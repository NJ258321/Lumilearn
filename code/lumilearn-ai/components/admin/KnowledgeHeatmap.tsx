/**
 * KnowledgeHeatmap - 知识点热力图
 */

import React from 'react';
import type { KnowledgeStats } from '../../src/types/admin';
import Card from './Card';
import AnimatedNumber from './AnimatedNumber';
import './KnowledgeHeatmap.css';

interface KnowledgeHeatmapProps {
  knowledge: KnowledgeStats;
}

const KnowledgeHeatmap: React.FC<KnowledgeHeatmapProps> = ({ knowledge }) => {
  // 安全获取数据
  const safeKnowledge = knowledge || { totalNodes: 0, totalEdges: 0, mastered: 0, weak: 0, needReview: 0, todayNew: 0 };

  // 计算百分比
  const total = safeKnowledge.totalNodes || 1;
  const masteredPercent = ((safeKnowledge.mastered / total) * 100).toFixed(0);
  const weakPercent = ((safeKnowledge.weak / total) * 100).toFixed(0);
  const needReviewPercent = ((safeKnowledge.needReview / total) * 100).toFixed(0);

  return (
    <Card title="知识点分布" icon="🎯">
      <div className="knowledge-heatmap-content fade-in" style={{ animationDelay: '0.1s' }}>
        {/* 分布条 */}
        <div className="distribution-bar">
          <div
            className="bar-segment mastered"
            style={{ width: `${masteredPercent}%` }}
          />
          <div
            className="bar-segment weak"
            style={{ width: `${weakPercent}%` }}
          />
          <div
            className="bar-segment need-review"
            style={{ width: `${needReviewPercent}%` }}
          />
        </div>

        {/* 图例 */}
        <div className="heatmap-legend">
          <div className="legend-item">
            <span className="legend-dot mastered"></span>
            <span className="legend-label">已掌握</span>
            <AnimatedNumber
              value={knowledge.mastered}
              fontSize="14px"
              fontWeight="600"
              suffix=""
            />
            <span className="legend-percent">({masteredPercent}%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot weak"></span>
            <span className="legend-label">薄弱</span>
            <AnimatedNumber
              value={knowledge.weak}
              fontSize="14px"
              fontWeight="600"
              suffix=""
            />
            <span className="legend-percent">({weakPercent}%)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot need-review"></span>
            <span className="legend-label">待复习</span>
            <AnimatedNumber
              value={knowledge.needReview}
              fontSize="14px"
              fontWeight="600"
              suffix=""
            />
            <span className="legend-percent">({needReviewPercent}%)</span>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="heatmap-stats fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="stat-item">
            <span className="stat-label">总知识点</span>
            <AnimatedNumber
              value={knowledge.totalNodes}
              fontSize="18px"
              fontWeight="700"
            />
          </div>
          <div className="stat-item">
            <span className="stat-label">今日更新</span>
            <AnimatedNumber
              value={knowledge.todayNew}
              fontSize="18px"
              fontWeight="700"
              color="#10b981"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default KnowledgeHeatmap;