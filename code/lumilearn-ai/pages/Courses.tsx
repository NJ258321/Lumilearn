import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Search, MoreHorizontal, ChevronUp, ChevronDown, Plus, Edit2, RefreshCw, Info, Trash2, X, Archive, BookOpen, Clock, CalendarRange, Network, Layers, Zap, Book, Loader2, Edit3 } from 'lucide-react';
import * as d3 from 'd3';
import { AppView, Course, CourseType } from '../types';
import { getCourseList } from '../src/api/courses';

interface CoursesProps {
  onNavigate: (view: AppView, courseId?: string) => void;
  onCourseSelect?: (courseId: string, mode: 'study' | 'review') => void;
}

// --- Types for Timeline Layout ---
interface VisualNode {
  id: string;
  type: 'semester' | 'category' | 'course';
  title: string;
  x: number;
  y: number;
  data: any;
  color?: string;
  statusColor?: string;
}

interface VisualLink {
  source: VisualNode;
  target: VisualNode;
  color: string;
}

// --- Force Graph Types ---
type NodeType = 'core' | 'math' | 'tech' | 'other';
type LinkType = 'prerequisite' | 'method-support' | 'application';
type CourseStatus = 'studying' | 'reviewing' | 'archived';

interface ForceNode extends d3.SimulationNodeDatum {
    id: string;
    name: string;
    group: NodeType;
    status: CourseStatus;
    r: number;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface ForceLink extends d3.SimulationLinkDatum<ForceNode> {
    source: string | ForceNode;
    target: string | ForceNode;
    type: LinkType;
}

// --- Visual Constants ---
// 在CONFIG常量中找到TIMELINE_START_Y和FORCE_CENTER_Y，将它们都减少10
const CONFIG = {
    // Timeline Graph Constants
    LEVEL_X_OFFSET: [-120, 60, 300], 
    MACRO_GAP_Y: 80,
    MICRO_GAP_Y: 48,
    // 修改前: TIMELINE_START_Y: 390,
    TIMELINE_START_Y: 400,  // 390

    // Force Graph Constants 
    // 修改前: FORCE_CENTER_Y: 200,
    FORCE_CENTER_Y: 150,  // 上移避免与时间轴重叠
    FORCE_CENTER_X: 165, 
};

type SheetMode = 'MENU' | 'RENAME' | 'STATUS' | 'DELETE' | 'INFO';

const Courses: React.FC<CoursesProps> = ({ onNavigate, onCourseSelect }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // Sheet State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>('MENU');
  const [tempName, setTempName] = useState('');
  const [tempDate, setTempDate] = useState('');

  // Canvas State
  // Initial Y offset to show the graph clearly
  const [transform, setTransform] = useState({ x: 0, y: -40, scale: 1 });  // 修改前: y: -50
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [hasAutoFit, setHasAutoFit] = useState(false);

  // Force Graph State
  const [forceNodes, setForceNodes] = useState<ForceNode[]>([]);
  const [forceLinks, setForceLinks] = useState<ForceLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Fetch Courses from API
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCourseList();
      if (response.success && response.data) {
        setCourses(response.data);
      } else {
        setError(response.error || '加载课程失败');
      }
    } catch (err) {
      setError('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Data Splitting (后端返回大写status)
  const reviewingCourses = useMemo(() =>
    courses.filter(c => c.status === 'REVIEWING').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  [courses]);

  const studyingCourses = useMemo(() =>
    courses.filter(c => c.status === 'STUDYING'),
  [courses]);

  // ---------------------------------------------------------------------------
  // 1. TIMELINE GRAPH ENGINE
  // ---------------------------------------------------------------------------
  const { timelineNodes, timelineLinks, targetSemY } = useMemo(() => {
    const nodes: VisualNode[] = [];
    const links: VisualLink[] = [];
    let currentY = CONFIG.TIMELINE_START_Y;
    let targetY = CONFIG.TIMELINE_START_Y;

    const semesters = Array.from(new Set<string>(courses.map(c => c.semester))).sort().reverse();
    
    semesters.forEach((sem: string) => {
        const semCourses = courses.filter(c => c.semester === sem);
        const types = Array.from(new Set(semCourses.map(c => c.type))).sort();
        let semStartY = currentY;
        
        const typeNodes: VisualNode[] = [];
        
        // 类型配置映射
        const typeConfig: Record<CourseType, { label: string; color: string; shortLabel: string }> = {
            PROFESSIONAL: { label: '专业课', color: '#3B82F6', shortLabel: 'Major' },
            ELECTIVE: { label: '选修课', color: '#10B981', shortLabel: 'Elective' },
            CROSS_MAJOR: { label: '跨专业', color: '#F59E0B', shortLabel: 'Cross' }
        };

        types.forEach(type => {
            const typeCourses = semCourses.filter(c => c.type === type);
            const typeHeight = typeCourses.length * CONFIG.MICRO_GAP_Y;
            const typeCenterY = currentY + (typeHeight / 2) - (CONFIG.MICRO_GAP_Y / 2);
            
            const config = typeConfig[type as CourseType] || typeConfig.ELECTIVE;

            const typeNode: VisualNode = {
                id: `type-${sem}-${type}`,
                type: 'category',
                title: config.label,
                x: CONFIG.LEVEL_X_OFFSET[1],
                y: typeCenterY,
                data: { label: config.shortLabel },
                color: config.color
            };
            nodes.push(typeNode);
            typeNodes.push(typeNode);

            typeCourses.forEach((course) => {
                const courseNode: VisualNode = {
                    id: `course-${course.id}`,
                    type: 'course',
                    title: course.name,
                    x: CONFIG.LEVEL_X_OFFSET[2],
                    y: currentY,
                    data: course,
                    statusColor: course.status === 'reviewing' ? '#EF4444' : (course.status === 'studying' ? '#3B82F6' : '#94A3B8')
                };
                nodes.push(courseNode);
                links.push({ source: typeNode, target: courseNode, color: config.color });
                
                currentY += CONFIG.MICRO_GAP_Y;
            });

            currentY += 10;
        });

        const semEndY = currentY - 10;
        const semCenterY = (semStartY + semEndY) / 2 - (CONFIG.MICRO_GAP_Y / 2);
        if (sem.includes('2024-2025')) targetY = semCenterY;

        const semNode: VisualNode = {
            id: `sem-${sem}`,
            type: 'semester',
            title: sem,
            x: CONFIG.LEVEL_X_OFFSET[0],
            y: semCenterY,
            data: { label: sem },
            color: '#1E293B'
        };
        nodes.push(semNode);

        typeNodes.forEach(tNode => {
             links.push({ source: semNode, target: tNode, color: '#CBD5E1' });
        });

        currentY += CONFIG.MACRO_GAP_Y;
    });

    return { timelineNodes: nodes, timelineLinks: links, targetSemY: targetY };
  }, [courses]);

  // ---------------------------------------------------------------------------
  // 2. FORCE DIRECTED GRAPH ENGINE - 基于课程数据自动生成
  // ---------------------------------------------------------------------------
  
  // 课程分组映射配置
  const COURSE_GROUP_MAP: Record<string, NodeType> = {
    // 数学类 - 左侧
    '高等数学（上）': 'math',
    '高等数学（下）': 'math',
    '线性代数': 'math',
    '概率论与数理统计': 'math',
    // 计算机技术类 - 右侧
    'C语言程序设计': 'tech',
    '数据结构': 'tech',
    '面向对象程序设计': 'tech',
    '计算机组成原理': 'tech',
    '数据库原理': 'tech',
    // 专业核心类 - 中心
    '地理信息系统原理': 'core',
    '遥感原理与应用': 'core',
    '摄影测量学': 'core',
    // 其他类
    '大学英语（一）': 'other',
    '大学英语（二）': 'other',
    '中国近现代史纲要': 'other',
    '思想道德与法治': 'other',
    '大学物理': 'other',
  };

  // 预定义的先修关系（强关系 - 实线）
  const PREREQUISITE_MAP: Record<string, string[]> = {
    '高等数学（下）': ['高等数学（上）'],
    '线性代数': ['高等数学（上）'],
    '概率论与数理统计': ['高等数学（下）', '线性代数'],
    '数据结构': ['C语言程序设计'],
    '面向对象程序设计': ['C语言程序设计'],
    '计算机组成原理': ['数据结构'],
    '数据库原理': ['数据结构'],
    '遥感原理与应用': ['地理信息系统原理', '线性代数'],
    '摄影测量学': ['遥感原理与应用', '高等数学（下）'],
    '大学英语（二）': ['大学英语（一）'],
  };

  // 根据课程数据生成知识图谱
  useEffect(() => {
    if (courses.length === 0) return;

    // 1. 生成节点
    const nodes: ForceNode[] = courses.map((course, index) => {
      // 确定分组
      const group = COURSE_GROUP_MAP[course.name] || 'other';
      
      // 根据状态确定节点大小
      const baseRadius = group === 'core' ? 36 : (group === 'math' || group === 'tech' ? 26 : 20);
      const r = baseRadius;
      
      // 状态映射（后端大写 -> 前端小写）
      const statusMap: Record<string, CourseStatus> = {
        'STUDYING': 'studying',
        'REVIEWING': 'reviewing',
        'ARCHIVED': 'archived'
      };
      const status = statusMap[course.status] || 'studying';

      // 专业核心课程固定在中心
      const isCore = group === 'core';
      
      return {
        id: course.id,
        name: course.name,
        group,
        status,
        r,
        // 核心课程固定在中心位置
        ...(isCore && index === courses.findIndex(c => COURSE_GROUP_MAP[c.name] === 'core') ? {
          fx: CONFIG.FORCE_CENTER_X,
          fy: CONFIG.FORCE_CENTER_Y
        } : {})
      };
    });

    // 2. 生成连线
    const links: ForceLink[] = [];
    
    // A. 先修关系（强关系 - 实线）
    courses.forEach(targetCourse => {
      const prerequisites = PREREQUISITE_MAP[targetCourse.name];
      if (prerequisites) {
        prerequisites.forEach(prereqName => {
          const sourceCourse = courses.find(c => c.name === prereqName);
          if (sourceCourse) {
            links.push({
              source: sourceCourse.id,
              target: targetCourse.id,
              type: 'prerequisite'
            });
          }
        });
      }
    });

    // B. 同类型课程之间的弱关系（虚线）- 排除"other"组
    const coursesByGroup: Record<string, Course[]> = {};
    courses.forEach(course => {
      const group = COURSE_GROUP_MAP[course.name] || 'other';
      if (!coursesByGroup[group]) coursesByGroup[group] = [];
      coursesByGroup[group].push(course);
    });

    Object.entries(coursesByGroup).forEach(([group, groupCourses]) => {
      // 只给 math/tech/core 组生成弱关系，other组（思政/英语等）不生成
      if (group !== 'other' && groupCourses.length >= 2) {
        // 将同组课程连成链
        for (let i = 0; i < groupCourses.length - 1; i++) {
          const existingLink = links.find(l => 
            (l.source === groupCourses[i].id && l.target === groupCourses[i + 1].id) ||
            (l.source === groupCourses[i + 1].id && l.target === groupCourses[i].id)
          );
          if (!existingLink) {
            links.push({
              source: groupCourses[i].id,
              target: groupCourses[i + 1].id,
              type: 'method-support'
            });
          }
        }
      }
    });

    // 3. 力导向图模拟 - 优化布局
    const simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance((d: any) => {
            // 先修关系更紧密，同组关系稍远
            if (d.type === 'prerequisite') return 75;  // 先修关系更近
            if (d.type === 'method-support') return 90;
            return 85; 
        }))
        .force("charge", d3.forceManyBody().strength(-300))  // 加强排斥力防止重叠
        .force("collide", d3.forceCollide().radius((d: any) => d.r * 1.5).strength(0.8))
        // 分组力 - 控制水平位置，更紧凑
        .force("x", d3.forceX((d: any) => {
            if (d.group === 'math') return CONFIG.FORCE_CENTER_X - 85;  // 数学组偏左
            if (d.group === 'tech') return CONFIG.FORCE_CENTER_X + 85;  // 技术组偏右
            if (d.group === 'other') return CONFIG.FORCE_CENTER_X + 100; // 其他组右下
            return CONFIG.FORCE_CENTER_X;  // 核心居中
        }).strength(0.8))
        // 垂直位置
        .force("y", d3.forceY((d: any) => {
            if (d.group === 'other') return CONFIG.FORCE_CENTER_Y + 60;
            return CONFIG.FORCE_CENTER_Y;
        }).strength(0.4))
        .stop();

    // Warm up simulation
    for (let i = 0; i < 300; ++i) simulation.tick();

    setForceNodes(nodes);
    setForceLinks(links);
  }, [courses]);

  // --- View Control ---
  const handleResetView = useCallback(() => {
      if (timelineNodes.length === 0 || !containerRef.current) {
          setTransform({ x: 0, y: 0, scale: 1 });
          return;
      }

      // 计算时间轴节点的边界框
      const xs = timelineNodes.map(n => n.x);
      const ys = timelineNodes.map(n => n.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      const nodeWidth = maxX - minX + 250; // 加上课程卡片宽度
      const nodeHeight = maxY - minY + 100;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // 计算合适的缩放比例
      const scaleX = containerWidth / nodeWidth;
      const scaleY = containerHeight / nodeHeight;
      const scale = Math.min(Math.min(scaleX, scaleY) * 0.85, 1); // 留一些边距，最大缩放为1
      
      // 计算居中位置
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      const x = containerWidth / 2 - centerX * scale;
      const y = containerHeight / 2 - centerY * scale;
      
      setTransform({ x, y, scale });
  }, [timelineNodes]);

  const handleShowGraph = () => {
      if (containerRef.current) {
         setTransform({ x: 0, y: 0, scale: 1 });
         setIsPanelOpen(false);
      }
  };

  useEffect(() => {
      if (!hasAutoFit && timelineNodes.length > 0) {
          handleResetView();
          setHasAutoFit(true);
      }
  }, [timelineNodes.length, hasAutoFit, handleResetView]);


  // --- Interaction Logic ---
  const handlePointerDown = (e: React.PointerEvent) => {
      containerRef.current?.setPointerCapture(e.pointerId);
      setIsDragging(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      setIsDragging(false);
      containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.4, transform.scale - e.deltaY * zoomSensitivity), 2.0);
      setTransform(prev => ({ ...prev, scale: newScale }));
  };

  // --- Helpers ---
  // DOM 节点尺寸（用于连线计算）
  const NODE_SIZES = {
    semester: { w: 120, h: 40 },
    category: { w: 90, h: 32 },
    course: { w: 200, h: 40 }
  };

  const getBezierPath = (link: VisualLink) => {
    // DOM 节点使用 transform -translate-x-1/2 -translate-y-1/2 居中
    // 所以 node.x, node.y 是节点中心坐标
    const srcX = link.source.x;
    const srcY = link.source.y;
    const tgtX = link.target.x;
    const tgtY = link.target.y;
    
    // 连线起点：源节点右边缘
    let startX = srcX;
    if (link.source.type === 'semester') startX += NODE_SIZES.semester.w / 2;
    else if (link.source.type === 'category') startX += NODE_SIZES.category.w / 2;
    
    // 连线终点：目标节点左边缘  
    let endX = tgtX;
    if (link.target.type === 'category') endX -= NODE_SIZES.category.w / 2;
    else if (link.target.type === 'course') endX -= NODE_SIZES.course.w / 2;
    
    const midX = (startX + endX) / 2;
    return `M ${startX} ${srcY} C ${midX} ${srcY}, ${midX} ${tgtY}, ${endX} ${tgtY}`;
  };

  // --- Colors & Styles ---
  const getStatusColor = (status: string) => {
      switch(status) {
          case 'studying': return '#2563EB'; // Blue
          case 'reviewing': return '#22C55E'; // Green
          case 'archived': return '#9CA3AF'; // Gray
          default: return '#94A3B8';
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden font-sans">
        
        {/* ========================================================================
            LAYER 0: THE INFINITE CANVAS
           ======================================================================== */}
        <div 
            ref={containerRef}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none z-0 bg-gradient-to-b from-slate-50 to-[#F1F5F9]"
            style={{ touchAction: 'none' }} 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
        >
            {/* Grid Background - Light Theme */}
            <div 
                className="absolute -inset-[3000px] opacity-40 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                    transform: `translate(${transform.x % 30}px, ${transform.y % 30}px)`
                }}
            ></div>

            <div 
                className="w-full h-full origin-top-left will-change-transform"
                style={{ 
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)' 
                }}
            >
                <svg 
                    className="absolute top-0 left-0 overflow-visible pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                    preserveAspectRatio="xMidYMid slice"
                >
                     <defs>
                        {/* Soft Shadow Filter for Light Theme */}
                        <filter id="shadow-light" x="-50%" y="-50%" width="200%" height="200%">
                           <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#94A3B8" floodOpacity="0.3"/>
                        </filter>
                        
                        {/* Light Theme Gradients */}
                        <linearGradient id="grad-blue-light" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#EFF6FF" />
                            <stop offset="100%" stopColor="#DBEAFE" />
                        </linearGradient>
                         <linearGradient id="grad-green-light" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F0FDF4" />
                            <stop offset="100%" stopColor="#DCFCE7" />
                        </linearGradient>
                        <linearGradient id="grad-gray-light" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F8FAFC" />
                            <stop offset="100%" stopColor="#F1F5F9" />
                        </linearGradient>

                        {/* Arrow Markers for different link types */}
                        <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L9,3 z" fill="#3B82F6" />
                        </marker>
                        <marker id="arrow-orange" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L9,3 z" fill="#F59E0B" />
                        </marker>
                        <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L9,3 z" fill="#10B981" />
                        </marker>
                     </defs>

                     <g>
                        {/* SVG 与 DOM 使用相同坐标系 - 原点 (0,0) 对齐 */}
                        
                        {/* --- PART A: FORCE GRAPH (Relationship) --- */}
                        <g className="force-layer">
                             
                             {/* Graph Title - 上移避免重叠 */}
                             <text 
                                x={CONFIG.FORCE_CENTER_X}
                                y={CONFIG.FORCE_CENTER_Y - 160}
                                textAnchor="middle" 
                                className="fill-slate-400 font-bold text-xs uppercase tracking-[0.2em]"
                             >
                                 Knowledge Graph
                             </text>
                             
                             {/* Legend - 图例说明 往左移 */}
                             <g transform={`translate(${CONFIG.FORCE_CENTER_X - 100}, ${CONFIG.FORCE_CENTER_Y + 130})`}>
                                <text x="0" y="0" className="fill-slate-400 text-[8px]" textAnchor="middle">关系说明</text>
                                <line x1="-50" y1="10" x2="-30" y2="10" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#arrow-blue)"/>
                                <text x="-25" y="13" className="fill-slate-400 text-[7px]">先修</text>
                                <line x1="-5" y1="10" x2="15" y2="10" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4,4"/>
                                <text x="20" y="13" className="fill-slate-400 text-[7px]">支撑</text>
                             </g>

                             {/* Links - 优化后的连线 */}
                             {forceLinks.map((link, i) => {
                                 const source = link.source as ForceNode;
                                 const target = link.target as ForceNode;
                                 
                                 // 根据关系类型设置不同样式
                                 const linkStyles = {
                                     'prerequisite': { 
                                         color: '#3B82F6',  // 蓝色 - 先修
                                         dash: 'none', 
                                         width: 2,
                                         marker: 'url(#arrow-blue)',
                                         label: '先修'
                                     },
                                     'method-support': { 
                                         color: '#F59E0B',  // 橙色 - 方法支持
                                         dash: '5,5', 
                                         width: 1.5,
                                         marker: 'url(#arrow-orange)',
                                         label: '支撑'
                                     },
                                     'application': { 
                                         color: '#10B981',  // 绿色 - 应用
                                         dash: '2,3', 
                                         width: 1.5,
                                         marker: '',
                                         label: '应用'
                                     }
                                 };
                                 const style = linkStyles[link.type] || linkStyles['prerequisite'];
                                 const isHovered = hoveredNode === (link.source as ForceNode).id || hoveredNode === (link.target as ForceNode).id;

                                 return (
                                     <g key={`fl-${i}`}>
                                        <line 
                                            x1={source.x} y1={source.y}
                                            x2={target.x} y2={target.y}
                                            stroke={style.color}
                                            strokeWidth={isHovered ? style.width + 1 : style.width}
                                            strokeDasharray={style.dash}
                                            opacity={isHovered ? 0.8 : 0.5}
                                            markerEnd={style.marker}
                                            className="transition-all duration-300"
                                        />
                                     </g>
                                 );
                             })}

                             {/* Nodes - 优化后的节点 */}
                             {forceNodes.map((node, i) => {
                                 const fillId = node.status === 'studying' ? 'url(#grad-blue-light)' : (node.status === 'reviewing' ? 'url(#grad-green-light)' : 'url(#grad-gray-light)');
                                 const strokeColor = getStatusColor(node.status);
                                 const isHovered = hoveredNode === node.id;
                                 const isBreathing = node.status !== 'archived';

                                 // Font Size Logic based on node size
                                 const fontSize = node.r < 30 ? 8 : 10;
                                 
                                 // 分组颜色
                                 const groupColors = {
                                     'core': '#3B82F6',
                                     'math': '#8B5CF6', 
                                     'tech': '#F59E0B',
                                     'other': '#94A3B8'
                                 };
                                 const groupColor = groupColors[node.group] || '#94A3B8';

                                 return (
                                     <g 
                                        key={`fn-${node.id}`} 
                                        transform={`translate(${node.x},${node.y})`}
                                        className="transition-all duration-300"
                                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                        onPointerDown={(e) => e.stopPropagation()} 
                                        onClick={() => onCourseSelect ? onCourseSelect(node.id, node.status === 'studying' ? 'study' : 'review') : onNavigate(AppView.COURSE_DETAIL_STUDY, node.id)}
                                        onMouseEnter={() => setHoveredNode(node.id)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                     >
                                         {/* Outer Glow Ring - 外发光 */}
                                         {isHovered && (
                                            <circle r={node.r * 1.5} fill={groupColor} opacity="0.15">
                                                <animate attributeName="r" values={`${node.r * 1.3};${node.r * 1.6};${node.r * 1.3}`} dur="1.5s" repeatCount="indefinite" />
                                                <animate attributeName="opacity" values="0.1;0.2;0.1" dur="1.5s" repeatCount="indefinite" />
                                            </circle>
                                         )}
                                         
                                         {/* Breathing Ring */}
                                         {isBreathing && !isHovered && (
                                            <circle r={node.r * 1.3} fill={strokeColor} opacity="0.1">
                                                <animate attributeName="r" values={`${node.r * 1.1};${node.r * 1.3};${node.r * 1.1}`} dur="4s" repeatCount="indefinite" />
                                                <animate attributeName="opacity" values="0.05;0.15;0.05" dur="4s" repeatCount="indefinite" />
                                            </circle>
                                         )}
                                         
                                         {/* Group Ring - 分组标识环 */}
                                         <circle r={node.r + 3} fill="none" stroke={groupColor} strokeWidth="1.5" opacity={isHovered ? 0.8 : 0.3} />

                                         {/* Main Circle */}
                                         <circle 
                                            r={node.r} 
                                            fill={fillId} 
                                            stroke={strokeColor} 
                                            strokeWidth={2} 
                                            filter="url(#shadow-light)"
                                         />

                                         {/* Label - Centered and multiline support simulation */}
                                         <text 
                                            dy="0.3em" 
                                            textAnchor="middle" 
                                            className="font-bold fill-slate-700 pointer-events-none"
                                            style={{ fontSize: fontSize, pointerEvents: 'none' }}
                                         >
                                             {/* Simple truncation for visual cleanliness */}
                                             {node.name.length > 5 && node.r < 40 ? (
                                                 <>
                                                     <tspan x="0" dy="-0.6em">{node.name.slice(0, 3)}</tspan>
                                                     <tspan x="0" dy="1.2em">{node.name.slice(3, 6)}</tspan>
                                                 </>
                                             ) : node.name}
                                         </text>
                                     </g>
                                 )
                             })}
                        </g>

                        {/* --- PART B: TIMELINE GRAPH (Pushed Down) --- */}
                        <g className="timeline-layer">

                            {timelineLinks.map((link, i) => (
                                <g key={i}>
                                    <path 
                                        d={getBezierPath(link)}
                                        fill="none"
                                        stroke={link.color}
                                        strokeWidth={2}
                                        strokeOpacity={0.4}
                                        className="transition-all duration-300"
                                    />
                                </g>
                            ))}
                        </g>
                    </g>
                </svg>

                {/* Timeline DOM Nodes - 使用左上角定位，与 SVG 坐标系一致 */}
                {timelineNodes.map(node => {
                    if (node.type === 'semester') {
                        return (
                            <div key={node.id} className="absolute" style={{ left: node.x - NODE_SIZES.semester.w/2, top: node.y - NODE_SIZES.semester.h/2 }}>
                                <div className="bg-slate-800 text-white flex items-center space-x-2 px-4 py-2 rounded-xl shadow-lg border-2 border-white z-10">
                                    <CalendarRange size={14} className="text-slate-300" />
                                    <span className="text-sm font-bold whitespace-nowrap">{node.title}</span>
                                </div>
                            </div>
                        );
                    }
                    if (node.type === 'category') {
                        return (
                            <div key={node.id} className="absolute" style={{ left: node.x - NODE_SIZES.category.w/2, top: node.y - NODE_SIZES.category.h/2 }}>
                                <div 
                                    className="bg-white border-2 px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap z-20 flex items-center justify-center min-w-[90px]" 
                                    style={{ borderColor: node.color, color: node.color }}
                                >
                                    <span className="text-xs font-bold">{node.title}</span>
                                </div>
                            </div>
                        );
                    }
                    if (node.type === 'course') {
                        const status = node.data.status?.toUpperCase?.() || node.data.status;
                        const isReviewing = status === 'REVIEWING';
                        const isStudying = status === 'STUDYING';
                        return (
                            <div 
                                key={node.id}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => onCourseSelect ? onCourseSelect(node.data.id, node.data.status === 'studying' ? 'study' : 'review') : onNavigate(AppView.COURSE_DETAIL_STUDY, node.data.id)}
                                className={`absolute bg-white w-[200px] h-[40px] rounded-lg shadow-sm border border-slate-100 flex items-center justify-between px-3 hover:scale-105 transition-all cursor-pointer group z-30 ${isReviewing ? 'ring-2 ring-red-50' : ''}`}
                                style={{ left: node.x - NODE_SIZES.course.w/2, top: node.y - NODE_SIZES.course.h/2 }}
                            >   
                                <div className="flex-1 overflow-hidden mr-2">
                                    <div className="text-xs font-bold text-slate-700 truncate">{node.title}</div>
                                </div>
                                <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap
                                    ${isReviewing ? 'bg-red-50 text-red-500' : (isStudying ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400')}
                                `}>
                                    {isReviewing && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>}
                                    <span>{isReviewing ? '复习中' : (isStudying ? '学习中' : '已结课')}</span>
                                </div>
                            </div>
                        )
                    }
                    return null;
                })}


            </div>
        </div>

        {/* ========================================================================
            LAYER 1: TOP DASHBOARD SHEET (Collapsible)
           ======================================================================== */}
        <div 
            className={`absolute top-[48px] left-0 right-0 bg-white/95 backdrop-blur-md rounded-b-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] z-20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] border-b border-slate-100 flex flex-col overflow-hidden ${isPanelOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
        >
            <div className="flex-1 overflow-y-auto pb-4 pt-2">
                {/* 1. Reviewing Section */}
                <div className="mb-6">
                    <div className="px-6 mb-3 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-1 h-4 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-sm font-bold text-slate-800">复习中 (Reviewing)</span>
                        </div>
                    </div>
                    
                    <div className="flex space-x-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {reviewingCourses.length === 0 && (
                            <div className="text-xs text-slate-400 py-4">暂无复习中课程</div>
                        )}
                        {reviewingCourses.map(course => {
                            const typeConfig = {
                                PROFESSIONAL: { label: '专业课', color: 'text-blue-600 bg-blue-50' },
                                ELECTIVE: { label: '选修课', color: 'text-emerald-600 bg-emerald-50' },
                                CROSS_MAJOR: { label: '公共课', color: 'text-amber-600 bg-amber-50' }
                            };
                            const typeInfo = typeConfig[course.type] || typeConfig.PROFESSIONAL;
                            const updateDate = course.updatedAt 
                                ? new Date(course.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) 
                                : '未知';
                            return (
                            <div 
                                key={course.id}
                                onClick={() => onCourseSelect ? onCourseSelect(course.id, 'review') : onNavigate(AppView.COURSE_DETAIL_STUDY, course.id)}
                                className="snap-start flex-shrink-0 w-[150px] h-[90px] bg-white rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100 relative active:scale-95 transition-transform flex flex-col justify-between group"
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeInfo.color}`}>{typeInfo.label}</span>
                                    <button onClick={(e) => { e.stopPropagation(); /* open menu */ }} className="text-slate-300 hover:text-slate-600 p-1 -mr-2 -mt-2 active:bg-slate-100 rounded-full">
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{course.name}</h3>
                                    <div className="flex justify-between items-end mt-1">
                                        <p className="text-[9px] text-slate-400">{updateDate} 更新</p>
                                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Studying Section */}
                <div className="mb-2">
                    <div className="px-6 mb-3 flex items-center">
                        <div className="w-1 h-4 bg-emerald-400 rounded-full mr-2"></div>
                        <span className="text-sm font-bold text-slate-800">学习中 (Studying)</span>
                    </div>
                    
                    <div className="flex space-x-4 overflow-x-auto px-6 pb-2 scrollbar-hide snap-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {studyingCourses.length === 0 && (
                            <div className="text-xs text-slate-400 py-4">暂无学习中课程</div>
                        )}
                        {studyingCourses.map(course => {
                            const typeConfig = {
                                PROFESSIONAL: { label: '专业课', color: 'text-blue-600 bg-blue-50' },
                                ELECTIVE: { label: '选修课', color: 'text-emerald-600 bg-emerald-50' },
                                CROSS_MAJOR: { label: '公共课', color: 'text-amber-600 bg-amber-50' }
                            };
                            const typeInfo = typeConfig[course.type] || typeConfig.PROFESSIONAL;
                            const updateDate = course.updatedAt 
                                ? new Date(course.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) 
                                : '未知';
                            return (
                            <div 
                                key={course.id}
                                onClick={() => onCourseSelect ? onCourseSelect(course.id, 'study') : onNavigate(AppView.COURSE_DETAIL_STUDY, course.id)}
                                className="snap-start flex-shrink-0 w-[150px] h-[90px] bg-slate-50 rounded-xl p-3 border border-slate-100 relative active:scale-95 transition-transform flex flex-col justify-between opacity-90 group"
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeInfo.color}`}>{typeInfo.label}</span>
                                    <button onClick={(e) => { e.stopPropagation(); /* open menu */ }} className="text-slate-300 hover:text-slate-600 p-1 -mr-2 -mt-2 active:bg-slate-100 rounded-full">
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-700 line-clamp-1">{course.name}</h3>
                                    <div className="flex justify-between items-end mt-1">
                                        <p className="text-[9px] text-slate-400">{updateDate} 更新</p>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div 
                className="h-6 w-full flex items-center justify-center bg-white border-t border-slate-50 active:bg-slate-50 cursor-pointer"
                onClick={() => setIsPanelOpen(false)}
            >
                <ChevronUp size={16} className="text-slate-300" />
            </div>
        </div>

        {/* Sticky App Bar */}
        <div className="h-[48px] bg-white sticky top-0 z-50 flex justify-between items-center px-6 border-b border-slate-100 shadow-sm">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsPanelOpen(!isPanelOpen)}>
                <h1 className="text-lg font-extrabold text-slate-800">课程中心</h1>
                <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-md transition-colors ${!isPanelOpen ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                     <span className="text-[10px] font-bold">{isPanelOpen ? '收起列表' : '展开列表'}</span>
                     {isPanelOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </div>
            </div>
            <div className="flex space-x-4 text-slate-500">
                <button
                    onClick={() => onNavigate(AppView.COURSE_MANAGER)}
                    className="active:scale-90 transition-transform text-blue-500"
                    title="课程管理"
                >
                    <Edit3 size={20} />
                </button>
            </div>
        </div>

    </div>
  );
};

export default Courses;