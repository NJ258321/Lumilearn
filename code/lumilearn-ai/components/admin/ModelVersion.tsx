/**
 * ModelVersion - 模型版本信息
 */

import React from 'react';
import type { ModelVersion as ModelVersionType } from '../../src/types/admin';
import Card from './Card';
import AnimatedNumber from './AnimatedNumber';
import './ModelVersion.css';

interface ModelVersionProps {
  model: ModelVersionType;
}

const ModelVersion: React.FC<ModelVersionProps> = ({ model }) => {
  const safeModel = model || { currentVersion: "v1.0", deployedVersion: "v1.0", accuracy: 0, updateTime: "" };
  return (
    <Card title="模型版本管理" icon="🤖">
      <div className="model-version-content fade-in">
        {/* 当前版本 */}
        <div className="current-version">
          <span className="version-label">当前使用</span>
          <span className="version-value">{safeModel.currentVersion}</span>
          <span className="version-course">(高数垂域)</span>
        </div>

        {/* 模型信息 */}
        <div className="model-info">
          <div className="info-item">
            <span className="info-label">基座模型</span>
            <span className="info-value">{safeModel.baseModel}</span>
          </div>
          <div className="info-item">
            <span className="info-label">微调方式</span>
            <span className="info-value">{safeModel.fineTuneMethod}</span>
          </div>
          <div className="info-item">
            <span className="info-label">训练数据</span>
            <AnimatedNumber
              value={safeModel.trainDataCount}
              fontSize="14px"
              fontWeight="500"
              suffix=" 条"
            />
          </div>
          <div className="info-item">
            <span className="info-label">准确率</span>
            <span className="info-value accuracy">
              <AnimatedNumber
                value={safeModel.accuracy}
                fontSize="14px"
                fontWeight="500"
                suffix="%"
              />
            </span>
          </div>
        </div>

        {/* 版本历史 */}
        <div className="version-history fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="history-label">版本历史</span>
          <div className="history-list">
            {safeModel.history.map((item, index) => (
              <div
                key={item.version}
                className={`history-item ${index === 0 ? 'current' : ''}`}
              >
                <span className={`status-dot ${item.status}`}></span>
                <span className="history-version">v{item.version}</span>
                <span className="history-date">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ModelVersion;