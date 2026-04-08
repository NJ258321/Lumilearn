/**
 * Overview - 总览页
 * 综合仪表盘，展示系统核心数据
 */

import React from 'react';
import { useAdminDashboard } from '../../../src/hooks/useAdminDashboard';
import UserStatsCard from '../UserStatsCard';
import CourseStatsCard from '../CourseStatsCard';
import KnowledgeHeatmap from '../KnowledgeHeatmap';
import TrainingQueue from '../TrainingQueue';
import RagStatus from '../RagStatus';
import ContributionList from '../ContributionList';
import ModelVersion from '../ModelVersion';
import KnowledgeGraph from '../KnowledgeGraph';
import MultimodalPanel from '../MultimodalPanel';
import Header from '../Header';
import './styles/overview.css';

export const Overview: React.FC = () => {
  const { data, loading, error, lastUpdate } = useAdminDashboard();

  // 简化版本，暂时不依赖Header组件
  if (loading || !data) {
    return (
      <div className="overview-page loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-page error">
        <p>数据加载失败: {error}</p>
      </div>
    );
  }

  return (
    <div className="overview-page">
      {/* 顶部标题栏 - 使用data中的system */}
      <Header system={data.system} lastUpdate={lastUpdate} />

      {/* 三栏布局 */}
      <div className="dashboard-grid">
        {/* 左侧栏 */}
        <div className="sidebar-left">
          <UserStatsCard users={data.users} />
          <CourseStatsCard courses={data.courses} />
          <KnowledgeHeatmap knowledge={data.knowledge} />
        </div>

        {/* 中间栏 - 知识图谱 */}
        <div className="main-content">
          <KnowledgeGraph graphData={data.knowledgeGraph} />
          <MultimodalPanel multimodal={data.multimodal} />
        </div>

        {/* 右侧栏 */}
        <div className="sidebar-right">
          <TrainingQueue running={data.training.running} queued={data.training.queued} completed={data.training.completed} />
          <RagStatus rag={data.rag} />
          <ContributionList contributions={data.contributions} />
          <ModelVersion model={data.model} />
        </div>
      </div>
    </div>
  );
};

export default Overview;
