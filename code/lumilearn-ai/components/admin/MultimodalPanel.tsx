/**
 * MultimodalPanel - 多模态数据面板
 */

import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import type { MultimodalStats } from '../../src/types/admin';
import Card from './Card';
import './MultimodalPanel.css';

interface MultimodalPanelProps {
  multimodal: MultimodalStats;
}

const MultimodalPanel: React.FC<MultimodalPanelProps> = ({ multimodal }) => {
  const safeMultimodal = multimodal || { audioHours: 0, imageCount: 0, noteCount: 0, practiceCount: 0 };
  // 统计数据
  const stats = [
    { label: '音频采集', value: safeMultimodal.audioHours, unit: 'h', color: '#3b82f6', icon: '🎙️' },
    { label: '图片采集', value: safeMultimodal.imageCount, unit: '张', color: '#6366f1', icon: '🖼️' },
    { label: '笔记采集', value: safeMultimodal.noteCount, unit: '条', color: '#06b6d4', icon: '📝' },
    { label: '答题数据', value: safeMultimodal.practiceCount, unit: '次', color: '#f59e0b', icon: '✍️' }
  ];

  // 柱状图数据
  const barData = stats.map(s => ({
    name: s.label.replace('采集', ''),
    value: s.value,
    color: s.color
  }));

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.date}</p>
          <p className="tooltip-value">{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title="多模态学习数据" icon="📊">
      <div className="multimodal-panel">
        {/* 统计卡片 */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-header">
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
              <div className="stat-body">
                <span className="stat-value" style={{ color: stat.color }}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </span>
                <span className="stat-unit">{stat.unit}</span>
              </div>
              {/* 进度条 */}
              <div className="stat-progress">
                <div
                  className="progress-bar"
                  style={{
                    width: `${(stat.value / Math.max(...stats.map(s => s.value))) * 100}%`,
                    backgroundColor: stat.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 趋势图 */}
        <div className="trend-section">
          <span className="section-label">每日学习趋势</span>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={safeMultimodal.dailyTrend}>
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 分布柱状图 */}
        <div className="distribution-section">
          <span className="section-label">数据分布</span>
          <div className="bar-chart-container">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  width={50}
                />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{
                    background: '#1a1f26',
                    border: '1px solid #252a33',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MultimodalPanel;