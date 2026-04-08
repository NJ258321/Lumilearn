/**
 * ModelTraining - 模型训练页
 * 包含丰富的可视化：进度圆环、性能图表、资源监控仪表盘
 */

import React from 'react';
import {
  Cpu, Play, Pause, Eye, CheckCircle, Clock, AlertTriangle, Gauge, Activity, Zap, TrendingUp
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import AnimatedNumber from '../AnimatedNumber';
import './styles/model-training.css';

// 训练进度圆环数据
const trainingProgressData = [
  { name: '数学模型v3', value: 45, fill: '#3b82f6' },
];

// 资源使用率数据
const resourceData = [
  { name: 'CPU', value: 78, fill: '#10b981' },
  { name: 'GPU', value: 92, fill: '#6366f1' },
  { name: '内存', value: 65, fill: '#f59e0b' },
  { name: '显存', value: 88, fill: '#06b6d4' },
];

// 模型性能雷达图数据
const modelPerformanceData = [
  { metric: '准确率', value: 92, fullMark: 100 },
  { metric: '召回率', value: 88, fullMark: 100 },
  { metric: 'F1分数', value: 90, fullMark: 100 },
  { metric: '推理速度', value: 85, fullMark: 100 },
  { metric: '稳定性', value: 95, fullMark: 100 },
  { metric: '泛化能力', value: 87, fullMark: 100 },
];

// 训练历史折线图数据
const trainingHistoryData = [
  { epoch: 'Epoch 1', loss: 0.85, accuracy: 65 },
  { epoch: 'Epoch 2', loss: 0.62, accuracy: 72 },
  { epoch: 'Epoch 3', loss: 0.48, accuracy: 78 },
  { epoch: 'Epoch 4', loss: 0.35, accuracy: 83 },
  { epoch: 'Epoch 5', loss: 0.28, accuracy: 87 },
  { epoch: 'Epoch 6', loss: 0.22, accuracy: 90 },
  { epoch: 'Epoch 7', loss: 0.18, accuracy: 92 },
];

// Mock数据
const mockTrainingTasks = [
  { id: 1, name: '数学模型v3', course: '高等数学', progress: 45, status: 'running', startTime: '2026-04-07 10:00' },
  { id: 2, name: '物理模型v2', course: '大学物理', progress: 100, status: 'completed', startTime: '2026-04-06 15:30' },
  { id: 3, name: '英语模型v1', course: '大学英语', progress: 0, status: 'queued', startTime: '等待中' },
];

const mockModelVersions = [
  { id: 1, version: 'v3.0', status: 'running', accuracy: 92, deployTime: '2026-04-07' },
  { id: 2, version: 'v2.0', status: 'deployed', accuracy: 88, deployTime: '2026-03-15' },
  { id: 3, version: 'v1.0', status: 'archived', accuracy: 85, deployTime: '2026-01-01' },
];

// 资源监控卡片组件
const ResourceGauge: React.FC<{ name: string; value: number; icon: React.ReactNode; color: string }> = ({
  name, value, icon, color
}) => (
  <div className="gauge-card">
    <div className="gauge-icon" style={{ color }}>{icon}</div>
    <div className="gauge-info">
      <span className="gauge-name">{name}</span>
      <span className="gauge-value">{value}%</span>
    </div>
    <div className="gauge-bar">
      <div className="gauge-fill" style={{ width: `${value}%`, background: color }}></div>
    </div>
  </div>
);

export const ModelTraining: React.FC = () => {
  return (
    <div className="model-training-page">
      <h1 className="page-title">模型训练</h1>

      {/* 顶部：进度圆环 + 资源监控 */}
      <div className="top-section">
        {/* 当前训练进度圆环 */}
        <div className="progress-ring-card">
          <div className="card-header">
            <h2><Activity size={20} /> 当前训练进度</h2>
            <span className="task-name">数学模型v3 - 高等数学</span>
          </div>
          <div className="ring-container">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={12} data={trainingProgressData} startAngle={180} endAngle={0}>
                <RadialBar minAngle={15} background={{ fill: '#252a33' }} dataKey="value" fill="#3b82f6" cornerRadius={6} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="ring-center">
              <span className="ring-value">45%</span>
              <span className="ring-label">训练进度</span>
            </div>
          </div>
          <div className="ring-stats">
            <div className="stat-item">
              <span className="stat-label">当前Epoch</span>
              <span className="stat-value">45/100</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">预估剩余</span>
              <span className="stat-value">约55分钟</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">当前Loss</span>
              <span className="stat-value">0.28</span>
            </div>
          </div>
        </div>

        {/* 资源监控仪表盘 */}
        <div className="resource-monitor-card">
          <div className="card-header">
            <h2><Gauge size={20} /> 资源监控</h2>
          </div>
          <div className="resource-gauges">
            <ResourceGauge name="CPU" value={78} icon={<Cpu size={18} />} color="#10b981" />
            <ResourceGauge name="GPU" value={92} icon={<Zap size={18} />} color="#6366f1" />
            <ResourceGauge name="内存" value={65} icon={<Activity size={18} />} color="#f59e0b" />
            <ResourceGauge name="显存" value={88} icon={<Gauge size={18} />} color="#06b6d4" />
          </div>
        </div>
      </div>

      {/* 中间：性能图表 */}
      <div className="charts-section">
        {/* 模型性能雷达图 */}
        <div className="performance-radar-card">
          <div className="card-header">
            <h2><Activity size={20} /> 模型性能指标</h2>
          </div>
          <div className="radar-container">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={modelPerformanceData}>
                <PolarGrid stroke="#252a33" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                <Radar
                  name="性能值"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1f26', border: '1px solid #252a33', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}%`, '性能值']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 训练历史折线图 */}
        <div className="training-history-card">
          <div className="card-header">
            <h2><TrendingUp size={20} /> 训练历史曲线</h2>
          </div>
          <div className="line-chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trainingHistoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252a33" />
                <XAxis dataKey="epoch" stroke="#94a3b8" fontSize={10} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: '#1a1f26', border: '1px solid #252a33', borderRadius: '8px' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} name="Loss" dot={{ fill: '#ef4444' }} />
                <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} name="准确率%" dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 训练任务表格 */}
      <div className="training-section">
        <h2 className="section-title">当前训练</h2>
        <div className="training-table">
          <div className="table-header">
            <div className="col-name">任务名称</div>
            <div className="col-course">课程</div>
            <div className="col-progress">进度</div>
            <div className="col-status">状态</div>
            <div className="col-actions">操作</div>
          </div>
          {mockTrainingTasks.map((task) => (
            <div key={task.id} className="table-row">
              <div className="col-name">{task.name}</div>
              <div className="col-course">{task.course}</div>
              <div className="col-progress">
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${task.status}`}
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{task.progress}%</span>
              </div>
              <div className="col-status">
                <span className={`status-badge ${task.status}`}>
                  {task.status === 'running' && <Clock size={12} />}
                  {task.status === 'completed' && <CheckCircle size={12} />}
                  {task.status === 'queued' && <AlertTriangle size={12} />}
                  {task.status === 'running' ? '运行中' : task.status === 'completed' ? '已完成' : '排队中'}
                </span>
              </div>
              <div className="col-actions">
                {task.status === 'running' && (
                  <>
                    <button className="action-btn" title="暂停"><Pause size={16} /></button>
                    <button className="action-btn" title="详情"><Eye size={16} /></button>
                  </>
                )}
                {task.status === 'completed' && (
                  <>
                    <button className="action-btn primary" title="部署">部署</button>
                    <button className="action-btn" title="查看"><Eye size={16} /></button>
                  </>
                )}
                {task.status === 'queued' && (
                  <button className="action-btn" title="取消">取消</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 模型版本卡片 */}
      <div className="version-section">
        <h2 className="section-title">模型版本</h2>
        <div className="version-cards">
          {mockModelVersions.map((model) => (
            <div key={model.id} className={`version-card ${model.status}`}>
              <div className="version-header">
                <span className="version-number">{model.version}</span>
                <span className={`status-badge ${model.status}`}>
                  {model.status === 'running' ? '运行中' : model.status === 'deployed' ? '已部署' : '已归档'}
                </span>
              </div>
              <div className="version-stats">
                <div className="stat-item">
                  <span className="stat-label">准确率</span>
                  <span className="stat-value">{model.accuracy}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">部署时间</span>
                  <span className="stat-value">{model.deployTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 历史训练记录 */}
      <div className="history-section">
        <h2 className="section-title">历史训练记录</h2>
        <button className="view-history-btn">
          查看全部训练记录
        </button>
      </div>
    </div>
  );
};

export default ModelTraining;
