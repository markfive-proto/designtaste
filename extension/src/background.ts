// Background script for Vibe UI Assistant
// Handles queue management, screenshot capture, and API communication

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
  screenshot: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  priority: number;
  timestamp: number;
}

class BackgroundQueue {
  private queue: QueuedElement[] = [];
  private processing = false;
  private webAppUrl = 'http://localhost:3000'; // Next.js app URL

  constructor() {
    this.loadQueue();
    this.setupListeners();
  }

  private async loadQueue() {
    const result = await chrome.storage.local.get(['processingQueue']);
    this.queue = result.processingQueue || [];
    this.updateBadge();
  }

  private async saveQueue() {
    await chrome.storage.local.set({ processingQueue: this.queue });
    this.updateBadge();
  }

  private updateBadge() {
    const queuedCount = this.queue.filter(item => item.status === 'queued').length;
    chrome.action.setBadgeText({
      text: queuedCount > 0 ? queuedCount.toString() : ''
    });
    chrome.action.setBadgeBackgroundColor({ color: '#3B82F6' });
  }

  private setupListeners() {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'ADD_TO_QUEUE':
          this.addToQueue(message.elementData, sender.tab!);
          sendResponse({ success: true });
          break;
        case 'PROCESS_NOW':
          this.processNow(message.elementData, sender.tab!);
          sendResponse({ success: true });
          break;
        case 'QUICK_FIX':
          this.handleQuickFix(message.elementData, message.prompt, sender.tab!)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true; // Keep message channel open for async response
        case 'FIND_INSPIRATION':
          this.handleFindInspiration(message.elementData, message.prompt, sender.tab!, message.elementScreenshot);
          sendResponse({ success: true });
          break;
        case 'GET_QUEUE_STATUS':
          sendResponse({ queue: this.queue });
          break;
        case 'CLEAR_QUEUE':
          this.clearQueue();
          sendResponse({ success: true });
          break;
        case 'CHECK_AUTH':
          this.checkAuthStatus()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ authenticated: false, error: error.message }));
          return true; // Keep message channel open for async response
        case 'OPEN_TAB':
          chrome.tabs.create({ url: message.url });
          sendResponse({ success: true });
          break;
        case 'CAPTURE_SCREENSHOT':
          chrome.tabs.captureVisibleTab({ format: 'png', quality: 90 })
            .then(screenshot => sendResponse(screenshot))
            .catch(error => sendResponse(null));
          return true; // Keep message channel open for async response
      }
    });

    // Listen for keyboard shortcut
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'activate_selector') {
        this.activateSelector();
      }
    });

    // Listen for tab updates to process queue
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && !this.processing) {
        this.processQueue();
      }
    });
  }

  private async activateSelector() {
    console.log('Background: Activating selector via keyboard shortcut');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_SELECTOR' });
        console.log('Background: Selector activated');
      } catch (error) {
        console.error('Background: Failed to activate selector:', error);
      }
    }
  }

  private async addToQueue(elementData: any, tab: chrome.tabs.Tab) {
    const screenshot = await this.captureScreenshot(tab.id!);
    
    const queueItem: QueuedElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: tab.url || '',
      elementData,
      screenshot,
      status: 'queued',
      priority: 1,
      timestamp: Date.now()
    };

    this.queue.push(queueItem);
    await this.saveQueue();
    
    // Show notification
    this.showNotification(`Element added to queue. ${this.queue.length} total.`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processNow(elementData: any, tab: chrome.tabs.Tab) {
    const screenshot = await this.captureScreenshot(tab.id!);
    
    const queueItem: QueuedElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: tab.url || '',
      elementData,
      screenshot,
      status: 'processing',
      priority: 10, // High priority for immediate processing
      timestamp: Date.now()
    };

    // Add to front of queue and process immediately
    this.queue.unshift(queueItem);
    await this.saveQueue();
    
    // Open web app with this element
    this.openWebApp(queueItem);
  }

  private async captureScreenshot(tabId: number): Promise<string> {
    try {
      const screenshot = await chrome.tabs.captureVisibleTab({
        format: 'png',
        quality: 90
      });
      return screenshot;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return '';
    }
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    // Sort by priority (higher = more urgent)
    this.queue.sort((a, b) => b.priority - a.priority);
    
    // Process up to 3 elements concurrently
    const toProcess = this.queue
      .filter(item => item.status === 'queued')
      .slice(0, 3);
    
    const promises = toProcess.map(item => this.processElement(item));
    await Promise.allSettled(promises);
    
    this.processing = false;
    
    // Continue processing if there are more items
    const remainingQueued = this.queue.filter(item => item.status === 'queued');
    if (remainingQueued.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private async processElement(element: QueuedElement) {
    try {
      element.status = 'processing';
      await this.saveQueue();
      
      // Send to Next.js API for processing
      const response = await fetch(`${this.webAppUrl}/api/elements/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: element.id,
          elementData: element.elementData,
          screenshot: element.screenshot,
          url: element.url
        })
      });

      if (response.ok) {
        element.status = 'completed';
        this.showNotification(`✅ Analysis complete for ${element.elementData.tagName}`);
      } else {
        console.error('API response error:', response.status, await response.text());
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Processing failed:', error);
      element.status = 'error';
      this.showNotification(`❌ Failed to process ${element.elementData.tagName}`);
    }
    
    await this.saveQueue();
  }

  private openWebApp(element?: QueuedElement) {
    const url = element 
      ? `${this.webAppUrl}/dashboard?elementId=${element.id}`
      : `${this.webAppUrl}/dashboard`;
    
    chrome.tabs.create({ url });
  }

  private async handleQuickFix(elementData: any, prompt: string, tab: chrome.tabs.Tab) {
    try {
      console.log('Background: Handling quick fix request:', prompt);
      
      // Check usage count and prompt for auth if needed
      const usageCheck = await this.checkQuickFixUsage();
      if (!usageCheck.allowed) {
        return {
          success: false,
          error: 'auth_required',
          message: 'Sign up with Google to continue using Quick Fix suggestions',
          usageCount: usageCheck.count
        };
      }
      
      // Increment usage count
      await this.incrementQuickFixUsage();
      
      // Analyze intent and generate quick fix
      const suggestion = await this.generateQuickFix(elementData, prompt);
      
      return {
        success: true,
        suggestion,
        usageCount: usageCheck.count + 1
      };
    } catch (error) {
      console.error('Background: Quick fix failed:', error);
      return {
        success: false,
        error: 'Failed to generate suggestion'
      };
    }
  }
  
  private async checkQuickFixUsage(): Promise<{ allowed: boolean; count: number }> {
    const result = await chrome.storage.local.get(['quickFixUsageCount', 'userAuthenticated']);
    const count = result.quickFixUsageCount || 0;
    const isAuthenticated = result.userAuthenticated || false;
    
    // Allow unlimited usage if authenticated, otherwise limit to 1 free try
    const allowed = isAuthenticated || count < 1;
    
    return { allowed, count };
  }
  
  private async incrementQuickFixUsage() {
    const result = await chrome.storage.local.get(['quickFixUsageCount']);
    const count = (result.quickFixUsageCount || 0) + 1;
    await chrome.storage.local.set({ quickFixUsageCount: count });
  }
  
  private async checkAuthStatus(): Promise<{ authenticated: boolean; user?: any }> {
    const result = await chrome.storage.local.get(['userAuthenticated', 'userProfile']);
    return {
      authenticated: result.userAuthenticated || false,
      user: result.userProfile || null
    };
  }

  private async handleFindInspiration(elementData: any, prompt: string, tab: chrome.tabs.Tab, elementScreenshot?: string) {
    const fullPageScreenshot = await this.captureScreenshot(tab.id!);
    
    const queueItem: QueuedElement = {
      id: `inspiration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: tab.url || '',
      elementData: {
        ...elementData,
        userPrompt: prompt,
        requestType: 'inspiration',
        elementScreenshot: elementScreenshot || null // Store element-specific screenshot
      },
      screenshot: fullPageScreenshot, // Keep full page screenshot for context
      status: 'queued',
      priority: 2, // Higher priority for inspiration requests
      timestamp: Date.now()
    };

    this.queue.push(queueItem);
    await this.saveQueue();
    
    this.showNotification(`Added "${prompt}" to inspiration queue`);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async generateQuickFix(elementData: any, prompt: string): Promise<string> {
    // Simple intent-based suggestions for common requests
    const lowerPrompt = prompt.toLowerCase();
    
    // Color and contrast improvements
    if (lowerPrompt.includes('color') || lowerPrompt.includes('contrast')) {
      return `To improve color contrast:\n• Use darker text colors (at least #374151)\n• Increase background contrast\n• Consider using color-contrast tools\n• Add hover states with darker shades`;
    }
    
    // Spacing and layout
    if (lowerPrompt.includes('spacing') || lowerPrompt.includes('padding') || lowerPrompt.includes('margin')) {
      return `To improve spacing:\n• Add consistent padding: py-4 px-6\n• Use margin utilities: mb-4, mt-2\n• Consider space-y-4 for vertical spacing\n• Use gap-4 for flex/grid layouts`;
    }
    
    // Modern/styling improvements
    if (lowerPrompt.includes('modern') || lowerPrompt.includes('better') || lowerPrompt.includes('improve')) {
      return `To modernize this ${elementData.tagName.toLowerCase()}:\n• Add rounded corners: rounded-lg\n• Include subtle shadows: shadow-md\n• Use gradient backgrounds: bg-gradient-to-r\n• Add smooth transitions: transition-all duration-200`;
    }
    
    // Button specific
    if (elementData.tagName.toLowerCase() === 'button' || lowerPrompt.includes('button')) {
      return `Button improvements:\n• Use consistent padding: px-6 py-3\n• Add hover effects: hover:bg-blue-600\n• Include focus states: focus:ring-2 focus:ring-blue-500\n• Consider using rounded-lg and font-semibold`;
    }
    
    // Generic improvement
    return `Quick improvements for ${elementData.tagName.toLowerCase()}:\n• Improve typography: font-semibold text-lg\n• Add visual hierarchy with proper spacing\n• Consider hover and focus states\n• Use consistent color scheme\n• Add subtle animations for better UX`;
  }

  private async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    this.showNotification('Queue cleared');
  }

  private showNotification(message: string) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Vibe UI Assistant',
      message
    });
  }
}

// Initialize background queue manager
new BackgroundQueue();