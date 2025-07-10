// Content script for Vibe UI Assistant
// Handles element selection overlay and interaction

interface ElementData {
  html: string;
  css: string;
  boundingBox: DOMRect;
  tagName: string;
  textContent: string;
  computedStyles: Record<string, string>;
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
    this.injectStyles();
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Vibe UI Assistant: Received message', message);
      switch (message.type) {
        case 'ACTIVATE_SELECTOR':
          this.activate();
          sendResponse({ success: true });
          break;
        case 'DEACTIVATE_SELECTOR':
          this.deactivate();
          sendResponse({ success: true });
          break;
      }
      return true; // Keep message channel open for async response
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
        background: rgba(0, 0, 0, 0.1);
        z-index: 999999;
        cursor: crosshair;
        pointer-events: none;
      }
      
      .vibe-ui-highlight {
        position: fixed;
        border: 3px solid #3B82F6;
        background: rgba(59, 130, 246, 0.15);
        pointer-events: none;
        z-index: 1000000;
        transition: all 0.1s ease;
        box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
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

  private handleClick = (event: MouseEvent) => {
    if (!this.isActive) return;
    
    const element = event.target as HTMLElement;
    if (this.isVibeUIElement(element)) return;
    
    console.log('Clicked on:', element.tagName, element.className);
    
    event.preventDefault();
    event.stopPropagation();
    
    this.selectElement(element);
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
    info.textContent = `${element.tagName.toLowerCase()}${element.className ? '.' + element.className.split(' ').join('.') : ''}`;
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

  private selectElement(element: HTMLElement) {
    this.clearSelection();
    
    const rect = element.getBoundingClientRect();
    
    // Create selection box
    this.selectionBox = document.createElement('div');
    this.selectionBox.className = 'vibe-ui-selection-box';
    this.selectionBox.style.position = 'fixed';
    this.selectionBox.style.left = `${rect.left}px`;
    this.selectionBox.style.top = `${rect.top}px`;
    this.selectionBox.style.width = `${rect.width}px`;
    this.selectionBox.style.height = `${rect.height}px`;
    this.selectionBox.style.pointerEvents = 'none';
    
    // Create action buttons
    this.actionButtons = document.createElement('div');
    this.actionButtons.className = 'vibe-ui-actions';
    
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
    
    // Create prompt input section
    const promptSection = document.createElement('div');
    promptSection.className = 'vibe-ui-prompt-section';
    
    const promptLabel = document.createElement('div');
    promptLabel.className = 'vibe-ui-prompt-label';
    promptLabel.textContent = 'What would you like to improve?';
    
    const promptInput = document.createElement('textarea');
    promptInput.className = 'vibe-ui-prompt-input';
    promptInput.placeholder = 'e.g., "Make this button more modern", "Find similar card designs", "Improve the color contrast"...';
    
    promptSection.appendChild(promptLabel);
    promptSection.appendChild(promptInput);
    
    // Create button row
    const buttonRow = document.createElement('div');
    buttonRow.className = 'vibe-ui-button-row';
    
    const quickFixBtn = this.createButton('Quick Fix', 'vibe-ui-btn-primary', () => {
      const prompt = promptInput.value.trim();
      if (!prompt) {
        alert('Please describe what you\'d like to improve');
        return;
      }
      this.handleQuickFix(element, prompt);
    });
    
    const findInspirationBtn = this.createButton('Find Inspiration', 'vibe-ui-btn-secondary', () => {
      const prompt = promptInput.value.trim();
      if (!prompt) {
        alert('Please describe what you\'re looking for');
        return;
      }
      this.handleFindInspiration(element, prompt);
    });
    
    const cancelBtn = this.createButton('Cancel', 'vibe-ui-btn-cancel', () => {
      this.clearSelection();
    });
    
    buttonRow.appendChild(quickFixBtn);
    buttonRow.appendChild(findInspirationBtn);
    buttonRow.appendChild(cancelBtn);
    
    this.actionButtons.appendChild(promptSection);
    this.actionButtons.appendChild(buttonRow);
    
    // Auto-focus the textarea
    setTimeout(() => promptInput.focus(), 100);
    
    document.body.appendChild(this.selectionBox);
    document.body.appendChild(this.actionButtons);
    
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
      } else {
        this.showErrorMessage('Failed to generate quick fix');
      }
    } catch (error) {
      console.error('Failed to get quick fix:', error);
      this.showErrorMessage('Failed to analyze element');
    }
  }

  private async handleFindInspiration(element: HTMLElement, prompt: string) {
    const elementData = this.extractElementData(element);
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIND_INSPIRATION',
        elementData,
        prompt
      });
      
      if (response.success) {
        this.showSuccessMessage('Added to inspiration queue! Check popup or dashboard for results.');
        this.deactivate();
      } else {
        this.showErrorMessage('Failed to add to inspiration queue');
      }
    } catch (error) {
      console.error('Failed to add to inspiration queue:', error);
      this.showErrorMessage('Failed to process request');
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
    
    // Extract relevant computed styles
    const relevantStyles: Record<string, string> = {};
    const styleProperties = [
      'display', 'position', 'width', 'height', 'padding', 'margin',
      'background-color', 'color', 'font-size', 'font-family', 'font-weight',
      'border', 'border-radius', 'box-shadow', 'text-align', 'line-height'
    ];
    
    styleProperties.forEach(prop => {
      relevantStyles[prop] = computedStyles.getPropertyValue(prop);
    });
    
    return {
      html: element.outerHTML,
      css: element.getAttribute('style') || '',
      boundingBox: rect,
      tagName: element.tagName,
      textContent: element.textContent?.slice(0, 200) || '',
      computedStyles: relevantStyles
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
}

// Initialize the element selector
console.log('Vibe UI Assistant: Initializing content script');

// Make sure we don't initialize multiple times
if (!(window as any).vibeUIAssistantInitialized) {
  (window as any).vibeUIAssistantInitialized = true;
  (window as any).vibeUISelector = new ElementSelector();
  console.log('Vibe UI Assistant: Content script initialized successfully');
} else {
  console.log('Vibe UI Assistant: Content script already initialized');
}