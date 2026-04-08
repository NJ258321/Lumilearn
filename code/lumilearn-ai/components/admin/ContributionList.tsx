/**
 * ContributionList - 众源知识列表
 */

import React from 'react';
import type { KnowledgeContributor } from '../../src/types/admin';
import Card from './Card';
import './ContributionList.css';

interface ContributionListProps {
  contributions: KnowledgeContributor[];
}

const ContributionList: React.FC<ContributionListProps> = ({ contributions }) => {
  // 安全获取数据
  const safeContributions = contributions || [];

  // 获取角色图标
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher': return '👨‍🏫';
      case 'student': return '👨‍🎓';
      case 'external': return '🌐';
      default: return '👤';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'merged': return '#10b981';
      case 'reviewing': return '#d97706';
      default: return '#94a3b8';
    }
  };

  // 获取质量星级
  const getQualityStars = (quality: number) => {
    return '⭐'.repeat(Math.floor(quality));
  };

  // 计算总数
  const totalContributions = safeContributions.reduce((sum, c) => sum + c.contributionCount, 0);

  return (
    <Card title="众源知识汇聚" icon="🌐">
      <div className="contribution-list-content">
        {/* 表头 */}
        <div className="contribution-header">
          <span className="header-source">来源</span>
          <span className="header-count">条数</span>
          <span className="header-quality">质量</span>
          <span className="header-status">状态</span>
        </div>

        {/* 列表项 */}
        <div className="contribution-items">
          {safeContributions.slice(0, 5).map((contrib) => (
            <div key={contrib.id} className="contribution-item">
              <div className="contrib-info">
                <span className="contrib-icon">{getRoleIcon(contrib.role)}</span>
                <span className="contrib-name">{contrib.name}</span>
              </div>
              <span className="contrib-count">{contrib.contributionCount.toLocaleString()}</span>
              <span className="contrib-quality">{getQualityStars(contrib.quality)}</span>
              <span
                className="contrib-status"
                style={{ color: getStatusColor(contrib.status) }}
              >
                {contrib.status === 'merged' ? '已融合' : '审核中'}
              </span>
            </div>
          ))}
        </div>

        {/* 底部统计 */}
        <div className="contribution-footer">
          <span className="total-label">总计</span>
          <span className="total-value">{totalContributions.toLocaleString()}</span>
          <span className="total-label">平均质量</span>
          <span className="total-value">⭐⭐⭐</span>
        </div>

        {/* 最新贡献者 */}
        <div className="latest-contributions">
          <span className="latest-label">最新贡献</span>
          {safeContributions.slice(0, 2).map((contrib) => (
            <div key={contrib.id} className="latest-item">
              <span className="latest-icon">🔶</span>
              <span className="latest-name">{contrib.name}</span>
              <span className="latest-content">- {contrib.latestContribution}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ContributionList;