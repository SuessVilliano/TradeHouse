import { useEffect, useRef } from 'react';

interface ChartEmbedProps { symbol?: string; interval?: string; theme?: 'dark' | 'light'; height?: number; }
declare global { interface Window { TradingView?: { widget: new (config: object) => void }; } }

export default function ChartEmbed({ symbol = 'NASDAQ:AAPL', interval = 'D', theme = 'dark', height = 400 }: ChartEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const containerId = `tradingview-${Date.now()}`;
    if (containerRef.current) containerRef.current.id = containerId;
    const loadChart = () => {
      if (!containerRef.current || !window.TradingView) return;
      new window.TradingView.widget({ autosize: true, symbol, interval, timezone: 'Etc/UTC', theme, style: '1', locale: 'en', toolbar_bg: '#111118', enable_publishing: false, hide_top_toolbar: false, save_image: false, container_id: containerId, backgroundColor: '#0d0d14', gridColor: 'rgba(30, 30, 46, 1)' });
    };
    if (window.TradingView) { loadChart(); } else {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js'; script.async = true; script.onload = loadChart;
      document.head.appendChild(script);
    }
    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [symbol, interval, theme]);
  return <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-th-border" style={{ height }} />;
}
