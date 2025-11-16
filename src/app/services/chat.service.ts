import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatResponse } from '../models/chat-response.model';

export interface ProcessQueriesResponse {
  originalCount?: number;
  duplicatesRemoved?: number;
  finalCount?: number;
  queriesProcessed?: number;
  queriesSucceeded?: number;
  queriesFailed?: number;
  processingTimeMs?: number;
  errors?: string[];
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = '/api/chat';
  private processQueriesUrl = '/api/queries/process';

  constructor(private http: HttpClient) { }

  sendMessage(query: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, { query });
  }

  processQueries(): Observable<ProcessQueriesResponse> {
    return this.http.post<ProcessQueriesResponse>(this.processQueriesUrl, {});
  }
}

