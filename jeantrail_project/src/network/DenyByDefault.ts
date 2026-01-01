// Network deny-by-default governance shim
// Initializes global network posture as disabled and gates common network APIs.
declare global {
  interface Window {
    __JEAN_NETWORK_ENABLED__?: boolean;
    __JEAN_NETWORK_REASON__?: string;
  }
}

type PolicyChangeDetail = { enabled: boolean; reason?: string };

const originalFetch = typeof window !== 'undefined' ? window.fetch : undefined;
const OriginalWebSocket = typeof window !== 'undefined' ? window.WebSocket : undefined;
const OriginalEventSource = typeof window !== 'undefined' ? (window as any).EventSource : undefined;
const OriginalXHR = typeof window !== 'undefined' ? window.XMLHttpRequest : undefined;
const originalSendBeacon = typeof navigator !== 'undefined' ? navigator.sendBeacon : undefined;

function isEnabled(): boolean {
  return Boolean(window.__JEAN_NETWORK_ENABLED__ === true);
}

function setEnabled(enabled: boolean, reason?: string) {
  window.__JEAN_NETWORK_ENABLED__ = enabled;
  window.__JEAN_NETWORK_REASON__ = reason || (enabled ? 'user_opt_in' : 'deny_by_default');
  const evt = new CustomEvent<PolicyChangeDetail>('jean-network-policy-change' as any, {
    detail: { enabled, reason: window.__JEAN_NETWORK_REASON__ }
  } as any);
  window.dispatchEvent(evt);
}

function block(reason: string): never {
  throw new Error(`Network disabled by governance policy: ${reason}`);
}

// Apply global overrides once
if (typeof window !== 'undefined') {
  // Default disabled
  if (typeof window.__JEAN_NETWORK_ENABLED__ === 'undefined') {
    setEnabled(false, 'deny_by_default');
  }

  // fetch
  if (originalFetch) {
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (!isEnabled()) {
        return Promise.reject(block('fetch'));
      }
      return originalFetch(input, init);
    };
  }

  // WebSocket
  if (OriginalWebSocket) {
    window.WebSocket = function (url: string | URL, protocols?: string | string[]) {
      if (!isEnabled()) block('websocket');
      return new OriginalWebSocket(url as any, protocols as any);
    } as any;
  }

  // EventSource
  if (OriginalEventSource) {
    (window as any).EventSource = function (url: string | URL, config?: any) {
      if (!isEnabled()) block('eventsource');
      return new OriginalEventSource(url as any, config);
    };
  }

  // XMLHttpRequest (axios/XHR)
  if (OriginalXHR) {
    class GatedXHR extends OriginalXHR {
      open(method: string, url: string, async?: boolean, user?: string, password?: string) {
        if (!isEnabled()) block('xmlhttprequest');
        return super.open(method, url, async as any, user as any, password as any);
      }
      send(body?: Document | BodyInit | null) {
        if (!isEnabled()) block('xmlhttprequest');
        return super.send(body as any);
      }
    }
    window.XMLHttpRequest = GatedXHR as any;
  }

  // navigator.sendBeacon
  if (originalSendBeacon) {
    navigator.sendBeacon = function (url: string | URL, data?: BodyInit | null) {
      if (!isEnabled()) {
        return false;
      }
      return originalSendBeacon.call(navigator, url as any, data as any);
    } as any;
  }
}

export const NetworkPolicy = Object.freeze({
  isEnabled,
  enable(reason?: string) {
    setEnabled(true, reason || 'user_opt_in');
  },
  disable(reason?: string) {
    setEnabled(false, reason || 'deny_by_default');
  },
  reason() {
    return window.__JEAN_NETWORK_REASON__ || 'deny_by_default';
  }
});

