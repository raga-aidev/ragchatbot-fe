export interface ChatResponse {
  message: string;
  tableData?: {
    columns: string[];
    rows: any[][];
  };
  graphData?: {
    chartType: string;
    x: any[];
    y: any[];
    labels: string[];
    xLabel: string;
    yLabel: string;
  };
}

export interface ChatMessage {
  text: string;
  isUser: boolean;
  response?: ChatResponse;
}

