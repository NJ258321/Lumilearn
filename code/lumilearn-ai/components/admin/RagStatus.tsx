/**
 * RagStatus - RAG知识库状态
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { RagStatus as RagStatusType } from '../../src/types/admin';
import Card from './Card';
import AnimatedNumber from './AnimatedNumber';
import './RagStatus.css';

interface RagStatusProps {
  rag: RagStatusType;
}

const RagStatus: React.FC<RagStatusProps> = ({ rag }) => {
  // 安全获取数据
  const safeRag = rag || { totalEntries: 0, dimension: 0, indexType: '', lastUpdate: '', sources: [] };

  // 获取来源颜色
  function getSourceColor(name: string) {
    const colors: Record<string, string> = {
      '教材': '#3b82f6',
      '真题': '#6366f1',
      '笔记': '#06b6d4',
      '用户贡献': '#f59e0b'
    };
    return colors[name] || '#94a3b8';
  }

  // 饼图数据
  const pieData = (safeRag.sources || []).map((source) => ({
    name: source.name,
    value: source.count,
    color: getSourceColor(source.name)
  }));

  return (
    <Card title="RAG知识库状态" icon="📚">
      <div className="rag-status-content fade-in">
        {/* 主要统计 */}
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">知识条目</span>
            <AnimatedNumber
              value={safeRag.totalEntries}
              fontSize="16px"
              fontWeight="600"
            />
          </div>
          <div className="stat-item">
            <span className="stat-label">向量维度</span>
            <AnimatedNumber
              value={safeRag.dimension}
              fontSize="16px"
              fontWeight="600"
            />
          </div>
          <div className="stat-item">
            <span className="stat-label">索引类型</span>
            <span className="stat-value">{safeRag.indexType}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">最近更新</span>
            <span className="stat-value small">{safeRag.lastUpdate}</span>
          </div>
        </div>

        {/* 来源分布 */}
        <div className="source-distribution fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="source-label">知识来源分布</span>
          <div className="source-chart">
            <div className="pie-container">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="source-legend">
              {safeRag.sources.map((source) => (
                <div key={source.name} className="legend-item">
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: getSourceColor(source.name) }}
                  />
                  <span className="legend-name">{source.name}</span>
                  <span className="legend-percent">{source.ratio}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RagStatus;