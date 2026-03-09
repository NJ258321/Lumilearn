import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, LayoutGrid, MoreHorizontal, ChevronUp, ChevronDown, Plus, Edit2, RefreshCw, Info, Trash2, Check, X, Calendar, Archive, BookOpen, Clock } from 'lucide-react';
import { MOCK_COURSES } from '../constants';
import { AppView, Course } from '../types';

interface CoursesProps {
  onNavigate: (view: AppView, courseId?: string) => void;
}

// --- Types for Graph Layout ---
interface Node {
  id: string;
  type: 'root' | 'semester' | 'category' | 'course';
  x: number;
  y: number;
  data: any;
  color?: string;
  statusColor?: string;
}

interface Link {
  source: Node;
  target: Node;
  color: string;
}

// --- Visual Constants (Compact Horizontal Tree) ---
const CONFIG = {
    X_GAP: 180, // Horizontal distance between levels
    Y_GAP_COURSE: 70, // Vertical distance between courses
    Y_GAP_CAT: 120,
    START_X: 80,
    NODE_WIDTH: 140,
    NODE_HEIGHT: 40
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
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // 1. Data Splitting
  const reviewingCourses = useMemo(() => 
    courses.filter(c => c.status === 'reviewing').sort((a, b) => (b.lastReview || '').localeCompare(a.lastReview || '')), 
  [courses]);

  const studyingCourses = useMemo(() => 
    courses.filter(c => c.status === 'studying'), 
  [courses]);

  // 2. Graph Calculation
  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    let currentY = 300; 

    const semesters = Array.from(new Set<string>(courses.map(c => c.semester))).sort().reverse();
    
    semesters.forEach((sem: string) => {
        const semCourses = courses.filter(c => c.semester === sem);
        const semHeight = semCourses.length * CONFIG.Y_GAP_COURSE;
        const semY = currentY + semHeight / 2;

        const semNode: Node = {
            id: `sem-${sem}`,
            type: 'semester',
            x: CONFIG.START_X,
            y: semY,
            data: { label: sem.split(' ')[0] },
            color: '#334155'
        };
        nodes.push(semNode);

        const types = Array.from(new Set(semCourses.map(c => c.type))).sort();
        let typeY = currentY;

        types.forEach(type => {
            const typeCourses = semCourses.filter(c => c.type === type);
            const typeHeight = typeCourses.length * CONFIG.Y_GAP_COURSE;
            const typeCenterY = typeY + typeHeight / 2;
            const typeColor = type === 'major' ? '#3B82F6' : '#10B981';

            const typeNode: Node = {
                id: `type-${sem}-${type}`,
                type: 'category',
                x: CONFIG.START_X + CONFIG.X_GAP,
                y: typeCenterY,
                data: { label: type === 'major' ? '专业课' : '选修课' },
                color: typeColor
            };
            nodes.push(typeNode);
            links.push({ source: semNode, target: typeNode, color: '#CBD5E1' });

            typeCourses.forEach((course, idx) => {
                const courseNode: Node = {
                    id: `course-${course.id}`,
                    type: 'course',
                    x: CONFIG.START_X + CONFIG.X_GAP * 2.2, 
                    y: typeY + CONFIG.Y_GAP_COURSE / 2 + (idx * CONFIG.Y_GAP_COURSE),
                    data: course,
                    statusColor: course.status === 'reviewing' ? '#EF4444' : (course.status === 'studying' ? '#3B82F6' : '#94A3B8')
                };
                nodes.push(courseNode);
                links.push({ source: typeNode, target: courseNode, color: typeColor });
            });

            typeY += typeHeight + 40; 
        });

        currentY = typeY + 80; 
    });

    return { nodes, links };
  }, [courses]);

  useEffect(() => {
      const latestSem = nodes.find(n => n.type === 'semester');
      if (latestSem && containerRef.current) {
          const viewportH = containerRef.current.clientHeight;
          setTransform({ x: 50, y: -(latestSem.y - viewportH / 2), scale: 1 });
      }
  }, [nodes.length]); // Re-center only when node count changes (init or structure change)

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

  // --- Sheet Actions ---
  const openMenu = (e: React.MouseEvent, course: Course) => {
      e.stopPropagation();
      setSelectedCourse(course);
      setTempName(course.name);
      setSheetMode('MENU');
  };

  const closeMenu = () => {
      setSelectedCourse(null);
      setSheetMode('MENU');
  };

  const handleRename = () => {
      if (selectedCourse && tempName.trim()) {
          setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, name: tempName } : c));
          closeMenu();
      }
  };

  const handleStatusChange = (status: 'reviewing' | 'studying' | 'archived') => {
      if (selectedCourse) {
          setCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, status, lastReview: status === 'reviewing' ? (tempDate || new Date().toISOString().split('T')[0]) : c.lastReview } : c));
          closeMenu();
      }
  };

  const handleDelete = () => {
      if (selectedCourse) {
          setCourses(prev => prev.filter(c => c.id !== selectedCourse.id));
          closeMenu();
      }
  };

  // --- Render Helpers ---
  const getSigmoidPath = (x1: number, y1: number, x2: number, y2: number) => {
    const cx1 = x1 + (x2 - x1) * 0.5;
    const cx2 = x2 - (x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9] relative overflow-hidden">
        
        {/* ========================================================================
            LAYER 0: THE INFINITE CANVAS
           ======================================================================== */}
        <div 
            ref={containerRef}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none z-0"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
        >
            <div 
                className="absolute -inset-[3000px] opacity-40 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px), radial-gradient(#CBD5E1 1.5px, transparent 1.5px)',
                    backgroundSize: '40px 40px',
                    backgroundPosition: '0 0, 20px 20px',
                    backgroundColor: '#F1F5F9'
                }}
            ></div>

            <div 
                className="w-full h-full origin-center will-change-transform"
                style={{ 
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                }}
            >
                <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none">
                    {links.map((link, i) => (
                        <g key={i}>
                            <path 
                                d={getSigmoidPath(
                                    link.source.x + (link.source.type === 'semester' ? 40 : link.source.type === 'category' ? 30 : 0), 
                                    link.source.y, 
                                    link.target.x - (link.target.type === 'course' ? 70 : 30), 
                                    link.target.y
                                )}
                                fill="none"
                                stroke={link.color}
                                strokeWidth={1.5}
                                strokeOpacity={0.6}
                            />
                            <circle cx={link.target.x - (link.target.type === 'course' ? 70 : 30)} cy={link.target.y} r={2} fill={link.color} />
                        </g>
                    ))}
                </svg>

                {nodes.map(node => {
                    if (node.type === 'semester') {
                        return (
                            <div key={node.id} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: node.x, top: node.y }}>
                                <div className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-slate-600 whitespace-nowrap">
                                    {node.data.label}
                                </div>
                            </div>
                        );
                    }
                    if (node.type === 'category') {
                        return (
                            <div key={node.id} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: node.x, top: node.y }}>
                                <div className="bg-white border text-[9px] font-bold px-2 py-1 rounded-md shadow-sm whitespace-nowrap" style={{ borderColor: node.color, color: node.color }}>
                                    {node.data.label}
                                </div>
                            </div>
                        );
                    }
                    if (node.type === 'course') {
                        return (
                            <div 
                                key={node.id}
                                onClick={() => onNavigate(AppView.COURSE_DETAIL_REVIEW, node.data.id)}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white w-[140px] h-[44px] rounded-lg shadow-sm border border-slate-100 flex items-center justify-between px-3 hover:scale-105 transition-transform cursor-pointer group"
                                style={{ left: node.x, top: node.y }}
                            >
                                <span className="text-[10px] font-bold text-slate-700 truncate">{node.data.name}</span>
                                <div className="relative flex items-center justify-center w-3 h-3">
                                    <span className="absolute w-full h-full rounded-full opacity-30 animate-ping" style={{ backgroundColor: node.statusColor }}></span>
                                    <span className="relative w-2 h-2 rounded-full" style={{ backgroundColor: node.statusColor }}></span>
                                </div>
                            </div>
                        )
                    }
                    return null;
                })}
            </div>
            
            <div className="absolute top-24 left-6 pointer-events-none">
                <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase">Archive Map</h2>
                <p className="text-[10px] text-slate-300">Infinite Canvas</p>
            </div>
        </div>


        {/* ========================================================================
            LAYER 1: TOP DASHBOARD SHEET
           ======================================================================== */}
        <div 
            className={`absolute top-[48px] left-0 right-0 bg-white rounded-b-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] z-20 transition-all duration-500 ease-in-out border-b border-slate-100 flex flex-col overflow-hidden ${isPanelOpen ? 'max-h-[500px]' : 'max-h-0'}`}
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
                                    <button onClick={(e) => openMenu(e, course)} className="text-slate-300 hover:text-slate-600 p-1 -mr-2 -mt-2 active:bg-slate-100 rounded-full">
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
                                    <button onClick={(e) => openMenu(e, course)} className="text-slate-300 hover:text-slate-600 p-1 -mr-2 -mt-2 active:bg-slate-100 rounded-full">
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
                        <div className="snap-start flex-shrink-0 w-[150px] h-[90px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 active:bg-slate-50 transition-colors">
                            <Plus size={20} className="mb-1" />
                            <span className="text-[10px] font-bold">添加课程</span>
                        </div>
                    </div>
                </div>
            </div>

            <div 
                className="h-6 w-full flex items-center justify-center bg-white border-t border-slate-50 active:bg-slate-50 cursor-pointer"
                onClick={() => setIsPanelOpen(!isPanelOpen)}
            >
                {isPanelOpen ? <ChevronUp size={16} className="text-slate-300" /> : <ChevronDown size={16} className="text-slate-300" />}
            </div>
        </div>

        {/* Sticky App Bar */}
        <div className="h-[48px] bg-white sticky top-0 z-50 flex justify-between items-center px-6 border-b border-slate-100 shadow-sm">
            <div className="flex items-center space-x-2" onClick={() => setIsPanelOpen(!isPanelOpen)}>
                <h1 className="text-lg font-extrabold text-slate-800">课程中心</h1>
                {!isPanelOpen && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded animate-fade-in">全景视图</span>}
            </div>
            <div className="flex space-x-4 text-slate-500">
                <Search size={20} />
                <LayoutGrid size={20} />
            </div>
        </div>

        {/* ========================================================================
            MODAL BOTTOM SHEET
           ======================================================================== */}
        {selectedCourse && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300" 
                    onClick={closeMenu}
                ></div>
                
                {/* Sheet Content */}
                <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 z-[70] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-300 pb-10">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>

                    {/* Header */}
                    <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-800 truncate">{selectedCourse.name}</h2>
                            <p className="text-xs text-slate-400 mt-1">{selectedCourse.semester}</p>
                        </div>
                        <button onClick={closeMenu} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-800">
                            <X size={20} />
                        </button>
                    </div>

                    {/* VIEW: MAIN MENU */}
                    {sheetMode === 'MENU' && (
                        <div className="space-y-2">
                             <button onClick={() => setSheetMode('RENAME')} className="w-full flex items-center p-4 rounded-xl hover:bg-slate-50 active:scale-98 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-100">
                                    <Edit2 size={18} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="text-sm font-bold text-slate-700">重命名课程</div>
                                    <div className="text-[10px] text-slate-400">修改课程显示名称</div>
                                </div>
                             </button>

                             <button onClick={() => setSheetMode('STATUS')} className="w-full flex items-center p-4 rounded-xl hover:bg-slate-50 active:scale-98 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mr-4 group-hover:bg-emerald-100">
                                    <RefreshCw size={18} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="text-sm font-bold text-slate-700">切换状态</div>
                                    <div className="text-[10px] text-slate-400">
                                        当前: <span className="uppercase font-bold text-slate-500">{selectedCourse.status}</span>
                                    </div>
                                </div>
                             </button>

                             <button onClick={() => setSheetMode('INFO')} className="w-full flex items-center p-4 rounded-xl hover:bg-slate-50 active:scale-98 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mr-4 group-hover:bg-purple-100">
                                    <Info size={18} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="text-sm font-bold text-slate-700">课程详情</div>
                                    <div className="text-[10px] text-slate-400">查看元数据与学分</div>
                                </div>
                             </button>

                             <button onClick={() => setSheetMode('DELETE')} className="w-full flex items-center p-4 rounded-xl hover:bg-red-50 active:scale-98 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mr-4 group-hover:bg-red-100">
                                    <Trash2 size={18} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="text-sm font-bold text-red-500">删除课程</div>
                                    <div className="text-[10px] text-red-300">此操作不可撤销</div>
                                </div>
                             </button>
                        </div>
                    )}

                    {/* VIEW: RENAME */}
                    {sheetMode === 'RENAME' && (
                        <div className="animate-in slide-in-from-right duration-200">
                            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Edit Name</h3>
                            <input 
                                autoFocus
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="w-full text-2xl font-bold text-slate-800 border-b-2 border-slate-200 py-2 focus:outline-none focus:border-blue-500 bg-transparent mb-8"
                            />
                            <div className="flex space-x-3">
                                <button onClick={() => setSheetMode('MENU')} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-500">取消</button>
                                <button onClick={handleRename} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white shadow-lg shadow-blue-200">保存</button>
                            </div>
                        </div>
                    )}

                    {/* VIEW: STATUS */}
                    {sheetMode === 'STATUS' && (
                        <div className="animate-in slide-in-from-right duration-200">
                            <h3 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wider">Select Status</h3>
                            
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                {[
                                    { id: 'reviewing', label: '复习中', icon: BookOpen, color: 'blue' },
                                    { id: 'studying', label: '学习中', icon: Clock, color: 'emerald' },
                                    { id: 'archived', label: '已结课', icon: Archive, color: 'slate' }
                                ].map((s) => {
                                    const isSelected = selectedCourse.status === s.id;
                                    return (
                                        <button 
                                            key={s.id}
                                            onClick={() => handleStatusChange(s.id as any)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all active:scale-95 ${isSelected ? `border-${s.color}-500 bg-${s.color}-50` : 'border-slate-100 bg-white'}`}
                                        >
                                            <s.icon size={24} className={`mb-2 ${isSelected ? `text-${s.color}-600` : 'text-slate-400'}`} />
                                            <span className={`text-xs font-bold ${isSelected ? `text-${s.color}-700` : 'text-slate-500'}`}>{s.label}</span>
                                            {isSelected && <div className={`w-2 h-2 mt-2 rounded-full bg-${s.color}-500`}></div>}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Conditional Date Picker for Reviewing */}
                            {selectedCourse.status !== 'reviewing' && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
                                    <Info className="text-blue-500 mt-0.5" size={16} />
                                    <div className="text-xs text-blue-700">
                                        <span className="font-bold block mb-1">切换到“复习中”？</span>
                                        系统将为此课程开启考试倒计时，请确保你已知晓考试日期。
                                    </div>
                                </div>
                            )}
                            
                            <button onClick={() => setSheetMode('MENU')} className="w-full mt-4 py-3 text-slate-400 font-bold text-sm">返回</button>
                        </div>
                    )}

                    {/* VIEW: DELETE */}
                    {sheetMode === 'DELETE' && (
                        <div className="animate-in slide-in-from-right duration-200 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">确认删除该课程？</h3>
                            <p className="text-sm text-slate-500 mb-8 px-6">"{selectedCourse.name}" 将被永久移除，所有的学习记录、笔记和录音都将消失。</p>
                            
                            <div className="flex space-x-3">
                                <button onClick={() => setSheetMode('MENU')} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">再想想</button>
                                <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 rounded-xl font-bold text-white shadow-lg shadow-red-200">确认删除</button>
                            </div>
                        </div>
                    )}

                    {/* VIEW: INFO */}
                    {sheetMode === 'INFO' && (
                        <div className="animate-in slide-in-from-right duration-200">
                            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Metadata</h3>
                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Course ID</span>
                                    <span className="text-sm font-mono text-slate-800">{selectedCourse.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Type</span>
                                    <span className="text-sm font-bold text-slate-800 uppercase">{selectedCourse.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Semester</span>
                                    <span className="text-sm text-slate-800">{selectedCourse.semester}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Last Review</span>
                                    <span className="text-sm text-slate-800">{selectedCourse.lastReview || 'Never'}</span>
                                </div>
                            </div>
                            <button onClick={() => setSheetMode('MENU')} className="w-full mt-6 py-3 bg-slate-200 rounded-xl font-bold text-slate-600">返回</button>
                        </div>
                    )}

                </div>
            </div>
        )}
    </div>
  );
};

export default Courses;