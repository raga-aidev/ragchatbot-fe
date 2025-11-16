import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ProcessQueriesResponse } from '../../services/chat.service';
import { ChatMessage, ChatResponse } from '../../models/chat-response.model';
import { TableRendererComponent } from '../table-renderer/table-renderer.component';
import { GraphRendererComponent } from '../graph-renderer/graph-renderer.component';
import { interval, Subscription } from 'rxjs';
import { featureFlags } from '../../config/feature-flags';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TableRendererComponent, GraphRendererComponent],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h1>NCAA Basketball Data</h1>
        <button 
          *ngIf="showProcessQueriesButton"
          (click)="processQueries()" 
          class="process-button"
          [disabled]="processingQueries">
          <span *ngIf="!processingQueries">Process Queries</span>
          <span *ngIf="processingQueries" class="processing-text">
            <span class="spinner-icon"></span>
            Processing...
          </span>
        </button>
      </div>
      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let message of messages" [class]="'message ' + (message.isUser ? 'user-message' : 'bot-message')">
          <div class="message-content">
            <div class="message-text">{{ message.text }}</div>
            <div *ngIf="message.response && !message.isUser" class="message-response">
              <div class="response-message">
                {{ message.response.message }}
                <span *ngIf="message.timeTaken" class="time-taken">({{ formatTime(message.timeTaken) }})</span>
              </div>
              <app-table-renderer *ngIf="message.response.tableData" [tableData]="message.response.tableData"></app-table-renderer>
              <app-graph-renderer *ngIf="message.response.graphData" [graphData]="message.response.graphData"></app-graph-renderer>
            </div>
          </div>
        </div>
        <div *ngIf="loading" class="message bot-message">
          <div class="message-content">
            <div class="loading-spinner">
              <span class="spinner-icon"></span>
              <span>Loading...</span>
              <span class="loading-duration">{{ elapsedTime }}s</span>
            </div>
          </div>
        </div>
      </div>
      <div 
        *ngIf="historyPanelEnabled && queryHistory.length > 0" 
        class="history-toggle-bar">
        <button 
          type="button" 
          class="history-toggle-button" 
          (click)="toggleHistoryPanel()"
          [disabled]="loading">
          <span *ngIf="!showHistory">Show history</span>
          <span *ngIf="showHistory">Hide history</span>
        </button>
        <span class="history-hint">Use ↑/↓ to cycle queries</span>
      </div>
      <div 
        *ngIf="historyPanelEnabled && showHistory && queryHistory.length > 0" 
        class="history-panel">
        <div class="history-panel-header">
          <span>Query history</span>
          <button 
            type="button" 
            class="history-close-button" 
            (click)="closeHistoryPanel()">
            Close
          </button>
        </div>
        <div class="history-list">
          <button 
            type="button" 
            class="history-item"
            *ngFor="let historyItem of queryHistory.slice().reverse(); let idx = index"
            (click)="loadHistoryItem(queryHistory.length - 1 - idx)">
            {{ historyItem }}
          </button>
        </div>
      </div>
      <div class="chat-input-container">
        <textarea
          #chatInput
          rows="1"
          [(ngModel)]="inputMessage" 
          (keydown)="onInputKeyDown($event)"
          (input)="handleInputChange()"
          placeholder="Ask a question about NCAA basketball data..."
          class="chat-input"
          [disabled]="loading"></textarea>
        <button 
          (click)="sendMessage()" 
          class="send-button"
          [disabled]="loading || !inputMessage.trim()">
          Send
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 1200px;
      margin: 0 auto;
      background: transparent;
      position: relative;
    }
    
    .chat-header {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border-bottom: 1px solid var(--glass-border);
      color: var(--text-primary);
      padding: var(--spacing-lg);
      text-align: center;
      box-shadow: var(--glass-shadow);
      position: sticky;
      top: 0;
      z-index: 100;
      animation: slideUp var(--transition-normal);
    }
    
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chat-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .process-button {
      padding: var(--spacing-sm) var(--spacing-md);
      background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
      color: var(--text-white);
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all var(--transition-normal);
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }
    
    .process-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.5);
    }
    
    .process-button:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .process-button:disabled {
      background: rgba(200, 200, 200, 0.5);
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.7;
    }
    
    .processing-text {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }
    
    .processing-text .spinner-icon {
      width: 14px;
      height: 14px;
      border: 2px solid var(--text-white);
      border-top-color: transparent;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      flex-shrink: 0;
    }
    
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      scroll-behavior: smooth;
    }
    
    .message {
      display: flex;
      margin-bottom: var(--spacing-sm);
      animation: fadeInUp var(--transition-normal) ease-out;
    }
    
    .user-message {
      justify-content: flex-end;
    }
    
    .bot-message {
      justify-content: flex-start;
    }
    
    .message-content {
      max-width: 70%;
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-lg);
      word-wrap: break-word;
      position: relative;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    
    .message-content:hover {
      transform: translateY(-2px);
    }
    
    .user-message .message-content {
      background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
      color: var(--text-white);
      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .user-message .message-content:hover {
      box-shadow: 0 6px 20px rgba(255, 107, 53, 0.6);
    }
    
    .bot-message .message-content {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      color: var(--text-primary);
      box-shadow: var(--glass-shadow);
      border: 1px solid var(--glass-border);
    }
    
    .bot-message .message-content:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }
    
    .message-text {
      margin-bottom: var(--spacing-sm);
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .response-message {
      margin-bottom: var(--spacing-md);
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.6;
    }
    
    .loading-spinner {
      color: var(--text-secondary);
      font-style: italic;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    
    .spinner-icon {
      width: 16px;
      height: 16px;
      border: 2px solid var(--primary-gradient-start);
      border-top-color: transparent;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      flex-shrink: 0;
    }
    
    .loading-duration {
      margin-left: auto;
      font-size: 12px;
      opacity: 0.7;
      font-weight: 500;
    }
    
    .time-taken {
      font-size: 12px;
      opacity: 0.7;
      font-weight: 400;
      margin-left: var(--spacing-sm);
    }
    
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    
    .chat-input-container {
      display: flex;
      padding: var(--spacing-lg);
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border-top: 1px solid var(--glass-border);
      gap: var(--spacing-md);
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
      position: sticky;
      bottom: 0;
      z-index: 100;
      animation: slideUp var(--transition-normal);
      align-items: flex-end;
    }

    .history-toggle-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--spacing-lg);
      margin-bottom: var(--spacing-sm);
      gap: var(--spacing-md);
      color: var(--text-secondary);
      font-size: 13px;
    }

    .history-toggle-button {
      border: 1px solid var(--glass-border);
      background: rgba(255, 255, 255, 0.8);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xs) var(--spacing-md);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all var(--transition-fast);
      color: var(--text-primary);
    }

    .history-toggle-button:hover:not(:disabled) {
      border-color: var(--primary-gradient-start);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    .history-toggle-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .history-hint {
      font-style: italic;
    }

    .history-panel {
      margin: 0 var(--spacing-lg) var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--glass-shadow);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
    }

    .history-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
      font-weight: 600;
      color: var(--text-primary);
    }

    .history-close-button {
      border: none;
      background: transparent;
      color: var(--primary-gradient-start);
      cursor: pointer;
      font-weight: 600;
      transition: opacity var(--transition-fast);
    }

    .history-close-button:hover {
      opacity: 0.7;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      max-height: 200px;
      overflow-y: auto;
    }

    .history-item {
      text-align: left;
      border: 1px solid transparent;
      background: rgba(255, 255, 255, 0.8);
      border-radius: var(--radius-md);
      padding: var(--spacing-sm) var(--spacing-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      color: var(--text-primary);
      font-size: 14px;
      line-height: 1.4;
    }

    .history-item:hover {
      border-color: var(--primary-gradient-start);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .chat-input {
      flex: 1;
      width: 100%;
      padding: var(--spacing-md) var(--spacing-lg);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-xl);
      font-size: 15px;
      line-height: 1.5;
      outline: none;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      color: var(--text-primary);
      transition: all var(--transition-normal);
      resize: none;
      overflow-y: hidden;
      min-height: 48px;
      max-height: 30vh;
    }
    
    .chat-input::placeholder {
      color: var(--text-secondary);
    }
    
    .chat-input:focus {
      border-color: var(--primary-gradient-start);
      box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
      background: rgba(255, 255, 255, 0.95);
    }
    
    .chat-input:disabled {
      background: rgba(255, 255, 255, 0.5);
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    .send-button {
      padding: var(--spacing-md) var(--spacing-xl);
      background: linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end));
      color: var(--text-white);
      border: none;
      border-radius: var(--radius-xl);
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
      transition: all var(--transition-normal);
      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
      position: relative;
      overflow: hidden;
    }
    
    .send-button::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    
    .send-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 53, 0.6);
    }
    
    .send-button:hover:not(:disabled)::before {
      width: 300px;
      height: 300px;
    }
    
    .send-button:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .send-button:disabled {
      background: rgba(200, 200, 200, 0.5);
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.6;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .message-content {
        max-width: 85%;
      }
      
      .chat-input {
        max-height: 35vh;
      }
      
      .chat-header {
        flex-direction: column;
        gap: var(--spacing-sm);
      }
      
      .chat-header h1 {
        font-size: 22px;
      }
      
      .process-button {
        width: 100%;
        justify-content: center;
      }
      
      .chat-messages {
        padding: var(--spacing-md);
      }
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked, AfterViewInit, OnDestroy {
  messages: ChatMessage[] = [];
  inputMessage: string = '';
  loading: boolean = false;
  processingQueries: boolean = false;
  elapsedTime: number = 0;
  showProcessQueriesButton: boolean = featureFlags.showProcessQueriesButton;
  historyPanelEnabled: boolean = featureFlags.enableChatHistoryPanel;
  queryHistory: string[] = [];
  historyIndex: number | null = null;
  showHistory: boolean = false;
  private loadingStartTime: number = 0;
  private timerSubscription?: Subscription;
  private draftBeforeHistory: string = '';
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('chatInput') private chatInput!: ElementRef<HTMLTextAreaElement>;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.addWelcomeMessage();
  }

  ngAfterViewInit(): void {
    this.autoResizeTextarea();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private addWelcomeMessage() {
    this.messages.push({
      text: 'Welcome! Ask me anything about NCAA basketball data.',
      isUser: false
    });
  }

  sendMessage() {
    const query = this.inputMessage.trim();
    if (!query || this.loading) {
      return;
    }

    this.addQueryToHistory(query);
    this.resetHistoryNavigation();

    // Add user message
    this.messages.push({
      text: query,
      isUser: true
    });

    this.inputMessage = '';
    this.autoResizeTextarea();
    this.loading = true;
    this.elapsedTime = 0;
    this.loadingStartTime = Date.now();
    this.startTimer();

    this.chatService.sendMessage(query).subscribe({
      next: (response: ChatResponse) => {
        const timeTaken = Date.now() - this.loadingStartTime;
        this.stopTimer();
        this.messages.push({
          text: query,
          isUser: false,
          response: response,
          timeTaken: timeTaken
        });
        this.loading = false;
        this.elapsedTime = 0;
      },
      error: (error) => {
        const timeTaken = Date.now() - this.loadingStartTime;
        this.stopTimer();
        this.messages.push({
          text: 'Sorry, I encountered an error: ' + (error.error?.message || error.message || 'Unknown error'),
          isUser: false,
          timeTaken: timeTaken
        });
        this.loading = false;
        this.elapsedTime = 0;
      }
    });
  }

  onInputKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!this.loading) {
        this.sendMessage();
      }
      return;
    }

    if (this.loading || !this.queryHistory.length) {
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.historyIndex === null) {
        this.draftBeforeHistory = this.inputMessage;
        this.historyIndex = this.queryHistory.length - 1;
      } else if (this.historyIndex > 0) {
        this.historyIndex--;
      }

      if (this.historyIndex !== null) {
        this.inputMessage = this.queryHistory[this.historyIndex];
        this.autoResizeTextarea();
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.historyIndex === null) {
        return;
      }

      if (this.historyIndex < this.queryHistory.length - 1) {
        this.historyIndex++;
        this.inputMessage = this.queryHistory[this.historyIndex];
        this.autoResizeTextarea();
      } else {
        this.inputMessage = this.draftBeforeHistory;
        this.resetHistoryNavigation();
        this.autoResizeTextarea();
      }
    }
  }

  handleInputChange() {
    if (this.historyIndex !== null) {
      this.resetHistoryNavigation();
    }
    this.autoResizeTextarea();
  }

  toggleHistoryPanel() {
    if (!this.historyPanelEnabled || !this.queryHistory.length) {
      return;
    }
    this.showHistory = !this.showHistory;
  }

  closeHistoryPanel() {
    this.showHistory = false;
  }

  loadHistoryItem(index: number) {
    if (index < 0 || index >= this.queryHistory.length) {
      return;
    }
    this.inputMessage = this.queryHistory[index];
    this.historyIndex = index;
    this.draftBeforeHistory = '';
    this.focusInput();
  }

  private startTimer() {
    this.stopTimer(); // Clear any existing timer
    this.timerSubscription = interval(100).subscribe(() => {
      if (this.loading && this.loadingStartTime > 0) {
        this.elapsedTime = Math.floor((Date.now() - this.loadingStartTime) / 1000);
      }
    });
  }

  private stopTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  private addQueryToHistory(query: string) {
    if (!query) {
      return;
    }
    if (this.queryHistory.length && this.queryHistory[this.queryHistory.length - 1] === query) {
      return;
    }
    this.queryHistory.push(query);
  }

  private resetHistoryNavigation() {
    this.historyIndex = null;
    this.draftBeforeHistory = '';
  }

  private focusInput() {
    if (this.chatInput?.nativeElement) {
      this.chatInput.nativeElement.focus();
    }
    this.autoResizeTextarea();
  }

  @HostListener('window:resize')
  handleWindowResize() {
    this.autoResizeTextarea();
  }

  private autoResizeTextarea() {
    if (!this.chatInput?.nativeElement) {
      return;
    }

    const resizeAction = () => {
      if (!this.chatInput?.nativeElement) {
        return;
      }
      const textarea = this.chatInput.nativeElement;
      const maxHeight = this.getMaxTextareaHeight();
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(resizeAction);
    } else {
      resizeAction();
    }
  }

  private getMaxTextareaHeight(): number {
    if (typeof window !== 'undefined' && window.innerHeight) {
      return Math.max(140, Math.floor(window.innerHeight * 0.3));
    }
    return 200;
  }

  formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 1) {
      return `${milliseconds}ms`;
    } else if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      // Ignore scroll errors
    }
  }

  processQueries() {
    if (this.processingQueries) {
      return;
    }

    this.processingQueries = true;
    const startTime = Date.now();

    this.chatService.processQueries().subscribe({
      next: (response: ProcessQueriesResponse) => {
        const processingTime = Date.now() - startTime;
        this.processingQueries = false;

        // Format success message
        let message = `✅ Query processing completed!\n\n`;
        message += `📊 Statistics:\n`;
        message += `• Original queries: ${response.originalCount || 0}\n`;
        message += `• Duplicates removed: ${response.duplicatesRemoved || 0}\n`;
        message += `• Final unique queries: ${response.finalCount || 0}\n`;
        message += `• Queries processed: ${response.queriesProcessed || 0}\n`;
        message += `• Successful: ${response.queriesSucceeded || 0}\n`;
        message += `• Failed: ${response.queriesFailed || 0}\n`;
        message += `• Processing time: ${this.formatTime(response.processingTimeMs || processingTime)}`;

        if (response.errors && response.errors.length > 0) {
          message += `\n\n⚠️ Errors:\n`;
          response.errors.forEach((error, index) => {
            message += `${index + 1}. ${error}\n`;
          });
        }

        this.messages.push({
          text: message,
          isUser: false,
          timeTaken: response.processingTimeMs || processingTime
        });
      },
      error: (error) => {
        const processingTime = Date.now() - startTime;
        this.processingQueries = false;

        const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
        this.messages.push({
          text: `❌ Error processing queries: ${errorMessage}`,
          isUser: false,
          timeTaken: processingTime
        });
      }
    });
  }
}

