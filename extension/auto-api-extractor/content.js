// Content script for Auto-API Extractor
(function() {
  'use strict';

  // Inject script to intercept fetch/XHR calls
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // Listen for messages from injected script
  window.addEventListener('message', function(event) {
    if (event.source !== window || !event.data.type === 'jeantrail_api_call') {
      return;
    }

    // Forward to background script
    chrome.runtime.sendMessage({
      action: 'logApiCall',
      data: event.data.payload
    });
  });

  // Monitor DOM changes for dynamic content
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        // Look for API-related elements
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            scanElementForApis(node);
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial scan
  scanElementForApis(document.body);

  function scanElementForApis(element) {
    // Look for common API patterns in the DOM
    const selectors = [
      '[data-api-url]',
      '[data-endpoint]',
      '[ng-href*="/api/"]',
      '[href*="/api/"]',
      'script[src*="/api/"]',
      'link[href*="/api/"]'
    ];

    selectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        const url = el.getAttribute('data-api-url') || 
                   el.getAttribute('data-endpoint') ||
                   el.getAttribute('href') ||
                   el.getAttribute('src');

        if (url && url.includes('/api/')) {
          chrome.runtime.sendMessage({
            action: 'logDiscoveredApi',
            data: {
              url: url,
              element: el.tagName,
              context: el.textContent?.substring(0, 100)
            }
          });
        }
      });
    });
  }

  // Extract API endpoints from JavaScript
  function extractApiEndpoints() {
    const scripts = document.querySelectorAll('script');
    const apiPatterns = [
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /axios\.[get|post|put|delete]+\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /\$\.ajax\s*\(\s*{\s*url\s*:\s*['"`]([^'"`]+)['"`]/g,
      /api\/[a-zA-Z0-9\/\-_]+/g
    ];

    const endpoints = new Set();

    scripts.forEach(script => {
      if (script.src) return; // Skip external scripts for now

      const content = script.textContent || '';
      apiPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const endpoint = match[1] || match[0];
          if (endpoint.includes('/api/')) {
            endpoints.add(endpoint);
          }
        }
      });
    });

    return Array.from(endpoints);
  }

  // Send discovered endpoints after page load
  setTimeout(() => {
    const endpoints = extractApiEndpoints();
    if (endpoints.length > 0) {
      chrome.runtime.sendMessage({
        action: 'logDiscoveredEndpoints',
        data: {
          url: window.location.href,
          endpoints: endpoints
        }
      });
    }
  }, 2000);
})();