// P2P Local Hub / Offline Chat Service Interface and Implementation
export interface LocalHubRoom {
  id: string;
  roomCode: string;
  name?: string;
  createdBy: string;
  isPrivate: boolean;
  maxParticipants: number;
  expiresAt?: Date;
  createdAt: Date;
  participants: LocalHubParticipant[];
}

export interface LocalHubParticipant {
  id: string;
  roomId: string;
  userId: string;
  peerId: string;
  role: ParticipantRole;
  joinedAt: Date;
  lastActive: Date;
}

export type ParticipantRole = 'host' | 'participant';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: MessageType;
  timestamp: Date;
  metadata: Record<string, any>;
}

export type MessageType = 
  | { type: 'text' }
  | { type: 'file'; filename: string; size: number; url: string }
  | { type: 'system'; event: string };

export interface CreateRoomRequest {
  name?: string;
  isPrivate: boolean;
  maxParticipants?: number;
  expiresHours?: number;
}

export interface JoinRoomRequest {
  roomCode: string;
  userName: string;
}

export interface SendMessageRequest {
  senderId: string;
  senderName: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface GetMessagesQuery {
  limit?: number;
  before?: Date;
}

export interface LocalHubService {
  // Room management
  createRoom: (request: CreateRoomRequest) => Promise<{
    success: boolean;
    room: LocalHubRoom;
    joinUrl: string;
  }>;
  joinRoom: (request: JoinRoomRequest) => Promise<{
    success: boolean;
    room: LocalHubRoom;
    participant: LocalHubParticipant;
    peerId: string;
  }>;
  getRoomInfo: (roomCode: string) => Promise<{
    room: LocalHubRoom;
    participants: LocalHubParticipant[];
    participantCount: number;
  }>;
  leaveRoom: (roomCode: string, peerId: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  listActiveRooms: () => Promise<LocalHubRoom[]>;
  
  // Messaging
  sendMessage: (roomCode: string, request: SendMessageRequest) => Promise<{
    success: boolean;
    message: ChatMessage;
  }>;
  getRoomMessages: (roomCode: string, query?: GetMessagesQuery) => Promise<ChatMessage[]>;
  
  // QR code and sharing
  getRoomQRCode: (roomCode: string) => Promise<{
    roomCode: string;
    joinUrl: string;
    qrCode: string;
  }>;
  exportChatHistory: (roomCode: string) => Promise<{
    roomCode: string;
    exportedAt: string;
    messages: ChatMessage[];
    format: string;
  }>;
  
  // WebSocket connection
  connectToRoom: (roomCode: string, peerId: string, callbacks: {
    onMessage: (message: ChatMessage) => void;
    onSignalling: (data: any) => void;
    onConnect: () => void;
    onDisconnect: () => void;
  }) => Promise<{
    connected: boolean;
    peerId: string;
  }>;
}

class LocalHubServiceImpl implements LocalHubService {
  private baseUrl: string;
  private websocketConnections: Map<string, WebSocket> = new Map();

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async createRoom(request: CreateRoomRequest): Promise<{
    success: boolean;
    room: LocalHubRoom;
    joinUrl: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/local-hub/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to create room: ${response.statusText}`);
    return response.json();
  }

  async joinRoom(request: JoinRoomRequest): Promise<{
    success: boolean;
    room: LocalHubRoom;
    participant: LocalHubParticipant;
    peerId: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/local-hub/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to join room: ${response.statusText}`);
    return response.json();
  }

  async getRoomInfo(roomCode: string): Promise<{
    room: LocalHubRoom;
    participants: LocalHubParticipant[];
    participantCount: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/local-hub/rooms/${roomCode}`);
    if (!response.ok) throw new Error(`Failed to get room info: ${response.statusText}`);
    return response.json();
  }

  async leaveRoom(roomCode: string, peerId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/local-hub/rooms/${roomCode}/leave/${peerId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`Failed to leave room: ${response.statusText}`);
    return response.json();
  }

  async listActiveRooms(): Promise<LocalHubRoom[]> {
    const response = await fetch(`${this.baseUrl}/api/local-hub/rooms/active`);
    if (!response.ok) throw new Error(`Failed to list active rooms: ${response.statusText}`);
    return response.json();
  }

  async sendMessage(roomCode: string, request: SendMessageRequest): Promise<{
    success: boolean;
    message: ChatMessage;
  }> {
    const response = await fetch(`${this.baseUrl}/api/local-hub/rooms/${roomCode}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to send message: ${response.statusText}`);
    return response.json();
  }

  async getRoomMessages(roomCode: string, query?: GetMessagesQuery): Promise<ChatMessage[]> {
    const params = new URLSearchParams();
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.before) params.append('before', query.before.toISOString());

    const response = await fetch(`${this.baseUrl}/api/local-hub/rooms/${roomCode}/messages?${params}`);
    if (!response.ok) throw new Error(`Failed to get room messages: ${response.statusText}`);
    return response.json();
  }

  async getRoomQRCode(roomCode: string): Promise<{
    roomCode: string;
    joinUrl: string;
    qrCode: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/local-hub/rooms/${roomCode}/qr`);
    if (!response.ok) throw new Error(`Failed to get room QR code: ${response.statusText}`);
    return response.json();
  }

  async exportChatHistory(roomCode: string): Promise<{
    roomCode: string;
    exportedAt: string;
    messages: ChatMessage[];
    format: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/local-hub/rooms/${roomCode}/export`);
    if (!response.ok) throw new Error(`Failed to export chat history: ${response.statusText}`);
    return response.json();
  }

  async connectToRoom(roomCode: string, peerId: string, callbacks: {
    onMessage: (message: ChatMessage) => void;
    onSignalling: (data: any) => void;
    onConnect: () => void;
    onDisconnect: () => void;
  }): Promise<{
    connected: boolean;
    peerId: string;
  }> {
    const wsUrl = `${this.baseUrl.replace('http', 'ws')}/api/local-hub/rooms/${roomCode}/ws/${peerId}`;
    const ws = new WebSocket(wsUrl);

    this.websocketConnections.set(`${roomCode}_${peerId}`, ws);

    ws.onopen = () => {
      callbacks.onConnect();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_message') {
          callbacks.onMessage(data.message);
        } else if (data.type === 'signalling') {
          callbacks.onSignalling(data.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      callbacks.onDisconnect();
      this.websocketConnections.delete(`${roomCode}_${peerId}`);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return new Promise((resolve) => {
      ws.onopen = () => {
        callbacks.onConnect();
        resolve({ connected: true, peerId });
      };
    });
  }

  disconnectFromRoom(roomCode: string, peerId: string): void {
    const connectionKey = `${roomCode}_${peerId}`;
    const ws = this.websocketConnections.get(connectionKey);
    
    if (ws) {
      ws.close();
      this.websocketConnections.delete(connectionKey);
    }
  }
}

// Singleton instance
export const localHubService = new LocalHubServiceImpl();

// React hook
export const useLocalHubService = (): LocalHubService => {
  return localHubService;
};

// Helper functions
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createJoinUrl(roomCode: string): string {
  return `jeantrail://local-hub/${roomCode}`;
}

export function formatMessageTimestamp(timestamp: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(timestamp);
}

export function isMessageTypeText(messageType: MessageType): boolean {
  return messageType.type === 'text';
}

export function isMessageTypeFile(messageType: MessageType): boolean {
  return messageType.type === 'file';
}

export function isMessageTypeSystem(messageType: MessageType): boolean {
  return messageType.type === 'system';
}

// Local storage helpers
export function saveMessageLocally(roomCode: string, message: ChatMessage): void {
  const key = `localhub_messages_${roomCode}`;
  const existingMessages = getStoredMessages(roomCode);
  existingMessages.push(message);
  
  // Keep only last 1000 messages
  if (existingMessages.length > 1000) {
    existingMessages.splice(0, existingMessages.length - 1000);
  }
  
  localStorage.setItem(key, JSON.stringify(existingMessages));
}

export function getStoredMessages(roomCode: string): ChatMessage[] {
  const key = `localhub_messages_${roomCode}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) return [];
  
  try {
    return JSON.parse(stored).map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch {
    return [];
  }
}

export function clearStoredMessages(roomCode: string): void {
  const key = `localhub_messages_${roomCode}`;
  localStorage.removeItem(key);
}

export function exportMessagesToJSON(messages: ChatMessage[], roomCode: string): string {
  const exportData = {
    roomCode,
    exportedAt: new Date().toISOString(),
    messageCount: messages.length,
    messages: messages.map(msg => ({
      id: msg.id,
      senderName: msg.senderName,
      content: msg.content,
      messageType: msg.messageType,
      timestamp: msg.timestamp.toISOString(),
      metadata: msg.metadata,
    })),
  };
  
  return JSON.stringify(exportData, null, 2);
}

export function exportMessagesToCSV(messages: ChatMessage[]): string {
  const headers = ['Timestamp', 'Sender', 'Message Type', 'Content', 'Metadata'];
  const rows = messages.map(msg => [
    msg.timestamp.toISOString(),
    msg.senderName,
    JSON.stringify(msg.messageType),
    msg.content,
    JSON.stringify(msg.metadata),
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  return csvContent;
}

// WebRTC helper (simplified)
export interface WebRTCManager {
  localPeer: string;
  remotePeers: Map<string, RTCPeerConnection>;
  dataChannels: Map<string, RTCDataChannel>;
  
  initialize: (peerId: string) => void;
  createOffer: (remotePeerId: string) => Promise<RTCSessionDescriptionInit>;
  createAnswer: (remotePeerId: string, offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>;
  handleAnswer: (remotePeerId: string, answer: RTCSessionDescriptionInit) => Promise<void>;
  handleIceCandidate: (remotePeerId: string, candidate: RTCIceCandidateInit) => Promise<void>;
  sendMessage: (remotePeerId: string, message: string) => void;
  onMessage: (callback: (fromPeerId: string, message: string) => void) => void;
}

export function createWebRTCManager(): WebRTCManager {
  const remotePeers = new Map<string, RTCPeerConnection>();
  const dataChannels = new Map<string, RTCDataChannel>();
  let localPeer = '';
  let messageCallback: ((fromPeerId: string, message: string) => void) | null = null;

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  };

  return {
    get localPeer() { return localPeer; },
    get remotePeers() { return remotePeers; },
    get dataChannels() { return dataChannels; },

    initialize(peerId: string) {
      localPeer = peerId;
    },

    async createOffer(remotePeerId: string): Promise<RTCSessionDescriptionInit> {
      const pc = new RTCPeerConnection(configuration);
      remotePeers.set(remotePeerId, pc);

      const dc = pc.createDataChannel('chat');
      dataChannels.set(remotePeerId, dc);

      dc.onmessage = (event) => {
        if (messageCallback) {
          messageCallback(remotePeerId, event.data);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return offer;
    },

    async createAnswer(remotePeerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
      const pc = new RTCPeerConnection(configuration);
      remotePeers.set(remotePeerId, pc);

      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dataChannels.set(remotePeerId, dc);

        dc.onmessage = (event) => {
          if (messageCallback) {
            messageCallback(remotePeerId, event.data);
          }
        };
      };

      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return answer;
    },

    async handleAnswer(remotePeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
      const pc = remotePeers.get(remotePeerId);
      if (!pc) throw new Error('Peer connection not found');

      await pc.setRemoteDescription(answer);
    },

    async handleIceCandidate(remotePeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
      const pc = remotePeers.get(remotePeerId);
      if (!pc) return;

      await pc.addIceCandidate(candidate);
    },

    sendMessage(remotePeerId: string, message: string) {
      const dc = dataChannels.get(remotePeerId);
      if (dc && dc.readyState === 'open') {
        dc.send(message);
      }
    },

    onMessage(callback: (fromPeerId: string, message: string) => void) {
      messageCallback = callback;
    },
  };
}