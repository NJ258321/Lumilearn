import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Flame, Play, Target, CheckCircle2, Folder, Plus, Minus, Edit3, Trash2, X, Save, HelpCircle, RotateCcw } from 'lucide-react';
import { AppView } from '../types';

interface CourseDetailReviewProps {
  onNavigate: (view: AppView) => void;
}

// --- 1. DATA STRUCTURE ---
const INITIAL_DATA = {
  id: "course-001",
  title: "摄影测量学",
  children: [ 
    {
      id: "cat-1",
      title: "绪论",
      type: "category",
      children: [ 
        { 
            id: "ch-1", title: "第一章：绪论", type: "chapter", 
            children: [ 
                { id: "l-1-1", title: "摄影测量定义", status: "mastered", type: "leaf" },
                { id: "l-1-2", title: "发展历程", status: "mastered", type: "leaf" }
            ]
        }
      ]
    },
    {
      id: "cat-2",
      title: "解析摄影测量",
      type: "category",
      children: [
        { 
            id: "ch-2", title: "第二章：单幅影像解析基础", type: "chapter",
            children: [
                { id: "l-2-1", title: "中心投影构像", status: "mastered", type: "leaf" },
                { id: "l-2-2", title: "常用坐标系", status: "reviewing", type: "leaf" },
                { id: "l-2-3", title: "共线条件方程", status: "weak", type: "leaf" },
                { id: "l-2-4", title: "空间后方交会", status: "reviewing", type: "leaf" }
            ]
        },
        { 
            id: "ch-3", title: "第三章：双像立体测图", type: "chapter",
            children: [
                { id: "l-3-1", title: "立体视觉原理", status: "mastered", type: "leaf" },
                { id: "l-3-2", title: "核线相关", status: "weak", type: "leaf" }
            ]
        },
        { 
            id: "ch-4", title: "第四章：解析空中三角测量", type: "chapter",
            children: [
                { id: "l-4-1", title: "解析空三相关知识", status: "mastered", type: "leaf" },
                { id: "l-4-2", title: "光束法空中三角测量", status: "reviewing", type: "leaf" },
                { id: "l-4-3", title: "解析空三最新发展", status: "weak", type: "leaf" }
            ]
        }
      ]
    },
    {
      id: "cat-3",
      title: "数字摄影测量",
      type: "category",
      children: [
        { 
            id: "ch-5", title: "第五章：数字影像与特征提取", type: "chapter",
            children: [
                { id: "l-5-1", title: "数字影像采样", status: "mastered", type: "leaf" },
                { id: "l-5-2", title: "影像重采样理论", status: "reviewing", type: "leaf" },
                { id: "l-5-3", title: "特征提取算法", status: "weak", type: "leaf" }
            ]
        },
        { 
            id: "ch-6", title: "第六章：影像匹配基础", type: "chapter",
            children: [
                { id: "l-6-1", title: "影像相关原理", status: "mastered", type: "leaf" },
                { id: "l-6-2", title: "最小二乘影像匹配", status: "weak", type: "leaf" },
                { id: "l-6-3", title: "特征匹配", status: "mastered", type: "leaf" }
            ]
        }
      ]
    }
  ]
};

// --- 2. CONFIG & TYPES ---
const CONFIG = {
    MACRO_GAP_Y: 70, 
    MICRO_GAP_Y: 50, // More compact vertical spacing for leaves
    LEVEL_X_OFFSET: [0, 280, 500, 780], 
    SHOW_LEAF_THRESHOLD: 1.1, 
    SHEET_MIN_HEIGHT: 140,
    SHEET_MAX_HEIGHT: 600, // Safe max height
};

interface VisualNode {
    id: string;
    title: string;
    type: 'root' | 'category' | 'chapter' | 'leaf';
    x: number;
    y: number;
    status?: string; 
    visible: boolean;
    parent?: VisualNode;
    data?: any; 
}

interface VisualLink {
    source: VisualNode;
    target: VisualNode;
}

// Helper for pinch distance
const getDistance = (p1: React.PointerEvent, p2: React.PointerEvent) => {
    return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
};

const CourseDetailReview: React.FC<CourseDetailReviewProps> = ({ onNavigate }) => {
  // --- STATE: Data ---
  const [courseData, setCourseData] = useState(INITIAL_DATA);
  const [editingNode, setEditingNode] = useState<any | null>(null);

  // --- STATE: Canvas ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 }); 
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [hasAutoFit, setHasAutoFit] = useState(false);

  // --- STATE: Pinch Zoom ---
  const evCache = useRef<Map<number, React.PointerEvent>>(new Map());
  const prevDiff = useRef(-1);

  // --- STATE: Bottom Sheet ---
  const [sheetHeight, setSheetHeight] = useState(CONFIG.SHEET_MIN_HEIGHT); 
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const sheetStartY = useRef(0);
  const sheetStartHeight = useRef(0);

  // Determine Mode based on scale
  const isMicro = transform.scale >= CONFIG.SHOW_LEAF_THRESHOLD;

  // --- ACTIONS ---
  const handleManualZoom = (factor: number) => {
    setTransform(prev => {
        const newScale = Math.min(Math.max(0.4, prev.scale + factor), 2.5);
        return { ...prev, scale: newScale };
    });
  };

  const handleResetView = () => {
    if (containerRef.current && treeHeight > 0) {
        const { clientHeight } = containerRef.current;
        const desiredHeight = treeHeight + 200; 
        let initialScale = clientHeight / desiredHeight;
        initialScale = Math.min(Math.max(initialScale, 0.5), 1.1);

        const treeCenterY = treeHeight / 2;
        const screenCenterY = clientHeight / 2;
        const initialY = screenCenterY - (treeCenterY * initialScale);
        const initialX = 40 - (CONFIG.LEVEL_X_OFFSET[1] * initialScale);

        setTransform({ x: initialX, y: initialY, scale: initialScale });
    }
  };

  const updateData = (action: 'add' | 'update' | 'delete', targetId: string, payload?: any) => {
    const newData = JSON.parse(JSON.stringify(courseData));
    
    const recurse = (node: any, parent: any) => {
        if (action === 'add' && node.id === targetId) {
             if (!node.children) node.children = [];
             node.children.push({
                 id: `l-${Date.now()}`,
                 title: "新知识点",
                 status: "weak",
                 type: "leaf"
             });
             return true;
        }
        
        if (action === 'update' && node.id === targetId) {
            Object.assign(node, payload);
            return true;
        }

        if (action === 'delete' && node.id === targetId && parent) {
            parent.children = parent.children.filter((c: any) => c.id !== targetId);
            return true;
        }

        if (node.children) {
            for (const child of node.children) {
                if (recurse(child, node)) return true;
            }
        }
        return false;
    };

    recurse(newData, null);
    setCourseData(newData);
  };

  const handleAddLeaf = (chapterId: string) => {
      updateData('add', chapterId);
  };

  const handleSaveEdit = () => {
      if (editingNode) {
          updateData('update', editingNode.id, { title: editingNode.title, status: editingNode.status });
          setEditingNode(null);
      }
  };

  const handleDeleteNode = () => {
      if (editingNode) {
          updateData('delete', editingNode.id);
          setEditingNode(null);
      }
  };

  // --- LAYOUT ENGINE ---
  const { nodes, links, treeHeight, spine } = useMemo(() => {
    const nodes: VisualNode[] = [];
    const links: VisualLink[] = [];
    let currentY = 0;

    const traverse = (data: any, level: number, parentNode?: VisualNode) => {
        if (level === 3 && !isMicro) return null;

        const node: VisualNode = {
            id: data.id || 'root',
            title: data.title,
            type: data.type || 'root',
            x: CONFIG.LEVEL_X_OFFSET[level],
            y: 0, 
            status: data.status,
            visible: true,
            data: data
        };

        const childNodes: VisualNode[] = [];
        if (data.children && data.children.length > 0) {
            data.children.forEach((child: any) => {
                const childNode = traverse(child, level + 1, node);
                if (childNode) childNodes.push(childNode);
            });
        }

        if (childNodes.length === 0) {
            node.y = currentY;
            currentY += isMicro ? CONFIG.MICRO_GAP_Y : CONFIG.MACRO_GAP_Y;
            if (level === 2 && !isMicro) currentY += 20; 
        } else {
            const firstChild = childNodes[0];
            const lastChild = childNodes[childNodes.length - 1];
            node.y = (firstChild.y + lastChild.y) / 2;
        }

        nodes.push(node);
        if (parentNode) {
            links.push({ source: parentNode, target: node });
        }
        return node;
    };

    traverse(courseData, 0);

    const catNodes = nodes.filter(n => n.type === 'category');
    let spineData = null;
    if (catNodes.length > 1) {
        spineData = {
            x: CONFIG.LEVEL_X_OFFSET[1] - 40, 
            yTop: catNodes[0].y,
            yBottom: catNodes[catNodes.length - 1].y
        };
    }

    return { nodes, links, treeHeight: currentY, spine: spineData };
  }, [isMicro, courseData]);


  // --- AUTO-FIT ON MOUNT ---
  useEffect(() => {
    if (containerRef.current && !hasAutoFit && treeHeight > 0) {
        const { clientHeight } = containerRef.current;
        const desiredHeight = treeHeight + 200; 
        let initialScale = clientHeight / desiredHeight;
        initialScale = Math.min(Math.max(initialScale, 0.5), 1.1);

        const treeCenterY = treeHeight / 2;
        const screenCenterY = clientHeight / 2;
        const initialY = screenCenterY - (treeCenterY * initialScale);
        const initialX = 40 - (CONFIG.LEVEL_X_OFFSET[1] * initialScale);

        setTransform({ x: initialX, y: initialY, scale: initialScale });
        setHasAutoFit(true);
    }
  }, [treeHeight, hasAutoFit]);


  // --- INTERACTION: Canvas ---
  const handlePointerDown = (e: React.PointerEvent) => {
    containerRef.current?.setPointerCapture(e.pointerId);
    evCache.current.set(e.pointerId, e);
    
    if (evCache.current.size === 2) {
        setIsDragging(false); 
        const points = Array.from(evCache.current.values());
        prevDiff.current = getDistance(points[0], points[1]);
    } else if (evCache.current.size === 1) {
        setIsDragging(true);
        lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (evCache.current.has(e.pointerId)) {
        evCache.current.set(e.pointerId, e);
    }

    if (evCache.current.size === 2) {
        const points = Array.from(evCache.current.values());
        const curDiff = getDistance(points[0], points[1]);

        if (prevDiff.current > 0) {
            const delta = curDiff - prevDiff.current;
            const zoomSensitivity = 0.005; 
            const newScale = Math.min(Math.max(0.4, transform.scale + delta * zoomSensitivity), 2.5);
            setTransform(prev => ({ ...prev, scale: newScale }));
        }
        prevDiff.current = curDiff;
        return;
    }

    if (isDragging && evCache.current.size === 1) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    containerRef.current?.releasePointerCapture(e.pointerId);
    evCache.current.delete(e.pointerId);
    if (evCache.current.size < 2) prevDiff.current = -1;
    if (evCache.current.size === 0) setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomSensitivity = 0.002;
        const newScale = Math.min(Math.max(0.4, transform.scale - e.deltaY * zoomSensitivity), 2.5);
        setTransform(prev => ({ ...prev, scale: newScale }));
    } else {
        setTransform(prev => ({ ...prev, y: prev.y - e.deltaY }));
    }
  };

  // --- INTERACTION: Sheet Drag ---
  const handleSheetDragStart = (e: React.PointerEvent) => {
    e.stopPropagation(); 
    setIsSheetDragging(true);
    sheetStartY.current = e.clientY;
    sheetStartHeight.current = sheetHeight;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const handleSheetDragMove = (e: React.PointerEvent) => {
    if (!isSheetDragging) return;
    e.stopPropagation();
    const deltaY = sheetStartY.current - e.clientY; 
    let newHeight = sheetStartHeight.current + deltaY;
    
    // Constraint Logic
    if (newHeight > CONFIG.SHEET_MAX_HEIGHT) {
        // Resistance when pulling past max
        newHeight = CONFIG.SHEET_MAX_HEIGHT + (newHeight - CONFIG.SHEET_MAX_HEIGHT) * 0.2;
    }
    if (newHeight < CONFIG.SHEET_MIN_HEIGHT) {
        newHeight = CONFIG.SHEET_MIN_HEIGHT; // Hard Stop at bottom
    }
    
    setSheetHeight(newHeight);
  };

  const handleSheetDragEnd = (e: React.PointerEvent) => {
    setIsSheetDragging(false);
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    
    const SNAP_THRESHOLD = 250;
    if (sheetHeight > SNAP_THRESHOLD) {
        setSheetHeight(Math.min(window.innerHeight * 0.6, CONFIG.SHEET_MAX_HEIGHT));
    } else {
        setSheetHeight(CONFIG.SHEET_MIN_HEIGHT);
    }
  };

  // --- RENDER HELPERS ---
  const getBezierPath = (link: VisualLink) => {
    const srcX = link.source.x + (link.source.type === 'root' ? 140 : 160); 
    const srcY = link.source.y;
    const tgtX = link.target.x;
    const tgtY = link.target.y;
    const midX = (srcX + tgtX) / 2;
    return `M ${srcX} ${srcY} C ${midX} ${srcY}, ${midX} ${tgtY}, ${tgtX} ${tgtY}`;
  };

  return (
    <div className="h-screen w-full bg-[#F8FAFC] overflow-hidden relative font-sans text-slate-800 flex flex-col">
        
        {/* --- HEADER --- */}
        <div className="absolute top-0 left-0 right-0 z-30 pt-12 pb-4 px-6 bg-gradient-to-b from-white/95 via-white/80 to-transparent pointer-events-none">
             <div className="pointer-events-auto flex items-center">
                <button onClick={() => onNavigate(AppView.COURSES)} className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mr-3 active:scale-95 transition-transform">
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
                        摄影测量学
                        <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Reviewing</span>
                    </h1>
                </div>
             </div>
        </div>

        {/* --- LEGEND (Visible on Micro Zoom) --- */}
        {isMicro && (
            <div className="absolute top-28 right-4 bg-white/90 backdrop-blur-md border border-slate-100 p-3 rounded-2xl shadow-sm z-30 flex flex-col space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></div>
                    <span className="text-[10px] font-bold text-slate-600">已掌握</span>
                </div>
                <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-[10px] font-bold text-slate-600">复习中</span>
                </div>
                <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                    <span className="text-[10px] font-bold text-slate-600">薄弱项</span>
                </div>
            </div>
        )}

        {/* --- CANVAS --- */}
        <div 
            ref={containerRef}
            className="absolute inset-0 z-0 touch-none overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
        >
            <div 
                className="absolute inset-[-200%] opacity-40 pointer-events-none"
                style={{
                    transform: `translate(${transform.x % 40}px, ${transform.y % 40}px)`,
                    backgroundImage: 'radial-gradient(#94A3B8 1.5px, transparent 1.5px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div 
                className="w-full h-full origin-top-left will-change-transform"
                style={{ 
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transition: (isDragging || evCache.current.size > 0) ? 'none' : 'transform 0.1s linear'
                }}
            >
                <svg className="absolute top-[-5000px] left-[-5000px] w-[10000px] h-[10000px] overflow-visible pointer-events-none">
                    <g transform="translate(5000, 5000)">
                        {spine && (
                            <line 
                                x1={spine.x} y1={spine.yTop} 
                                x2={spine.x} y2={spine.yBottom} 
                                stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" 
                                className="opacity-50"
                            />
                        )}
                        
                        {links.map((link, i) => {
                            const isRootLink = link.source.type === 'root';
                            return (
                                <path 
                                    key={i}
                                    d={getBezierPath(link)}
                                    fill="none"
                                    stroke={isRootLink ? "#E2E8F0" : "#CBD5E1"} 
                                    strokeWidth={link.target.type === 'leaf' ? 1 : 2}
                                    strokeDasharray={isRootLink ? "4 4" : ""}
                                    className="transition-all"
                                    style={{ transitionDuration: '300ms' }}
                                />
                            );
                        })}

                        {nodes.filter(n => n.type === 'category' && spine).map((node, i) => (
                             <line 
                                key={`spine-con-${i}`}
                                x1={spine!.x} y1={node.y}
                                x2={node.x} y2={node.y}
                                stroke="#CBD5E1" strokeWidth="2"
                             />
                        ))}
                    </g>
                </svg>

                {nodes.map(node => (
                    <div 
                        key={node.id}
                        className="absolute flex items-center justify-center transform -translate-y-1/2 transition-all"
                        style={{ 
                            left: node.x, 
                            top: node.y,
                            transitionDuration: '300ms',
                            zIndex: node.type === 'leaf' ? 10 : 20
                        }}
                    >
                        {node.type === 'root' && (
                            <div className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl border-4 border-slate-100 min-w-[160px] text-center opacity-50 hover:opacity-100 transition-opacity">
                                <span className="font-bold text-lg whitespace-nowrap">{node.title}</span>
                            </div>
                        )}
                        {node.type === 'category' && (
                            <div className="bg-blue-50 text-blue-700 border-2 border-blue-200 px-4 py-2 rounded-2xl shadow-sm min-w-[140px] text-center">
                                <span className="font-bold text-sm whitespace-nowrap">{node.title}</span>
                            </div>
                        )}
                        {node.type === 'chapter' && (
                            <div 
                                className={`relative bg-white border border-slate-200 border-l-4 border-l-blue-500 pl-4 pr-6 py-3 rounded-xl shadow-sm min-w-[200px] flex justify-between items-center transition-all ${isMicro ? 'scale-100' : 'scale-95'}`}
                            >
                                <span className="font-bold text-slate-700 text-sm whitespace-nowrap">{node.title}</span>
                                {!isMicro && (
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center ml-2">
                                        <ChevronRight size={14} className="text-slate-400" />
                                    </div>
                                )}
                                {isMicro && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleAddLeaf(node.id); }}
                                        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md active:scale-95 z-20"
                                    >
                                        <Plus size={14} className="text-white" />
                                    </button>
                                )}
                            </div>
                        )}
                        {node.type === 'leaf' && (
                            <div 
                                onClick={() => setEditingNode({ ...node.data })}
                                className={`
                                    relative bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-3 shadow-sm flex items-center cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300
                                    w-auto max-w-[180px] min-w-[120px]
                                    ${node.status === 'weak' ? 'ring-2 ring-yellow-100' : ''}
                                `}
                            >
                                {/* Status Indicator Bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                                    node.status === 'weak' ? 'bg-yellow-400' :
                                    node.status === 'reviewing' ? 'bg-red-500' :
                                    'bg-emerald-400'
                                }`}></div>
                                
                                <span className={`text-xs ml-2 truncate ${node.status === 'weak' ? 'font-extrabold text-slate-800' : 'font-medium text-slate-600'}`}>
                                    {node.title}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* --- ZOOM CONTROLS --- */}
        <div className="absolute bottom-[200px] right-4 flex flex-col space-y-3 z-30">
            <button 
                onClick={() => handleManualZoom(0.25)}
                className="w-10 h-10 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-600 active:bg-blue-50 active:text-blue-600 transition-colors"
            >
                <Plus size={20} />
            </button>
            <button 
                onClick={() => handleManualZoom(-0.25)}
                className="w-10 h-10 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-600 active:bg-blue-50 active:text-blue-600 transition-colors"
            >
                <Minus size={20} />
            </button>
            <button 
                onClick={handleResetView}
                className="w-10 h-10 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-600 active:bg-blue-50 active:text-blue-600 transition-colors"
            >
                <RotateCcw size={18} />
            </button>
        </div>

        {/* --- TASK BOTTOM SHEET --- */}
        {!editingNode && (
            <div 
                className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-[32px] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] flex flex-col"
                style={{ 
                    height: sheetHeight,
                    transition: isSheetDragging ? 'none' : 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
            >
                <div 
                    className="w-full pt-4 pb-2 cursor-grab active:cursor-grabbing flex flex-col items-center flex-none bg-white rounded-t-[32px] touch-none"
                    onPointerDown={handleSheetDragStart}
                    onPointerMove={handleSheetDragMove}
                    onPointerUp={handleSheetDragEnd}
                >
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-3"></div>
                    <div className="px-6 w-full flex justify-between items-center text-slate-800">
                        <div className="flex items-center">
                            <Flame size={16} className="text-orange-500 mr-2" fill="#F97316" />
                            <h3 className="text-sm font-bold">今日待办 (2)</h3>
                        </div>
                        {sheetHeight < 200 && <span className="text-[10px] text-slate-400">Swipe up</span>}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 mt-2">
                    <div className="space-y-4">
                        <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 active:bg-blue-50 active:border-blue-100 transition-colors cursor-pointer" onClick={() => onNavigate(AppView.TIME_MACHINE)}>
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-4">
                                <Target size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-sm">重点突破：共线条件方程</h4>
                                <p className="text-xs text-slate-500">预计 15 分钟 · 关联 3 个考点</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                                <Play size={14} className="text-slate-400 ml-0.5" fill="currentColor"/>
                            </div>
                        </div>

                        <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-sm">章节测验：第二章</h4>
                                <p className="text-xs text-slate-500">5 道错题待复习</p>
                            </div>
                        </div>

                        {/* --- RESTORED RESOURCES SECTION --- */}
                        <div className="pt-4 border-t border-slate-100">
                             <h5 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Resources</h5>
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="bg-white border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                                     <Folder size={20} className="text-blue-500 mb-2" />
                                     <span className="text-xs font-bold text-slate-700">课件 PPT</span>
                                 </div>
                                 <div className="bg-white border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                                     <Play size={20} className="text-red-500 mb-2" />
                                     <span className="text-xs font-bold text-slate-700">结构化文档</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- EDIT NODE MODAL SHEET --- */}
        {editingNode && (
            <div className="absolute inset-0 z-50 flex items-end justify-center">
                <div 
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
                    onClick={() => setEditingNode(null)}
                ></div>
                <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 z-50 shadow-2xl animate-in slide-in-from-bottom duration-300">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                    
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-2">
                            <Edit3 size={18} className="text-blue-600" />
                            <h3 className="text-lg font-bold text-slate-800">编辑知识点</h3>
                        </div>
                        <button onClick={() => setEditingNode(null)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">标题</label>
                            <input 
                                value={editingNode.title}
                                onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                                className="w-full text-lg font-bold text-slate-800 border-b-2 border-slate-200 py-2 focus:outline-none focus:border-blue-500 bg-transparent"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">状态</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['weak', 'reviewing', 'mastered'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setEditingNode({ ...editingNode, status })}
                                        className={`py-2 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                                            editingNode.status === status
                                            ? status === 'weak' ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                                            : status === 'reviewing' ? 'border-red-400 bg-red-50 text-red-700'
                                            : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-100 bg-white text-slate-400'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button 
                            onClick={handleDeleteNode}
                            className="p-4 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button 
                            onClick={handleSaveEdit}
                            className="flex-1 bg-blue-600 text-white rounded-2xl font-bold py-4 shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center space-x-2"
                        >
                            <Save size={18} />
                            <span>保存更改</span>
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => { setEditingNode(null); onNavigate(AppView.TIME_MACHINE); }}
                        className="w-full mt-3 py-3 text-slate-400 font-bold text-xs flex items-center justify-center space-x-1"
                    >
                        <Play size={12} />
                        <span>进入 Time Machine 学习此知识点</span>
                    </button>
                </div>
            </div>
        )}

        {/* ZOOM HINT OVERLAY (Only show if not already micro) */}
        {!isMicro && !editingNode && (
            <div className="absolute bottom-[280px] left-1/2 transform -translate-x-1/2 bg-slate-800/80 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold pointer-events-none animate-pulse transition-opacity duration-300">
                双指捏合展开详情 (Zoom)
            </div>
        )}
    </div>
  );
};

export default CourseDetailReview;