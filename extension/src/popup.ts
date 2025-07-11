// Popup script for Vibe UI Assistant extension

interface QueuedElement {
  id: string;
  url: string;
  elementData: {
    html: string;
    css: string;
    boundingBox: DOMRect;
    tagName: string;
    textContent: string;
    computedStyles: Record<string, string>;
    elementScreenshot?: string;
    userPrompt?: string;
    requestType?: string;
  };
  status: 'queued' | 'processing' | 'completed' | 'error';
  priority: number;
  timestamp: number;
}

class PopupManager {
  private queueContainer: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;

  constructor() {
    this.initializePopup();
  }

  private async initializePopup() {
    await this.setupDOM();
    await this.loadQueueStatus();
    this.attachEventListeners();
  }

  private async setupDOM() {
    const popup = document.getElementById('popup');
    if (!popup) return;

    // Check auth status first
    const authStatus = await this.getAuthStatus();

    popup.innerHTML = `
      <div class="popup-header">
        <div class="header-content">
          <h2>Vibe UI Assistant</h2>
          <div class="status" id="status">●</div>
        </div>
        <div class="user-section" id="userSection">
          ${authStatus.authenticated ? this.renderUserInfo(authStatus.user) : this.renderSignInPrompt()}
        </div>
      </div>
      
      <div class="queue-section">
        <div class="queue-header">
          <h3>Processing Queue</h3>
          <button id="viewAll" class="btn-secondary">View All</button>
        </div>
        <div id="queueContainer" class="queue-container">
          <!-- Queue items will be inserted here -->
        </div>
      </div>
      
      <div class="actions">
        <button id="selectElement" class="btn-primary">Select Element</button>
        <button id="openApp" class="btn-secondary">Open App</button>
      </div>
      
      <div class="footer">
        <button id="clearQueue" class="btn-text">Clear Queue</button>
        <button id="settings" class="btn-text">Settings</button>
      </div>
    `;

    this.queueContainer = document.getElementById('queueContainer');
    this.statusEl = document.getElementById('status');
  }

  private async getAuthStatus(): Promise<{ authenticated: boolean; user?: any }> {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
      return response;
    } catch (error) {
      return { authenticated: false };
    }
  }

  private renderUserInfo(user: any): string {
    const avatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&size=32&background=3B82F6&color=fff`;
    const name = user?.name || user?.email?.split('@')[0] || 'User';
    
    return `
      <div class="user-info">
        <img src="${avatar}" alt="User avatar" class="user-avatar" />
        <div class="user-details">
          <div class="user-name">${name}</div>
          <div class="user-status">✅ Signed in</div>
        </div>
        <button id="signOut" class="sign-out-btn" title="Sign out">⚙️</button>
      </div>
    `;
  }

  private renderSignInPrompt(): string {
    return `
      <div class="sign-in-prompt">
        <div class="sign-in-icon">👤</div>
        <div class="sign-in-text">
          <div class="sign-in-title">Not signed in</div>
          <div class="sign-in-subtitle">Limited to 1 free suggestion</div>
        </div>
        <div class="sign-in-buttons">
          <button id="signInBtn" class="sign-in-btn">Sign In</button>
          <button id="syncAuthBtn" class="sync-auth-btn" title="Sync with web app if already signed in">🔄</button>
        </div>
      </div>
    `;
  }

  private renderThumbnail(item: QueuedElement): string {
    const elementScreenshot = item.elementData?.elementScreenshot;
    
    if (elementScreenshot) {
      return `<div class="queue-item-thumbnail">
        <img src="${elementScreenshot}" alt="Element thumbnail" />
      </div>`;
    }
    
    // Fallback icon based on element type
    const tagName = item.elementData?.tagName?.toLowerCase() || 'div';
    const icon = this.getElementIcon(tagName);
    
    return `<div class="queue-item-thumbnail queue-item-icon">
      ${icon}
    </div>`;
  }

  private getElementIcon(tagName: string): string {
    switch (tagName) {
      case 'button': return '🔘';
      case 'input': return '📝';
      case 'img': return '🖼️';
      case 'nav': return '🧭';
      case 'header': return '📄';
      case 'footer': return '📑';
      case 'section': return '📋';
      case 'article': return '📰';
      case 'aside': return '📌';
      case 'form': return '📋';
      default: return '📦';
    }
  }

  private attachEventListeners() {
    // Select Element button
    document.getElementById('selectElement')?.addEventListener('click', () => {
      this.activateSelector();
    });

    // Open App button
    document.getElementById('openApp')?.addEventListener('click', () => {
      this.openWebApp();
    });

    // View All button
    document.getElementById('viewAll')?.addEventListener('click', () => {
      this.openWebApp();
    });

    // Clear Queue button
    document.getElementById('clearQueue')?.addEventListener('click', () => {
      this.clearQueue();
    });

    // Settings button
    document.getElementById('settings')?.addEventListener('click', () => {
      this.openSettings();
    });

    // Sign in button
    document.getElementById('signInBtn')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ 
        type: 'OPEN_TAB', 
        url: 'http://localhost:3000/auth/signup' 
      });
      window.close();
    });

    // Sync auth button (for local development)
    document.getElementById('syncAuthBtn')?.addEventListener('click', () => {
      this.syncAuthWithWebApp();
    });

    // Sign out button
    document.getElementById('signOut')?.addEventListener('click', () => {
      this.handleSignOut();
    });
  }

  private async loadQueueStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_QUEUE_STATUS' });
      const queue: QueuedElement[] = response.queue || [];
      
      this.updateQueueDisplay(queue);
      this.updateStatus(queue);
    } catch (error) {
      console.error('Failed to load queue status:', error);
    }
  }

  private updateQueueDisplay(queue: QueuedElement[]) {
    if (!this.queueContainer) return;

    if (queue.length === 0) {
      this.queueContainer.innerHTML = `
        <div class="empty-queue">
          <p>No elements in queue</p>
          <p class="empty-subtitle">Select elements to get started</p>
        </div>
      `;
      return;
    }

    // Show only the first 3 items in popup
    const displayQueue = queue.slice(0, 3);
    const remaining = queue.length - displayQueue.length;

    this.queueContainer.innerHTML = displayQueue.map(item => `
      <div class="queue-item ${item.status}">
        ${this.renderThumbnail(item)}
        <div class="queue-item-info">
          <div class="queue-item-title">${this.getElementTitle(item)}</div>
          <div class="queue-item-url">${this.formatUrl(item.url)}</div>
        </div>
        <div class="queue-item-status">
          ${this.getStatusIcon(item.status)}
        </div>
      </div>
    `).join('');

    if (remaining > 0) {
      this.queueContainer.innerHTML += `
        <div class="queue-more">
          <p>+${remaining} more items</p>
        </div>
      `;
    }
  }

  private updateStatus(queue: QueuedElement[]) {
    if (!this.statusEl) return;

    const processing = queue.filter(item => item.status === 'processing').length;
    const queued = queue.filter(item => item.status === 'queued').length;

    if (processing > 0) {
      this.statusEl.className = 'status processing';
      this.statusEl.title = `${processing} processing, ${queued} queued`;
    } else if (queued > 0) {
      this.statusEl.className = 'status queued';
      this.statusEl.title = `${queued} in queue`;
    } else {
      this.statusEl.className = 'status idle';
      this.statusEl.title = 'Idle';
    }
  }

  private getElementTitle(item: QueuedElement): string {
    const elementData = item.elementData;
    if (!elementData) return 'Element';
    
    // Try to get a more descriptive title
    const tagName = elementData.tagName || 'Element';
    const textContent = elementData.textContent?.slice(0, 30) || '';
    const className = this.extractClassName(elementData.html);
    
    // Create a smart title based on available information
    if (textContent.trim()) {
      return `${this.formatTagName(tagName)}: ${textContent.trim()}`;
    } else if (className) {
      return `${this.formatTagName(tagName)} (${className})`;
    } else {
      return this.formatTagName(tagName);
    }
  }
  
  private extractClassName(html: string): string {
    const match = html.match(/class=["']([^"']*?)["']/);
    if (match && match[1]) {
      // Get first meaningful class name (ignore utility classes)
      const classes = match[1].split(' ').filter(cls => 
        cls.length > 2 && !cls.startsWith('w-') && !cls.startsWith('h-') && 
        !cls.startsWith('p-') && !cls.startsWith('m-') && !cls.startsWith('text-')
      );
      return classes[0] || match[1].split(' ')[0];
    }
    return '';
  }

  private formatTagName(tagName: string): string {
    const formatted = tagName.toLowerCase();
    switch (formatted) {
      case 'div': return 'Container';
      case 'section': return 'Section';
      case 'header': return 'Header';
      case 'nav': return 'Navigation';
      case 'footer': return 'Footer';
      case 'article': return 'Article';
      case 'aside': return 'Sidebar';
      case 'main': return 'Main Content';
      default: return tagName;
    }
  }

  private formatUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch {
      return url;
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'queued': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  }

  private async activateSelector() {
    try {
      console.log('Popup: Activating selector');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Popup: Active tab', tab);
      
      if (!tab.id) {
        alert('No active tab found.');
        return;
      }
      
      // Check if tab URL is valid for injection
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://'))) {
        alert('Cannot activate selector on this page. Please navigate to a regular website.');
        return;
      }
      
      console.log('Popup: Checking if content script is ready');
      
      // First, try to ping the content script to see if it's ready
      const isReady = await this.testContentScriptReady(tab.id);
      
      if (isReady) {
        console.log('Popup: Content script is ready, activating selector');
        await this.sendActivateMessage(tab.id);
      } else {
        console.log('Popup: Content script not ready, injecting...');
        await this.injectAndActivate(tab.id);
      }
      
    } catch (error) {
      console.error('Popup: Failed to activate selector:', error);
      alert('Failed to activate selector. Please refresh the page and try again.');
    }
  }

  private async testContentScriptReady(tabId: number): Promise<boolean> {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
      return response && response.success && response.ready;
    } catch (error) {
      console.log('Popup: Content script not ready:', error);
      return false;
    }
  }

  private async sendActivateMessage(tabId: number): Promise<void> {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: 'ACTIVATE_SELECTOR' });
      
      if (response && response.success) {
        console.log('Popup: Successfully activated selector');
        window.close();
      } else {
        console.error('Popup: Content script did not respond properly');
        alert('Could not activate selector. Please refresh the page and try again.');
      }
    } catch (error) {
      console.error('Popup: Failed to send activate message:', error);
      alert('Communication failed. Please refresh the page and try again.');
    }
  }

  private async injectAndActivate(tabId: number): Promise<void> {
    try {
      console.log('Popup: Injecting content script');
      
      // Inject CSS first
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['content.css']
      });
      
      // Then inject the script
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      
      console.log('Popup: Content script and CSS injected, waiting for initialization');
      
      // Wait for content script to initialize with retries
      let retries = 5;
      let isReady = false;
      
      while (retries > 0 && !isReady) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between retries
        
        try {
          const pingResponse = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
          if (pingResponse && pingResponse.success && pingResponse.ready) {
            isReady = true;
            break;
          }
        } catch (error) {
          console.log(`Popup: Ping retry ${6 - retries} failed:`, error);
        }
        
        retries--;
      }
      
      if (isReady) {
        console.log('Popup: Content script ready after injection, activating selector');
        await this.sendActivateMessage(tabId);
      } else {
        console.error('Popup: Content script not ready after injection and retries');
        alert('Could not initialize selector. Please refresh the page and try again.');
      }
      
    } catch (injectError) {
      console.error('Popup: Manual injection failed:', injectError);
      alert('Could not inject content script. Please refresh the page and try again.');
    }
  }

  private openWebApp() {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
    window.close();
  }

  private async clearQueue() {
    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_QUEUE' });
      await this.loadQueueStatus();
    } catch (error) {
      console.error('Failed to clear queue:', error);
    }
  }

  private openSettings() {
    chrome.tabs.create({ url: 'http://localhost:3000/settings' });
    window.close();
  }

  private async handleSignOut() {
    try {
      // Clear extension storage
      await chrome.storage.local.clear();
      
      // Open sign out page
      chrome.runtime.sendMessage({ 
        type: 'OPEN_TAB', 
        url: 'http://localhost:3000/auth/signout' 
      });
      
      // Refresh popup
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  private async syncAuthWithWebApp() {
    try {
      // Show loading state
      const syncBtn = document.getElementById('syncAuthBtn') as HTMLButtonElement;
      if (syncBtn) {
        syncBtn.textContent = '⏳';
        syncBtn.disabled = true;
      }

      // Try to fetch auth status from the web app
      const response = await fetch('http://localhost:3000/api/auth/status', {
        credentials: 'include' // Include cookies for session
      });

      if (response.ok) {
        const authData = await response.json();
        
        if (authData.authenticated && authData.user) {
          // Store auth data in extension
          await chrome.storage.local.set({
            userAuthenticated: true,
            userProfile: authData.user,
            userSession: authData.session || {}
          });
          
          // Refresh popup to show signed in state
          window.location.reload();
        } else {
          // User not signed in on web app
          alert('You are not signed in on the web app. Please sign in first at localhost:3000');
        }
      } else {
        throw new Error('Failed to fetch auth status');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Make sure you are signed in at localhost:3000 and try again.');
      
      // Reset button
      const syncBtn = document.getElementById('syncAuthBtn') as HTMLButtonElement;
      if (syncBtn) {
        syncBtn.textContent = '🔄';
        syncBtn.disabled = false;
      }
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});