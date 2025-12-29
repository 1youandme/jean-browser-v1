// Injected script to intercept fetch/XHR calls
(function() {
  'use strict';

  // Store original functions
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  // Intercept fetch calls
  window.fetch = function(...args) {
    const [resource, options = {}] = args;
    
    // Log the request
    logApiCall({
      type: 'fetch',
      url: resource,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body,
      timestamp: new Date().toISOString()
    });

    // Intercept response
    return originalFetch.apply(this, args)
      .then(response => {
        // Clone response to avoid consuming it
        const clonedResponse = response.clone();
        
        // Try to get response body
        clonedResponse.text().then(body => {
          logApiCall({
            type: 'fetch_response',
            url: resource,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: body,
            timestamp: new Date().toISOString()
          });
        }).catch(() => {
          // Ignore body parsing errors
        });

        return response;
      });
  };

  // Intercept XHR calls
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._method = method;
    this._url = url;
    
    logApiCall({
      type: 'xhr',
      method: method,
      url: url,
      timestamp: new Date().toISOString()
    });

    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    // Store request data
    this._requestBody = body;
    
    // Set up response handler
    const originalOnReadyStateChange = this.onreadystatechange;
    
    this.onreadystatechange = function() {
      if (this.readyState === 4) {
        logApiCall({
          type: 'xhr_response',
          url: this._url,
          method: this._method,
          status: this.status,
          statusText: this.statusText,
          responseHeaders: this.getAllResponseHeaders(),
          responseText: this.responseText,
          requestBody: this._requestBody,
          timestamp: new Date().toISOString()
        });
      }
      
      if (originalOnReadyStateChange) {
        originalOnReadyStateChange.apply(this, arguments);
      }
    };

    return originalXHRSend.apply(this, [body]);
  };

  // Function to log API calls to content script
  function logApiCall(data) {
    // Only log API calls
    if (data.url && typeof data.url === 'string') {
      try {
        const url = new URL(data.url, window.location.origin);
        if (url.pathname.includes('/api/') || url.pathname.includes('/graphql')) {
          // Send to content script
          window.postMessage({
            type: 'jeantrail_api_call',
            payload: data
          }, '*');
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }
  }

  // Extract API client configurations
  function extractApiClientConfig() {
    const configs = [];
    
    // Look for common API client patterns
    if (window.axios) {
      configs.push({
        type: 'axios',
        defaults: window.axios.defaults
      });
    }
    
    if (window.jQuery && window.jQuery.ajaxSettings) {
      configs.push({
        type: 'jquery',
        settings: window.jQuery.ajaxSettings
      });
    }
    
    // Look for API base URLs
    const possibleApiUrls = [
      'apiBaseUrl',
      'API_URL',
      'baseURL',
      'endpoint',
      'serverUrl'
    ];
    
    possibleApiUrls.forEach(prop => {
      if (window[prop] && typeof window[prop] === 'string') {
        configs.push({
          type: 'global_var',
          property: prop,
          value: window[prop]
        });
      }
    });
    
    return configs;
  }

  // Send configuration data after page load
  setTimeout(() => {
    const configs = extractApiClientConfig();
    if (configs.length > 0) {
      window.postMessage({
        type: 'jeantrail_api_config',
        payload: {
          url: window.location.href,
          configs: configs
        }
      }, '*');
    }
  }, 1000);

  console.log('JeanTrail Auto-API Extractor initialized');
})();