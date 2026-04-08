/**
 * 权限保护组件 - 确保只有管理员可访问
 */

import React from 'react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

/**
 * 管理员路由保护组件
 * - 检查用户是否已登录
 * - 检查用户角色是否为管理员
 * - 不满足条件则显示无权限提示
 */
export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  // 从localStorage获取用户信息
  const token = localStorage.getItem('lumilearn_token');
  const userStr = localStorage.getItem('lumilearn_user');

  // 未登录
  if (!token) {
    // 可以选择重定向到登录页或首页
    // 这里我们选择显示无权限提示，而不是重定向
    console.warn('[AdminRoute] 用户未登录，拒绝访问管理员大屏');
    return <AdminAccessDenied reason="未登录" />;
  }

  // 检查用户角色
  let userRole = 'USER';
  try {
    const user = userStr ? JSON.parse(userStr) : null;
    userRole = user?.role || 'USER';
  } catch {
    console.warn('[AdminRoute] 无法解析用户信息');
  }

  // 非管理员
  if (userRole !== 'ADMIN') {
    console.warn('[AdminRoute] 用户角色非管理员，拒绝访问:', userRole);
    return <AdminAccessDenied reason="无管理员权限" />;
  }

  // 管理员，放行
  return <>{children}</>;
};

/**
 * 访问被拒绝时显示的组件
 */
interface AdminAccessDeniedProps {
  reason: string;
}

const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({ reason }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0e17',
      color: '#f1f5f9',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: '#1a1f26',
        borderRadius: '12px',
        border: '1px solid #252a33'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ marginBottom: '10px', color: '#ef4444' }}>访问被拒绝</h2>
        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
          原因: {reason}
        </p>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          只有管理员角色才能访问AI训练指挥中心
        </p>
      </div>
    </div>
  );
};

export default ProtectedAdminRoute;