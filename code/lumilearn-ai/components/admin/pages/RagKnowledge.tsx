/**
 * RagKnowledge - RAG知识库页
 * 核心特点：检索系统、可视化监控、知识库管理
 */

import React, { useState } from 'react';
import {
  Database, Search, BarChart3, RefreshCw, CheckCircle, AlertTriangle, Clock,
  Gauge, Zap, Activity, GitBranch, FileText, Cpu, Brain
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import AnimatedNumber from '../AnimatedNumber';
import './styles/rag-knowledge.css';

// 存储容量数据 - 科技感仪表盘
const capacityData = [
  { name: '已使用', value: 78, fill: 'url(#capacityGradient)' },
  { name: '剩余', value: 22, fill: '#1e2a3d' },
];

// 知识来源分布 - 环形图
const sourceDistributionData = [
  { name: '课程教材', value: 8234, color: '#3b82f6' },
  { name: '历年真题', value: 2456, color: '#6366f1' },
  { name: '错题本', value: 1234, color: '#06b6d4' },
  { name: '用户贡献', value: 966, color: '#f59e0b' },
];

// 检索性能趋势 - 面积图
const performanceTrendData = [
  { time: '10:00', latency: 45, hits: 92 },
  { time: '10:05', latency: 52, hits: 88 },
  { time: '10:10', latency: 38, hits: 95 },
  { time: '10:15', latency: 65, hits: 85 },
  { time: '10:20', latency: 48, hits: 91 },
  { time: '10:25', latency: 42, hits: 94 },
  { time: '10:30', latency: 55, hits: 89 },
];

// 向量检索各环节耗时
const retrievalStepsData = [
  { name: '语义解析', time: 15, fill: '#3b82f6' },
  { name: '向量匹配', time: 35, fill: '#6366f1' },
  { name: '结果重排', time: 20, fill: '#06b6d4' },
  { name: '返回结果', time: 10, fill: '#10b981' },
];

// 文档类型分布
const docTypeData = [
  { type: 'PDF', count: 5234, fill: '#ef4444' },
  { type: '文本', count: 4123, fill: '#3b82f6' },
  { type: 'Markdown', count: 2341, fill: '#10b981' },
  { type: '图片', count: 1192, fill: '#f59e0b' },
];

// Mock数据 - 统一为数字格式
const mockRagStats = {
  docs: 12890,
  latency: 100,  // 毫秒，显示时加 <100ms
  hitRate: 95,   // 百分比
  vectors: 12.8  // 向量数(K)，直接是小数形式
};

// 知识来源详情
const mockKnowledgeSources = [
  { id: 1, source: '课程教材', count: 8234, quality: 98, lastUpdate: '2026-04-07', status: 'normal', type: 'official' },
  { id: 2, source: '历年真题', count: 2456, quality: 95, lastUpdate: '2026-04-05', status: 'normal', type: 'official' },
  { id: 3, source: '错题本', count: 1234, quality: 88, lastUpdate: '2026-04-07', status: 'normal', type: 'user' },
  { id: 4, source: '用户贡献', count: 966, quality: 72, lastUpdate: '2026-04-06', status: 'warning', type: 'user' },
];

export const RagKnowledge: React.FC = () => {
  const [testQuery, setTestQuery] = useState('');
  const [queryResult, setQueryResult] = useState<{success: boolean; results?: any[]; time?: string} | null>(null);

  const handleTestQuery = () => {
    if (!testQuery.trim()) return;
    // 模拟检索
    setQueryResult({
      success: true,
      results: [
        { title: '相关知识点1', score: 0.95, source: '课程教材' },
        { title: '相关知识点2', score: 0.87, source: '历年真题' },
        { title: '相关知识点3', score: 0.82, source: '错题本' },
      ],
      time: '48ms'
    });
  };

  return (
    <div className="rag-knowledge-page">
      <h1 className="page-title">
        <Brain size={24} />
        RAG 检索系统
        <span className="title-sub">知识库中心</span>
      </h1>

      {/* 核心指标 - 科技感仪表盘 */}
      <div className="core-metrics">
        <div className="metric-card primary">
          <div className="metric-icon"><Database size={28} /></div>
          <div className="metric-content">
            <div className="metric-value">
              <AnimatedNumber value={mockRagStats.docs} />
              <span className="metric-unit">条</span>
            </div>
            <div className="metric-label">知识条目</div>
            <div className="metric-trend up">
              <Zap size={12} /> +234 今日新增
            </div>
          </div>
          <div className="metric-glow"></div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon"><Search size={28} /></div>
          <div className="metric-content">
            <div className="metric-value">
              <AnimatedNumber value={mockRagStats.hitRate} />
              <span className="metric-unit">%</span>
            </div>
            <div className="metric-label">检索命中率</div>
            <div className="metric-trend">
              <Activity size={12} /> 实时监控中
            </div>
          </div>
          <div className="metric-glow"></div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon"><Clock size={28} /></div>
          <div className="metric-content">
            <div className="metric-value">
              &lt;<AnimatedNumber value={mockRagStats.latency} />
              <span className="metric-unit">ms</span>
            </div>
            <div className="metric-label">平均响应</div>
            <div className="metric-trend good">
              <Gauge size={12} /> 性能优良
            </div>
          </div>
          <div className="metric-glow"></div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon"><GitBranch size={28} /></div>
          <div className="metric-content">
            <div className="metric-value">
              <AnimatedNumber value={mockRagStats.vectors} decimals={1} />
              <span className="metric-unit">K</span>
            </div>
            <div className="metric-label">向量维度</div>
            <div className="metric-trend">
              <Cpu size={12} /> 向量引擎
            </div>
          </div>
          <div className="metric-glow"></div>
        </div>
      </div>

      {/* 主内容区域 - 检索测试 + 可视化 */}
      <div className="main-content-grid">
        {/* 左侧 - 检索测试区 */}
        <div className="retrieval-panel">
          <div className="panel-header">
            <h3><Search size={18} /> 检索测试</h3>
            <span className="panel-sub">输入问题测试RAG检索效果</span>
          </div>

          <div className="query-input-section">
            <input
              type="text"
              className="query-input"
              placeholder="输入检索内容，例如：高等数学极限求解..."
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestQuery()}
            />
            <button className="query-btn" onClick={handleTestQuery}>
              <Zap size={16} />
              开始检索
            </button>
          </div>

          {queryResult && (
            <div className="query-result">
              <div className="result-header">
                <span className="result-count">找到 {queryResult.results?.length} 条相关结果</span>
                <span className="result-time">{queryResult.time}</span>
              </div>
              <div className="result-list">
                {queryResult.results?.map((item, idx) => (
                  <div key={idx} className="result-item">
                    <div className="result-rank">{idx + 1}</div>
                    <div className="result-content">
                      <div className="result-title">{item.title}</div>
                      <div className="result-meta">
                        <span className="result-source">{item.source}</span>
                        <span className="result-score">相似度: {(item.score * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="result-score-bar">
                      <div className="score-fill" style={{ width: `${item.score * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 快速测试问题 */}
          <div className="quick-queries">
            <span className="quick-label">快速测试:</span>
            {['什么是导数', '矩阵的秩', '极限求解'].map((q, i) => (
              <button key={i} className="quick-btn" onClick={() => { setTestQuery(q); handleTestQuery(); }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧 - 性能监控 */}
        <div className="performance-panel">
          {/* 检索性能趋势 */}
          <div className="perf-card">
            <div className="perf-header">
              <h4><Activity size={16} /> 检索性能</h4>
              <span className="perf-sub">近30分钟</span>
            </div>
            <div className="perf-chart">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={performanceTrendData}>
                  <defs>
                    <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3d" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: '#0f1419', border: '1px solid #252a33', borderRadius: '6px' }}
                  />
                  <Area type="monotone" dataKey="latency" stroke="#f59e0b" fill="url(#perfGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 检索流程耗时 */}
          <div className="perf-card">
            <div className="perf-header">
              <h4><GitBranch size={16} /> 检索流程耗时</h4>
              <span className="perf-sub">ms</span>
            </div>
            <div className="perf-chart">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={retrievalStepsData} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3d" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={60} />
                  <Tooltip
                    contentStyle={{ background: '#0f1419', border: '1px solid #252a33', borderRadius: '6px' }}
                  />
                  <Bar dataKey="time" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 存储和知识来源 - 紧凑设计 */}
      <div className="info-grid">
        {/* 存储容量 - 简洁数字卡片 */}
        <div className="info-card compact">
          <div className="info-card-header">
            <Gauge size={16} />
            <span>存储容量</span>
          </div>
          <div className="storage-simple">
            <div className="storage-numbers">
              <div className="storage-main">
                <span className="storage-percent">
                  <AnimatedNumber value={capacityData[0].value} />
                  <span className="storage-unit">%</span>
                </span>
                <span className="storage-label">已使用</span>
              </div>
              <div className="storage-bar-simple">
                <div className="bar-fill" style={{ width: `${capacityData[0].value}%` }}></div>
              </div>
            </div>
            <div className="storage-details-grid">
              <div className="detail-cell">
                <span className="detail-icon">📦</span>
                <div className="detail-info">
                  <span className="detail-num">50</span>
                  <span className="detail-unit">GB 总容量</span>
                </div>
              </div>
              <div className="detail-cell">
                <span className="detail-icon">📊</span>
                <div className="detail-info">
                  <span className="detail-num used">39</span>
                  <span className="detail-unit">GB 已用</span>
                </div>
              </div>
              <div className="detail-cell">
                <span className="detail-icon">💚</span>
                <div className="detail-info">
                  <span className="detail-num free">11</span>
                  <span className="detail-unit">GB 剩余</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 知识来源分布 - 紧凑水平卡片 */}
        <div className="info-card compact">
          <div className="info-card-header">
            <Database size={16} />
            <span>知识来源</span>
          </div>
          <div className="source-compact">
            <div className="source-bars">
              {sourceDistributionData.map((item, index) => (
                <div key={index} className="source-bar-item">
                  <div className="source-bar-header">
                    <span className="source-dot" style={{ background: item.color }}></span>
                    <span className="source-name">{item.name}</span>
                    <span className="source-count">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="source-bar-track">
                    <div
                      className="source-bar-fill"
                      style={{
                        width: `${(item.value / 8234) * 100}%`,
                        background: item.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 知识库详情表格 */}
      <div className="source-table-section">
        <div className="section-header">
          <h3><FileText size={18} /> 知识库详情</h3>
        </div>
        <div className="source-table">
          <div className="table-header">
            <div className="col-source">来源</div>
            <div className="col-type">类型</div>
            <div className="col-count">条数</div>
            <div className="col-quality">质量分</div>
            <div className="col-update">最后更新</div>
            <div className="col-status">状态</div>
          </div>
          {mockKnowledgeSources.map((item) => (
            <div key={item.id} className="table-row">
              <div className="col-source">
                <span className="source-name">{item.source}</span>
              </div>
              <div className="col-type">
                <span className={`type-badge ${item.type}`}>{item.type === 'official' ? '官方' : '用户'}</span>
              </div>
              <div className="col-count"><AnimatedNumber value={item.count} /></div>
              <div className="col-quality">
                <div className="quality-bar">
                  <div className="quality-fill" style={{ width: `${item.quality}%`, background: item.quality >= 90 ? '#10b981' : item.quality >= 70 ? '#f59e0b' : '#ef4444' }}></div>
                </div>
                <span className="quality-value">{item.quality}</span>
              </div>
              <div className="col-update">{item.lastUpdate}</div>
              <div className="col-status">
                <span className={`status-badge ${item.status}`}>
                  {item.status === 'normal' ? <><CheckCircle size={12} /> 正常</> : <><AlertTriangle size={12} /> 待审</>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="action-bar">
        <button className="action-btn primary">
          <RefreshCw size={16} />
          重新索引
        </button>
        <button className="action-btn">
          <BarChart3 size={16} />
          效果评估
        </button>
        <button className="action-btn">
          <Database size={16} />
          导出报告
        </button>
      </div>
    </div>
  );
};

export default RagKnowledge;