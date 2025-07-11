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

    popup.innerHTML = `
      <div class="popup-header">
        <h2>Vibe UI Assistant</h2>
        <div class="status" id="status">●</div>
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
      
      if (tab.id) {
        console.log('Popup: Sending message to tab', tab.id);
        
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_SELECTOR' });
          console.log('Popup: Response from content script', response);
          
          if (response && response.success) {
            console.log('Popup: Successfully activated selector');
            window.close();
          } else {
            console.error('Popup: Content script did not respond properly');
            alert('Content script not ready. Please refresh the page and try again.');
          }
        } catch (messageError) {
          console.error('Popup: Message sending failed:', messageError);
          
          // Try to inject content script manually
          try {
            console.log('Popup: Attempting to inject content script manually');
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            });
            
            // Wait a bit then try again
            setTimeout(async () => {
              try {
                const retryResponse = await chrome.tabs.sendMessage(tab.id!, { type: 'ACTIVATE_SELECTOR' });
                if (retryResponse && retryResponse.success) {
                  console.log('Popup: Successfully activated after manual injection');
                  window.close();
                } else {
                  alert('Could not activate selector. Please refresh the page and try again.');
                }
              } catch (retryError) {
                console.error('Popup: Retry failed:', retryError);
                alert('Could not activate selector. Please refresh the page and try again.');
              }
            }, 500);
            
          } catch (injectError) {
            console.error('Popup: Manual injection failed:', injectError);
            alert('Could not communicate with page. Please refresh and try again.');
          }
        }
      }
    } catch (error) {
      console.error('Popup: Failed to activate selector:', error);
      alert('Failed to activate selector. Please refresh the page and try again.');
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
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});