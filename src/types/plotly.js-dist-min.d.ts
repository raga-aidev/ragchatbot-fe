declare module 'plotly.js-dist-min' {
  interface PlotlyData {
    x?: any[];
    y?: any[];
    type?: string;
    mode?: string;
    text?: any[];
    hovertemplate?: string;
    marker?: any;
    line?: any;
  }

  interface PlotlyLayout {
    title?: any;
    xaxis?: any;
    yaxis?: any;
    hovermode?: string;
    showlegend?: boolean;
    margin?: any;
  }

  interface PlotlyConfig {
    responsive?: boolean;
    displayModeBar?: boolean;
    modeBarButtonsToRemove?: string[];
    displaylogo?: boolean;
  }

  const Plotly: {
    newPlot: (
      element: HTMLElement,
      data: PlotlyData[],
      layout?: PlotlyLayout,
      config?: PlotlyConfig
    ) => Promise<void>;
  };

  export = Plotly;
}

