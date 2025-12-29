// Hello AI Plugin Script
class HelloAIPlugin {
  constructor() {
    this.settings = {
      defaultModel: 'qwen-2.5-72b',
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant integrated into JeanTrail.',
      saveHistory: true,
      maxHistoryItems: 100
    };
    
    this.chatHistory = [];
    this.isTyping = false;
    this.pluginId = 'hello-ai';
    
    this.init();
  }

  async init() {
    // Load settings and history
    await this.loadSettings();
    await this.loadChatHistory();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup auto-resize for textarea
    this.setupTextareaResize();
    
    // Initialize Jean API connection
    this.initializeJeanAPI();
    
    console.log('Hello AI Plugin initialized');
  }

  setupEventListeners() {
    // Send button
    document.getElementById('sendBtn').addEventListener('click', () => {
      this.sendMessage();
    });

    // Enter key to send (Shift+Enter for new line)
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Character count
    chatInput.addEventListener('input', (e) => {
      const count = e.target.value.length;
      document.getElementById('charCount').textContent = count;
    });

    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.openSettings();
    });

    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
      this.closeSettings();
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetSettingsBtn').addEventListener('click', () => {
      this.resetSettings();
    });

    // Temperature slider
    const tempSlider = document.getElementById('temperature');
    const tempValue = document.getElementById('tempValue');
    tempSlider.addEventListener('input', (e) => {
      tempValue.textContent = e.target.value;
    });

    // Quick commands
    document.querySelectorAll('.quick-cmd').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cmd = e.target.dataset.cmd;
        this.executeQuickCommand(cmd);
      });
    });

    // Minimize button
    document.getElementById('minimizeBtn').addEventListener('click', () => {
      this.minimizePlugin();
    });

    // Close modal on outside click
    document.getElementById('settingsModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeSettings();
      }
    });
  }

  setupTextareaResize() {
    const textarea = document.getElementById('chatInput');
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }

  async initializeJeanAPI() {
    try {
      // Check if Jean API is available
      if (typeof window.jeanAPI !== 'undefined') {
        console.log('Jean API detected');
      } else {
        console.log('Jean API not available, using fallback');
        this.setupFallbackAPI();
      }
    } catch (error) {
      console.error('Failed to initialize Jean API:', error);
      this.setupFallbackAPI();
    }
  }

  setupFallbackAPI() {
    // Fallback to direct HTTP requests
    this.jeanAPI = {
      chat: async (message, options = {}) => {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            model: options.model || this.settings.defaultModel,
            max_tokens: options.maxTokens || this.settings.maxTokens,
            temperature: options.temperature || this.settings.temperature,
            system_prompt: options.systemPrompt || this.settings.systemPrompt
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.response || data.content || 'Sorry, I could not process your request.';
      }
    };
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || this.isTyping) return;

    // Add user message to chat
    this.addMessage(message, 'user');
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('charCount').textContent = '0';
    
    // Show typing indicator
    this.showTypingIndicator();
    this.isTyping = true;
    
    try {
      // Get AI response
      const response = await this.getAIResponse(message);
      
      // Hide typing indicator
      this.hideTypingIndicator();
      
      // Add AI response to chat
      this.addMessage(response, 'assistant');
      
      // Save to history
      if (this.settings.saveHistory) {
        await this.saveChatHistory();
      }
      
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('Sorry, I encountered an error while processing your request. Please try again.', 'assistant');
      console.error('AI response error:', error);
    } finally {
      this.isTyping = false;
    }
  }

  async getAIResponse(message) {
    const options = {
      model: this.settings.defaultModel,
      maxTokens: this.settings.maxTokens,
      temperature: this.settings.temperature,
      systemPrompt: this.settings.systemPrompt
    };

    // Use Jean API if available
    if (window.jeanAPI && window.jeanAPI.chat) {
      return await window.jeanAPI.chat(message, options);
    }
    
    // Use fallback
    return await this.jeanAPI.chat(message, options);
  }

  addMessage(content, type = 'user') {
    const messagesContainer = document.getElementById('chatMessages');
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    
    // Remove welcome message on first user message
    if (welcomeMessage && type === 'user') {
      welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatar = type === 'user' ? '👤' : '🤖';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-bubble">
          <p>${this.escapeHtml(content)}</p>
        </div>
        <div class="message-time">${time}</div>
      </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to history
    this.chatHistory.push({
      content,
      type,
      timestamp: new Date().toISOString()
    });
    
    // Limit history size
    if (this.chatHistory.length > this.settings.maxHistoryItems) {
      this.chatHistory = this.chatHistory.slice(-this.settings.maxHistoryItems);
    }
  }

  showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.classList.remove('hidden');
    
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.classList.add('hidden');
  }

  async executeQuickCommand(cmd) {
    let message = '';
    
    switch (cmd) {
      case 'summarize':
        message = 'Please summarize the current page content for me.';
        break;
      case 'translate':
        message = 'Can you help me translate some text? Please ask what language and text to translate.';
        break;
      case 'explain':
        message = 'I need help understanding a concept. Please ask what you would like me to explain.';
        break;
      default:
        return;
    }
    
    // Set the message in input and send
    const input = document.getElementById('chatInput');
    input.value = message;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    document.getElementById('charCount').textContent = message.length;
    
    // Auto-send after a short delay
    setTimeout(() => this.sendMessage(), 100);
  }

  openSettings() {
    // Load current settings into form
    document.getElementById('modelSelect').value = this.settings.defaultModel;
    document.getElementById('maxTokens').value = this.settings.maxTokens;
    document.getElementById('temperature').value = this.settings.temperature;
    document.getElementById('tempValue').textContent = this.settings.temperature;
    document.getElementById('systemPrompt').value = this.settings.systemPrompt;
    document.getElementById('saveHistory').checked = this.settings.saveHistory;
    
    // Show modal
    document.getElementById('settingsModal').classList.remove('hidden');
  }

  closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
  }

  async saveSettings() {
    // Update settings from form
    this.settings = {
      defaultModel: document.getElementById('modelSelect').value,
      maxTokens: parseInt(document.getElementById('maxTokens').value),
      temperature: parseFloat(document.getElementById('temperature').value),
      systemPrompt: document.getElementById('systemPrompt').value,
      saveHistory: document.getElementById('saveHistory').checked,
      maxHistoryItems: this.settings.maxHistoryItems
    };
    
    // Save to storage
    try {
      await this.saveSettingsToStorage();
      this.closeSettings();
      this.showNotification('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showNotification('Failed to save settings', 'error');
    }
  }

  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.settings = {
        defaultModel: 'qwen-2.5-72b',
        maxTokens: 1000,
        temperature: 0.7,
        systemPrompt: 'You are a helpful AI assistant integrated into JeanTrail.',
        saveHistory: true,
        maxHistoryItems: 100
      };
      
      // Update form
      document.getElementById('modelSelect').value = this.settings.defaultModel;
      document.getElementById('maxTokens').value = this.settings.maxTokens;
      document.getElementById('temperature').value = this.settings.temperature;
      document.getElementById('tempValue').textContent = this.settings.temperature;
      document.getElementById('systemPrompt').value = this.settings.systemPrompt;
      document.getElementById('saveHistory').checked = this.settings.saveHistory;
      
      this.showNotification('Settings reset to defaults', 'info');
    }
  }

  minimizePlugin() {
    // Send message to parent window to minimize plugin
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'jeantrail_plugin_minimize',
        pluginId: this.pluginId
      }, '*');
    }
  }

  async loadSettings() {
    try {
      // Load from JeanTrail plugin storage
      if (window.jeantrailAPI && window.jeantrailAPI.getPluginSettings) {
        const settings = await window.jeantrailAPI.getPluginSettings(this.pluginId);
        if (settings) {
          this.settings = { ...this.settings, ...settings };
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettingsToStorage() {
    try {
      // Save to JeanTrail plugin storage
      if (window.jeantrailAPI && window.jeantrailAPI.setPluginSettings) {
        await window.jeantrailAPI.setPluginSettings(this.pluginId, this.settings);
      }
    } catch (error) {
      console.error('Failed to save settings to storage:', error);
    }
  }

  async loadChatHistory() {
    if (!this.settings.saveHistory) return;
    
    try {
      // Load from JeanTrail plugin storage
      if (window.jeantrailAPI && window.jeantrailAPI.getPluginData) {
        const history = await window.jeantrailAPI.getPluginData(this.pluginId, 'chatHistory');
        if (history && Array.isArray(history)) {
          this.chatHistory = history;
          // Display history
          this.chatHistory.forEach(msg => {
            this.addMessage(msg.content, msg.type);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }

  async saveChatHistory() {
    if (!this.settings.saveHistory) return;
    
    try {
      // Save to JeanTrail plugin storage
      if (window.jeantrailAPI && window.jeantrailAPI.setPluginData) {
        await window.jeantrailAPI.setPluginData(this.pluginId, 'chatHistory', this.chatHistory);
      }
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
      color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize plugin when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new HelloAIPlugin();
});

// Handle plugin messages from parent window
window.addEventListener('message', (event) => {
  if (event.data.type === 'jeantrail_plugin_command') {
    const { command, data } = event.data;
    
    switch (command) {
      case 'focus':
        document.getElementById('chatInput').focus();
        break;
      case 'set_message':
        const input = document.getElementById('chatInput');
        input.value = data.message;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        document.getElementById('charCount').textContent = data.message.length;
        break;
    }
  }
});