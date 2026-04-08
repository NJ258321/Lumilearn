/**
 * 管理员大屏独立入口
 * 只渲染大屏页面，与移动端完全独立
 * 使用新的导航栏架构
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminLayout } from './components/admin/AdminLayout';
import { Overview, UserManagement, ModelTraining, RagKnowledge, CrowdKnowledge } from './components/admin/pages';
import './index.css';

// 模拟管理员登录状态（用于开发测试）
const mockAdminUser = {
  id: '1',
  username: 'admin',
  role: 'ADMIN',
  email: 'admin@example.com'
};

// 设置模拟的管理员 token 和用户信息
localStorage.setItem('lumilearn_token', 'mock-admin-token-12345');
localStorage.setItem('lumilearn_user', JSON.stringify(mockAdminUser));

// 页面组件映射
const pageComponents = {
  overview: Overview,
  users: UserManagement,
  model: ModelTraining,
  rag: RagKnowledge,
  crowd: CrowdKnowledge,
};

type PageKey = keyof typeof pageComponents;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageKey>('overview');

  const handleNavigate = (page: string) => {
    if (page in pageComponents) {
      setCurrentPage(page as PageKey);
    }
  };

  const CurrentPageComponent = pageComponents[currentPage];

  return (
    <AdminLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
    >
      <CurrentPageComponent />
    </AdminLayout>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
