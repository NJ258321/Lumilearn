/**
 * DataTicker - 底部数据滚动条
 */

import React, { useState, useEffect, useRef } from 'react';
import type { TickerItem } from '../../src/types/admin';
import './DataTicker.css';

interface DataTickerProps {
  ticker: TickerItem[];
}

const DataTicker: React.FC<DataTickerProps> = ({ ticker }) => {
  const [position, setPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // 滚动动画
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setPosition((prev) => prev - 1);
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused]);

  // 重置位置实现无限滚动
  useEffect(() => {
    if (containerRef.current) {
      const contentWidth = containerRef.current.scrollWidth / 2;
      if (Math.abs(position) >= contentWidth) {
        setPosition(0);
      }
    }
  }, [position]);

  // 复制数据实现无缝滚动
  const duplicatedTicker = [...ticker, ...ticker];

  const formatValue = (value: string | number, unit?: string) => {
    if (typeof value === 'number') {
      return value.toLocaleString() + (unit || '');
    }
    return value + (unit || '');
  };

  // 暂停/继续滚动
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div
      className="data-ticker"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="ticker-label">
        <span className="ticker-icon">📈</span>
        <span>关键指标</span>
      </div>
      <div className="ticker-container">
        <div
          className="ticker-content"
          ref={containerRef}
          style={{ transform: `translateX(${position}px)` }}
        >
          {duplicatedTicker.map((item, index) => (
            <div key={index} className="ticker-item">
              <span className="ticker-label-text">{item.label}</span>
              <span className="ticker-value">{formatValue(item.value, item.unit)}</span>
              <span className="ticker-divider">|</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ticker-status" onClick={togglePause} style={{ cursor: 'pointer' }}>
        <span className="ticker-play">{isPaused ? '⏸️' : '▶️'}</span>
        <span className="ticker-status-text">{isPaused ? '已暂停' : '滚动中'}</span>
      </div>
    </div>
  );
};

export default DataTicker;