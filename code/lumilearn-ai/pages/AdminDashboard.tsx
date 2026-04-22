/**
 * 管理员AI训练指挥中心大屏
 * LumiTrace AI Admin Dashboard
 */

import React from 'react';
import './AdminDashboard.css';
import '../src/styles/admin.css';

// 导入组件
import Header from '../components/admin/Header';
import UserStatsCard from '../components/admin/UserStatsCard';
import CourseStatsCard from '../components/admin/CourseStatsCard';
import KnowledgeHeatmap from '../components/admin/KnowledgeHeatmap';
import KnowledgeGraph from '../components/admin/KnowledgeGraph';
import MultimodalPanel from '../components/admin/MultimodalPanel';
import TrainingQueue from '../components/admin/TrainingQueue';
import RagStatus from '../components/admin/RagStatus';
import ContributionList from '../components/admin/ContributionList';
import ModelVersion from '../components/admin/ModelVersion';
import DataTicker from '../components/admin/DataTicker';

// 导入Hook
import { useAdminDashboard } from '../src/hooks/useAdminDashboard';

const AdminDashboard: React.FC = () => {
  const { data, loading, error, refresh, lastUpdate } = useAdminDashboard();

  // 加载状态
  if (loading || !data) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>正在加载AI训练指挥中心...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={refresh}>点击重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        {/* 顶部标题栏 */}
        <Header
          system={data.system}
          lastUpdate={lastUpdate}
        />

        {/* 主体内容 */}
        <main className="dashboard-main">
          {/* 左侧面板 */}
          <aside className="sidebar-left">
            <UserStatsCard users={data.users} />
            <CourseStatsCard courses={data.courses} />
            <KnowledgeHeatmap knowledge={data.knowledge} />
          </aside>

          {/* 中央区域 */}
          <section className="main-content">
            <KnowledgeGraph graphData={data.knowledgeGraph} />
            <MultimodalPanel multimodal={data.multimodal} />
          </section>

          {/* 右侧面板 */}
          <aside className="sidebar-right">
            <TrainingQueue
              running={data.training.running}
              queued={data.training.queued}
              completed={data.training.completed}
            />
            <RagStatus rag={data.rag} />
            <ContributionList contributions={data.contributions} />
            <ModelVersion model={data.model} />
          </aside>
        </main>

        {/* 底部数据滚动条 */}
        <DataTicker ticker={data.ticker} />
      </div>
    </div>
  );
};

export default AdminDashboard;