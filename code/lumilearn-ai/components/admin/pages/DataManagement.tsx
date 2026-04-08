/**
 * DataManagement - 数据管理页
 * 包含丰富的可视化图表：环形图、柱状图、折线图、雷达图
 */

import React, { useState } from 'react';
import {
  BookOpen, FileText, AlertCircle, TrendingUp, CheckCircle, XCircle, HelpCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import AnimatedNumber from '../AnimatedNumber';
import './styles/data-management.css';

// 课程完成率环形图数据
const courseCompletionData = [
  { name: '已完成', value: 15, color: '#10b981' },
  { name: '进行中', value: 23, color: '#3b82f6' },
  { name: '未开始', value: 7, color: '#252a33' },
];

// 题目难度分布柱状图数据
const difficultyData = [
  { name: '简单', count: 4500, rate: 35 },
  { name: '中等', count: 5200, rate: 40 },
  { name: '困难', count: 3190, rate: 25 },
];

// 错题率趋势折线图数据
const errorTrendData = [
  { date: '04-01', rate: 14 },
  { date: '04-02', rate: 12 },
  { date: '04-03', rate: 15 },
  { date: '04-04', rate: 11 },
  { date: '04-05', rate: 13 },
  { date: '04-06', rate: 10 },
  { date: '04-07', rate: 12 },
];

// 知识点掌握度雷达图数据
const knowledgeMasteryData = [
  { subject: '极限', value: 85, fullMark: 100 },
  { subject: '导数', value: 72, fullMark: 100 },
  { subject: '积分', value: 68, fullMark: 100 },
  { subject: '级数', value: 55, fullMark: 100 },
  { subject: '微分', value: 80, fullMark: 100 },
  { subject: '方程', value: 65, fullMark: 100 },
];

type DataTab = 'courses' | 'questions' | 'mistakes';

export const DataManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DataTab>('courses');

  return (
    <div className="data-management-page">
      <h1 className="page-title">数据管理</h1>

      {/* 顶部统计卡片 */}
      <div className="stats-row">
        <div className="stat-card clickable" onClick={() => setActiveTab('courses')}>
          <div className="stat-icon"><BookOpen size={18} /></div>
          <div className="stat-content">
            <div className="stat-value"><AnimatedNumber value={45} /></div>
            <div className="stat-label">课程总数</div>
            <div className="stat-sub">
              <span>进行中: 23</span>
              <span>已完成: 15</span>
            </div>
          </div>
        </div>
        <div className="stat-card clickable" onClick={() => setActiveTab('questions')}>
          <div className="stat-icon"><FileText size={18} /></div>
          <div className="stat-content">
            <div className="stat-value"><AnimatedNumber value={12890} /></div>
            <div className="stat-label">题目总数</div>
            <div className="stat-sub">
              <span>使用率: 69%</span>
            </div>
          </div>
        </div>
        <div className="stat-card clickable warning" onClick={() => setActiveTab('mistakes')}>
          <div className="stat-icon warning"><AlertCircle size={18} /></div>
          <div className="stat-content">
            <div className="stat-value"><AnimatedNumber value={3256} /></div>
            <div className="stat-label">错题汇总</div>
            <div className="stat-sub">
              <span>今日新增: 45</span>
              <span>错误率: 12%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 可视化图表区域 */}
      <div className="visualization-row">
        {/* 课程完成率环形图 */}
        <div className="viz-card completion-card">
          <div className="viz-header">
            <h3><CheckCircle size={18} /> 课程完成率</h3>
          </div>
          <div className="viz-content">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={courseCompletionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {courseCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1f26', border: '1px solid #252a33', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="donut-value">33%</span>
              <span className="donut-label">完成率</span>
            </div>
          </div>
          <div className="viz-legend">
            {courseCompletionData.map((item) => (
              <div key={item.name} className="legend-item">
                <span className="legend-dot" style={{ background: item.color }}></span>
                <span className="legend-name">{item.name}</span>
                <span className="legend-value">{item.value}门</span>
              </div>
            ))}
          </div>
        </div>

        {/* 题目难度分布 */}
        <div className="viz-card difficulty-card">
          <div className="viz-header">
            <h3><HelpCircle size={18} /> 题目难度分布</h3>
          </div>
          <div className="viz-content">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={difficultyData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252a33" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#1a1f26', border: '1px solid #252a33', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 错题率趋势 */}
        <div className="viz-card trend-card">
          <div className="viz-header">
            <h3><TrendingUp size={18} /> 错题率趋势</h3>
            <span className="viz-subtitle">近7日错题率变化</span>
          </div>
          <div className="viz-content">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={errorTrendData}>
                <defs>
                  <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#252a33" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1a1f26', border: '1px solid #252a33', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, '错题率']}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#errorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 知识点掌握度雷达图 */}
        <div className="viz-card mastery-card">
          <div className="viz-header">
            <h3><BookOpen size={18} /> 知识点掌握度</h3>
          </div>
          <div className="viz-content radar-content">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={difficultyData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252a33" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={40} />
                <Tooltip
                  contentStyle={{ background: '#1a1f26', border: '1px solid #252a33', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, '占比']}
                />
                <Bar dataKey="rate" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 数据详情 */}
      <div className="data-detail-section">
        <div className="section-header">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              课程数据
            </button>
            <button
              className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              题目数据
            </button>
            <button
              className={`tab ${activeTab === 'mistakes' ? 'active' : ''}`}
              onClick={() => setActiveTab('mistakes')}
            >
              错题数据
            </button>
          </div>
          <button className="export-btn">
            <TrendingUp size={16} />
            导出数据
          </button>
        </div>

        <div className="detail-content">
          {activeTab === 'courses' && (
            <div className="detail-table">
              <div className="table-header">
                <div className="col-name">课程名称</div>
                <div className="col-type">类型</div>
                <div className="col-count">题目数</div>
                <div className="col-students">学习人数</div>
                <div className="col-status">状态</div>
              </div>
              {[
                { name: '高等数学', type: '专业课', count: 450, students: 320, status: '进行中' },
                { name: '大学物理', type: '专业课', count: 380, students: 256, status: '进行中' },
                { name: '线性代数', type: '专业课', count: 290, students: 189, status: '已完成' },
                { name: '概率论', type: '专业课', count: 310, students: 145, status: '进行中' },
              ].map((course, i) => (
                <div key={i} className="table-row">
                  <div className="col-name">{course.name}</div>
                  <div className="col-type">{course.type}</div>
                  <div className="col-count">{course.count}</div>
                  <div className="col-students">{course.students}</div>
                  <div className="col-status">
                    <span className={`status-badge ${course.status}`}>{course.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="detail-table">
              <div className="table-header">
                <div className="col-name">题目内容(摘要)</div>
                <div className="col-type">类型</div>
                <div className="col-count">难度</div>
                <div className="col-students">作答次数</div>
                <div className="col-status">正确率</div>
              </div>
              {[
                { name: '求函数极限', type: '计算题', difficulty: '中等', count: 890, rate: '75%' },
                { name: '求矩阵秩', type: '证明题', difficulty: '困难', count: 456, rate: '45%' },
                { name: '求导数', type: '计算题', difficulty: '简单', count: 1230, rate: '88%' },
              ].map((q, i) => (
                <div key={i} className="table-row">
                  <div className="col-name">{q.name}</div>
                  <div className="col-type">{q.type}</div>
                  <div className="col-count">{q.difficulty}</div>
                  <div className="col-students">{q.count}</div>
                  <div className="col-status">{q.rate}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'mistakes' && (
            <div className="detail-table">
              <div className="table-header">
                <div className="col-name">错题内容</div>
                <div className="col-type">课程</div>
                <div className="col-count">错误次数</div>
                <div className="col-students">涉及用户</div>
                <div className="col-status">最近错误</div>
              </div>
              {[
                { name: '泰勒公式应用', course: '高等数学', count: 89, users: 45, time: '今天' },
                { name: '行列式计算', course: '线性代数', count: 67, users: 32, time: '昨天' },
                { name: '动量守恒定律', course: '大学物理', count: 54, users: 28, time: '2天前' },
              ].map((m, i) => (
                <div key={i} className="table-row">
                  <div className="col-name">{m.name}</div>
                  <div className="col-type">{m.course}</div>
                  <div className="col-count">{m.count}</div>
                  <div className="col-students">{m.users}</div>
                  <div className="col-status">{m.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
