import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import * as Plotly from 'plotly.js-dist-min';

@Component({
  selector: 'app-graph-renderer',
  standalone: true,
  template: `
    <div class="plot-wrapper">
      <div #plotContainer class="plot-container"></div>
    </div>
  `,
  styles: [`
    .plot-wrapper {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      box-shadow: var(--glass-shadow);
      padding: var(--spacing-md);
      margin: var(--spacing-md) 0;
      animation: fadeInUp var(--transition-normal) ease-out;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    
    .plot-wrapper:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }
    
    .plot-container {
      width: 100%;
      height: 400px;
      min-height: 300px;
      position: relative;
    }
    
    @media (max-width: 768px) {
      .plot-container {
        height: 300px;
        min-height: 250px;
      }
      
      .plot-wrapper {
        padding: var(--spacing-sm);
      }
    }
    
    @media (min-width: 1200px) {
      .plot-container {
        height: 450px;
      }
    }
  `]
})
export class GraphRendererComponent implements OnInit, OnChanges, OnDestroy {
  @Input() graphData!: {
    chartType: 'bar' | 'line' | 'multi_line' | 'pie' | 'bubble' | 'scatter';
    x?: any[];
    y?: any[];
    values?: any[];
    sizes?: any[];
    labels?: string[];
    xLabel?: string;
    yLabel?: string;
    series?: Array<{ name?: string; x: any[]; y: any[]; labels?: string[] }>;
  };
  @ViewChild('plotContainer', { static: true }) plotContainer!: ElementRef;
  private resizeHandler?: () => void;

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

  private formatLabel(label: string): string {
    if (!label) return '';
    
    // Replace underscores with spaces
    let formatted = label.replace(/_/g, ' ');
    
    // Convert to title case (capitalize first letter of each word)
    formatted = formatted.split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    
    return formatted;
  }

  private renderPlot() {
    if (!this.graphData || !this.plotContainer) {
      return;
    }

    const data: any[] = [];
    let layout: any = {};

    // Format labels for better readability
    const formattedXLabel = this.formatLabel(this.graphData.xLabel || '');
    const formattedYLabel = this.formatLabel(this.graphData.yLabel || '');

    // Gradient colors matching the glass theme - orange palette
    const primaryColor = 'rgba(255, 107, 53, 0.8)';
    const primaryColorSolid = 'rgba(255, 107, 53, 1.0)';
    const secondaryColor = 'rgba(247, 147, 30, 0.8)';
    const accentColor = 'rgba(255, 154, 86, 0.6)';

    // Common layout properties
    const commonLayout = {
      paper_bgcolor: 'rgba(0, 0, 0, 0)',
      plot_bgcolor: 'rgba(255, 255, 255, 0.3)',
      font: {
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#1f2937'
      },
      hoverlabel: {
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        bordercolor: 'rgba(255, 107, 53, 0.3)',
        font: {
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          size: 12,
          color: '#1f2937'
        }
      }
    };

    const labelsArray = this.graphData.labels ?? [];

    if (this.graphData.chartType === 'pie') {
      // Pie chart layout
      layout = {
        ...commonLayout,
        title: {
          text: formattedYLabel || 'Distribution',
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            size: 18,
            color: '#1f2937'
          },
          x: 0.5,
          xanchor: 'center'
        },
        showlegend: true,
        legend: {
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            size: 12,
            color: '#1f2937'
          }
        },
        margin: { l: 20, r: 20, t: 50, b: 20 }
      };

      // Generate colors for pie segments
      const colors = labelsArray.map((_, i) => {
        const ratio = i / Math.max(labelsArray.length - 1, 1);
        return `rgba(${255}, ${107 + ratio * 40}, ${53 - ratio * 23}, 0.8)`;
      });

      data.push({
        type: 'pie',
        labels: labelsArray,
        values: this.graphData.values || [],
        textinfo: 'label+percent',
        textposition: 'outside',
        hovertemplate: '<b>%{label}</b><br>Value: %{value}<br>Percentage: %{percent}<extra></extra>',
        marker: {
          colors: colors,
          line: {
            color: 'rgba(255, 255, 255, 0.8)',
            width: 2
          }
        }
      });
    } else if (this.graphData.chartType === 'bubble') {
      // Bubble chart layout
      layout = {
        ...commonLayout,
        title: {
          text: `${formattedYLabel} vs ${formattedXLabel}`,
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            size: 18,
            color: '#1f2937'
          },
          x: 0.5,
          xanchor: 'center'
        },
        xaxis: {
          title: {
            text: formattedXLabel,
            font: {
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              size: 14,
              color: '#6b7280'
            }
          },
          gridcolor: 'rgba(0, 0, 0, 0.05)',
          gridwidth: 1,
          showgrid: true,
          zeroline: false,
          linecolor: 'rgba(0, 0, 0, 0.1)',
          linewidth: 1
        },
        yaxis: {
          title: {
            text: formattedYLabel,
            font: {
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              size: 14,
              color: '#6b7280'
            }
          },
          gridcolor: 'rgba(0, 0, 0, 0.05)',
          gridwidth: 1,
          showgrid: true,
          zeroline: false,
          linecolor: 'rgba(0, 0, 0, 0.1)',
          linewidth: 1
        },
        hovermode: 'closest',
        showlegend: false,
        margin: { l: 70, r: 30, t: 50, b: 70 }
      };

      data.push({
        x: this.graphData.x || [],
        y: this.graphData.y || [],
        mode: 'markers',
        type: 'scatter',
        text: this.graphData.labels,
        hovertemplate: '<b>%{text}</b><br>' +
                      `${formattedXLabel}: %{x}<br>` +
                      `${formattedYLabel}: %{y}<extra></extra>`,
        marker: {
          size: this.graphData.sizes || [],
          sizemode: 'diameter',
          sizeref: 2.0,
          sizemin: 4,
          color: primaryColor,
          line: {
            color: primaryColorSolid,
            width: 2
          },
          opacity: 0.7
        }
      });
    } else {
      // Bar/Line/Scatter chart layout
      layout = {
        ...commonLayout,
        title: {
          text: `${formattedYLabel} vs ${formattedXLabel}`,
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            size: 18,
            color: '#1f2937'
          },
          x: 0.5,
          xanchor: 'center'
        },
        xaxis: {
          title: {
            text: formattedXLabel,
            font: {
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              size: 14,
              color: '#6b7280'
            }
          },
          gridcolor: 'rgba(0, 0, 0, 0.05)',
          gridwidth: 1,
          showgrid: true,
          zeroline: false,
          linecolor: 'rgba(0, 0, 0, 0.1)',
          linewidth: 1
        },
        yaxis: {
          title: {
            text: formattedYLabel,
            font: {
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              size: 14,
              color: '#6b7280'
            }
          },
          gridcolor: 'rgba(0, 0, 0, 0.05)',
          gridwidth: 1,
          showgrid: true,
          zeroline: false,
          linecolor: 'rgba(0, 0, 0, 0.1)',
          linewidth: 1
        },
        hovermode: 'closest',
        showlegend: false,
        margin: { l: 70, r: 30, t: 50, b: 70 }
      };

      const hasSeries = Array.isArray(this.graphData.series) && this.graphData.series.length > 0;

      if (this.graphData.chartType === 'bar') {
        // Create gradient colors for bars - orange gradient
        const yValues = this.graphData.y || [];
        const colors = yValues.map((_, i) => {
          const ratio = i / Math.max(yValues.length - 1, 1);
          return `rgba(${255}, ${107 + ratio * 40}, ${53 - ratio * 23}, 0.8)`;
        });
        
        data.push({
          x: this.graphData.x || [],
          y: this.graphData.y || [],
          type: 'bar',
          text: labelsArray,
          hovertemplate: '<b>%{text}</b><br>' +
                        `${formattedXLabel}: %{x}<br>` +
                        `${formattedYLabel}: %{y}<extra></extra>`,
          marker: {
            color: colors.length > 0 ? colors : primaryColor,
            line: {
              color: primaryColorSolid,
              width: 1.5
            },
            opacity: 0.9
          },
          textposition: 'outside'
        });
      } else if (this.graphData.chartType === 'line' || this.graphData.chartType === 'multi_line') {
        if (hasSeries) {
          layout.showlegend = true;
          layout.legend = {
            font: {
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              size: 12,
              color: '#1f2937'
            }
          };

          const palette = [
            'rgba(255, 107, 53, 1)',
            'rgba(78, 205, 196, 1)',
            'rgba(142, 68, 173, 1)',
            'rgba(52, 152, 219, 1)',
            'rgba(46, 204, 113, 1)',
            'rgba(241, 196, 15, 1)'
          ];

          this.graphData.series!.forEach((series, idx) => {
            const color = palette[idx % palette.length];
            data.push({
              x: series.x || [],
              y: series.y || [],
              name: series.name || `Series ${idx + 1}`,
              type: 'scatter',
              mode: 'lines+markers',
              text: series.labels,
              hovertemplate: '<b>%{text}</b><br>' +
                            `${formattedXLabel}: %{x}<br>` +
                            `${formattedYLabel}: %{y}<extra></extra>`,
              line: {
                color,
                width: 3,
                shape: 'linear'
              },
              marker: {
                size: 7,
                color,
                line: {
                  color: 'rgba(255, 255, 255, 0.8)',
                  width: 2
                }
              },
              fill: 'none'
            });
          });
        } else {
          data.push({
            x: this.graphData.x || [],
            y: this.graphData.y || [],
            type: 'scatter',
            mode: 'lines+markers',
            text: labelsArray,
            hovertemplate: '<b>%{text}</b><br>' +
                          `${formattedXLabel}: %{x}<br>` +
                          `${formattedYLabel}: %{y}<extra></extra>`,
            line: {
              color: primaryColorSolid,
              width: 3,
              shape: 'linear'
            },
            marker: {
              size: 8,
              color: primaryColorSolid,
              line: {
                color: 'rgba(255, 255, 255, 0.8)',
                width: 2
              }
            },
            fill: 'tonexty',
            fillcolor: 'rgba(255, 107, 53, 0.2)'
          });
        }
      } else {
        // Scatter plot fallback
        data.push({
          x: this.graphData.x || [],
          y: this.graphData.y || [],
          type: 'scatter',
          mode: 'markers',
          text: this.graphData.labels,
          hovertemplate: '<b>%{text}</b><br>' +
                        `${formattedXLabel}: %{x}<br>` +
                        `${formattedYLabel}: %{y}<extra></extra>`,
          marker: {
            size: 10,
            color: primaryColor,
            line: {
              color: primaryColorSolid,
              width: 2
            },
            opacity: 0.8
          }
        });
      }
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
      displaylogo: false,
      toImageButtonOptions: {
        format: 'png',
        filename: 'chart',
        height: 500,
        width: 1000,
        scale: 2
      },
      displayModeBarPosition: 'top-right'
    };

    Plotly.newPlot(this.plotContainer.nativeElement, data, layout, config).then(() => {
      // Make plot responsive on window resize
      this.resizeHandler = () => {
        // Use type assertion since Plotly.Plots is not in the type definitions
        (Plotly as any).Plots?.resize(this.plotContainer.nativeElement);
      };
      window.addEventListener('resize', this.resizeHandler);
    });
  }
  
  ngOnDestroy() {
    // Clean up resize listener if component is destroyed
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }
}

