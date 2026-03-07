import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronRight, Flame, Play, Target, CheckCircle2, Folder, Plus, Minus, Edit3, Trash2, X, Save, HelpCircle, RotateCcw, Loader2, AlertCircle, Clock, FileText, Calendar, Search } from 'lucide-react';
import { AppView } from '../types';
import { getStudyRecordList, updateStudyRecord, deleteStudyRecord } from '../src/api/studyRecords';
import type { StudyRecord } from '../types';

interface CourseDetailReviewProps {
  onNavigate: (view: AppView, data?: any) => void;
  courseId?: string | null;
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
    MICRO_GAP_Y: 50, 
    // Tightened Layout: [Root, Category, Chapter, Leaf]
    // Increased gap between Chapter (L2) and Leaf (L3) to prevent overlap
    LEVEL_X_OFFSET: [0, 180, 360, 580], 
    SHOW_LEAF_THRESHOLD: 1.0, 
    SHEET_MIN_HEIGHT: 140,
    SHEET_MAX_HEIGHT: 600, 
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

const CourseDetailReview: React.FC<CourseDetailReviewProps> = ({ onNavigate, courseId }) => {
  // --- STATE: Data ---
  const [courseData, setCourseData] = useState(INITIAL_DATA);
  const [editingNode, setEditingNode] = useState<any | null>(null);

  // --- API State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);
  const [notesContent, setNotesContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // --- Fetch Study Records ---
  const fetchStudyRecords = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = { courseId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await getStudyRecordList(params);
      if (response.success && response.data) {
        setStudyRecords(response.data || []);
      } else {
        setError(response.error || '加载学习记录失败');
      }
    } catch (err) {
      setError('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  }, [courseId, startDate, endDate]);

  // Initial fetch
  useEffect(() => {
    fetchStudyRecords();
  }, [fetchStudyRecords]);

  // --- Search by Date Range ---
  const handleSearchByDate = () => {
    fetchStudyRecords();
  };

  // --- Clear Date Filter ---
  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  // --- Update Notes ---
  const handleUpdateNotes = async () => {
    if (!editingRecord) return;
    setLoading(true);
    try {
      const response = await updateStudyRecord(editingRecord.id, { notes: notesContent });
      if (response.success) {
        setShowNotesModal(false);
        setEditingRecord(null);
        setNotesContent('');
        fetchStudyRecords();
      } else {
        setError(response.error || '保存笔记失败');
      }
    } catch (err) {
      setError('保存笔记失败');
    } finally {
      setLoading(false);
    }
  };

  // --- Delete Record ---
  const handleDeleteRecord = async (id: string) => {
    setLoading(true);
    try {
      const response = await deleteStudyRecord(id);
      if (response.success) {
        setShowDeleteConfirm(null);
        fetchStudyRecords();
      } else {
        setError(response.error || '删除失败');
      }
    } catch (err) {
      setError('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // --- Open Notes Modal ---
  const openNotesModal = (record: StudyRecord) => {
    setEditingRecord(record);
    setNotesContent(record.notes || '');
    setShowNotesModal(true);
  };

  // --- Format Duration ---
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- Format Date ---
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // --- STATE: Canvas ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 }); 
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [hasAutoFit, setHasAutoFit] = useState(false);
  
  // Focus & Interaction State
  const [focusedChapterId, setFocusedChapterId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const lastTap = useRef({ time: 0, id: '' });
  
  // Hint State
  const [showHint, setShowHint] = useState(true);

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

  // Auto-hide hint
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // --- ACTIONS ---
  const handleManualZoom = (factor: number) => {
    setTransform(prev => {
        const newScale = Math.min(Math.max(0.4, prev.scale + factor), 2.5);
        return { ...prev, scale: newScale };
    });
  };

  const handleResetView = () => {
    setFocusedChapterId(null);
    if (containerRef.current && treeHeight > 0) {
        const { clientHeight } = containerRef.current;
        // Optimization: Reduced padding for larger initial view
        const desiredHeight = treeHeight + 50; 
        let initialScale = clientHeight / desiredHeight;
        // Optimization: Increased max initial scale
        initialScale = Math.min(Math.max(initialScale, 0.5), 1.1);

        const treeCenterY = treeHeight / 2;
        const screenCenterY = clientHeight / 2;
        // Added 120px offset to move graph down from the top header
        const initialY = screenCenterY - (treeCenterY * initialScale) + 120;
        
        // Align Category (L1) roughly to the left
        const initialX = 50 - (CONFIG.LEVEL_X_OFFSET[1] * initialScale);

        setTransform({ x: initialX, y: initialY, scale: initialScale });
    }
  };

  const focusChapter = (nodeId: string) => {
      setFocusedChapterId(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      
      if (node && containerRef.current) {
          const { clientHeight } = containerRef.current;
          
          const targetScale = 0.9; 
          
          const targetY = (clientHeight / 2) - (node.y * targetScale);
          // Position Chapter (L2) at x=50 to allow space for L3 on the right
          const targetX = 50 - (node.x * targetScale);
          
          setTransform({ x: targetX, y: targetY, scale: targetScale });
          
          setHighlightedNodeId(nodeId);
          setTimeout(() => setHighlightedNodeId(null), 1000);
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
        // Force show leaves if their parent is the focused chapter
        const isParentFocused = parentNode && parentNode.id === focusedChapterId;
        const shouldShow = isMicro || isParentFocused;

        if (level === 3 && !shouldShow) return null;

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
  }, [isMicro, courseData, focusedChapterId]);


  // --- AUTO-FIT ON MOUNT ---
  useEffect(() => {
    if (containerRef.current && !hasAutoFit && treeHeight > 0) {
        handleResetView();
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

  // Node Double Tap Handler
  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string, type: string) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTap.current.time < DOUBLE_TAP_DELAY && lastTap.current.id === nodeId) {
          if (type === 'chapter') {
             e.preventDefault();
             e.stopPropagation();
             focusChapter(nodeId);
          }
      }
      lastTap.current = { time: now, id: nodeId };
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

        {/* Loading Overlay */}
        {loading && (
            <div className="absolute inset-0 z-[100] bg-white/50 flex items-center justify-center">
                <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-xl shadow-lg">
                    <Loader2 className="animate-spin text-blue-600" size={20} />
                    <span className="text-sm font-medium text-slate-600">加载中...</span>
                </div>
            </div>
        )}

        {/* Error Toast */}
        {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-in slide-in-from-top">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">{error}</span>
                <button onClick={() => setError(null)} className="ml-2 hover:bg-red-600 rounded p-1">
                    <X size={14} />
                </button>
            </div>
        )}

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
                    transition: (isDragging || evCache.current.size > 0) ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' 
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

                {nodes.map(node => {
                    const isHighlighted = highlightedNodeId === node.id;
                    
                    return (
                        <div 
                            key={node.id}
                            className="absolute flex items-center justify-center transform -translate-y-1/2 transition-all"
                            style={{ 
                                left: node.x, 
                                top: node.y,
                                transitionDuration: '300ms',
                                zIndex: node.type === 'leaf' ? 10 : 20,
                                transform: `translateY(-50%) scale(${isHighlighted ? 1.1 : 1})`
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
                                    onPointerDown={(e) => handleNodePointerDown(e, node.id, node.type)}
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
                    );
                })}
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
                        {studyRecords[0] && (
                        <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 active:bg-blue-50 active:border-blue-100 transition-colors cursor-pointer" onClick={() => onNavigate(AppView.TIME_MACHINE, studyRecords[0].id)}>
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
                        )}

                        <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-sm">章节测验：第二章</h4>
                                <p className="text-xs text-slate-500">5 道错题待复习</p>
                            </div>
                        </div>

                        {/* --- DATE RANGE SEARCH --- */}
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">学习记录</h5>
                                {(startDate || endDate) && (
                                    <button
                                        onClick={clearDateFilter}
                                        className="text-[10px] text-blue-500 hover:text-blue-700"
                                    >
                                        清除筛选
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex-1 flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                                    <Calendar size={12} className="text-slate-400" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="text-[10px] text-slate-600 w-full outline-none"
                                        placeholder="开始日期"
                                    />
                                </div>
                                <span className="text-slate-400 text-xs">-</span>
                                <div className="flex-1 flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                                    <Calendar size={12} className="text-slate-400" />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="text-[10px] text-slate-600 w-full outline-none"
                                        placeholder="结束日期"
                                    />
                                </div>
                                <button
                                    onClick={handleSearchByDate}
                                    className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    <Search size={14} />
                                </button>
                            </div>
                             {studyRecords.length === 0 ? (
                                 <div className="text-center py-4 text-slate-400">
                                     <Clock size={20} className="mx-auto mb-2 opacity-50" />
                                     <p className="text-xs">暂无学习记录</p>
                                 </div>
                             ) : (
                                 <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                     {studyRecords.slice(0, 5).map((record) => (
                                         <div
                                             key={record.id}
                                             className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm"
                                         >
                                             <div className="flex items-start justify-between">
                                                 <div className="flex-1 min-w-0">
                                                     <h6 className="text-xs font-bold text-slate-700 truncate">{record.title}</h6>
                                                     <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400">
                                                         <Clock size={10} />
                                                         <span>{formatDate(record.recordedAt)}</span>
                                                         <span>·</span>
                                                         <span>{formatDuration(record.duration)}</span>
                                                     </div>
                                                 </div>
                                                 <div className="flex space-x-1 ml-2">
                                                     <button
                                                         onClick={() => openNotesModal(record)}
                                                         className="p-1 text-slate-400 hover:text-blue-500"
                                                         title="编辑笔记"
                                                     >
                                                         <FileText size={12} />
                                                     </button>
                                                     <button
                                                         onClick={() => setShowDeleteConfirm(record.id)}
                                                         className="p-1 text-slate-400 hover:text-red-500"
                                                         title="删除"
                                                     >
                                                         <Trash2 size={12} />
                                                     </button>
                                                 </div>
                                             </div>
                                             {record.notes && (
                                                 <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">{record.notes}</p>
                                             )}
                                             <button
                                                 onClick={() => onNavigate(AppView.TIME_MACHINE, record.id)}
                                                 className="mt-2 w-full py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 flex items-center justify-center"
                                             >
                                                 <Play size={10} className="mr-1" />
                                                 进入时光机
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             )}
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
            <div className={`absolute bottom-[160px] left-1/2 transform -translate-x-1/2 bg-slate-800/60 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold pointer-events-none transition-opacity duration-1000 ${showHint ? 'opacity-100' : 'opacity-0'}`}>
                双击章节节点展开详情
            </div>
        )}

        {/* Notes Edit Modal */}
        {showNotesModal && (
            <div className="absolute inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">编辑笔记</h3>
                        <button onClick={() => setShowNotesModal(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="mb-2 text-xs text-slate-500">
                        {editingRecord?.title}
                    </div>
                    <textarea
                        value={notesContent}
                        onChange={(e) => setNotesContent(e.target.value)}
                        placeholder="在此添加学习笔记..."
                        rows={8}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    />
                    <div className="flex space-x-3 mt-5">
                        <button
                            onClick={() => setShowNotesModal(false)}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleUpdateNotes}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : '保存'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
            <div className="absolute inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="text-red-600" size={24} />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 text-center mb-2">确认删除</h3>
                    <p className="text-sm text-slate-500 text-center mb-5">删除后无法恢复，请谨慎操作</p>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={() => handleDeleteRecord(showDeleteConfirm)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                        >
                            删除
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default CourseDetailReview;