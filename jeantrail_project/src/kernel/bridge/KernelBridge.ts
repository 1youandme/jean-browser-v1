import { EventEmitter } from 'events';
import { 
  SignedMessage, 
  BridgeMessage, 
  HandshakePayload, 
  HandshakeAckPayload, 
  GraphSubmissionPayload,
  BridgeErrorPayload,
  MessageType
} from './BridgeTypes.js';
import { SecurityContext } from './SecurityContext.js';

export class KernelBridge extends EventEmitter {
  private security: SecurityContext;
  
  // Simulate connected clients
  private clients: Map<string, string> = new Map(); // sessionId -> clientId

  constructor() {
    super();
    this.security = new SecurityContext();
  }

  /**
   * Handle incoming raw message from transport (WebSocket/SSE)
   */
  public handleMessage(rawMessage: SignedMessage, sessionId?: string): BridgeMessage | null {
    // 1. Verify Signature
    if (!this.security.verify(rawMessage.message, rawMessage.signature)) {
      this.emit('security_alert', { reason: 'Invalid Signature', payload: rawMessage });
      return this.createErrorResponse(rawMessage.message.id, 'AUTH_FAILED', 'Invalid signature');
    }

    const msg = rawMessage.message;

    // 2. Handle Handshake (No session required yet)
    if (msg.type === 'HANDSHAKE_INIT') {
      return this.handleHandshake(msg);
    }

    // 3. Verify Session
    if (!sessionId || !this.clients.has(sessionId)) {
      return this.createErrorResponse(msg.id, 'UNAUTHORIZED', 'Session required');
    }

    // 4. Dispatch based on Type
    switch (msg.type) {
      case 'GRAPH_SUBMISSION':
        return this.handleGraphSubmission(msg, sessionId);
      case 'AUDIT_LOG_REQUEST':
        return this.handleAuditRequest(msg, sessionId);
      default:
        return this.createErrorResponse(msg.id, 'UNKNOWN_TYPE', `Unknown message type: ${msg.type}`);
    }
  }

  private handleHandshake(msg: BridgeMessage<HandshakePayload>): BridgeMessage<HandshakeAckPayload | BridgeErrorPayload> {
    const { clientId, requestedCapabilities } = msg.payload;
    
    // Create Session
    const { sessionId, granted } = this.security.createSession(clientId, requestedCapabilities);
    this.clients.set(sessionId, clientId);

    return {
      id: msg.id + '_ack',
      type: 'HANDSHAKE_ACK',
      timestamp: Date.now(),
      payload: {
        sessionId,
        grantedCapabilities: granted,
        serverTime: Date.now()
      }
    };
  }

  private handleGraphSubmission(msg: BridgeMessage<GraphSubmissionPayload>, sessionId: string): BridgeMessage {
    // Check Permission
    if (!this.security.hasCapability(sessionId, 'SUBMIT_GRAPH')) {
      return this.createErrorResponse(msg.id, 'FORBIDDEN', 'Missing capability: SUBMIT_GRAPH');
    }

    const { graph, userIntent } = msg.payload;

    // Validate Graph Structure (Basic check)
    if (!graph || !graph.nodes || !graph.edges) {
      return this.createErrorResponse(msg.id, 'INVALID_GRAPH', 'Partial or malformed graph');
    }

    // Emit event for Kernel to pick up
    this.emit('graph_received', { sessionId, graph, intent: userIntent });

    return {
      id: msg.id + '_resp',
      type: 'GRAPH_ACCEPTED',
      timestamp: Date.now(),
      payload: {
        graphId: graph.id,
        status: 'queued',
        queuePosition: 1
      }
    };
  }

  private handleAuditRequest(msg: BridgeMessage, sessionId: string): BridgeMessage {
    if (!this.security.hasCapability(sessionId, 'READ_LOGS')) {
      return this.createErrorResponse(msg.id, 'FORBIDDEN', 'Missing capability: READ_LOGS');
    }
    
    // Mock response
    return {
      id: msg.id + '_resp',
      type: 'AUDIT_LOG_RESPONSE',
      timestamp: Date.now(),
      payload: {
        logs: [
          { time: Date.now(), level: 'info', msg: 'Access granted' }
        ]
      }
    };
  }

  private createErrorResponse(replyToId: string, code: string, message: string): BridgeMessage<BridgeErrorPayload> {
    return {
      id: replyToId + '_err',
      type: 'ERROR',
      timestamp: Date.now(),
      payload: {
        code,
        message
      }
    };
  }

  /**
   * Push an update to a specific client
   */
  public pushUpdate(sessionId: string, update: BridgeMessage) {
    // In real impl, this would send via WebSocket
    this.emit('outgoing_message', { sessionId, message: update });
  }
}
