import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th *ngFor="let col of tableData.columns">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of tableData.rows">
            <td *ngFor="let cell of row">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      max-height: 400px;
      overflow-y: auto;
      overflow-x: auto;
      margin: var(--spacing-md) 0;
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      box-shadow: var(--glass-shadow);
      animation: fadeInUp var(--transition-normal) ease-out;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    
    .table-container:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }
    
    .data-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      min-width: 100%;
    }
    
    .data-table th {
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      padding: var(--spacing-md);
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
      border-bottom: 2px solid rgba(255, 107, 53, 0.2);
      position: sticky;
      top: 0;
      z-index: 10;
      transition: background var(--transition-fast);
    }
    
    .data-table th:first-child {
      border-top-left-radius: var(--radius-md);
    }
    
    .data-table th:last-child {
      border-top-right-radius: var(--radius-md);
    }
    
    .data-table td {
      padding: var(--spacing-md);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      color: var(--text-primary);
      font-size: 14px;
      background: rgba(255, 255, 255, 0.3);
      transition: background var(--transition-fast), transform var(--transition-fast);
    }
    
    .data-table tbody tr {
      transition: background var(--transition-fast), transform var(--transition-fast);
    }
    
    .data-table tbody tr:hover {
      background: rgba(255, 107, 53, 0.1);
      transform: scale(1.01);
    }
    
    .data-table tbody tr:hover td {
      background: rgba(255, 107, 53, 0.05);
    }
    
    .data-table tbody tr:last-child td:first-child {
      border-bottom-left-radius: var(--radius-md);
    }
    
    .data-table tbody tr:last-child td:last-child {
      border-bottom-right-radius: var(--radius-md);
    }
    
    /* Custom scrollbar for table container */
    .table-container::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    .table-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    .table-container::-webkit-scrollbar-thumb {
      background: rgba(255, 107, 53, 0.3);
      border-radius: 4px;
      backdrop-filter: blur(5px);
    }
    
    .table-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 107, 53, 0.5);
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .table-container {
        max-height: 300px;
      }
      
      .data-table th,
      .data-table td {
        padding: var(--spacing-sm);
        font-size: 12px;
      }
    }
  `]
})
export class TableRendererComponent {
  @Input() tableData!: { columns: string[]; rows: any[][] };
}

