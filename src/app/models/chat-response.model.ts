export interface ChatResponse {
  message: string;
  tableData?: {
    columns: string[];
    rows: any[][];
  };
  graphData?: {
    chartType: 'bar' | 'line' | 'multi_line' | 'pie' | 'bubble' | 'scatter';
    // Common fields for bar/line charts
    x?: any[];
    y?: any[];
    // Fields for pie chart
    values?: any[];
    // Fields for bubble chart
    sizes?: any[];
    // Common fields
    labels?: string[];
    xLabel?: string;
    yLabel?: string;
    series?: Array<{ name?: string; x: any[]; y: any[]; labels?: string[] }>;
  };
}

export interface ChatMessage {
  text: string;
  isUser: boolean;
  response?: ChatResponse;
  timeTaken?: number; // Time taken in milliseconds
}

