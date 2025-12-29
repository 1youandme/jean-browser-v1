// Popup script for Auto-API Extractor
document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const requestCount = document.getElementById('requestCount');
  const domainCount = document.getElementById('domainCount');
  const requestList = document.getElementById('requestList');

  let currentRequests = [];
  let isLogging = false;

  // Initialize popup
  updateStatus();
  loadRequests();

  // Event listeners
  startBtn.addEventListener('click', startLogging);
  stopBtn.addEventListener('click', stopLogging);
  clearBtn.addEventListener('click', clearRequests);
  exportBtn.addEventListener('click', exportRequests);
  settingsBtn.addEventListener('click', openSettings);

  // Update status display
  function updateStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      isLogging = response.isLogging;
      
      if (isLogging) {
        statusIndicator.classList.remove('inactive');
        statusIndicator.classList.add('active');
        statusText.textContent = 'Logging...';
        startBtn.disabled = true;
        stopBtn.disabled = false;
      } else {
        statusIndicator.classList.remove('active');
        statusIndicator.classList.add('inactive');
        statusText.textContent = 'Not logging';
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }

      requestCount.textContent = response.logCount || 0;
    });
  }

  // Load and display requests
  function loadRequests() {
    chrome.runtime.sendMessage({ action: 'getRequests' }, (response) => {
      currentRequests = response.requests || [];
      displayRequests(currentRequests);
      updateStats(currentRequests);
    });
  }

  // Display requests in the popup
  function displayRequests(requests) {
    const recentRequests = requests.slice(-10).reverse();
    
    if (recentRequests.length === 0) {
      requestList.innerHTML = `
        <div class="empty-state">
          No requests logged yet. Start logging to see API calls.
        </div>
      `;
      return;
    }

    const html = recentRequests.map(request => {
      const methodClass = `method-${(request.method || 'get').toLowerCase()}`;
      const displayUrl = request.url.length > 50 
        ? request.url.substring(0, 50) + '...' 
        : request.url;
      
      return `
        <div class="request-item">
          <span class="request-method ${methodClass}">${request.method || 'GET'}</span>
          <span class="request-url" title="${request.url}">${displayUrl}</span>
        </div>
      `;
    }).join('');

    requestList.innerHTML = html;
  }

  // Update statistics
  function updateStats(requests) {
    const domains = new Set(requests.map(req => req.domain));
    document.getElementById('domainCount').textContent = domains.size;
  }

  // Start logging
  function startLogging() {
    chrome.runtime.sendMessage({ action: 'startLogging' }, (response) => {
      if (response && response.success) {
        updateStatus();
        showNotification('Logging started', 'success');
      }
    });
  }

  // Stop logging
  function stopLogging() {
    chrome.runtime.sendMessage({ action: 'stopLogging' }, (response) => {
      if (response && response.success) {
        updateStatus();
        showNotification('Logging stopped', 'info');
      }
    });
  }

  // Clear requests
  function clearRequests() {
    if (confirm('Are you sure you want to clear all logged requests?')) {
      chrome.runtime.sendMessage({ action: 'clearRequests' }, (response) => {
        if (response && response.success) {
          currentRequests = [];
          displayRequests([]);
          updateStats([]);
          requestCount.textContent = '0';
          document.getElementById('domainCount').textContent = '0';
          showNotification('Requests cleared', 'success');
        }
      });
    }
  }

  // Export requests to JeanTrail
  async function exportRequests() {
    if (currentRequests.length === 0) {
      showNotification('No requests to export', 'warning');
      return;
    }

    const jeantrailUrl = prompt('Enter JeanTrail URL:', 'http://localhost:8080');
    if (!jeantrailUrl) return;

    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'exportLogs',
        jeantrailUrl: jeantrailUrl
      });

      if (response && response.success) {
        showNotification(`Exported ${response.exported} requests to JeanTrail`, 'success');
        
        // Clear after successful export
        chrome.runtime.sendMessage({ action: 'clearRequests' });
        loadRequests();
        updateStatus();
      } else {
        throw new Error(response?.error || 'Export failed');
      }
    } catch (error) {
      showNotification(`Export failed: ${error.message}`, 'error');
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export to JeanTrail';
    }
  }

  // Open settings
  function openSettings() {
    chrome.runtime.sendMessage({ action: 'getFilter' }, (response) => {
      const filter = response.filter || {};
      
      const newDomains = prompt('Filter domains (comma-separated):', filter.domains?.join(', ') || '');
      const newMethods = prompt('Filter methods (comma-separated):', filter.methods?.join(', ') || '');
      const includeHeaders = confirm('Include headers?');
      const includeBody = confirm('Include request/response body?');

      const newFilter = {
        domains: newDomains ? newDomains.split(',').map(d => d.trim()).filter(d => d) : [],
        methods: newMethods ? newMethods.split(',').map(m => m.trim().toUpperCase()).filter(m => m) : [],
        includeHeaders,
        includeBody
      };

      chrome.runtime.sendMessage({
        action: 'setFilter',
        filter: newFilter
      }, (response) => {
        if (response && response.success) {
          showNotification('Settings updated', 'success');
        }
      });
    });
  }

  // Show notification
  function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      z-index: 1000;
      max-width: 300px;
    `;

    const colors = {
      success: { bg: '#48bb78', text: 'white' },
      error: { bg: '#f56565', text: 'white' },
      warning: { bg: '#ed8936', text: 'white' },
      info: { bg: '#4299e1', text: 'white' }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Auto-refresh every 2 seconds when logging
  setInterval(() => {
    if (isLogging) {
      loadRequests();
      updateStatus();
    }
  }, 2000);

  // Handle JeanTrail link click
  document.querySelector('.footer-link').addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: 'http://localhost:8080/developer-hub/auto-api' });
  });
});