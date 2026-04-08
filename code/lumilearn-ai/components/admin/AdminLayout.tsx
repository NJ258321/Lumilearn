/**
 * AdminLayout - 大屏整体布局组件
 * 包含顶部导航栏、主体内容区、底部状态栏
 */

import React from 'react';
import { AdminNavBar } from './AdminNavBar';
import { AdminStatusBar } from './AdminStatusBar';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

/**
 * 大屏整体布局
 * - 顶部导航栏 (64px)
 * - 主内容区域 (可滚动)
 * - 底部状态栏 (40px)
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentPage,
  onNavigate
}) => {
  return (
    <div className="admin-layout">
      <AdminNavBar
        currentPage={currentPage}
        onNavigate={onNavigate}
      />
      <main className="admin-main">
        <div className="admin-content">
          {children}
        </div>
      </main>
      <AdminStatusBar />
    </div>
  );
};

export default AdminLayout;
