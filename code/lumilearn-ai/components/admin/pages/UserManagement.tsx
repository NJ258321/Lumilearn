/**
 * UserManagement - 用户管理页
 * 包含丰富的可视化图表：趋势图、柱状图、中国地图
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Users, TrendingUp, UserPlus, BarChart3, MapPin, BookOpen } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import ReactECharts from 'echarts-for-react';
import AnimatedNumber from '../AnimatedNumber';
import { registerChinaMap, fetchChinaGeoJson } from './ChinaMapData';
import './styles/user-management.css';

// 初始化地图数据
let mapInitialized = false;

const initMap = async () => {
  if (mapInitialized) return;
  try {
    await fetchChinaGeoJson();
    mapInitialized = true;
  } catch (e) {
    console.warn('使用简化版地图数据');
  }
};

// 用户增长趋势数据 - 增强表现力
const userTrendData = [
  { date: '03-25', users: 980, new: 12 },
  { date: '03-26', users: 1020, new: 18 },
  { date: '03-27', users: 1055, new: 22 },
  { date: '03-28', users: 1090, new: 25 },
  { date: '03-29', users: 1120, new: 20 },
  { date: '03-30', users: 1160, new: 28 },
  { date: '03-31', users: 1195, new: 32 },
  { date: '04-01', users: 1150, new: 15 },
  { date: '04-02', users: 1180, new: 22 },
  { date: '04-03', users: 1205, new: 25 },
  { date: '04-04', users: 1190, new: 18 },
  { date: '04-05', users: 1210, new: 20 },
  { date: '04-06', users: 1225, new: 23 },
  { date: '04-07', users: 1234, new: 26 },
];

// 用户专业/方向分布 - 学科门类 + 具体专业
const majorDistributionData = [
  // 理工类
  { category: '工科', major: '计算机科学', count: 186, color: '#3b82f6' },
  { category: '工科', major: '软件工程', count: 145, color: '#2563eb' },
  { category: '工科', major: '电子信息', count: 98, color: '#1d4ed8' },
  { category: '工科', major: '机械工程', count: 76, color: '#1e40af' },
  { category: '工科', major: '土木工程', count: 52, color: '#1e3a8a' },
  // 理科
  { category: '理科', major: '数学', count: 124, color: '#06b6d4' },
  { category: '理科', major: '物理学', count: 87, color: '#0891b2' },
  { category: '理科', major: '化学', count: 65, color: '#0e7490' },
  // 文科
  { category: '文科', major: '英语', count: 112, color: '#6366f1' },
  { category: '文科', major: '汉语言文学', count: 78, color: '#4f46e5' },
  { category: '文科', major: '历史学', count: 45, color: '#4338ca' },
  { category: '文科', major: '法学', count: 62, color: '#3730a3' },
  // 经管
  { category: '经管', major: '金融学', count: 88, color: '#f59e0b' },
  { category: '经管', major: '工商管理', count: 76, color: '#d97706' },
  { category: '经管', major: '会计学', count: 54, color: '#b45309' },
  // 医学
  { category: '医学', major: '临床医学', count: 68, color: '#10b981' },
  { category: '医学', major: '药学', count: 36, color: '#059669' },
];

// 学科门类汇总数据
const categorySummary = [
  { name: '工科', value: 557, color: '#3b82f6' },
  { name: '理科', value: 276, color: '#06b6d4' },
  { name: '文科', value: 297, color: '#6366f1' },
  { name: '经管', value: 218, color: '#f59e0b' },
  { name: '医学', value: 104, color: '#10b981' },
];

// 用户活跃度分布 - 每日活跃时段
const activeTimeData = [
  { time: '6-9时', count: 180 },
  { time: '9-12时', count: 320 },
  { time: '12-14时', count: 210 },
  { time: '14-18时', count: 450 },
  { time: '18-21时', count: 520 },
  { time: '21-24时', count: 280 },
];

// 地域分布数据 - 用于中国地图（与阿里云GeoJSON名称匹配）
const regionMapData = [
  { name: '北京市', value: 320 },
  { name: '天津市', value: 85 },
  { name: '河北省', value: 156 },
  { name: '山西省', value: 98 },
  { name: '内蒙古自治区', value: 72 },
  { name: '辽宁省', value: 145 },
  { name: '吉林省', value: 88 },
  { name: '黑龙江省', value: 95 },
  { name: '上海市', value: 280 },
  { name: '江苏省', value: 180 },
  { name: '浙江省', value: 156 },
  { name: '安徽省', value: 125 },
  { name: '福建省', value: 110 },
  { name: '江西省', value: 92 },
  { name: '山东省', value: 142 },
  { name: '河南省', value: 168 },
  { name: '湖北省', value: 115 },
  { name: '湖南省', value: 108 },
  { name: '广东省', value: 240 },
  { name: '广西壮族自治区', value: 86 },
  { name: '海南省', value: 45 },
  { name: '重庆市', value: 102 },
  { name: '四川省', value: 128 },
  { name: '贵州省', value: 76 },
  { name: '云南省', value: 95 },
  { name: '西藏自治区', value: 28 },
  { name: '陕西省', value: 112 },
  { name: '甘肃省', value: 68 },
  { name: '青海省', value: 35 },
  { name: '宁夏回族自治区', value: 42 },
  { name: '新疆维吾尔自治区', value: 88 },
  { name: '台湾省', value: 65 },
  { name: '香港特别行政区', value: 78 },
  { name: '澳门特别行政区', value: 32 },
];

// Mock数据
const mockUserStats = {
  total: 1234,
  active: 856,
  todayNew: 23
};

const mockUsers = [
  { id: 1, name: '张三', courses: 3, progress: 85, avatar: 'A', level: '优秀' },
  { id: 2, name: '李四', courses: 5, progress: 60, avatar: 'B', level: '良好' },
  { id: 3, name: '王五', courses: 2, progress: 92, avatar: 'C', level: '优秀' },
  { id: 4, name: '赵六', courses: 4, progress: 45, avatar: 'D', level: '待提升' },
  { id: 5, name: '钱七', courses: 6, progress: 78, avatar: 'E', level: '良好' },
];

// 获取地图ECharts配置 - 优化配色方案
const getMapOption = () => {
  // 计算实际数据的最大值
  const maxValue = Math.max(...regionMapData.map(d => d.value), 1);

  // 准备series数据
  const seriesData = regionMapData.map(item => ({
    name: item.name,
    value: item.value
  }));

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 14, 23, 0.95)',
      borderColor: 'rgba(6, 182, 212, 0.6)',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: '#f1f5f9', fontSize: 13 },
      extraCssText: 'box-shadow: 0 0 30px rgba(6, 182, 212, 0.2), 0 8px 32px rgba(0,0,0,0.5); border-radius: 10px; backdrop-filter: blur(10px);',
      formatter: function(params: any) {
        const value = params.value || 0;
        const percentage = ((value / 1234) * 100).toFixed(1);
        return `<div style="line-height:1.8; font-family: 'Noto Sans SC', sans-serif;">
          <span style="color:#06b6d4;font-weight:700;font-size:15px;">▌ ${params.name}</span><br/>
          <span style="color:#94a3b8;">用户数 </span><span style="color:#10b981;font-weight:700;font-size:18px;">${value}</span><br/>
          <span style="color:#64748b;">占比 </span><span style="color:#f59e0b;font-weight:600;">${percentage}%</span>
        </div>`;
      }
    },
    visualMap: {
      min: 0,
      max: maxValue,
      text: ['用户多', '用户少'],
      textStyle: { color: '#64748b', fontSize: 13, fontFamily: 'Noto Sans SC' },
      calculable: true,
      inRange: {
        // 科技感渐变 - 青→蓝→紫→粉→红
        color: [
          'rgba(15, 20, 25, 0.8)',     // 极低 - 深色
          'rgba(6, 182, 212, 0.3)',   // 很低 - 翡翠青
          'rgba(59, 130, 246, 0.45)', // 低 - 科技蓝
          'rgba(99, 102, 241, 0.55)', // 中 - 蓝紫
          'rgba(168, 85, 247, 0.7)',  // 中高 - 紫
          'rgba(236, 72, 153, 0.8)',  // 高 - 玫红
          'rgba(248, 113, 113, 1)'    // 很高 - 红
        ]
      },
      left: 'left',
      bottom: '15',
      itemWidth: 16,
      itemHeight: 180,
      borderColor: 'rgba(6, 182, 212, 0.3)',
      borderWidth: 1,
      separatorStyle: { color: '#06b6d4' },
      backgroundColor: 'rgba(15, 20, 25, 0.8)',
      padding: [8, 12]
    },
    series: [{
      name: '用户分布',
      type: 'map',
      map: 'china',
      roam: true,
      zoom: 1.1,
      center: [105, 36],
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          color: '#ffffff',
          fontSize: 13,
          fontWeight: 600,
          textShadowColor: 'rgba(6, 182, 212, 0.8)',
          textShadowBlur: 8
        },
        itemStyle: {
          areaColor: {
            type: 'radial',
            x: 0.5,
            y: 0.5,
            r: 0.8,
            colorStops: [
              { offset: 0, color: 'rgba(6, 182, 212, 0.7)' },
              { offset: 1, color: 'rgba(6, 182, 212, 0.4)' }
            ]
          },
          shadowBlur: 25,
          shadowColor: 'rgba(6, 182, 212, 0.6)'
        }
      },
      itemStyle: {
        areaColor: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.18)' },
            { offset: 1, color: 'rgba(6, 182, 212, 0.08)' }
          ]
        },
        borderColor: 'rgba(6, 182, 212, 0.35)',
        borderWidth: 1
      },
      select: { disabled: true },
      data: seriesData
    }]
  };
};

export const UserManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [mapReady, setMapReady] = useState(false);

  // 使用 useMemo 缓存地图配置
  const mapOption = useMemo(() => getMapOption(), [mapReady]);

  // 初始化地图
  useEffect(() => {
    initMap().then(() => {
      registerChinaMap().then(() => {
        console.log('地图注册成功, 数据:', regionMapData);
        setMapReady(true);
      }).catch(err => {
        console.error('注册地图失败:', err);
      });
    });
  }, []);

  return (
    <div className="user-management-page">
      <h1 className="page-title"><Users size={20} /> 用户管理</h1>

      {/* 顶部统计卡片 - 三列并排 */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-content">
            <div className="stat-value"><AnimatedNumber value={mockUserStats.total} /></div>
            <div className="stat-label">总用户数</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active"><TrendingUp size={20} /></div>
          <div className="stat-content">
            <div className="stat-value"><AnimatedNumber value={mockUserStats.active} /></div>
            <div className="stat-label">活跃用户</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><UserPlus size={20} /></div>
          <div className="stat-content">
            <div className="stat-value"><AnimatedNumber value={mockUserStats.todayNew} /></div>
            <div className="stat-label">今日新增</div>
          </div>
        </div>
      </div>

      {/* 主体布局：左右两栏，中央大地图 */}
      <div className="main-content-layout">
        {/* 左侧边栏 */}
        <aside className="sidebar-left">
          {/* 用户专业分布 */}
          <div className="chart-section major-section">
            <div className="section-header">
              <h2><BookOpen size={16} /> 用户专业分布</h2>
              <span className="section-subtitle">学科门类占比</span>
            </div>
            <div className="major-chart-container">
              {/* 环形图 - 学科门类 */}
              <div className="donut-chart-wrapper">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={categorySummary}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categorySummary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(26, 31, 38, 0.95)',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                      formatter={(value: number) => [`${value}人`, '用户数']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* 中心数字 */}
                <div className="donut-center">
                  <span className="donut-value">1452</span>
                  <span className="donut-label">总人数</span>
                </div>
              </div>
              {/* 图例列表 */}
              <div className="major-legend">
                {categorySummary.map((item, index) => (
                  <div key={index} className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                    <span className="legend-name">{item.name}</span>
                    <span className="legend-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* 具体专业列表 */}
            <div className="major-list">
              <div className="major-list-title">热门专业 TOP5</div>
              {majorDistributionData.slice(0, 5).map((item, index) => (
                <div key={index} className="major-list-item">
                  <span className="major-rank">{index + 1}</span>
                  <span className="major-name">{item.major}</span>
                  <span className="major-category" style={{ color: item.color }}>{item.category}</span>
                  <span className="major-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 用户活跃时段 */}
          <div className="chart-section active-section">
            <div className="section-header">
              <h2><BarChart3 size={16} /> 用户活跃时段</h2>
              <span className="section-subtitle">按时间段统计</span>
            </div>
            <div className="chart-container active-chart">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={activeTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3d" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1f26', border: '1px solid #252a33', borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>

        {/* 中央区域 - 大地图 */}
        <section className="center-map-section">
          <div className="section-header">
            <h2><MapPin size={20} /> 用户地域分布</h2>
            <span className="section-subtitle">全国用户分布热力图 · 点击可放大查看详情</span>
          </div>
          <div className="map-container large-map">
            {mapReady ? (
              <ReactECharts
                key={Date.now()}
                option={mapOption}
                style={{ width: '100%', height: '100%' }}
                notMerge={true}
                lazyUpdate={false}
              />
            ) : (
              <div className="map-loading">正在加载地图数据...</div>
            )}
          </div>
        </section>

        {/* 右侧边栏 */}
        <aside className="sidebar-right">
          {/* 用户增长趋势 */}
          <div className="chart-section trend-section">
            <div className="section-header">
              <h2><TrendingUp size={16} /> 用户增长趋势</h2>
              <span className="section-subtitle">近14日</span>
            </div>
            <div className="chart-container trend-chart">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={userTrendData}>
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="newUserGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3d" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1f26', border: '1px solid #252a33', borderRadius: '8px', padding: '8px' }}
                    labelStyle={{ color: '#f1f5f9', marginBottom: '4px' }}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '5px' }} />
                  <Area
                    type="monotone"
                    name="总用户"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#userGradient)"
                    dot={{ fill: '#3b82f6', strokeWidth: 0, r: 2 }}
                  />
                  <Area
                    type="monotone"
                    name="新增"
                    dataKey="new"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#newUserGradient)"
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 用户列表 */}
          <div className="user-list-section">
            <div className="section-header">
              <h2>用户列表</h2>
              <input
                type="text"
                placeholder="搜索用户..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="user-table">
              <div className="table-header">
                <div className="col-avatar">头像</div>
                <div className="col-name">用户名</div>
                <div className="col-level">等级</div>
              </div>
              <div className="table-body">
                {mockUsers.map((user) => (
                  <div key={user.id} className="table-row">
                    <div className="col-avatar">
                      <div className="user-avatar">{user.avatar}</div>
                    </div>
                    <div className="col-name">{user.name}</div>
                    <div className="col-level">
                      <span className={`level-badge ${user.level}`}>{user.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default UserManagement;
