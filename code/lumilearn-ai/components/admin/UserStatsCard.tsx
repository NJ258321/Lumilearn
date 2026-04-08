/**
 * UserStatsCard - 用户统计卡片
 */

import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { UserStats } from '../../src/types/admin';
import Card from './Card';
import AnimatedNumber from './AnimatedNumber';
import './UserStatsCard.css';

interface UserStatsCardProps {
  users: UserStats;
}

const UserStatsCard: React.FC<UserStatsCardProps> = ({ users }) => {
  // 安全获取数据，使用默认值
  const safeUsers = users || { total: 0, active: 0, todayNew: 0, trend: [] };

  // 转换趋势数据
  const trendData = (safeUsers.trend || []).map((value: number, index: number) => ({
    day: index + 1,
    value
  }));

  // 计算活跃率
  const activeRate = safeUsers.total > 0 ? ((safeUsers.active / safeUsers.total) * 100).toFixed(1) : '0';

  return (
    <Card title="用户数据总览" icon="👥">
      <div className="user-stats-content fade-in">
        <div className="stat-row">
          <div className="stat-item main">
            <span className="stat-label">总用户</span>
            <AnimatedNumber
              value={users.total}
              fontSize="24px"
              fontWeight="700"
            />
          </div>
        </div>

        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">活跃用户</span>
            <AnimatedNumber
              value={users.active}
              fontSize="20px"
              fontWeight="600"
            />
            <span className="stat-rate">({activeRate}%)</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">本日新增</span>
            <span className="stat-value positive">+{users.todayNew}</span>
          </div>
        </div>

        <div className="trend-chart fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="trend-label">7日活跃趋势</span>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UserStatsCard;