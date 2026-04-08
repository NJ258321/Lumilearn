/**
 * CourseStatsCard - 课程统计卡片
 */

import React from 'react';
import type { CourseStats } from '../../src/types/admin';
import Card from './Card';
import AnimatedNumber from './AnimatedNumber';
import './CourseStatsCard.css';

interface CourseStatsCardProps {
  courses: CourseStats;
}

const CourseStatsCard: React.FC<CourseStatsCardProps> = ({ courses }) => {
  // 安全获取数据
  const safeCourses = courses || { total: 0, studying: 0, reviewing: 0, archived: 0, byType: { professional: 0, crossMajor: 0, elective: 0 } };

  // 类型分布数据
  const typeData = [
    { name: '专业课', value: safeCourses.byType.professional, color: '#3b82f6' },
    { name: '跨专业', value: safeCourses.byType.crossMajor, color: '#06b6d4' },
    { name: '选修课', value: safeCourses.byType.elective, color: '#f59e0b' }
  ];

  return (
    <Card title="课程数据统计" icon="📚">
      <div className="course-stats-content fade-in" style={{ animationDelay: '0.05s' }}>
        <div className="stat-row">
          <div className="stat-item main">
            <span className="stat-label">开设课程</span>
            <AnimatedNumber
              value={courses.total}
              fontSize="24px"
              fontWeight="700"
            />
          </div>
        </div>

        <div className="stat-row three-col">
          <div className="stat-item">
            <span className="stat-label">学习中</span>
            <AnimatedNumber
              value={courses.studying}
              fontSize="20px"
              fontWeight="600"
              color="#3b82f6"
            />
          </div>
          <div className="stat-item">
            <span className="stat-label">复习中</span>
            <AnimatedNumber
              value={courses.reviewing}
              fontSize="20px"
              fontWeight="600"
              color="#6366f1"
            />
          </div>
          <div className="stat-item">
            <span className="stat-label">已归档</span>
            <AnimatedNumber
              value={courses.archived}
              fontSize="20px"
              fontWeight="600"
              color="#94a3b8"
            />
          </div>
        </div>

        <div className="type-distribution fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="type-label">课程类型分布</span>
          <div className="type-bars">
            {typeData.map((item) => (
              <div key={item.name} className="type-bar-item">
                <div className="type-bar-bg">
                  <div
                    className="type-bar-fill"
                    style={{
                      width: `${(item.value / courses.total) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
                <span className="type-name">{item.name}</span>
                <span className="type-count">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CourseStatsCard;