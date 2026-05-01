'use client';

import React, { useEffect, useRef } from 'react';

// Define a mapping from app asset names to TradingView symbol names
const symbolMap: { [key: string]: string } = {
  'EUR/USD': 'FX:EURUSD',
  'EUR/USD (OTC)': 'FX:EURUSD',
  'EUR/JPY': 'FX:EURJPY',
  'EUR/JPY (OTC)': 'FX:EURJPY',
};

type TradingViewWidgetProps = {
  asset: string;
  interval: string;
};

// A simple check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ asset, interval }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Using React.useId to ensure a unique ID for each widget instance
  const widgetContainerId = `tradingview_widget_${React.useId().replace(/:/g, '')}`;

  useEffect(() => {
    // Don't run this effect on the server
    if (!isBrowser) return;

    const symbol = symbolMap[asset] || 'FX:EURUSD';

    const createWidget = () => {
      if (!containerRef.current || !(window as any).TradingView) return;
      // Clear the container before creating a new widget
      containerRef.current.innerHTML = '';
      new (window as any).TradingView.widget({
        autosize: true,
        symbol: symbol,
        interval: interval,
        timezone: "America/Sao_Paulo",
        theme: "dark",
        style: "1",
        locale: "br",
        toolbar_bg: "#000000",
        enable_publishing: false,
        hide_side_toolbar: true,
        hide_legend: true,
        hide_top_toolbar: true,
        save_image: false,
        container_id: widgetContainerId,
        studies: [
          {
            id: "BB@tv-basicstudies",
            inputs: {
              length: 20,
              "StdDev": 2,
            }
          }
        ],
        disabled_features: [
            "header_widget",
            "left_toolbar",
            "footer_widget",
            "legend_context_menu",
            "edit_buttons_in_legend",
            "context_menus",
            "control_bar",
            "timeframes_toolbar",
            "display_market_status",
            "remove_library_container_border"
        ],
        enabled_features: [],
        overrides: {
            "mainSeriesProperties.showOHLC": false,
            "paneProperties.legendProperties.showStudyArguments": false,
            "paneProperties.legendProperties.showStudyTitles": false,
            "paneProperties.legendProperties.showStudyValues": false,
            "paneProperties.legendProperties.showSeriesTitle": false,
            "paneProperties.legendProperties.showSeriesOHLC": false,
            "paneProperties.legendProperties.showLegend": false,
            "paneProperties.background": "#0a0a0a",
            "paneProperties.vertGridProperties.color": "rgba(42, 46, 57, 0)",
            "paneProperties.horzGridProperties.color": "rgba(42, 46, 57, 0)",
            "scalesProperties.textColor": "#AAA"
        },
        studies_overrides: {
            "Bollinger Bands.Upper.color": "#22c55e",
            "Bollinger Bands.Lower.color": "#FF5252",
            "Bollinger Bands.Basis.color": "#FFFFFF",
            "Bollinger Bands.Upper.linewidth": 1,
            "Bollinger Bands.Lower.linewidth": 1,
            "Bollinger Bands.Background.transparency": 95,
        }
      });
    };

    // Check if the script is already on the page
    if (document.getElementById('tradingview-widget-script')) {
      if ((window as any).TradingView) {
        // If script is loaded and ready, create the widget
        createWidget();
      }
      // If script tag is present but not ready, the 'onload' will handle it.
    } else {
      // If script is not present, create and load it.
      const script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = createWidget;
      document.head.appendChild(script);
    }
    
  }, [asset, interval, widgetContainerId]); // Re-run when asset or the unique ID changes

  return (
    <div id={widgetContainerId} ref={containerRef} className="tradingview-widget-container h-full w-full" />
  );
};

export default TradingViewWidget;