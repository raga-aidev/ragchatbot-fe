import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { ChatMessage, ChatResponse } from '../../models/chat-response.model';
import { TableRendererComponent } from '../table-renderer/table-renderer.component';
import { GraphRendererComponent } from '../graph-renderer/graph-renderer.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TableRendererComponent, GraphRendererComponent],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h1>NCAA Basketball Data Chatbot</h1>
      </div>
      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let message of messages" [class]="'message ' + (message.isUser ? 'user-message' : 'bot-message')">
          <div class="message-content">
            <div class="message-text">{{ message.text }}</div>
            <div *ngIf="message.response && !message.isUser" class="message-response">
              <div class="response-message">{{ message.response.message }}</div>
              <app-table-renderer *ngIf="message.response.tableData" [tableData]="message.response.tableData"></app-table-renderer>
              <app-graph-renderer *ngIf="message.response.graphData" [graphData]="message.response.graphData"></app-graph-renderer>
            </div>
          </div>
        </div>
        <div *ngIf="loading" class="message bot-message">
          <div class="message-content">
            <div class="loading-spinner">Loading...</div>
          </div>
        </div>
      </div>
      <div class="chat-input-container">
        <input 
          type="text" 
          [(ngModel)]="inputMessage" 
          (keyup.enter)="sendMessage()"
          placeholder="Ask a question about NCAA basketball data..."
          class="chat-input"
          [disabled]="loading">
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
      background-color: #f5f5f5;
    }
    .chat-header {
      background-color: #2196F3;
      color: white;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .chat-header h1 {
      margin: 0;
      font-size: 24px;
    }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .message {
      display: flex;
      margin-bottom: 10px;
    }
    .user-message {
      justify-content: flex-end;
    }
    .bot-message {
      justify-content: flex-start;
    }
    .message-content {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 18px;
      word-wrap: break-word;
    }
    .user-message .message-content {
      background-color: #2196F3;
      color: white;
    }
    .bot-message .message-content {
      background-color: white;
      color: #333;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .message-text {
      margin-bottom: 8px;
    }
    .response-message {
      margin-bottom: 10px;
      font-weight: 500;
    }
    .loading-spinner {
      color: #666;
      font-style: italic;
    }
    .chat-input-container {
      display: flex;
      padding: 15px 20px;
      background-color: white;
      border-top: 1px solid #ddd;
      gap: 10px;
    }
    .chat-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #ddd;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
    }
    .chat-input:focus {
      border-color: #2196F3;
    }
    .chat-input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
    .send-button {
      padding: 12px 24px;
      background-color: #2196F3;
      color: white;
      border: none;
      border-radius: 24px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .send-button:hover:not(:disabled) {
      background-color: #1976D2;
    }
    .send-button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  messages: ChatMessage[] = [];
  inputMessage: string = '';
  loading: boolean = false;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.addWelcomeMessage();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
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

    // Add user message
    this.messages.push({
      text: query,
      isUser: true
    });

    this.inputMessage = '';
    this.loading = true;

    this.chatService.sendMessage(query).subscribe({
      next: (response: ChatResponse) => {
        this.messages.push({
          text: query,
          isUser: false,
          response: response
        });
        this.loading = false;
      },
      error: (error) => {
        this.messages.push({
          text: 'Sorry, I encountered an error: ' + (error.error?.message || error.message || 'Unknown error'),
          isUser: false
        });
        this.loading = false;
      }
    });
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      // Ignore scroll errors
    }
  }
}

