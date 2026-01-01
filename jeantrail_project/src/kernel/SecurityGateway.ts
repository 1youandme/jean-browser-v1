export interface SecurityContext {
  fingerprint: string;
  ip?: string;
  userAgent: string;
  timestamp: number;
}

class SecurityGateway {
  private static instance: SecurityGateway;
  
  private constructor() {}

  public static getInstance(): SecurityGateway {
    if (!SecurityGateway.instance) {
      SecurityGateway.instance = new SecurityGateway();
    }
    return SecurityGateway.instance;
  }

  public async generateFingerprint(): Promise<string> {
    // Basic fingerprinting components
    // In a real sovereign browser, we would query the kernel or Rust backend for hardware ID
    // Here we use browser primitives to simulate a stable ID
    const components = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      navigator.hardwareConcurrency
    ];

    // Try to get WebGL renderer if available
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          components.push(renderer);
        }
      }
    } catch (e) {
      // Ignore WebGL errors
    }
    
    // Simple hash generation
    const str = components.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  public async validateRegistration(email: string): Promise<{ allowed: boolean; reason?: string }> {
    const fingerprint = await this.generateFingerprint();
    console.log(`[Security] Validating registration for ${email} with fingerprint ${fingerprint}`);
    
    // Check local storage for previous registration (Client-side enforcement)
    // This is the "Governance-First" check: One account per device (initially)
    const existing = localStorage.getItem('jeantrail_device_fingerprint');
    
    if (existing && existing === fingerprint) {
      // If a different email is used on same device
      const registeredEmail = localStorage.getItem('jeantrail_registered_email');
      if (registeredEmail && registeredEmail !== email) {
        return { 
          allowed: false, 
          reason: 'Multiple account creation is not permitted on this device.' 
        };
      }
    }
    
    return { allowed: true };
  }

  public async bindDevice(email: string): Promise<void> {
    const fingerprint = await this.generateFingerprint();
    localStorage.setItem('jeantrail_device_fingerprint', fingerprint);
    localStorage.setItem('jeantrail_registered_email', email);
    localStorage.setItem('jeantrail_device_bind_ts', Date.now().toString());
  }
}

export const securityGateway = SecurityGateway.getInstance();
