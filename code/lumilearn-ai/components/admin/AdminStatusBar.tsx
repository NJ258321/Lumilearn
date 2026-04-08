/**
 * AdminStatusBar - 大屏底部状态栏
 */

import React, { useState, useEffect } from 'react';
import { Activity, Users, Server } from 'lucide-react';
import './AdminStatusBar.css';

export const AdminStatusBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <footer className="admin-statusbar">
      <div className="statusbar-left">
        <div className="status-item">
          <Activity size={14} className="status-icon online" />
          <span>系统正常</span>
        </div>
        <div className="status-item">
          <Users size={14} />
          <span>在线用户: 128</span>
        </div>
        <div className="status-item">
          <Server size={14} />
          <span>API: 正常</span>
        </div>
      </div>

      <div className="statusbar-center">
        <span className="system-info">LumiLearn AI 训练指挥中心 v1.0</span>
      </div>

      <div className="statusbar-right">
        <span className="update-time">
          最后更新: {formatTime(currentTime)}
        </span>
      </div>
    </footer>
  );
};

export default AdminStatusBar;
