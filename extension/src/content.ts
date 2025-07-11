// Content script for Vibe UI Assistant
// Handles element selection overlay and interaction

interface ElementData {
  html: string;
  css: string;
  boundingBox: DOMRect;
  tagName: string;
  textContent: string;
  computedStyles: Record<string, string>;
  classList: string[];
  tailwindClasses: string[];
  parentContext: {
    tagName: string;
    classList: string[];
    display?: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
  } | null;
  children: Array<{
    tagName: string;
    classList: string[];
    textContent: string;
    innerHTML: string;
  }>;
  innerHTML: string;
  attributes: Record<string, string>;
}

class ElementSelector {
  private isActive = false;
  private overlay: HTMLDivElement | null = null;
  private highlightedElement: HTMLElement | null = null;
  private selectionBox: HTMLDivElement | null = null;
  private actionButtons: HTMLDivElement | null = null;

  constructor() {
    console.log('Vibe UI Assistant: Content script loaded');
    this.setupMessageListener();
    this.setupAuthSyncListener();
    this.injectStyles();
    
    // Signal that content script is ready
    this.signalReadiness();
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Vibe UI Assistant: Received message', message);
      
      // Immediately signal that we received the message
      if (!sendResponse) {
        console.warn('Vibe UI Assistant: No sendResponse function available');
        return;
      }
      
      try {
        switch (message.type) {
          case 'PING':
            console.log('Vibe UI Assistant: Responding to ping');
            sendResponse({ success: true, ready: true });
            break;
          case 'ACTIVATE_SELECTOR':
            console.log('Vibe UI Assistant: Activating selector');
            this.activate();
            sendResponse({ success: true });
            break;
          case 'DEACTIVATE_SELECTOR':
            console.log('Vibe UI Assistant: Deactivating selector');
            this.deactivate();
            sendResponse({ success: true });
            break;
          default:
            console.log('Vibe UI Assistant: Unknown message type', message.type);
            sendResponse({ success: false, error: 'Unknown message type' });
        }
      } catch (error) {
        console.error('Vibe UI Assistant: Error handling message', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        sendResponse({ success: false, error: errorMessage });
      }
      
      return true; // Keep message channel open for async response
    });
  }

  private signalReadiness() {
    // Send a message to background script to signal readiness
    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ 
          type: 'CONTENT_SCRIPT_READY',
          url: window.location.href,
          timestamp: Date.now()
        }).catch(err => {
          console.log('Vibe UI Assistant: Could not signal readiness (extension may be reloading):', err);
        });
      }
    } catch (error) {
      console.log('Vibe UI Assistant: Could not signal readiness:', error);
    }
  }

  private setupAuthSyncListener() {
    // Listen for auth sync messages from web pages (for local development)
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'VIBE_UI_AUTH_SYNC') {
        console.log('Vibe UI Assistant: Received auth sync message', event.data);
        
        try {
          // Store auth data in extension storage
          await chrome.storage.local.set({
            userAuthenticated: event.data.data.authenticated,
            userProfile: event.data.data.user,
            userSession: event.data.data.session
          });
          
          // Confirm sync success
          window.postMessage({
            type: 'VIBE_UI_AUTH_SYNC_CONFIRMED'
          }, '*');
          
          console.log('Vibe UI Assistant: Auth sync completed successfully');
          
        } catch (error) {
          console.error('Vibe UI Assistant: Auth sync failed:', error);
        }
      }
    });
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .vibe-ui-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.05);
        z-index: 999999;
        cursor: crosshair;
        pointer-events: none;
      }
      
      .vibe-ui-highlight {
        position: fixed;
        border: 2px solid #3B82F6;
        background: rgba(59, 130, 246, 0.08);
        pointer-events: none;
        z-index: 1000000;
        transition: all 0.1s ease;
        box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
      }
      
      .vibe-ui-selection-box {
        position: absolute;
        border: 3px solid #10B981;
        background: rgba(16, 185, 129, 0.1);
        z-index: 1000001;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
      }
      
      .vibe-ui-actions {
        position: absolute;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 1000002;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        min-width: 320px;
      }
      
      .vibe-ui-prompt-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .vibe-ui-prompt-label {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }
      
      .vibe-ui-prompt-input {
        width: 100%;
        padding: 8px 12px;
        border: 2px solid #E5E7EB;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        min-height: 60px;
        max-height: 120px;
      }
      
      .vibe-ui-prompt-input:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .vibe-ui-button-row {
        display: flex;
        gap: 8px;
      }
      
      .vibe-ui-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .vibe-ui-btn-primary {
        background: #3B82F6;
        color: white;
      }
      
      .vibe-ui-btn-primary:hover {
        background: #2563EB;
      }
      
      .vibe-ui-btn-secondary {
        background: #10B981;
        color: white;
      }
      
      .vibe-ui-btn-secondary:hover {
        background: #059669;
      }
      
      .vibe-ui-btn-cancel {
        background: #EF4444;
        color: white;
      }
      
      .vibe-ui-btn-cancel:hover {
        background: #DC2626;
      }
      
      .vibe-ui-element-info {
        position: absolute;
        background: #1F2937;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        z-index: 1000003;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  public activate() {
    console.log('Vibe UI Assistant: Activating element selector');
    if (this.isActive) return;
    
    this.isActive = true;
    this.createOverlay();
    this.attachEventListeners();
    this.showInstructions();
  }

  public deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.removeOverlay();
    this.removeEventListeners();
    this.clearSelection();
  }

  private createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'vibe-ui-overlay';
    document.body.appendChild(this.overlay);
  }

  private removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private showInstructions() {
    // Could add a tooltip with instructions
    console.log('Vibe UI Assistant activated. Click on any element to select it.');
  }

  private attachEventListeners() {
    document.addEventListener('mouseover', this.handleMouseOver, true);
    document.addEventListener('mouseout', this.handleMouseOut, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown, true);
  }

  private removeEventListeners() {
    document.removeEventListener('mouseover', this.handleMouseOver, true);
    document.removeEventListener('mouseout', this.handleMouseOut, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
  }

  private handleMouseOver = (event: MouseEvent) => {
    if (!this.isActive) return;
    
    const element = event.target as HTMLElement;
    if (this.isVibeUIElement(element)) return;
    
    console.log('Hovering over:', element.tagName, element.className);
    this.highlightElement(element);
  };

  private handleMouseOut = (event: MouseEvent) => {
    if (!this.isActive) return;
    
    const element = event.target as HTMLElement;
    if (this.isVibeUIElement(element)) return;
    
    // Only remove highlight if we're actually leaving the element
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget || !element.contains(relatedTarget)) {
      this.removeHighlight();
    }
  };

  private handleClick = async (event: MouseEvent) => {
    if (!this.isActive) return;
    
    const element = event.target as HTMLElement;
    if (this.isVibeUIElement(element)) return;
    
    console.log('Clicked on:', element.tagName, element.className);
    
    event.preventDefault();
    event.stopPropagation();
    
    await this.selectElement(element);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isActive) return;
    
    if (event.key === 'Escape') {
      this.deactivate();
    }
  };

  private isVibeUIElement(element: HTMLElement): boolean {
    return element.closest('.vibe-ui-overlay, .vibe-ui-actions, .vibe-ui-selection-box, .vibe-ui-highlight') !== null;
  }

  private highlightElement(element: HTMLElement) {
    this.removeHighlight();
    
    const rect = element.getBoundingClientRect();
    
    // Create highlight overlay
    const highlight = document.createElement('div');
    highlight.className = 'vibe-ui-highlight';
    highlight.style.position = 'fixed'; // Use fixed positioning for viewport coordinates
    highlight.style.left = `${rect.left}px`;
    highlight.style.top = `${rect.top}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    highlight.style.pointerEvents = 'none'; // Don't block interactions
    
    // Add element info tooltip
    const info = document.createElement('div');
    info.className = 'vibe-ui-element-info';
    const classText = element.className && typeof element.className === 'string' && element.className.trim() 
      ? '.' + element.className.trim().split(' ').filter(c => c).join('.') 
      : '';
    info.textContent = `${element.tagName.toLowerCase()}${classText}`;
    info.style.position = 'fixed';
    info.style.left = `${rect.left}px`;
    info.style.top = `${Math.max(0, rect.top - 25)}px`; // Don't go above viewport
    info.style.pointerEvents = 'none';
    
    document.body.appendChild(highlight);
    document.body.appendChild(info);
    
    this.highlightedElement = highlight;
    
    console.log('Highlighting element:', element.tagName, 'at', rect);
  }

  private removeHighlight() {
    if (this.highlightedElement) {
      this.highlightedElement.remove();
      this.highlightedElement = null;
    }
    
    // Remove info tooltip
    const existingInfo = document.querySelector('.vibe-ui-element-info');
    if (existingInfo) {
      existingInfo.remove();
    }
  }

  private async selectElement(element: HTMLElement) {
    // Clear any existing selection first
    this.clearSelection();
    
    const rect = element.getBoundingClientRect();
    
    // Create selection box with validation
    try {
      this.selectionBox = document.createElement('div');
      if (!this.selectionBox) {
        throw new Error('Failed to create div element for selection box');
      }
      
      this.selectionBox.className = 'vibe-ui-selection-box';
      this.selectionBox.style.position = 'fixed';
      this.selectionBox.style.left = `${rect.left}px`;
      this.selectionBox.style.top = `${rect.top}px`;
      this.selectionBox.style.width = `${rect.width}px`;
      this.selectionBox.style.height = `${rect.height}px`;
      this.selectionBox.style.pointerEvents = 'none';
      
      console.log('Selection box created successfully');
    } catch (selectionBoxError) {
      console.error('Failed to create selection box:', selectionBoxError);
      this.showErrorMessage('Failed to create selection interface');
      return;
    }
    
    // Immediately capture screenshot and analyze with error handling
    let elementScreenshot = '';
    let aiSuggestion = {
      suggestedPrompt: `Improve this ${element.tagName.toLowerCase()} by enhancing its design and usability`,
      componentType: element.tagName.toLowerCase()
    };
    
    try {
      console.log('Capturing element screenshot...');
      elementScreenshot = await this.captureElementForAnalysis(element);
      console.log('Screenshot captured successfully');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot, continuing without it:', screenshotError);
    }
    
    try {
      console.log('Getting AI suggestion...');
      aiSuggestion = await this.getAISuggestion(elementScreenshot, element);
      console.log('AI suggestion received:', aiSuggestion);
    } catch (aiError) {
      console.error('Failed to get AI suggestion, using fallback:', aiError);
      // aiSuggestion already has fallback values set above
    }
    
    // Store screenshot for later use
    (element as any)._vibeScreenshot = elementScreenshot;
    
    // Create action buttons with validation
    try {
      this.actionButtons = document.createElement('div');
      if (!this.actionButtons) {
        throw new Error('Failed to create div element for action buttons');
      }
      this.actionButtons.className = 'vibe-ui-actions';
      console.log('Action buttons container created successfully');
    } catch (actionButtonsError) {
      console.error('Failed to create action buttons container:', actionButtonsError);
      this.showErrorMessage('Failed to create action interface');
      return;
    }
    
    // Position buttons below the element (or above if not enough space)
    const spaceBelow = window.innerHeight - rect.bottom;
    const buttonsHeight = 60; // Approximate height of buttons
    
    const buttonsTop = spaceBelow > buttonsHeight 
      ? rect.bottom + 10 
      : rect.top - buttonsHeight - 10;
    const buttonsLeft = Math.max(10, Math.min(rect.left, window.innerWidth - 300)); // Keep in viewport
    
    this.actionButtons.style.position = 'fixed';
    this.actionButtons.style.left = `${buttonsLeft}px`;
    this.actionButtons.style.top = `${buttonsTop}px`;
    
    // Create prompt input section with validation
    let promptSection: HTMLElement;
    let promptInput: HTMLTextAreaElement;
    
    try {
      promptSection = document.createElement('div');
      if (!promptSection) {
        throw new Error('Failed to create prompt section div');
      }
      promptSection.className = 'vibe-ui-prompt-section';
      
      promptInput = document.createElement('textarea');
      if (!promptInput) {
        throw new Error('Failed to create textarea element');
      }
      promptInput.className = 'vibe-ui-prompt-input';
      promptInput.value = aiSuggestion.suggestedPrompt || '';
      promptInput.placeholder = 'What would you like to improve about this element?';
      
      promptSection.appendChild(promptInput);
      console.log('Prompt section created successfully');
    } catch (promptError) {
      console.error('Failed to create prompt section:', promptError);
      this.showErrorMessage('Failed to create input interface');
      return;
    }
    
    // Add AI suggestions below input
    if (aiSuggestion.suggestedPrompt) {
      const suggestionsContainer = document.createElement('div');
      suggestionsContainer.className = 'vibe-ui-suggestions';
      
      const suggestionsLabel = document.createElement('div');
      suggestionsLabel.className = 'vibe-ui-suggestions-label';
      suggestionsLabel.textContent = 'AI Suggestions (click to copy):';
      
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'vibe-ui-suggestion-item';
      suggestionItem.textContent = aiSuggestion.suggestedPrompt;
      suggestionItem.onclick = () => {
        promptInput.value = aiSuggestion.suggestedPrompt;
        suggestionItem.style.backgroundColor = '#dcfce7'; // Green background when clicked
        setTimeout(() => {
          suggestionItem.style.backgroundColor = '#f3f4f6';
        }, 1000);
      };
      
      // Add component type as insight
      const insightItem = document.createElement('div');
      insightItem.className = 'vibe-ui-suggestion-item';
      insightItem.textContent = `Component type: ${aiSuggestion.componentType}`;
      insightItem.onclick = () => {
        promptInput.value = `Improve this ${aiSuggestion.componentType} by ` + promptInput.value;
        insightItem.style.backgroundColor = '#dcfce7';
        setTimeout(() => {
          insightItem.style.backgroundColor = '#f3f4f6';
        }, 1000);
      };
      
      suggestionsContainer.appendChild(suggestionsLabel);
      suggestionsContainer.appendChild(suggestionItem);
      suggestionsContainer.appendChild(insightItem);
      promptSection.appendChild(suggestionsContainer);
    }
    
    // Create button row with validation
    let buttonRow: HTMLElement;
    try {
      buttonRow = document.createElement('div');
      if (!buttonRow) {
        throw new Error('Failed to create button row div');
      }
      buttonRow.className = 'vibe-ui-button-row';
      console.log('Button row created successfully');
    } catch (buttonRowError) {
      console.error('Failed to create button row:', buttonRowError);
      this.showErrorMessage('Failed to create button interface');
      return;
    }
    
    const exploreBtn = this.createButton('Explore', 'vibe-ui-btn-primary', () => {
      const prompt = promptInput.value.trim();
      if (!prompt) {
        alert('Please describe what you\'d like to improve');
        return;
      }
      const storedScreenshot = (element as any)._vibeScreenshot;
      const allTextData = {
        userInput: prompt,
        aiSuggestion: aiSuggestion.suggestedPrompt,
        componentType: aiSuggestion.componentType,
        insights: `Component type: ${aiSuggestion.componentType}`
      };
      this.handleExploreElement(element, prompt, storedScreenshot, allTextData);
    });
    
    const cancelBtn = this.createButton('Cancel', 'vibe-ui-btn-cancel', () => {
      this.clearSelection();
    });
    
    buttonRow.appendChild(exploreBtn);
    buttonRow.appendChild(cancelBtn);
    
    // Safely append elements with proper validation
    try {
      // Validate all elements before appending
      if (!promptSection) {
        throw new Error('Prompt section not created');
      }
      if (!buttonRow) {
        throw new Error('Button row not created');
      }
      if (!this.actionButtons) {
        throw new Error('Action buttons container not created');
      }
      if (!this.selectionBox) {
        throw new Error('Selection box not created');
      }
      
      // Ensure elements are valid DOM nodes
      if (!(promptSection instanceof HTMLElement)) {
        throw new Error('Prompt section is not a valid HTML element');
      }
      if (!(buttonRow instanceof HTMLElement)) {
        throw new Error('Button row is not a valid HTML element');
      }
      if (!(this.actionButtons instanceof HTMLElement)) {
        throw new Error('Action buttons container is not a valid HTML element');
      }
      if (!(this.selectionBox instanceof HTMLElement)) {
        throw new Error('Selection box is not a valid HTML element');
      }
      
      // Ensure document.body exists
      if (!document.body) {
        throw new Error('Document body not available');
      }
      
      // Append elements step by step with validation
      console.log('Appending prompt section...');
      this.actionButtons.appendChild(promptSection);
      
      console.log('Appending button row...');
      this.actionButtons.appendChild(buttonRow);
      
      console.log('Appending selection box to body...');
      document.body.appendChild(this.selectionBox);
      
      console.log('Appending action buttons to body...');
      document.body.appendChild(this.actionButtons);
      
      // Auto-focus the textarea safely
      setTimeout(() => {
        try {
          if (promptInput && 
              typeof promptInput.focus === 'function' && 
              document.body.contains(promptInput) &&
              this.actionButtons && 
              document.body.contains(this.actionButtons)) {
            promptInput.focus();
            console.log('Text input focused successfully');
          }
        } catch (focusError) {
          console.log('Could not focus input:', focusError);
        }
      }, 200);
      
      console.log('Selection UI created successfully');
    } catch (error) {
      console.error('Failed to create selection UI:', error);
      
      // Clean up any partially created elements
      try {
        if (this.selectionBox && this.selectionBox.parentNode) {
          this.selectionBox.parentNode.removeChild(this.selectionBox);
        }
        if (this.actionButtons && this.actionButtons.parentNode) {
          this.actionButtons.parentNode.removeChild(this.actionButtons);
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
      
      this.clearSelection();
      
      // Show error message to user
      this.showErrorMessage('Failed to create selection interface. Please try again.');
    }
    
    this.removeHighlight();
  }

  private createButton(text: string, className: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `vibe-ui-btn ${className}`;
    button.addEventListener('click', onClick);
    return button;
  }

  private clearSelection() {
    if (this.selectionBox) {
      this.selectionBox.remove();
      this.selectionBox = null;
    }
    
    if (this.actionButtons) {
      this.actionButtons.remove();
      this.actionButtons = null;
    }
  }

  private async handleQuickFix(element: HTMLElement, prompt: string) {
    const elementData = this.extractElementData(element);
    
    try {
      this.showLoadingMessage('Analyzing for quick improvements...');
      
      const response = await chrome.runtime.sendMessage({
        type: 'QUICK_FIX',
        elementData,
        prompt
      });
      
      if (response.success) {
        this.showQuickFixResult(response.suggestion);
      } else if (response.error === 'auth_required') {
        this.showSignUpPrompt(response.message, response.usageCount);
      } else {
        this.showErrorMessage('Failed to generate quick fix');
      }
    } catch (error) {
      console.error('Failed to get quick fix:', error);
      this.showErrorMessage('Failed to analyze element');
    }
  }

  private async handleExploreElement(element: HTMLElement, prompt: string, existingScreenshot?: string, textData?: any) {
    // Check if user is authenticated
    let authCheck;
    try {
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error('Extension context invalidated');
      }
      authCheck = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    } catch (error) {
      console.error('Auth check failed:', error);
      this.showErrorMessage('Extension error. Please refresh the page and try again.');
      return;
    }
    
    if (!authCheck.authenticated) {
      this.showSignUpPrompt('Sign up with Google to explore design insights and access advanced features', 1);
      return;
    }
    
    this.showLoadingMessage('Processing element...');
    
    // Use existing screenshot if available
    let elementScreenshot = existingScreenshot;
    if (!elementScreenshot) {
      elementScreenshot = await this.captureElementForAnalysis(element);
    }
    
    const elementData = this.extractElementData(element);
    
    // Generate element ID and navigate immediately
    const elementId = this.generateElementId();
    
    try {
      // Check if chrome runtime is available
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error('Extension context invalidated. Please refresh the page and reload the extension.');
      }
      
      // Send to processing queue with all text data
      const response = await chrome.runtime.sendMessage({
        type: 'FIND_INSPIRATION',
        elementData: {
          ...elementData,
          userPrompt: prompt,
          elementScreenshot,
          // Store all the text data
          aiSuggestion: textData?.aiSuggestion,
          componentType: textData?.componentType,
          insights: textData?.insights,
          userInput: textData?.userInput
        },
        elementId
      });
      
      if (response.success) {
        // Navigate directly to element details page
        window.open(`http://localhost:3000/elements/${elementId}`, '_blank');
        this.deactivate();
      } else {
        this.showErrorMessage('Failed to process element');
      }
    } catch (error) {
      console.error('Failed to process element:', error);
      let errorMessage = 'Failed to process request';
      
      if (error instanceof Error) {
        if (error.message.includes('Extension context invalidated')) {
          errorMessage = 'Extension was reloaded. Please refresh the page and try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check that the app is running on localhost:3000';
        } else {
          errorMessage = error.message;
        }
      }
      
      this.showErrorMessage(errorMessage);
    }
  }

  private async handleFindInspiration(element: HTMLElement, prompt: string, existingScreenshot?: string) {
    // Check if user is authenticated
    const authCheck = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    if (!authCheck.authenticated) {
      this.showSignUpPrompt('Sign up with Google to find design inspiration and access advanced features', 1);
      return;
    }
    
    this.showLoadingMessage('Preparing element data...');
    
    // Use existing screenshot if available, otherwise capture new one
    let elementScreenshot = existingScreenshot;
    if (!elementScreenshot) {
      // Hide overlays and highlights for clean screenshot
      this.hideOverlaysForScreenshot();
      
      // Wait longer for UI to settle and reflow
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture clean element screenshot
      elementScreenshot = await this.captureCleanElementScreenshot(element);
      
      // Restore overlays after screenshot
      this.showOverlaysAfterScreenshot();
    }
    
    const elementData = this.extractElementData(element);
    
    // Generate element ID and navigate immediately
    const elementId = this.generateElementId();
    
    try {
      // Send to processing queue
      const response = await chrome.runtime.sendMessage({
        type: 'FIND_INSPIRATION',
        elementData: {
          ...elementData,
          userPrompt: prompt,
          elementScreenshot
        },
        elementId
      });
      
      if (response.success) {
        // Navigate directly to element details page
        window.open(`http://localhost:3000/elements/${elementId}`, '_blank');
        this.deactivate();
      } else {
        this.showErrorMessage('Failed to process element');
      }
    } catch (error) {
      console.error('Failed to process element:', error);
      this.showErrorMessage('Failed to process request');
    }
  }

  private hideOverlaysForScreenshot() {
    // Hide all Vibe UI elements temporarily - more comprehensive approach
    const vibeSelectors = [
      '.vibe-ui-overlay',
      '.vibe-ui-selection-box', 
      '.vibe-ui-actions',
      '.vibe-ui-highlight',
      '.vibe-ui-element-info',
      '[class*="vibe-ui"]',  // Catch any other vibe UI elements
      '#vibe-ui-root'         // In case there's a root container
    ];
    
    vibeSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
        (el as HTMLElement).style.opacity = '0';
        (el as HTMLElement).style.pointerEvents = 'none';
      });
    });
    
    // Also hide any active highlights
    if (this.highlightedElement) {
      this.highlightedElement.style.visibility = 'hidden';
    }
    if (this.selectionBox) {
      this.selectionBox.style.visibility = 'hidden';
    }
    if (this.actionButtons) {
      this.actionButtons.style.visibility = 'hidden';
    }
  }

  private showOverlaysAfterScreenshot() {
    // Show all Vibe UI elements again - restore comprehensive hiding
    const vibeSelectors = [
      '.vibe-ui-overlay',
      '.vibe-ui-selection-box', 
      '.vibe-ui-actions',
      '.vibe-ui-highlight',
      '.vibe-ui-element-info',
      '[class*="vibe-ui"]',
      '#vibe-ui-root'
    ];
    
    vibeSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.visibility = '';
        (el as HTMLElement).style.opacity = '';
        (el as HTMLElement).style.pointerEvents = '';
      });
    });
    
    // Also restore any active highlights
    if (this.highlightedElement) {
      this.highlightedElement.style.visibility = '';
    }
    if (this.selectionBox) {
      this.selectionBox.style.visibility = '';
    }
    if (this.actionButtons) {
      this.actionButtons.style.visibility = '';
    }
  }

  private generateElementId(): string {
    return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async captureElementForAnalysis(element: HTMLElement): Promise<string> {
    try {
      // Remove highlights but keep selection box for later use
      this.removeHighlight();
      
      // Hide overlays completely for clean screenshot
      this.hideOverlaysForScreenshot();
      
      // Wait longer for complete UI removal and reflow
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture clean screenshot
      const screenshot = await this.captureCleanElementScreenshot(element);
      
      return screenshot;
    } catch (error) {
      console.error('Failed to capture element for analysis:', error);
      return '';
    }
  }

  private async getAISuggestion(imageUrl: string, element: HTMLElement): Promise<{suggestedPrompt: string, componentType: string}> {
    // Get contextual information about the element
    const context = this.analyzeElementContext(element);
    
    // Enhanced fallback suggestions based on element context
    const fallbackResponse = this.generateContextualSuggestion(element, context);

    if (!imageUrl) {
      console.log('No image URL provided, using fallback suggestion');
      return fallbackResponse;
    }

    try {
      console.log('Requesting AI suggestion for element:', element.tagName);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch('http://localhost:3000/api/ai/analyze-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          elementData: {
            tagName: element.tagName,
            className: typeof element.className === 'string' ? element.className : '',
            id: element.id,
            textContent: element.textContent?.slice(0, 200) || '',
            context: context
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('AI suggestion endpoint not found, using fallback');
        } else if (response.status >= 500) {
          console.log('Server error for AI suggestion, using fallback');
        } else {
          console.error('AI suggestion API returned error:', response.status, response.statusText);
        }
        return fallbackResponse;
      }

      const data = await response.json();
      if (data.success && data.suggestedPrompt) {
        console.log('AI suggestion received:', data.suggestedPrompt);
        return {
          suggestedPrompt: data.suggestedPrompt,
          componentType: data.componentType || element.tagName.toLowerCase()
        };
      } else {
        console.log('AI suggestion API returned no valid data, using fallback');
        return fallbackResponse;
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('AI suggestion request timed out, using fallback');
        } else if (error.message.includes('Failed to fetch')) {
          console.log('Network error or CORS issue with AI API, using fallback suggestion');
        } else {
          console.error('Failed to get AI suggestion:', error.message);
        }
      } else {
        console.error('Failed to get AI suggestion:', error);
      }
      return fallbackResponse;
    }
  }

  private async captureCleanElementScreenshot(element: HTMLElement): Promise<string> {
    try {
      // Check if chrome runtime is available
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        throw new Error('Extension context invalidated');
      }
      
      // Get element bounds
      const rect = element.getBoundingClientRect();
      
      // Request full page screenshot from background script
      const fullScreenshot = await chrome.runtime.sendMessage({ 
        type: 'CAPTURE_SCREENSHOT' 
      });
      
      if (!fullScreenshot) {
        throw new Error('Failed to capture page screenshot');
      }

      // Create canvas for cropping
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set canvas size to element size with padding
      const padding = 8;
      canvas.width = Math.max(rect.width + padding * 2, 100);
      canvas.height = Math.max(rect.height + padding * 2, 100);
      
      // Create image from full screenshot
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = fullScreenshot;
      });
      
      // Calculate the device pixel ratio
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // Draw the cropped element area with padding
      ctx.drawImage(
        img,
        Math.max(0, (rect.left - padding) * devicePixelRatio),
        Math.max(0, (rect.top - padding) * devicePixelRatio),
        (rect.width + padding * 2) * devicePixelRatio,
        (rect.height + padding * 2) * devicePixelRatio,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      return canvas.toDataURL('image/png', 0.9);
    } catch (error) {
      console.warn('Clean screenshot capture failed, using fallback:', error);
      return this.createFallbackScreenshot(element);
    } finally {
      // Restore overlays
      this.showOverlaysAfterScreenshot();
    }
  }

  private createFallbackScreenshot(element: HTMLElement): string {
    const rect = element.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = Math.max(rect.width, 200);
    canvas.height = Math.max(rect.height, 100);
    
    // Create a visual placeholder
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(element.tagName, canvas.width / 2, canvas.height / 2);
    
    return canvas.toDataURL('image/png', 0.8);
  }

  private async captureElementScreenshot(element: HTMLElement): Promise<string> {
    try {
      // Get element bounds
      const rect = element.getBoundingClientRect();
      
      // Create a temporary canvas to capture just the element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set canvas size to element size
      canvas.width = Math.max(rect.width, 100);
      canvas.height = Math.max(rect.height, 100);
      
      // Use html2canvas if available, otherwise take full page screenshot
      try {
        // Request full page screenshot from background script
        const fullScreenshot = await chrome.runtime.sendMessage({ 
          type: 'CAPTURE_SCREENSHOT' 
        });
        
        if (fullScreenshot) {
          // Create image from full screenshot
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = fullScreenshot;
          });
          
          // Calculate the device pixel ratio
          const devicePixelRatio = window.devicePixelRatio || 1;
          
          // Draw the cropped element area
          ctx.drawImage(
            img,
            rect.left * devicePixelRatio,
            rect.top * devicePixelRatio,
            rect.width * devicePixelRatio,
            rect.height * devicePixelRatio,
            0,
            0,
            canvas.width,
            canvas.height
          );
          
          return canvas.toDataURL('image/png', 0.8);
        }
      } catch (error) {
        console.warn('Screenshot capture failed, using fallback:', error);
      }
      
      // Fallback: create a simple visual representation
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      
      ctx.fillStyle = '#374151';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        element.tagName || 'Element',
        canvas.width / 2,
        canvas.height / 2
      );
      
      return canvas.toDataURL('image/png', 0.8);
      
    } catch (error) {
      console.error('Failed to capture element screenshot:', error);
      // Return a placeholder image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200;
      canvas.height = 150;
      
      if (ctx) {
        ctx.fillStyle = '#E5E7EB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6B7280';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Element', canvas.width / 2, canvas.height / 2);
      }
      
      return canvas.toDataURL('image/png', 0.8);
    }
  }

  private async processElement(element: HTMLElement, addToQueue: boolean) {
    const elementData = this.extractElementData(element);
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: addToQueue ? 'ADD_TO_QUEUE' : 'PROCESS_NOW',
        elementData
      });
      
      if (response.success) {
        this.showSuccessMessage(addToQueue ? 'Added to queue!' : 'Processing now...');
        this.deactivate();
      }
    } catch (error) {
      console.error('Failed to process element:', error);
      this.showErrorMessage('Failed to process element');
    }
  }

  private extractElementData(element: HTMLElement): ElementData {
    const rect = element.getBoundingClientRect();
    const computedStyles = window.getComputedStyle(element);
    
    // Extract comprehensive computed styles for recreation
    const relevantStyles: Record<string, string> = {};
    const styleProperties = [
      // Layout
      'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      'box-sizing',
      
      // Spacing
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      
      // Typography
      'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
      'color', 'text-align', 'text-decoration', 'text-transform',
      'letter-spacing', 'word-spacing',
      
      // Background & Colors
      'background', 'background-color', 'background-image', 'background-size',
      'background-position', 'background-repeat',
      
      // Borders
      'border', 'border-width', 'border-style', 'border-color', 'border-radius',
      'border-top', 'border-right', 'border-bottom', 'border-left',
      
      // Shadows & Effects
      'box-shadow', 'text-shadow', 'opacity', 'transform',
      
      // Flexbox
      'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
      'align-content', 'gap',
      
      // Grid
      'grid', 'grid-template-columns', 'grid-template-rows', 'grid-gap',
      
      // Other
      'overflow', 'cursor', 'transition', 'animation'
    ];
    
    styleProperties.forEach(prop => {
      const value = computedStyles.getPropertyValue(prop);
      if (value && value !== 'normal' && value !== 'none') {
        relevantStyles[prop] = value;
      }
    });

    // Extract class information for Tailwind detection
    const classList = Array.from(element.classList);
    const tailwindClasses = classList.filter(cls => 
      // Common Tailwind patterns
      /^(bg-|text-|p-|m-|w-|h-|flex|grid|border|rounded|shadow|font-|leading-|tracking-|space-|gap-|justify-|items-|content-|self-|order-|col-|row-|transform|transition|duration-|ease-|scale-|rotate-|translate-|opacity-|z-|overflow-|cursor-|select-|pointer-|sr-|focus:|hover:|active:|disabled:|md:|lg:|xl:|2xl:|sm:)/.test(cls)
    );

    // Get parent context for better recreation
    const parentElement = element.parentElement;
    const parentStyles = parentElement ? window.getComputedStyle(parentElement) : null;
    const parentContext = parentElement ? {
      tagName: parentElement.tagName,
      classList: Array.from(parentElement.classList),
      display: parentStyles?.display,
      flexDirection: parentStyles?.flexDirection,
      justifyContent: parentStyles?.justifyContent,
      alignItems: parentStyles?.alignItems
    } : null;

    // Extract inner structure for complex elements
    const children = Array.from(element.children).map(child => ({
      tagName: child.tagName,
      classList: Array.from(child.classList),
      textContent: child.textContent?.slice(0, 100) || '',
      innerHTML: child.innerHTML.slice(0, 500) // Truncated for storage
    }));
    
    return {
      html: element.outerHTML,
      css: element.getAttribute('style') || '',
      boundingBox: rect,
      tagName: element.tagName,
      textContent: element.textContent?.slice(0, 500) || '',
      computedStyles: relevantStyles,
      classList: classList,
      tailwindClasses: tailwindClasses,
      parentContext: parentContext,
      children: children.slice(0, 10), // Limit to first 10 children
      innerHTML: element.innerHTML.slice(0, 2000), // Store inner HTML for recreation
      attributes: Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {} as Record<string, string>)
    };
  }

  private showSuccessMessage(message: string) {
    this.showMessage(message, '#10B981');
  }

  private showErrorMessage(message: string) {
    this.showMessage(message, '#EF4444');
  }

  private showMessage(message: string, color: string) {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000004;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
    `;
    
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }

  private showLoadingMessage(message: string) {
    this.showMessage(message, '#F59E0B');
  }

  private showQuickFixResult(suggestion: string) {
    const resultEl = document.createElement('div');
    resultEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      color: #1F2937;
      padding: 20px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 1000004;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border: 2px solid #10B981;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    
    resultEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #10B981;">💡 Quick Fix Suggestion</h3>
        <button id="close-suggestion" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #6B7280;">&times;</button>
      </div>
      <div style="margin-bottom: 16px; line-height: 1.5;">${suggestion}</div>
      <div style="display: flex; gap: 8px;">
        <button id="copy-suggestion" style="
          background: #10B981; 
          color: white; 
          border: none; 
          padding: 8px 16px; 
          border-radius: 6px; 
          font-size: 14px; 
          cursor: pointer;
          font-weight: 500;
        ">Copy Suggestion</button>
        <button id="close-suggestion-alt" style="
          background: #F3F4F6; 
          color: #374151; 
          border: 1px solid #D1D5DB; 
          padding: 8px 16px; 
          border-radius: 6px; 
          font-size: 14px; 
          cursor: pointer;
        ">Close</button>
      </div>
    `;
    
    document.body.appendChild(resultEl);
    
    // Add event listeners
    const closeBtn = resultEl.querySelector('#close-suggestion');
    const closeAltBtn = resultEl.querySelector('#close-suggestion-alt');
    const copyBtn = resultEl.querySelector('#copy-suggestion');
    
    const closeResult = () => {
      resultEl.remove();
      this.deactivate();
    };
    
    closeBtn?.addEventListener('click', closeResult);
    closeAltBtn?.addEventListener('click', closeResult);
    
    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(suggestion).then(() => {
        this.showSuccessMessage('Suggestion copied to clipboard!');
        closeResult();
      });
    });
    
    // Auto-close after 30 seconds
    setTimeout(() => {
      if (document.body.contains(resultEl)) {
        resultEl.remove();
        this.deactivate();
      }
    }, 30000);
  }

  private showSignUpPrompt(message: string, usageCount: number) {
    // Force deactivate the selector to prevent interaction conflicts
    this.isActive = false;
    this.removeOverlay();
    this.removeEventListeners();
    this.clearSelection();
    this.removeHighlight();
    
    const promptEl = document.createElement('div');
    promptEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      color: #1F2937;
      padding: 24px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 1000004;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border: 2px solid #3B82F6;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    
    promptEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #3B82F6;">🎉 You've tried our Quick Fix!</h3>
          <p style="margin: 0; color: #6B7280; font-size: 12px;">Used ${usageCount}/1 free suggestions</p>
        </div>
        <button id="close-signup" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #6B7280;">&times;</button>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p style="margin: 0 0 12px 0; line-height: 1.5; color: #374151;">
          Sign up with Google to unlock unlimited Quick Fix suggestions plus:
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6;">
          <li>✨ Find Design Inspiration</li>
          <li>📊 Processing Queue & History</li>
          <li>💾 Save Your Improvements</li>
          <li>🔄 Advanced AI Analysis</li>
        </ul>
      </div>
      
      <div style="display: flex; gap: 12px;">
        <button id="signup-google" style="
          background: #4285F4; 
          color: white; 
          border: none; 
          padding: 12px 20px; 
          border-radius: 8px; 
          font-size: 14px; 
          font-weight: 600;
          cursor: pointer;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <button id="close-signup-alt" style="
          background: #F3F4F6; 
          color: #374151; 
          border: 1px solid #D1D5DB; 
          padding: 12px 16px; 
          border-radius: 8px; 
          font-size: 14px; 
          cursor: pointer;
        ">Maybe Later</button>
      </div>
    `;
    
    document.body.appendChild(promptEl);
    
    // Add event listeners
    const closeBtn = promptEl.querySelector('#close-signup');
    const closeAltBtn = promptEl.querySelector('#close-signup-alt');
    const signupBtn = promptEl.querySelector('#signup-google');
    
    const closePrompt = () => {
      promptEl.remove();
      // No need to deactivate again since we already did it above
    };
    
    closeBtn?.addEventListener('click', closePrompt);
    closeAltBtn?.addEventListener('click', closePrompt);
    
    signupBtn?.addEventListener('click', () => {
      // Open the app's signup page via background script
      chrome.runtime.sendMessage({ 
        type: 'OPEN_TAB', 
        url: 'http://localhost:3000/auth/signup' 
      });
      closePrompt();
    });
    
    // Auto-close after 45 seconds
    setTimeout(() => {
      if (document.body.contains(promptEl)) {
        promptEl.remove();
        // No need to deactivate again since we already did it above
      }
    }, 45000);
  }

  private analyzeElementContext(element: HTMLElement): any {
    const rect = element.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    
    // Analyze page type and context
    const pageContext = this.analyzePageContext();
    
    // Analyze position with better precision
    const position = {
      top: rect.top < viewport.height * 0.15,
      topMid: rect.top < viewport.height * 0.35,
      center: rect.top > viewport.height * 0.25 && rect.top < viewport.height * 0.75,
      bottomMid: rect.top > viewport.height * 0.65,
      bottom: rect.top > viewport.height * 0.85,
      fullWidth: rect.width > viewport.width * 0.8,
      large: rect.width * rect.height > viewport.width * viewport.height * 0.1,
      left: rect.left < viewport.width * 0.2,
      right: rect.right > viewport.width * 0.8,
      centerX: rect.left > viewport.width * 0.2 && rect.right < viewport.width * 0.8
    };

    // Enhanced content analysis
    const text = element.textContent?.trim() || '';
    const textLower = text.toLowerCase();
    const hasText = text.length > 0;
    const hasImages = element.querySelectorAll('img').length > 0;
    const hasLinks = element.querySelectorAll('a').length > 0;
    const hasButtons = element.querySelectorAll('button, input[type="button"], input[type="submit"]').length > 0;
    const hasInputs = element.querySelectorAll('input, textarea, select').length > 0;
    const hasIcons = element.querySelectorAll('svg, i[class*="icon"], .icon, [class*="fa-"]').length > 0;

    // Analyze semantic meaning from text content
    const semantics = this.analyzeTextSemantics(textLower);
    
    // Analyze element naming and classes
    const naming = this.analyzeElementNaming(element);

    // Analyze structure with more detail
    const parent = element.parentElement;
    const siblings = parent ? Array.from(parent.children) : [];
    const isOnlyChild = siblings.length === 1;
    const childrenCount = element.children.length;
    const depth = this.getElementDepth(element);

    // Enhanced styling analysis
    const styles = window.getComputedStyle(element);
    const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
    const isFlexContainer = styles.display === 'flex' || styles.display === 'inline-flex';
    const isGridContainer = styles.display === 'grid' || styles.display === 'inline-grid';
    const isFixed = styles.position === 'fixed';
    const isSticky = styles.position === 'sticky';
    const hasBoxShadow = styles.boxShadow !== 'none';
    const hasBorder = styles.border !== 'none' && styles.borderWidth !== '0px';

    return {
      pageContext,
      position,
      content: { 
        hasText, hasImages, hasLinks, hasButtons, hasInputs, hasIcons,
        textLength: text.length, 
        textPreview: text.slice(0, 100),
        semantics 
      },
      naming,
      structure: { isOnlyChild, childrenCount, siblingCount: siblings.length, depth },
      styling: { 
        isVisible, isFlexContainer, isGridContainer, isFixed, isSticky, 
        hasBoxShadow, hasBorder 
      },
      dimensions: { width: rect.width, height: rect.height, area: rect.width * rect.height }
    };
  }

  private analyzePageContext(): any {
    const url = window.location.href;
    const title = document.title.toLowerCase();
    const bodyClasses = document.body.className.toLowerCase();
    const htmlClasses = document.documentElement.className.toLowerCase();
    
    // Check for common app/site patterns
    const pageType = {
      dashboard: this.checkPattern(['dashboard', 'admin', 'panel', 'console'], [url, title, bodyClasses]),
      ecommerce: this.checkPattern(['shop', 'store', 'cart', 'product', 'checkout'], [url, title, bodyClasses]),
      blog: this.checkPattern(['blog', 'article', 'post', 'news'], [url, title, bodyClasses]),
      landing: this.checkPattern(['landing', 'home', 'welcome'], [url, title, bodyClasses]),
      app: this.checkPattern(['app', 'application'], [url, title, bodyClasses]),
      docs: this.checkPattern(['docs', 'documentation', 'guide', 'api'], [url, title, bodyClasses]),
      portfolio: this.checkPattern(['portfolio', 'work', 'showcase'], [url, title, bodyClasses]),
      social: this.checkPattern(['social', 'profile', 'feed', 'timeline'], [url, title, bodyClasses]),
      settings: this.checkPattern(['settings', 'config', 'preferences'], [url, title, bodyClasses]),
      auth: this.checkPattern(['login', 'signup', 'auth', 'register'], [url, title, bodyClasses])
    };

    // Check for mobile app patterns
    const isMobileApp = window.navigator.userAgent.includes('Mobile') || 
                       document.querySelector('meta[name="viewport"]')?.getAttribute('content')?.includes('user-scalable=no');

    // Check for framework patterns
    const framework = {
      react: !!document.querySelector('[data-reactroot], #root, #__next'),
      vue: !!document.querySelector('[data-v-]'),
      angular: !!document.querySelector('[ng-]'),
      tailwind: bodyClasses.includes('tailwind') || htmlClasses.includes('tailwind'),
      bootstrap: bodyClasses.includes('bootstrap') || !!document.querySelector('[class*="col-"]')
    };

    return { pageType, isMobileApp, framework, url, title };
  }

  private checkPattern(patterns: string[], sources: string[]): boolean {
    return patterns.some(pattern => 
      sources.some(source => source.includes(pattern))
    );
  }

  private analyzeTextSemantics(text: string): any {
    const keywords = {
      navigation: ['menu', 'nav', 'navigation', 'home', 'about', 'contact', 'services', 'products'],
      cta: ['sign up', 'get started', 'try free', 'download', 'buy now', 'learn more', 'contact us', 'subscribe'],
      auth: ['sign in', 'log in', 'login', 'register', 'signup', 'create account', 'sign out', 'logout'],
      ecommerce: ['add to cart', 'buy', 'purchase', 'checkout', 'price', '$', 'sale', 'discount'],
      social: ['share', 'like', 'follow', 'tweet', 'post', 'comment', 'profile'],
      content: ['read more', 'continue reading', 'view all', 'see more', 'show more'],
      dashboard: ['dashboard', 'overview', 'analytics', 'reports', 'statistics', 'metrics'],
      settings: ['settings', 'preferences', 'options', 'configuration', 'account', 'profile'],
      help: ['help', 'support', 'faq', 'documentation', 'guide', 'tutorial'],
      footer: ['copyright', '©', 'terms', 'privacy', 'policy', 'rights reserved'],
      hero: ['welcome', 'introducing', 'discover', 'transform', 'revolutionize', 'unlock']
    };

    const foundKeywords: Record<string, string[]> = {};
    
    Object.entries(keywords).forEach(([category, words]) => {
      const found = words.filter(word => text.includes(word));
      if (found.length > 0) {
        foundKeywords[category] = found;
      }
    });

    return foundKeywords;
  }

  private analyzeElementNaming(element: HTMLElement): any {
    const id = element.id?.toLowerCase() || '';
    const className = typeof element.className === 'string' ? element.className.toLowerCase() : '';
    const dataAttrs = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => attr.value.toLowerCase())
      .join(' ');

    const namingPatterns = {
      header: this.checkPattern(['header', 'top', 'navbar', 'nav', 'menu'], [id, className, dataAttrs]),
      footer: this.checkPattern(['footer', 'bottom', 'foot'], [id, className, dataAttrs]),
      sidebar: this.checkPattern(['sidebar', 'side', 'aside', 'drawer'], [id, className, dataAttrs]),
      main: this.checkPattern(['main', 'content', 'primary', 'body'], [id, className, dataAttrs]),
      hero: this.checkPattern(['hero', 'banner', 'jumbotron', 'splash'], [id, className, dataAttrs]),
      card: this.checkPattern(['card', 'tile', 'item', 'box'], [id, className, dataAttrs]),
      modal: this.checkPattern(['modal', 'dialog', 'popup', 'overlay'], [id, className, dataAttrs]),
      form: this.checkPattern(['form', 'input', 'field'], [id, className, dataAttrs]),
      button: this.checkPattern(['btn', 'button', 'cta'], [id, className, dataAttrs]),
      navigation: this.checkPattern(['nav', 'menu', 'breadcrumb'], [id, className, dataAttrs]),
      search: this.checkPattern(['search', 'find'], [id, className, dataAttrs]),
      profile: this.checkPattern(['profile', 'user', 'avatar'], [id, className, dataAttrs]),
      dashboard: this.checkPattern(['dashboard', 'admin', 'panel'], [id, className, dataAttrs]),
      settings: this.checkPattern(['settings', 'config', 'preferences'], [id, className, dataAttrs]),
      notification: this.checkPattern(['notification', 'alert', 'toast', 'message'], [id, className, dataAttrs]),
      tabs: this.checkPattern(['tab', 'tabs', 'nav-tabs'], [id, className, dataAttrs]),
      list: this.checkPattern(['list', 'items', 'collection'], [id, className, dataAttrs])
    };

    return namingPatterns;
  }

  private getElementDepth(element: HTMLElement): number {
    let depth = 0;
    let current = element.parentElement;
    while (current && current !== document.body) {
      depth++;
      current = current.parentElement;
    }
    return depth;
  }

  private generateContextualSuggestion(element: HTMLElement, context: any): {suggestedPrompt: string, componentType: string} {
    const tagName = element.tagName.toLowerCase();
    const text = context.content.textPreview;
    const { pageContext, position, content, naming, structure, styling } = context;
    
    // Determine page-specific context
    let pageTypeContext = '';
    const primaryPageType = Object.entries(pageContext.pageType).find(([_, isType]) => isType)?.[0];
    
    if (primaryPageType) {
      pageTypeContext = this.getPageTypeContext(primaryPageType);
    }

    // Priority-based component detection (highest priority first)
    
    // 1. Explicit naming patterns (highest confidence)
    if (naming.hero || (naming.banner && position.top)) {
      return this.createSuggestion('hero section', 'Improve this hero section by making the headline more compelling and adding stronger visual impact', pageTypeContext);
    }
    
    if (naming.header || (naming.navigation && position.top)) {
      return this.createSuggestion('navigation header', 'Improve this navigation by making the menu items clearer and more accessible', pageTypeContext);
    }
    
    if (naming.footer || (position.bottom && naming.main === false)) {
      return this.createSuggestion('footer', 'Improve this footer by better organizing the links and contact information', pageTypeContext);
    }
    
    if (naming.sidebar || (position.left && styling.isFixed)) {
      const sidebarType = pageContext.pageType.dashboard ? 'dashboard sidebar' : 'sidebar navigation';
      return this.createSuggestion(sidebarType, `Improve this ${sidebarType} by organizing menu items and improving visual hierarchy`, pageTypeContext);
    }
    
    if (naming.modal || naming.dialog) {
      return this.createSuggestion('modal dialog', 'Improve this modal by making it more user-friendly and visually appealing', pageTypeContext);
    }
    
    if (naming.card) {
      return this.createSuggestion('content card', 'Improve this card by enhancing the layout and visual organization', pageTypeContext);
    }
    
    if (naming.tabs) {
      return this.createSuggestion('tab navigation', 'Improve these tabs by making them more intuitive and visually distinct', pageTypeContext);
    }

    // 2. Semantic text analysis (high confidence)
    if (content.semantics.auth) {
      if (content.semantics.auth.some(word => ['sign in', 'log in', 'login'].includes(word))) {
        return this.createSuggestion('sign-in form', 'Improve this sign-in form by making it more secure and user-friendly', pageTypeContext);
      }
      if (content.semantics.auth.some(word => ['sign up', 'register', 'create account'].includes(word))) {
        return this.createSuggestion('registration form', 'Improve this registration form by reducing friction and building trust', pageTypeContext);
      }
    }
    
    if (content.semantics.cta) {
      const ctaType = this.identifyCTAType(content.semantics.cta, pageContext);
      return this.createSuggestion(`${ctaType} button`, `Improve this ${ctaType} button by making it more compelling and action-oriented`, pageTypeContext);
    }
    
    if (content.semantics.ecommerce) {
      return this.createSuggestion('purchase element', 'Improve this e-commerce element by making it more conversion-focused and trustworthy', pageTypeContext);
    }
    
    if (content.semantics.dashboard && pageContext.pageType.dashboard) {
      return this.createSuggestion('dashboard widget', 'Improve this dashboard widget by making the data more readable and actionable', pageTypeContext);
    }
    
    if (content.semantics.settings) {
      return this.createSuggestion('settings panel', 'Improve this settings panel by organizing options more clearly and intuitively', pageTypeContext);
    }

    // 3. Position + content analysis (medium confidence)
    if (position.top && position.fullWidth && content.hasLinks) {
      return this.createSuggestion('navigation bar', 'Improve this navigation by making menu items more discoverable and accessible', pageTypeContext);
    }
    
    if (position.top && position.large && content.hasText && content.textLength > 50) {
      const heroType = pageContext.pageType.landing ? 'landing page hero' : 'hero section';
      return this.createSuggestion(heroType, `Improve this ${heroType} by making the value proposition clearer and more compelling`, pageTypeContext);
    }
    
    if (position.bottom && position.fullWidth) {
      return this.createSuggestion('page footer', 'Improve this footer by organizing information better and adding useful links', pageTypeContext);
    }
    
    if (position.left && styling.isFixed && pageContext.pageType.dashboard) {
      return this.createSuggestion('dashboard sidebar', 'Improve this dashboard sidebar by organizing navigation items and adding better visual grouping', pageTypeContext);
    }

    // 4. Element type + context (medium confidence)
    if ((tagName === 'button' || content.hasButtons) && !content.semantics.cta) {
      const buttonContext = this.getButtonContext(text, pageContext);
      return this.createSuggestion(`${buttonContext} button`, `Improve this ${buttonContext} button by enhancing its visual prominence and interaction design`, pageTypeContext);
    }
    
    if (tagName === 'form' || content.hasInputs) {
      const formType = this.getFormType(content.semantics, pageContext);
      return this.createSuggestion(`${formType} form`, `Improve this ${formType} form by making it easier to complete and more user-friendly`, pageTypeContext);
    }
    
    if (content.hasImages && !content.hasText) {
      return this.createSuggestion('image gallery', 'Improve this image display by optimizing loading and adding better visual organization', pageTypeContext);
    }
    
    if (content.hasText && structure.childrenCount > 3 && styling.hasBoxShadow) {
      return this.createSuggestion('content card', 'Improve this content card by enhancing readability and visual hierarchy', pageTypeContext);
    }

    // 5. Generic patterns (lower confidence)
    if (content.hasText && content.textLength > 100) {
      return this.createSuggestion('content section', 'Improve this content by enhancing readability and visual organization', pageTypeContext);
    }
    
    if (structure.childrenCount > 5) {
      return this.createSuggestion('layout container', 'Improve this layout by organizing elements better and adding proper spacing', pageTypeContext);
    }
    
    if (content.hasLinks && !position.top) {
      return this.createSuggestion('link collection', 'Improve these links by making them more visually distinct and better organized', pageTypeContext);
    }

    // 6. Fallback based on tag
    const fallbackType = this.getFallbackType(tagName, pageContext);
    return this.createSuggestion(fallbackType, `Improve this ${fallbackType} by modernizing its design and user experience`, pageTypeContext);
  }

  private getPageTypeContext(pageType: string): string {
    const contexts = {
      dashboard: 'for better data visualization and user workflow',
      ecommerce: 'to increase conversions and customer trust',
      blog: 'to improve readability and engagement',
      landing: 'to boost conversion rates and user engagement',
      app: 'to enhance user experience and functionality',
      docs: 'to improve information discovery and readability',
      portfolio: 'to showcase work more effectively',
      social: 'to encourage user interaction and engagement',
      settings: 'to make configuration more intuitive',
      auth: 'to build trust and reduce user friction'
    };
    return contexts[pageType] || '';
  }

  private createSuggestion(componentType: string, baseSuggestion: string, pageContext: string): {suggestedPrompt: string, componentType: string} {
    const suggestion = pageContext ? `${baseSuggestion} ${pageContext}` : baseSuggestion;
    return { suggestedPrompt: suggestion, componentType };
  }

  private identifyCTAType(ctaWords: string[], pageContext: any): string {
    if (ctaWords.some(word => ['sign up', 'get started', 'try free'].includes(word))) {
      return 'sign-up';
    }
    if (ctaWords.some(word => ['download', 'get app'].includes(word))) {
      return 'download';
    }
    if (ctaWords.some(word => ['buy now', 'purchase'].includes(word))) {
      return 'purchase';
    }
    if (ctaWords.some(word => ['contact us', 'get in touch'].includes(word))) {
      return 'contact';
    }
    if (ctaWords.some(word => ['learn more', 'read more'].includes(word))) {
      return 'learn more';
    }
    return 'call-to-action';
  }

  private getButtonContext(text: string, pageContext: any): string {
    const textLower = text.toLowerCase();
    if (textLower.includes('save') || textLower.includes('submit')) return 'save';
    if (textLower.includes('cancel') || textLower.includes('close')) return 'cancel';
    if (textLower.includes('edit') || textLower.includes('modify')) return 'edit';
    if (textLower.includes('delete') || textLower.includes('remove')) return 'delete';
    if (textLower.includes('search') || textLower.includes('find')) return 'search';
    if (pageContext.pageType.dashboard) return 'action';
    return 'interactive';
  }

  private getFormType(semantics: any, pageContext: any): string {
    if (semantics.auth) return 'authentication';
    if (semantics.settings) return 'settings';
    if (pageContext.pageType.ecommerce) return 'checkout';
    if (semantics.help) return 'contact';
    return 'input';
  }

  private getFallbackType(tagName: string, pageContext: any): string {
    const fallbacks = {
      div: pageContext.pageType.dashboard ? 'dashboard component' : 'content container',
      section: 'content section',
      article: 'article content',
      aside: 'sidebar content',
      nav: 'navigation menu',
      ul: 'list items',
      ol: 'ordered list',
      li: 'list item',
      img: 'image display',
      a: 'link element'
    };
    return fallbacks[tagName] || tagName;
  }
}

// Initialize the element selector
console.log('Vibe UI Assistant: Initializing content script');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSelector);
} else {
  initializeSelector();
}

function initializeSelector() {
  console.log('Vibe UI Assistant: DOM ready, initializing selector');
  
  // Make sure we don't initialize multiple times
  if (!(window as any).vibeUIAssistantInitialized) {
    (window as any).vibeUIAssistantInitialized = true;
    (window as any).vibeUISelector = new ElementSelector();
    console.log('Vibe UI Assistant: Content script initialized successfully');
  } else {
    console.log('Vibe UI Assistant: Content script already initialized');
  }
}