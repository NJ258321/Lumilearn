/**
 * Card - 管理员大屏基础卡片组件
 */

import React, { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  /** 卡片标题 */
  title?: string;
  /** 标题图标 */
  icon?: string;
  /** 卡片内容 */
  children: ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 是否可悬停 */
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  icon,
  children,
  className = '',
  hoverable = true
}) => {
  return (
    <div className={`admin-card ${hoverable ? 'card-glow' : ''} ${className}`}>
      {title && (
        <div className="card-header">
          {icon && <span className="card-icon">{icon}</span>}
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default Card;