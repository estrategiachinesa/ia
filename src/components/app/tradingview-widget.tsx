
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
};

// A simple check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ asset }) => {
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
        interval: "1",
        timezone: "America/Sao_Paulo",
        theme: "dark",
        style: "1", // Corrected to '1' for Candlestick charts
        locale: "br",
        enable_publishing: false,
        hide_side_toolbar: true, // Hides the drawing toolbar on the left
        hide_volume: true, // Remove the volume indicator
        allow_symbol_change: false,
        container_id: widgetContainerId,
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
    
  }, [asset, widgetContainerId]); // Re-run when asset or the unique ID changes

  return (
    <div id={widgetContainerId} ref={containerRef} className="tradingview-widget-container h-[400px] w-full" />
  );
};

export default TradingViewWidget;
