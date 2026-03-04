import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, MoreHorizontal, ChevronUp, ChevronDown, Plus, Edit2, RefreshCw, Info, Trash2, X, Archive, BookOpen, Clock, CalendarRange, Network, Layers, Zap, Book } from 'lucide-react';
import * as d3 from 'd3';
import { MOCK_COURSES } from '../constants';
import { AppView, Course } from '../types';

interface CoursesProps {
  onNavigate: (view: AppView, courseId?: string) => void;
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
    FORCE_CENTER_Y: 210,  // 400
    FORCE_CENTER_X: 165, 
};

type SheetMode = 'MENU' | 'RENAME' | 'STATUS' | 'DELETE' | 'INFO';

const Courses: React.FC<CoursesProps> = ({ onNavigate }) => {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
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

  // Data Splitting
  const reviewingCourses = useMemo(() => 
    courses.filter(c => c.status === 'reviewing').sort((a, b) => (b.lastReview || '').localeCompare(a.lastReview || '')), 
  [courses]);

  const studyingCourses = useMemo(() => 
    courses.filter(c => c.status === 'studying'), 
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
        
        types.forEach(type => {
            const typeCourses = semCourses.filter(c => c.type === type);
            const typeHeight = typeCourses.length * CONFIG.MICRO_GAP_Y;
            const typeCenterY = currentY + (typeHeight / 2) - (CONFIG.MICRO_GAP_Y / 2);
            
            const typeColor = type === 'major' ? '#3B82F6' : '#10B981';

            const typeNode: VisualNode = {
                id: `type-${sem}-${type}`,
                type: 'category',
                title: type === 'major' ? '专业必修' : '通识选修',
                x: CONFIG.LEVEL_X_OFFSET[1],
                y: typeCenterY,
                data: { label: type === 'major' ? 'Major' : 'Elective' },
                color: typeColor
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
                links.push({ source: typeNode, target: courseNode, color: typeColor });
                
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
  // 2. FORCE DIRECTED GRAPH ENGINE (Updated for Mobile Light Theme)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 1. Nodes Definition with Groups
    // SCALING: Reduced radius (r) to fit mobile
    const nodes: ForceNode[] = [
        // Core (Center, Largest)
        { id: 'c4', name: '遥感原理与应用', group: 'core', status: 'studying', r: 42, fx: CONFIG.FORCE_CENTER_X, fy: CONFIG.FORCE_CENTER_Y }, // Anchored Center
        { id: 'c_photo', name: '摄影测量学', group: 'core', status: 'reviewing', r: 38 },

        // Math (Left, Medium - Reduced r)
        { id: 'c2', name: '高等数学', group: 'math', status: 'reviewing', r: 28 },
        { id: 'c8', name: '线性代数', group: 'math', status: 'archived', r: 24 },

        // Tech (Right, Medium - Reduced r)
        { id: 'c1', name: '数据结构', group: 'tech', status: 'reviewing', r: 28 },
        { id: 'c6', name: 'C语言', group: 'tech', status: 'archived', r: 24 }, // Shortened name for display

        // Other (Side/Bottom, Smallest)
        { id: 'c5', name: '近代史', group: 'other', status: 'studying', r: 18 },
        { id: 'c7', name: '思修', group: 'other', status: 'archived', r: 18 },
    ];

    // 2. Links Definition (Strict Relationships)
    const links: ForceLink[] = [
        // Prerequisite (Solid) - Math
        { source: 'c2', target: 'c8', type: 'prerequisite' }, // Math -> LinAlg
        { source: 'c8', target: 'c_photo', type: 'prerequisite' }, // LinAlg -> Photo
        { source: 'c2', target: 'c_photo', type: 'prerequisite' }, // Math -> Photo
        { source: 'c2', target: 'c4', type: 'prerequisite' }, // Math -> RS

        // Method Support (Dashed) - Tech
        { source: 'c6', target: 'c1', type: 'method-support' }, // C -> DataStruct
        { source: 'c1', target: 'c4', type: 'method-support' }, // DataStruct -> RS
        { source: 'c1', target: 'c_photo', type: 'method-support' }, // DataStruct -> Photo

        // Application (Dotted) - Core Interaction
        { source: 'c_photo', target: 'c4', type: 'application' }, // Photo <-> RS
    ];

    // 3. Force Simulation with TIGHTER Layout
    const simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance((d) => {
            // Reduced distances for mobile compactness
            if (d.type === 'application') return 90;
            return 100; 
        }))
        .force("charge", d3.forceManyBody().strength(-200)) // Reduced repulsion
        .force("collide", d3.forceCollide().radius((d: any) => d.r * 1.2)) 
        // Custom Forces to Enforce TIGHT Layout
        .force("x", d3.forceX((d: any) => {
            // Much smaller offsets to fit ~375px width
            if (d.group === 'math') return CONFIG.FORCE_CENTER_X - 110; // Left
            if (d.group === 'tech') return CONFIG.FORCE_CENTER_X + 110; // Right
            if (d.group === 'other') return CONFIG.FORCE_CENTER_X + 120; // Move closer to right edge
            return CONFIG.FORCE_CENTER_X; // Core stays center
        }).strength(0.8)) // Stronger pull to keep them in columns
        .force("y", d3.forceY((d: any) => {
            // MOVED UP from +75 to +50 to raise the "other" group
            if (d.group === 'other') return CONFIG.FORCE_CENTER_Y + 50; 
            if (d.id === 'c_photo') return CONFIG.FORCE_CENTER_Y - 90; // Photo above RS
            return CONFIG.FORCE_CENTER_Y;
        }).strength(0.5))
        .stop();

    // Warm up simulation
    for (let i = 0; i < 300; ++i) simulation.tick();

    setForceNodes(nodes);
    setForceLinks(links);
  }, []);

  // --- View Control ---
  const handleResetView = () => {
      // Logic: If panel is open, show graph partially? No, defaults to graph at top.
      // We set a default transform that frames the top graph nicely.
      setTransform({ x: 0, y: 0, scale: 1 });
  };

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
  }, [timelineNodes.length, hasAutoFit]);


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
      if (e.ctrlKey) {
          e.preventDefault();
          const zoomSensitivity = 0.002;
          const newScale = Math.min(Math.max(0.4, transform.scale - e.deltaY * zoomSensitivity), 2.0);
          setTransform(prev => ({ ...prev, scale: newScale }));
      }
  };

  // --- Helpers ---
  const getBezierPath = (link: VisualLink) => {
    let srcX = link.source.x;
    let tgtX = link.target.x;
    if (link.source.type === 'semester') srcX += 80; 
    else if (link.source.type === 'category') srcX += 55;
    if (link.target.type === 'category') tgtX -= 55; 
    else if (link.target.type === 'course') tgtX -= 100;
    const srcY = link.source.y;
    const tgtY = link.target.y;
    const midX = (srcX + tgtX) / 2;
    return `M ${srcX} ${srcY} C ${midX} ${srcY}, ${midX} ${tgtY}, ${tgtX} ${tgtY}`;
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
                <svg className="absolute top-[-5000px] left-[-5000px] w-[10000px] h-[10000px] overflow-visible pointer-events-none">
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

                        {/* Arrow Marker */}
                        <marker id="arrow" markerWidth="8" markerHeight="8" refX="22" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L9,3 z" fill="#CBD5E1" />
                        </marker>
                     </defs>

                     <g transform="translate(5000, 5000)">
                        
                        {/* --- PART A: FORCE GRAPH (Relationship) --- */}
                        <g className="force-layer">
                             
                             {/* Graph Title - Moved Up */}
                             <text 
                                x={CONFIG.FORCE_CENTER_X + 150}  // 向右移动20像素
                                y={CONFIG.FORCE_CENTER_Y - 130} // 向上移动20像素
                                textAnchor="middle" 
                                className="fill-slate-400 font-bold text-xs uppercase tracking-[0.2em]"
                             >
                                 Knowledge Graph
                             </text>

                             {/* Links */}
                             {forceLinks.map((link, i) => {
                                 const source = link.source as ForceNode;
                                 const target = link.target as ForceNode;
                                 
                                 // Line Styles
                                 const strokeDashArray = link.type === 'method-support' ? '4,4' : (link.type === 'application' ? '1,3' : 'none');
                                 const strokeWidth = link.type === 'prerequisite' ? 2 : 1.5;
                                 const isBiDirectional = link.type === 'application';

                                 return (
                                     <g key={`fl-${i}`}>
                                        <line 
                                            x1={source.x} y1={source.y}
                                            x2={target.x} y2={target.y}
                                            stroke="#94A3B8"
                                            strokeWidth={strokeWidth}
                                            strokeDasharray={strokeDashArray}
                                            opacity={0.4}
                                            markerEnd={!isBiDirectional ? "url(#arrow)" : ""}
                                        />
                                     </g>
                                 );
                             })}

                             {/* Nodes */}
                             {forceNodes.map((node, i) => {
                                 const fillId = node.status === 'studying' ? 'url(#grad-blue-light)' : (node.status === 'reviewing' ? 'url(#grad-green-light)' : 'url(#grad-gray-light)');
                                 const strokeColor = getStatusColor(node.status);
                                 const isHovered = hoveredNode === node.id;
                                 const isBreathing = node.status !== 'archived';

                                 // Font Size Logic based on node size
                                 const fontSize = node.r < 30 ? 8 : 10;

                                 return (
                                     <g 
                                        key={`fn-${node.id}`} 
                                        transform={`translate(${node.x},${node.y})`}
                                        className="transition-transform duration-300"
                                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                        onPointerDown={(e) => e.stopPropagation()} 
                                        onClick={() => onNavigate(node.status === 'studying' ? AppView.COURSE_DETAIL_STUDY : AppView.COURSE_DETAIL_REVIEW, node.id)}
                                        onMouseEnter={() => setHoveredNode(node.id)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                     >
                                         {/* Breathing Ring */}
                                         {isBreathing && (
                                            <circle r={node.r * 1.3} fill={strokeColor} opacity="0.1">
                                                <animate attributeName="r" values={`${node.r * 1.1};${node.r * 1.3};${node.r * 1.1}`} dur="4s" repeatCount="indefinite" />
                                                <animate attributeName="opacity" values="0.05;0.15;0.05" dur="4s" repeatCount="indefinite" />
                                            </circle>
                                         )}

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

                {/* Timeline DOM Nodes - Kept as is */}
                {timelineNodes.map(node => {
                    if (node.type === 'semester') {
                        return (
                            <div key={node.id} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: node.x, top: node.y }}>
                                <div className="bg-slate-800 text-white flex items-center space-x-2 px-4 py-2 rounded-xl shadow-lg border-2 border-white z-10">
                                    <CalendarRange size={14} className="text-slate-300" />
                                    <span className="text-sm font-bold whitespace-nowrap">{node.title}</span>
                                </div>
                            </div>
                        );
                    }
                    if (node.type === 'category') {
                        return (
                            <div key={node.id} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: node.x, top: node.y }}>
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
                        const isReviewing = node.data.status === 'reviewing';
                        const isStudying = node.data.status === 'studying';
                        return (
                            <div 
                                key={node.id}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => onNavigate(node.data.status === 'studying' ? AppView.COURSE_DETAIL_STUDY : AppView.COURSE_DETAIL_REVIEW, node.data.id)}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 bg-white w-[200px] h-[40px] rounded-lg shadow-sm border border-slate-100 flex items-center justify-between px-3 hover:scale-105 transition-all cursor-pointer group z-30 ${isReviewing ? 'ring-2 ring-red-50' : ''}`}
                                style={{ left: node.x, top: node.y }}
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

                {/* --- MOVED HORIZONTAL LEGEND & DIVIDER INSIDE TRANSFORM --- */}
                {!isPanelOpen && (
                    <div 
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
                        style={{ left: CONFIG.FORCE_CENTER_X, top: 325 }}
                    >
                         <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 px-4 py-2 rounded-full shadow-sm flex items-center space-x-4 pointer-events-auto">
                             {/* Status Group */}
                             <div className="flex items-center space-x-2">
                                 <div className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]"></div>
                                    <span className="text-[8px] font-bold text-slate-600">Studying</span>
                                 </div>
                                 <div className="flex items-center space-x-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]"></div>
                                    <span className="text-[8px] font-bold text-slate-600">Reviewing</span>
                                 </div>
                             </div>
                             
                             {/* Divider */}
                             <div className="w-[1px] h-2.5 bg-slate-300 opacity-50"></div>
                
                             {/* Relations Group */}
                             <div className="flex items-center space-x-2">
                                 <div className="flex items-center space-x-1">
                                    <div className="w-3 h-0.5 bg-slate-400 rounded-full"></div>
                                    <span className="text-[8px] font-bold text-slate-500">Theory</span>
                                 </div>
                                 <div className="flex items-center space-x-1">
                                    <div className="w-3 h-0.5 border-t-2 border-dashed border-slate-400"></div>
                                    <span className="text-[8px] font-bold text-slate-500">Method</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}
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
                    
                    <div className="flex space-x-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x">
                        {reviewingCourses.map(course => (
                            <div 
                                key={course.id}
                                onClick={() => onNavigate(AppView.COURSE_DETAIL_REVIEW, course.id)}
                                className="snap-start flex-shrink-0 w-[150px] h-[90px] bg-white rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-100 relative active:scale-95 transition-transform flex flex-col justify-between group"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">专业课</span>
                                    <button onClick={(e) => { e.stopPropagation(); /* open menu */ }} className="text-slate-300 hover:text-slate-600 p-1 -mr-2 -mt-2 active:bg-slate-100 rounded-full">
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{course.name}</h3>
                                    <div className="flex justify-between items-end mt-1">
                                        <p className="text-[9px] text-slate-400">01/25 更新</p>
                                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Studying Section */}
                <div className="mb-2">
                    <div className="px-6 mb-3 flex items-center">
                        <div className="w-1 h-4 bg-emerald-400 rounded-full mr-2"></div>
                        <span className="text-sm font-bold text-slate-800">学习中 (Studying)</span>
                    </div>
                    
                    <div className="flex space-x-4 overflow-x-auto px-6 pb-2 scrollbar-hide snap-x">
                        {studyingCourses.map(course => (
                            <div 
                                key={course.id}
                                onClick={() => onNavigate(AppView.COURSE_DETAIL_STUDY, course.id)}
                                className="snap-start flex-shrink-0 w-[150px] h-[90px] bg-slate-50 rounded-xl p-3 border border-slate-100 relative active:scale-95 transition-transform flex flex-col justify-between opacity-90 group"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">选修</span>
                                    <button onClick={(e) => { e.stopPropagation(); /* open menu */ }} className="text-slate-300 hover:text-slate-600 p-1 -mr-2 -mt-2 active:bg-slate-100 rounded-full">
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-700 line-clamp-1">{course.name}</h3>
                                    <div className="flex justify-between items-end mt-1">
                                        <p className="text-[9px] text-slate-400">01/20 更新</p>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                    onClick={isPanelOpen ? handleShowGraph : handleResetView} 
                    className={`active:scale-90 transition-transform ${!isPanelOpen ? 'text-blue-500 bg-blue-50 p-1.5 rounded-lg' : ''}`}
                    title={isPanelOpen ? "View Relationship Graph" : "Reset View"}
                >
                    {isPanelOpen ? <Network size={18} /> : <RefreshCw size={18} />}
                </button>
                <Search size={20} />
            </div>
        </div>

    </div>
  );
};

export default Courses;