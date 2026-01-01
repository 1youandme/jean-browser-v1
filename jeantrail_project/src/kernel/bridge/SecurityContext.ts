import { BridgeCapability } from './BridgeTypes.js';
import { createHmac, randomBytes } from 'crypto';

export class SecurityContext {
  private secretKey: string;
  private activeSessions: Map<string, Set<BridgeCapability>> = new Map();

  constructor() {
    // In production, this would come from a secure vault or env
    this.secretKey = process.env.BRIDGE_SECRET || 'dev-secret-key-change-me';
  }

  /**
   * Create a new session with specific capabilities
   */
  public createSession(clientId: string, requestedCaps: string[]): { sessionId: string; granted: BridgeCapability[] } {
    const sessionId = randomBytes(16).toString('hex');
    
    // Policy Check: Filter requested capabilities based on client identity
    // For now, we allow basic ones and deny ADMIN unless specific ID
    const granted: BridgeCapability[] = [];
    
    for (const cap of requestedCaps) {
      if (cap === 'ADMIN_OVERRIDE' && clientId !== 'admin-user') {
        continue; // Deny
      }
      // Validate it's a known capability
      if (['SUBMIT_GRAPH', 'READ_LOGS', 'CANCEL_EXECUTION'].includes(cap)) {
        granted.push(cap as BridgeCapability);
      }
    }

    this.activeSessions.set(sessionId, new Set(granted));
    return { sessionId, granted };
  }

  /**
   * Verify if a session has a specific capability
   */
  public hasCapability(sessionId: string, capability: BridgeCapability): boolean {
    const caps = this.activeSessions.get(sessionId);
    return caps ? caps.has(capability) : false;
  }

  /**
   * Sign a message payload (Server-side signing)
   */
  public sign(payload: any): string {
    const data = JSON.stringify(payload);
    return createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  /**
   * Verify a signature (Client-side signing verification)
   * In a real system, we'd use asymmetric keys (Client Private -> Server Public).
   * Here, we simulate by assuming shared secret or verifying mock signatures.
   */
  public verify(payload: any, signature: string): boolean {
    // Simulation: In a real app, we'd verify the client's signature.
    // For this prototype, we'll just check if signature exists and is non-empty.
    // Or we could implement a symmetric check if we shared the key (not recommended for browser).
    
    // TODO: Implement Asymmetric Verification (RSA/ECDSA)
    // For now, fail if signature is missing "valid" keyword for testing
    return signature.startsWith('sig_');
  }
}
