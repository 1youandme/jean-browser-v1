// Background script for Auto-API Extractor
let isLogging = false;
let requestLogs = [];
let filter = {
  domains: [],
  methods: [],
  includeHeaders: true,
  includeBody: false
};

// Initialize storage
chrome.storage.local.get(['isLogging', 'requestLogs', 'filter'], (result) => {
  isLogging = result.isLogging || false;
  requestLogs = result.requestLogs || [];
  filter = result.filter || filter;
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startLogging':
      startLogging();
      sendResponse({ success: true });
      break;
      
    case 'stopLogging':
      stopLogging();
      sendResponse({ success: true });
      break;
      
    case 'getStatus':
      sendResponse({ isLogging, logCount: requestLogs.length });
      break;
      
    case 'getRequests':
      sendResponse({ requests: requestLogs });
      break;
      
    case 'clearRequests':
      requestLogs = [];
      chrome.storage.local.set({ requestLogs });
      sendResponse({ success: true });
      break;
      
    case 'setFilter':
      filter = request.filter;
      chrome.storage.local.set({ filter });
      sendResponse({ success: true });
      break;
      
    case 'getFilter':
      sendResponse({ filter });
      break;
      
    case 'exportLogs':
      exportLogsToJeanTrail(request.jeantrailUrl).then(response => {
        sendResponse(response);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Keep message channel open for async response
});

// Start logging
function startLogging() {
  isLogging = true;
  chrome.storage.local.set({ isLogging });
  
  // Add webRequest listener if not already added
  if (!chrome.webRequest.onBeforeRequest.hasListener(onBeforeRequest)) {
    chrome.webRequest.onBeforeRequest.addListener(
      onBeforeRequest,
      { urls: ['<all_urls>'] },
      ['requestBody']
    );
  }
  
  if (!chrome.webRequest.onCompleted.hasListener(onCompleted)) {
    chrome.webRequest.onCompleted.addListener(
      onCompleted,
      { urls: ['<all_urls>'] }
    );
  }
}

// Stop logging
function stopLogging() {
  isLogging = false;
  chrome.storage.local.set({ isLogging });
}

// Handle requests
function onBeforeRequest(details) {
  if (!isLogging) return;
  
  const url = new URL(details.url);
  const domain = url.hostname;
  
  // Apply filters
  if (filter.domains.length > 0 && !filter.domains.includes(domain)) {
    return;
  }
  
  if (filter.methods.length > 0 && !filter.methods.includes(details.method)) {
    return;
  }
  
  // Store request data
  const requestData = {
    id: details.requestId,
    timestamp: new Date().toISOString(),
    url: details.url,
    method: details.method,
    domain: domain,
    requestHeaders: {},
    requestBody: null,
    responseHeaders: {},
    responseStatus: null,
    responseBody: null,
    tabId: details.tabId
  };
  
  // Get request headers
  if (filter.includeHeaders) {
    chrome.webRequest.onBeforeSendHeaders?.getDetails?.({ requestId: details.requestId }, (details) => {
      if (details && details.requestHeaders) {
        requestData.requestHeaders = details.requestHeaders.reduce((acc, header) => {
          acc[header.name] = header.value;
          return acc;
        }, {});
      }
    });
  }
  
  // Get request body if enabled
  if (filter.includeBody && details.requestBody) {
    try {
      if (details.requestBody.raw) {
        const decoder = new TextDecoder('utf-8');
        const body = Array.from(details.requestBody.raw)
          .map(byte => String.fromCharCode(byte))
          .join('');
        requestData.requestBody = body;
      }
    } catch (error) {
      console.warn('Failed to decode request body:', error);
    }
  }
  
  // Store temporary request data
  chrome.storage.local.get(['tempRequests'], (result) => {
    const tempRequests = result.tempRequests || {};
    tempRequests[details.requestId] = requestData;
    chrome.storage.local.set({ tempRequests });
  });
}

function onCompleted(details) {
  if (!isLogging) return;
  
  chrome.storage.local.get(['tempRequests'], (result) => {
    const tempRequests = result.tempRequests || {};
    const requestData = tempRequests[details.requestId];
    
    if (requestData) {
      // Update response data
      requestData.responseStatus = details.statusCode;
      
      // Get response headers
      if (filter.includeHeaders && details.responseHeaders) {
        requestData.responseHeaders = details.responseHeaders.reduce((acc, header) => {
          acc[header.name] = header.value;
          return acc;
        }, {});
      }
      
      // Move to permanent logs
      requestLogs.push(requestData);
      
      // Keep only last 1000 logs
      if (requestLogs.length > 1000) {
        requestLogs = requestLogs.slice(-1000);
      }
      
      // Save to storage
      chrome.storage.local.set({ 
        requestLogs,
        tempRequests: Object.fromEntries(
          Object.entries(tempRequests).filter(([key]) => key !== details.requestId)
        )
      });
    }
  });
}

// Export logs to JeanTrail
async function exportLogsToJeanTrail(jeantrailUrl) {
  try {
    const response = await fetch(`${jeantrailUrl}/api/auto-api/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logs: requestLogs.map(log => ({
          session_id: getSessionId(),
          domain: log.domain,
          method: log.method,
          url: log.url,
          headers: log.requestHeaders,
          request_body: log.requestBody,
          response_status: log.responseStatus,
          response_headers: log.responseHeaders,
          response_body: log.responseBody,
        }))
      })
    });
    
    if (response.ok) {
      return { success: true, exported: requestLogs.length };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`Failed to export logs: ${error.message}`);
  }
}

// Get or generate session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('jeantrail_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('jeantrail_session_id', sessionId);
  }
  return sessionId;
}

// Cleanup old logs periodically
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  requestLogs = requestLogs.filter(log => 
    new Date(log.timestamp).getTime() > oneHourAgo
  );
  chrome.storage.local.set({ requestLogs });
}, 30 * 60 * 1000); // Every 30 minutes