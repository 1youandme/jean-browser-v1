import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { LocalHubRoom, LocalHubParticipant, LocalHubMessage } from '../types/local-hub';

interface LocalHubProps {
  userId: string;
  userName: string;
}

interface LocalHubState {
  rooms: LocalHubRoom[];
  currentRoom: LocalHubRoom | null;
  participants: LocalHubParticipant[];
  messages: LocalHubMessage[];
  isConnected: boolean;
  peerId: string | null;
  isLoading: boolean;
  error?: string;
}

const LocalHub: React.FC<LocalHubProps> = ({ userId, userName }) => {
  const [state, setState] = useState<LocalHubState>({
    rooms: [],
    currentRoom: null,
    participants: [],
    messages: [],
    isConnected: false,
    peerId: null,
    isLoading: false,
  });

  const [activeTab, setActiveTab] = useState<'rooms' | 'create' | 'room'>('rooms');
  const [newMessage, setNewMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // WebRTC references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    loadPublicRooms();
    initWebSocket();
  }, []);

  const loadPublicRooms = async () => {
    try {
      const rooms = await invoke<LocalHubRoom[]>('local_hub_get_public_rooms', { limit: 50 });
      setState(prev => ({ ...prev, rooms }));
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const initWebSocket = async () => {
    try {
      // Connect to WebSocket server
      const ws = new WebSocket('ws://localhost:8765');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Local Hub WebSocket');
        setState(prev => ({ ...prev, isConnected: true }));
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onclose = () => {
        console.log('Disconnected from Local Hub WebSocket');
        setState(prev => ({ ...prev, isConnected: false, peerId: null }));
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, error: 'Connection error' }));
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  };

  const handleWebSocketMessage = async (message: any) => {
    switch (message.signal_type) {
      case 'room-join':
        await handlePeerJoin(message);
        break;
      case 'room-leave':
        await handlePeerLeave(message);
        break;
      case 'offer':
        await handleOffer(message);
        break;
      case 'answer':
        await handleAnswer(message);
        break;
      case 'ice-candidate':
        await handleIceCandidate(message);
        break;
      case 'message':
        await handleChatMessage(message);
        break;
      default:
        console.log('Unknown message type:', message.signal_type);
    }
  };

  const createRoom = async (roomData: {
    name: string;
    description: string;
    isPublic: boolean;
    password?: string;
    maxParticipants: number;
    enableVoiceChat: boolean;
    enableFileSharing: boolean;
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const room = await invoke<LocalHubRoom>('local_hub_create_room', {
        userId,
        request: {
          room_id: generateRoomId(),
          room_name: roomData.name,
          description: roomData.description,
          is_public: roomData.isPublic,
          requires_password: !!roomData.password,
          password: roomData.password,
          max_participants: roomData.maxParticipants,
          enable_file_sharing: roomData.enableFileSharing,
          enable_voice_chat: roomData.enableVoiceChat,
          enable_screen_sharing: false,
          expires_hours: 24,
        },
      });

      setState(prev => ({ ...prev, rooms: [room, ...prev.rooms] }));
      setActiveTab('rooms');
    } catch (error) {
      setState(prev => ({ ...prev, error: `Failed to create room: ${error}` }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const joinRoom = async (roomId: string, password?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const participant = await invoke<LocalHubParticipant>('local_hub_join_room', {
        userId,
        request: {
          room_id: roomId,
          display_name: userName,
          password,
          can_send_audio: true,
          can_send_video: false,
          can_share_screen: false,
        },
      });

      // Get room details
      const room = await invoke<LocalHubRoom>('local_hub_get_room', { roomId, userId });
      
      setState(prev => ({
        ...prev,
        currentRoom: room,
        participants: [participant],
        peerId: participant.peer_id,
      }));

      await loadRoomParticipants(roomId);
      await loadRoomMessages(roomId);
      
      setActiveTab('room');
      
      if (room?.enable_voice_chat) {
        await initWebRTC(roomId);
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: `Failed to join room: ${error}` }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const leaveRoom = async () => {
    try {
      if (state.peerId) {
        await invoke('local_hub_leave_room', { peerId: state.peerId });
      }

      // Close WebRTC connections
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      setState(prev => ({
        ...prev,
        currentRoom: null,
        participants: [],
        messages: [],
        peerId: null,
      }));

      setActiveTab('rooms');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const loadRoomParticipants = async (roomId: string) => {
    try {
      const participants = await invoke<LocalHubParticipant[]>('local_hub_get_participants', {
        roomId,
        userId,
      });
      setState(prev => ({ ...prev, participants }));
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };

  const loadRoomMessages = async (roomId: string) => {
    try {
      const messages = await invoke<LocalHubMessage[]>('local_hub_get_messages', {
        roomId,
        userId,
        limit: 50,
      });
      setState(prev => ({ ...prev, messages: messages.reverse() }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !state.peerId) return;

    try {
      await invoke('local_hub_send_message', {
        peerId: state.peerId,
        content: newMessage,
        messageType: 'text',
        replyToId: null,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const initWebRTC = async (roomId: string) => {
    try {
      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      localStreamRef.current = localStream;

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && state.peerId) {
          sendSignalingMessage({
            room_id: roomId,
            from_peer_id: state.peerId,
            to_peer_id: 'all',
            signal_type: 'ice-candidate',
            signal_data: event.candidate,
            timestamp: new Date(),
          });
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        // Play remote audio
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play();
      };
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
    }
  };

  const sendSignalingMessage = async (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const handleOffer = async (message: any) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(message.signal_data)
      );
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      sendSignalingMessage({
        room_id: message.room_id,
        from_peer_id: state.peerId,
        to_peer_id: message.from_peer_id,
        signal_type: 'answer',
        signal_data: answer,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  };

  const handleAnswer = async (message: any) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(message.signal_data)
      );
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  };

  const handleIceCandidate = async (message: any) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(message.signal_data)
      );
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  };

  const handlePeerJoin = async (message: any) => {
    await loadRoomParticipants(state.currentRoom?.room_id || '');
  };

  const handlePeerLeave = async (message: any) => {
    await loadRoomParticipants(state.currentRoom?.room_id || '');
  };

  const handleChatMessage = async (message: any) => {
    if (message.signal_data.message) {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, message.signal_data.message],
      }));
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsSpeaking(audioTrack.enabled);
      }
    }
  };

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateQRCode = (roomId: string) => {
    // This would generate a QR code for room joining
    return `https://jean.local/hub/${roomId}`;
  };

  const renderRoomsList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Public Rooms</h2>
        <button
          onClick={() => setActiveTab('create')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Create Room
        </button>
      </div>

      {state.rooms.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No public rooms available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.rooms.map(room => (
            <div key={room.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{room.room_name}</h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  {room.participant_count}/{room.max_participants}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-3">{room.description}</p>
              
              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                {room.enable_voice_chat && <span>🎤 Voice</span>}
                {room.enable_file_sharing && <span>📁 Files</span>}
                {room.enable_screen_sharing && <span>🖥️ Screen</span>}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => joinRoom(room.room_id)}
                  disabled={room.participant_count >= room.max_participants}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join Room
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateQRCode(room.room_id));
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  📱
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateRoom = () => (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Create New Room</h2>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createRoom({
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          isPublic: formData.get('isPublic') === 'true',
          password: formData.get('password') as string,
          maxParticipants: parseInt(formData.get('maxParticipants') as string),
          enableVoiceChat: formData.get('enableVoiceChat') === 'true',
          enableFileSharing: formData.get('enableFileSharing') === 'true',
        });
      }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Room Name</label>
          <input
            name="name"
            type="text"
            required
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="My Awesome Room"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Describe your room..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Visibility</label>
          <select
            name="isPublic"
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="true">Public</option>
            <option value="false">Private</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password (optional)</label>
          <input
            name="password"
            type="password"
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Room password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Max Participants</label>
          <input
            name="maxParticipants"
            type="number"
            min="2"
            max="50"
            defaultValue="10"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center">
            <input name="enableVoiceChat" type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm">Enable Voice Chat</span>
          </label>
          <label className="flex items-center">
            <input name="enableFileSharing" type="checkbox" defaultChecked className="mr-2" />
            <span className="text-sm">Enable File Sharing</span>
          </label>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={state.isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {state.isLoading ? 'Creating...' : 'Create Room'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderRoom = () => {
    if (!state.currentRoom) return null;

    return (
      <div className="flex flex-col h-[600px]">
        {/* Room Header */}
        <div className="border-b pb-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{state.currentRoom.room_name}</h2>
              <p className="text-gray-600">{state.currentRoom.description}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {state.participants.length} participants
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateQRCode(state.currentRoom!.room_id));
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                📱 Share
              </button>
              <button
                onClick={leaveRoom}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Leave
              </button>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="border-b pb-2 mb-4">
          <h3 className="font-semibold mb-2">Participants</h3>
          <div className="flex space-x-3 overflow-x-auto">
            {state.participants.map(participant => (
              <div key={participant.id} className="flex flex-col items-center min-w-[60px]">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  {participant.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-xs mt-1">{participant.display_name || 'Anonymous'}</span>
                {participant.is_speaking && (
                  <span className="text-xs text-green-600">🎤</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {state.messages.map(message => (
            <div key={message.id} className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                {message.participant_id}
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-lg p-2">
                  <p className="text-sm">{message.content}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
          {state.currentRoom.enable_voice_chat && (
            <button
              onClick={toggleAudio}
              className={`px-4 py-2 rounded-lg ${
                isSpeaking ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              🎤
            </button>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'rooms', label: 'Rooms' },
    { id: 'create', label: 'Create' },
  ];

  if (state.error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600">{state.error}</div>
          <button
            onClick={() => setState(prev => ({ ...prev, error: undefined }))}
            className="mt-2 text-red-600 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Local Hub</h1>
        <p className="text-gray-600">Connect with local peers using WebRTC</p>
        <div className="flex items-center space-x-2 mt-2">
          <div className={`w-3 h-3 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">
            {state.isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {state.peerId && (
            <span className="text-sm text-gray-500">
              Peer ID: {state.peerId}
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {activeTab === 'room' && (
          <button
            onClick={() => setActiveTab('rooms')}
            className="ml-auto px-4 py-2 font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Rooms
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'rooms' && renderRoomsList()}
        {activeTab === 'create' && renderCreateRoom()}
        {activeTab === 'room' && renderRoom()}
      </div>
    </div>
  );
};

export default LocalHub;