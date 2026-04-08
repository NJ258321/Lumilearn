/**
 * AdminNavBar - 大屏顶部导航栏
 */

import React, { useState } from 'react';
import { Settings, Bell, User } from 'lucide-react';
import './AdminNavBar.css';

interface NavItem {
  key: string;
  label: string;
}

interface AdminNavBarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems: NavItem[] = [
  { key: 'overview', label: '总览' },
  { key: 'users', label: '用户管理' },
  { key: 'model', label: '模型训练' },
  { key: 'rag', label: 'RAG知识库' },
  { key: 'crowd', label: '众源知识' },
];

export const AdminNavBar: React.FC<AdminNavBarProps> = ({
  currentPage,
  onNavigate
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <nav className="admin-navbar">
      {/* 左侧：品牌标识 */}
      <div className="navbar-brand">
        <div className="brand-icon">L</div>
        <span className="brand-text">AI训练指挥中心</span>
      </div>

      {/* 中间：导航菜单 */}
      <div className="navbar-items">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 右侧：操作按钮 */}
      <div className="navbar-actions">
        <button className="action-btn" title="通知">
          <Bell size={20} />
        </button>
        <div className="settings-dropdown">
          <button
            className="action-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="设置"
          >
            <Settings size={20} />
          </button>
          {showSettings && (
            <div className="dropdown-menu">
              <button onClick={() => onNavigate('settings')}>
                <Settings size={16} />
                <span>系统设置</span>
              </button>
              <button onClick={() => onNavigate('theme')}>
                <span>切换主题</span>
              </button>
              <button onClick={() => onNavigate('export')}>
                <span>导出数据</span>
              </button>
            </div>
          )}
        </div>
        <div className="user-info">
          <div className="user-avatar">
            <User size={18} />
          </div>
          <span className="user-name">admin</span>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavBar;
