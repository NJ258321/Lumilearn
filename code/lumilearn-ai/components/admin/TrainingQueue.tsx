/**
 * TrainingQueue - 训练任务队列
 */

import React from 'react';
import type { TrainingTask } from '../../src/types/admin';
import Card from './Card';
import AnimatedNumber from './AnimatedNumber';
import './TrainingQueue.css';

interface TrainingQueueProps {
  running: TrainingTask[];
  queued: TrainingTask[];
  completed: number;
}

const TrainingQueue: React.FC<TrainingQueueProps> = ({ running, queued, completed }) => {
  // 安全获取数据
  const safeRunning = running || [];
  const safeQueued = queued || [];
  const safeCompleted = completed || 0;

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🔄';
      case 'queued': return '⏳';
      case 'completed': return '✅';
      default: return '❓';
    }
  };

  // 获取课程颜色
  const getCourseColor = (course?: string) => {
    const colors: Record<string, string> = {
      math: '#3b82f6',
      physics: '#6366f1',
      computer: '#06b6d4',
      chemistry: '#f59e0b',
      biology: '#ec4899'
    };
    return course ? colors[course] || '#94a3b8' : '#94a3b8';
  };

  return (
    <Card title="训练任务队列" icon="⚙️">
      <div className="training-queue-content fade-in">
        {/* 进行中任务 */}
        <div className="task-section">
          <div className="section-header">
            <span className="section-icon">{getStatusIcon('running')}</span>
            <span className="section-title">进行中</span>
            <span className="section-count">{running.length}</span>
          </div>
          <div className="task-list">
            {running.map((task, index) => (
              <div
                key={task.id}
                className="task-item running"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <div className="task-info">
                  <span className="task-name" style={{ borderLeftColor: getCourseColor(task.course) }}>
                    {task.name}
                  </span>
                  <span className="task-time">{task.estimatedTime}</span>
                </div>
                <div className="task-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="progress-text">{task.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 队列中任务 */}
        <div className="task-section fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="section-header">
            <span className="section-icon">{getStatusIcon('queued')}</span>
            <span className="section-title">队列中</span>
            <span className="section-count">{queued.length}</span>
          </div>
          <div className="task-list queued">
            {queued.slice(0, 3).map((task) => (
              <div key={task.id} className="task-item queued">
                <span className="task-name">{task.name}</span>
              </div>
            ))}
            {queued.length > 3 && (
              <div className="more-tasks">+{queued.length - 3} 个任务</div>
            )}
          </div>
        </div>

        {/* 今日完成 */}
        <div className="task-section completed fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="section-header">
            <span className="section-icon">{getStatusIcon('completed')}</span>
            <span className="section-title">今日完成</span>
          </div>
          <div className="completed-count">
            <AnimatedNumber value={completed} fontSize="28px" fontWeight="700" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TrainingQueue;