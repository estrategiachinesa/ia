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
        enable_publishing: false,
        hide_side_toolbar: true,
        hide_volume: true,
        allow_symbol_change: false,
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
        overrides: {
            "mainSeriesProperties.showOHLC": false,
            "paneProperties.legendProperties.showStudyArguments": false,
            "paneProperties.legendProperties.showStudyTitles": false,
            "paneProperties.legendProperties.showStudyValues": false,
        },
        studies_overrides: {
            "Bollinger Bands.Upper.color": "#22c55e",
            "Bollinger Bands.Lower.color": "#FF5252",
            "Bollinger Bands.Basis.color": "#FFFFFF",
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
    <div id={widgetContainerId} ref={containerRef} className="tradingview-widget-container h-[400px] w-full" />
  );
};

export default TradingViewWidget;
