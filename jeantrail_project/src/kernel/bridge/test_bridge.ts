import { KernelBridge } from './KernelBridge.js';
import { SignedMessage, BridgeMessage, GraphSubmissionPayload } from './BridgeTypes.js';
import { ExecutionGraph, NodeCapability } from '../graph/ExecutionGraph.js';

// Mock Client Utilities
function signMessage(msg: BridgeMessage): SignedMessage {
  return {
    message: msg,
    signature: 'sig_mock_valid_' + Date.now(), // Matches validation logic
    senderPublicKey: 'pub_key_123'
  };
}

async function runTest() {
  console.log('--- Kernel Bridge Security Test ---\n');

  const bridge = new KernelBridge();
  let currentSessionId: string | undefined;

  // Listen for outgoing messages (Mock Transport)
  bridge.on('outgoing_message', (data) => {
    console.log(`[SERVER -> CLIENT ${data.sessionId}]`, data.message.type);
  });

  bridge.on('security_alert', (data) => {
    console.log('[SECURITY ALERT]', data.reason);
  });

  bridge.on('graph_received', (data) => {
    console.log('[KERNEL] Processing Graph:', data.graph.id);
  });

  // 1. Handshake
  console.log('[Test 1] Initiating Handshake...');
  const handshakeMsg: BridgeMessage = {
    id: 'msg_1',
    type: 'HANDSHAKE_INIT',
    timestamp: Date.now(),
    payload: {
      clientId: 'browser_client_01',
      clientVersion: '1.0.0',
      requestedCapabilities: ['SUBMIT_GRAPH', 'READ_LOGS'],
      nonce: 'nonce_123'
    }
  };

  const response1 = bridge.handleMessage(signMessage(handshakeMsg));
  
  if (response1?.type === 'HANDSHAKE_ACK') {
    currentSessionId = response1.payload.sessionId;
    console.log('Success: Session Established:', currentSessionId);
    console.log('Granted Caps:', response1.payload.grantedCapabilities);
  } else {
    console.error('Failed Handshake:', response1);
    process.exit(1);
  }

  console.log('\n---');

  // 2. Submit Graph (Authorized)
  console.log('[Test 2] Submitting Valid Graph...');
  
  const nodes = new Map();
  nodes.set('node_1', { id: 'node_1', name: 'Start', capability: NodeCapability.ORCHESTRATION, model: 'default', inputs: {}, outputs: [], constraints: {} });

  const mockGraph: ExecutionGraph = {
    id: 'graph_cinematic_01',
    intentId: 'intent_123',
    timestamp: Date.now(),
    status: 'draft',
    nodes: nodes,
    edges: [],
    metadata: { priority: 'normal', tags: ['test'] }
  };

  const submitMsg: BridgeMessage<GraphSubmissionPayload> = {
    id: 'msg_2',
    type: 'GRAPH_SUBMISSION',
    timestamp: Date.now(),
    payload: {
      graph: mockGraph,
      userIntent: 'Create a cool video'
    }
  };

  const response2 = bridge.handleMessage(signMessage(submitMsg), currentSessionId);
  console.log('Response:', response2?.type, response2?.payload);

  console.log('\n---');

  // 3. Unauthorized Action (Admin Override)
  // We need to re-handshake to simulate a different session or just try a message the current session shouldn't do?
  // Actually, let's try to do something we didn't ask for. But our mock granted everything asked.
  // Let's try sending a message with a bad signature.
  
  console.log('[Test 3] Sending Invalid Signature...');
  const badMsg = signMessage(submitMsg);
  badMsg.signature = 'invalid_sig'; // Tamper
  
  const response3 = bridge.handleMessage(badMsg, currentSessionId);
  console.log('Response:', response3?.type, response3?.payload);

  console.log('\n---');

  // 4. Submit Partial Graph (Refusal)
  console.log('[Test 4] Submitting Partial Graph...');
  const partialMsg: BridgeMessage<GraphSubmissionPayload> = {
    id: 'msg_3',
    type: 'GRAPH_SUBMISSION',
    timestamp: Date.now(),
    payload: {
      graph: {} as any, // Malformed
      userIntent: 'Break it'
    }
  };
  
  const response4 = bridge.handleMessage(signMessage(partialMsg), currentSessionId);
  console.log('Response:', response4?.type, response4?.payload);
}

runTest();
