/**
 * CrowdKnowledge - 众源知识页
 * 包含丰富的可视化：贡献排行榜、质量分布饼图、审核进度流程
 */

import React, { useState } from 'react';
import {
  Users, CheckCircle, Clock, FileText, Settings, Download, Award, Star, Check, X, Hourglass
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ProgressBar
} from 'recharts';
import AnimatedNumber from '../AnimatedNumber';
import './styles/crowd-knowledge.css';

// 质量分布数据
const qualityDistributionData = [
  { name: '优秀', value: 320, color: '#10b981' },
  { name: '良好', value: 280, color: '#3b82f6' },
  { name: '一般', value: 180, color: '#f59e0b' },
  { name: '较差', value: 66, color: '#ef4444' },
];

// 来源类型分布数据
const sourceTypeData = [
  { name: '学生贡献', value: 420, color: '#6366f1' },
  { name: '教师贡献', value: 280, color: '#06b6d4' },
  { name: '外部导入', value: 166, color: '#f59e0b' },
  { name: '系统生成', value: 100, color: '#94a3b8' },
];

// 贡献者排行榜数据
const contributorRankData = [
  { name: '张三', contributions: 156, quality: 92 },
  { name: '李四', contributions: 142, quality: 88 },
  { name: '王五', contributions: 128, quality: 85 },
  { name: '赵六', contributions: 95, quality: 78 },
  { name: '钱七', contributions: 82, quality: 72 },
];

// Mock数据
const mockCrowdStats = {
  total: 966,
  pending: 45,
  merged: 823
};

const mockContributions = [
  { id: 1, knowledge: '导数定义', source: '用户A', user: '张三', updateTime: '2026-04', status: 'merged' },
  { id: 2, knowledge: '导数计算', source: '用户B', user: '李四', updateTime: '2026-04', status: 'pending' },
  { id: 3, knowledge: '泰勒公式', source: '教材', user: '系统', updateTime: '2026-01', status: 'merged' },
  { id: 4, knowledge: '积分技巧', source: '用户C', user: '王五', updateTime: '2026-04', status: 'pending' },
  { id: 5, knowledge: '微分方程', source: '用户D', user: '赵六', updateTime: '2026-03', status: 'merged' },
];

// 审核进度步骤
const reviewSteps = [
  { key: 'submitted', label: '已提交', count: 45, icon: Hourglass },
  { key: 'reviewing', label: '审核中', count: 12, icon: Clock },
  { key: 'approved', label: '已批准', count: 28, icon: CheckCircle },
  { key: 'rejected', label: '已拒绝', count: 5, icon: X },
];

export const CrowdKnowledge: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'merged'>('all');

  const filteredData = filter === 'all'
    ? mockContributions
    : mockContributions.filter(c => c.status === filter);

  return (
    <div className="crowd-knowledge-page">
      <h1 className="page-title">众源知识</h1>

      {/* 顶部统计卡片 */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-content">
            <div className="stat-value"><AnimatedNumber value={mockCrowdStats.total} /></div>
            <div className="stat-label">总贡献</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-content">
            <div className="stat-value"><AnimatedNumber value={mockCrowdStats.pending} /></div>
            <div className="stat-label">待审核</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon"><CheckCircle size={24} /></div>
          <div className="stat-content">
            <div className="stat-value"><AnimatedNumber value={mockCrowdStats.merged} /></div>
            <div className="stat-label">已融合</div>
          </div>
        </div>
      </div>

      {/* 可视化图表区域 */}
      <div className="visualization-row">
        {/* 审核进度流程图 */}
        <div className="viz-card review-progress-card">
          <div className="viz-header">
            <h3><CheckCircle size={18} /> 审核进度</h3>
          </div>
          <div className="review-steps">
            {reviewSteps.map((step, index) => (
              <div key={step.key} className="review-step">
                <div className="step-icon" style={{
                  background: index === 1 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: index === 1 ? '#3b82f6' : '#10b981'
                }}>
                  <step.icon size={16} />
                </div>
                <div className="step-info">
                  <span className="step-label">{step.label}</span>
                  <span className="step-count">{step.count}</span>
                </div>
                {index < reviewSteps.length - 1 && (
                  <div className="step-connector"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 质量分布饼图 */}
        <div className="viz-card quality-dist-card">
          <div className="viz-header">
            <h3><Star size={18} /> 知识质量分布</h3>
          </div>
          <div className="viz-content">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={qualityDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {qualityDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1f26', border: '1px solid #252a33', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="quality-legend">
              {qualityDistributionData.map((item) => (
                <div key={item.name} className="legend-item">
                  <span className="legend-dot" style={{ background: item.color }}></span>
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 来源类型分布 */}
        <div className="viz-card source-type-card">
          <div className="viz-header">
            <h3><Users size={18} /> 来源类型</h3>
          </div>
          <div className="viz-content">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sourceTypeData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252a33" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={60} />
                <Tooltip
                  contentStyle={{ background: '#1a1f26', border: '1px solid #252a33', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 贡献者排行榜 */}
        <div className="viz-card contributor-rank-card">
          <div className="viz-header">
            <h3><Award size={18} /> 贡献者排行</h3>
            <span className="viz-subtitle">TOP 5</span>
          </div>
          <div className="contributor-list">
            {contributorRankData.map((contributor, index) => (
              <div key={contributor.name} className="contributor-item">
                <div className="contributor-rank">
                  {index < 3 ? <Star size={14} className="rank-star" /> : <span>{index + 1}</span>}
                </div>
                <div className="contributor-info">
                  <span className="contributor-name">{contributor.name}</span>
                  <div className="contributor-stats">
                    <span className="stat贡献">{contributor.contributions}条</span>
                    <span className="stat-quality" style={{ color: contributor.quality >= 80 ? '#10b981' : '#f59e0b' }}>
                      质量{contributor.quality}%
                    </span>
                  </div>
                </div>
                <div className="contributor-bar">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(contributor.contributions / contributorRankData[0].contributions) * 100}%`,
                      background: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : '#3b82f6'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 贡献列表 */}
      <div className="contribution-section">
        <div className="section-header">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              全部
            </button>
            <button
              className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              待审核
            </button>
            <button
              className={`filter-tab ${filter === 'merged' ? 'active' : ''}`}
              onClick={() => setFilter('merged')}
            >
              已融合
            </button>
          </div>
          <div className="header-actions">
            <button className="action-btn">
              <Settings size={16} />
              融合规则设置
            </button>
            <button className="action-btn">
              <Download size={16} />
              导出知识库
            </button>
          </div>
        </div>

        <div className="contribution-table">
          <div className="table-header">
            <div className="col-knowledge">知识点</div>
            <div className="col-source">来源</div>
            <div className="col-user">贡献者</div>
            <div className="col-time">更新时间</div>
            <div className="col-status">状态</div>
          </div>
          {filteredData.map((item) => (
            <div key={item.id} className="table-row">
              <div className="col-knowledge">
                <FileText size={14} className="icon" />
                {item.knowledge}
              </div>
              <div className="col-source">{item.source}</div>
              <div className="col-user">{item.user}</div>
              <div className="col-time">{item.updateTime}</div>
              <div className="col-status">
                <span className={`status-badge ${item.status}`}>
                  {item.status === 'merged' && <CheckCircle size={12} />}
                  {item.status === 'pending' && <Clock size={12} />}
                  {item.status === 'merged' ? '已融合' : '审核中'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CrowdKnowledge;
