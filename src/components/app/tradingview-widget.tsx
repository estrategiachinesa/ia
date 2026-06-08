
'use client';

import React, { useEffect, useRef } from 'react';

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

const isBrowser = typeof window !== 'undefined';

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ asset, interval }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetContainerId = `tradingview_widget_${React.useId().replace(/:/g, '')}`;

  useEffect(() => {
    if (!isBrowser) return;

    const symbol = symbolMap[asset] || 'FX:EURUSD';

    const createWidget = () => {
      if (!containerRef.current || !(window as any).TradingView) return;
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
            "remove_library_container_border",
            "create_volume_indicator_by_default",
            "show_legend",
            "study_buttons_in_legend",
            "pane_context_menu",
            "volume_force_overlay"
        ],
        enabled_features: ["side_toolbar_in_fullscreen_mode"],
        overrides: {
            "mainSeriesProperties.showOHLC": false,
            "paneProperties.legendProperties.showStudyArguments": false,
            "paneProperties.legendProperties.showStudyTitles": false,
            "paneProperties.legendProperties.showStudyValues": false,
            "paneProperties.background": "#020202",
            "paneProperties.vertGridProperties.color": "rgba(255, 0, 0, 0.02)",
            "paneProperties.horzGridProperties.color": "rgba(255, 0, 0, 0.02)",
            "scalesProperties.textColor": "#FFFFFF",
            "mainSeriesProperties.candleStyle.drawBorder": true,
            "mainSeriesProperties.candleStyle.borderUpColor": "#22C55E",
            "mainSeriesProperties.candleStyle.borderDownColor": "#FF0000",
            "mainSeriesProperties.candleStyle.upColor": "#22C55E",
            "mainSeriesProperties.candleStyle.downColor": "#FF0000",
            "mainSeriesProperties.candleStyle.wickUpColor": "#22C55E",
            "mainSeriesProperties.candleStyle.wickDownColor": "#FF0000",
            "mainSeriesProperties.showPriceLine": true,
        },
        studies_overrides: {
            "Bollinger Bands.Upper.color": "#FF0000", // Superior Vermelha
            "Bollinger Bands.Lower.color": "#22C55E", // Inferior Verde
            "Bollinger Bands.Basis.color": "#FFFFFF", // Central Branca
            "Bollinger Bands.Upper.linewidth": 2,
            "Bollinger Bands.Lower.linewidth": 2,
            "Bollinger Bands.Background.transparency": 95,
        }
      });
    };

    if (document.getElementById('tradingview-widget-script')) {
      if ((window as any).TradingView) {
        createWidget();
      }
    } else {
      const script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = createWidget;
      document.head.appendChild(script);
    }
    
  }, [asset, interval, widgetContainerId]);

  return (
    <div 
        id={widgetContainerId} 
        ref={containerRef} 
        className="tradingview-widget-container" 
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
    />
  );
};

export default TradingViewWidget;
