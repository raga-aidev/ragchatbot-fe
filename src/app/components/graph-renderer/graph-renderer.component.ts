import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import * as Plotly from 'plotly.js-dist-min';

@Component({
  selector: 'app-graph-renderer',
  standalone: true,
  template: `
    <div #plotContainer class="plot-container"></div>
  `,
  styles: [`
    .plot-container {
      width: 100%;
      height: 400px;
      margin: 10px 0;
    }
  `]
})
export class GraphRendererComponent implements OnInit, OnChanges {
  @Input() graphData!: {
    chartType: string;
    x: any[];
    y: any[];
    labels: string[];
    xLabel: string;
    yLabel: string;
  };
  @ViewChild('plotContainer', { static: true }) plotContainer!: ElementRef;

  ngOnInit() {
    if (this.graphData) {
      this.renderPlot();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['graphData'] && !changes['graphData'].firstChange) {
      this.renderPlot();
    }
  }

  private renderPlot() {
    if (!this.graphData || !this.plotContainer) {
      return;
    }

    const data: any[] = [];
    const layout: any = {
      title: {
        text: `${this.graphData.yLabel} vs ${this.graphData.xLabel}`
      },
      xaxis: {
        title: this.graphData.xLabel
      },
      yaxis: {
        title: this.graphData.yLabel
      },
      hovermode: 'closest',
      showlegend: false,
      margin: { l: 60, r: 20, t: 40, b: 60 }
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
      displaylogo: false
    };

    if (this.graphData.chartType === 'bar') {
      data.push({
        x: this.graphData.x,
        y: this.graphData.y,
        type: 'bar',
        text: this.graphData.labels,
        hovertemplate: '<b>%{text}</b><br>' +
                      `${this.graphData.xLabel}: %{x}<br>` +
                      `${this.graphData.yLabel}: %{y}<extra></extra>`,
        marker: {
          color: 'rgba(54, 162, 235, 0.6)',
          line: {
            color: 'rgba(54, 162, 235, 1.0)',
            width: 1
          }
        }
      });
    } else if (this.graphData.chartType === 'line') {
      data.push({
        x: this.graphData.x,
        y: this.graphData.y,
        type: 'scatter',
        mode: 'lines+markers',
        text: this.graphData.labels,
        hovertemplate: '<b>%{text}</b><br>' +
                      `${this.graphData.xLabel}: %{x}<br>` +
                      `${this.graphData.yLabel}: %{y}<extra></extra>`,
        line: {
          color: 'rgba(54, 162, 235, 1.0)',
          width: 2
        },
        marker: {
          size: 6,
          color: 'rgba(54, 162, 235, 1.0)'
        }
      });
    } else {
      data.push({
        x: this.graphData.x,
        y: this.graphData.y,
        type: 'scatter',
        mode: 'markers',
        text: this.graphData.labels,
        hovertemplate: '<b>%{text}</b><br>' +
                      `${this.graphData.xLabel}: %{x}<br>` +
                      `${this.graphData.yLabel}: %{y}<extra></extra>`,
        marker: {
          size: 8,
          color: 'rgba(54, 162, 235, 0.6)',
          line: {
            color: 'rgba(54, 162, 235, 1.0)',
            width: 1
          }
        }
      });
    }

    Plotly.newPlot(this.plotContainer.nativeElement, data, layout, config);
  }
}

