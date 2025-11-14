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
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th {
      background-color: #f5f5f5;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #ddd;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
    }
    .data-table tr:hover {
      background-color: #f9f9f9;
    }
  `]
})
export class TableRendererComponent {
  @Input() tableData!: { columns: string[]; rows: any[][] };
}

