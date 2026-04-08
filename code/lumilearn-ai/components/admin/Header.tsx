/**
 * Header - 顶部标题栏组件
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { SystemStatus } from '../../src/types/admin';
import './Header.css';

interface HeaderProps {
  system?: SystemStatus;
  lastUpdate?: Date | null;
}

const Header: React.FC<HeaderProps> = ({ system: systemProp, lastUpdate }) => {
  // 使用传入的system或默认值
  const defaultSystem = { onlineUsers: 128, systemHealth: 'normal' as const };
  const system = systemProp || defaultSystem;
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新时间 - 每秒更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 格式化日期时间
  const formatDateTime = () => {
    const year = currentTime.getFullYear();
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const day = String(currentTime.getDate()).padStart(2, '0');
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');

    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[currentTime.getDay()];

    return {
      date: `${year}年${month}月${day} ${weekDay}`,
      time: `${hours}:${minutes}:${seconds}`
    };
  };

  // 格式化更新时间
  const formatLastUpdate = useCallback(() => {
    if (!lastUpdate) return '刚刚';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    return lastUpdate.toLocaleTimeString();
  }, [lastUpdate]);

  const { date, time } = formatDateTime();

  // 获取状态颜色
  const getHealthColor = () => {
    switch (system.systemHealth) {
      case 'normal': return '#10b981';
      case 'warning': return '#d97706';
      case 'error': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <header className="dashboard-header fade-in">
      <div className="header-left">
        <div className="logo-container">
          <span className="logo-icon">🔷</span>
          <h1 className="header-title">AI训练指挥中心</h1>
        </div>
        <span className="header-subtitle">LumiTrace AI Admin</span>
      </div>

      <div className="header-center">
        <div className="datetime-display">
          <span className="date-text">{date}</span>
          <span className="time-text">{time}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="status-item">
          <span className="status-icon">👥</span>
          <span className="status-label">在线用户</span>
          <span className="status-value">{system.onlineUsers}</span>
        </div>
        <div className="status-divider">|</div>
        <div className="status-item">
          <span
            className="health-indicator"
            style={{ backgroundColor: getHealthColor() }}
          />
          <span className="status-label">系统状态</span>
          <span className="status-value" style={{ color: getHealthColor() }}>
            {system.systemHealth === 'normal' ? '正常' : '异常'}
          </span>
        </div>
        <div className="status-divider">|</div>
        <div className="status-item update-time">
          <span className="status-label">更新于</span>
          <span className="status-value small">{formatLastUpdate()}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;