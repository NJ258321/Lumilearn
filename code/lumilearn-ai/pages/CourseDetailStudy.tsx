import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, Edit3, Trash2, Calendar, MapPin, CheckCircle2, RotateCcw, Zap, Mic, Plus, Lock, MoreHorizontal, BookOpen, FileText, Settings, Minus, ChevronRight, Loader2, AlertCircle, X, Filter, AlertTriangle } from 'lucide-react';
import { AppView } from '../types';
import { getChapterList, createChapter, updateChapter, deleteChapter } from '../src/api/chapters';
import { getKnowledgePointList, createKnowledgePoint, updateKnowledgePoint, deleteKnowledgePoint, updateMastery, getWeakPoints, batchCreateKnowledgePoints, batchUpdateStatus } from '../src/api/knowledgePoints';
import type { Chapter, KnowledgePoint } from '../types';

interface CourseDetailStudyProps {
  onNavigate: (view: AppView, data?: any) => void;
  courseId?: string | null;
}

// --- 1. DATA STRUCTURE: REMOTE SENSING ---
const INITIAL_DATA = {
  id: "course-002",
  title: "遥感原理与应用",
  children: [
    {
      id: "cat-1",
      title: "遥感物理与平台基础",
      type: "category",
      status: "completed",
      children: [
        { 
          id: "ch-1", title: "1. 电磁波及遥感物理基础", type: "chapter", status: "completed",
          children: [
            { id: "l-1-1", title: "1.1 物体的发射辐射", type: "leaf", status: "completed" },
            { id: "l-1-2", title: "1.2 辐射的大气传输", type: "leaf", status: "completed" },
            { id: "l-1-3", title: "1.3 物体的反射辐射", type: "leaf", status: "completed" }
          ]
        },
        { 
          id: "ch-2", title: "2. 遥感平台及运行特点", type: "chapter", status: "completed",
          children: [
            { id: "l-2-1", title: "2.1 遥感卫星轨道及运行特点", type: "leaf", status: "completed" },
            { id: "l-2-2", title: "2.2 陆地卫星及轨道特征", type: "leaf", status: "completed" }
          ]
        }
      ]
    },
    {
      id: "cat-2",
      title: "传感器与图像处理",
      type: "category",
      status: "completed",
      children: [
        { 
          id: "ch-3", title: "3. 遥感传感器及成像原理", type: "chapter", status: "completed",
          children: [
            { id: "l-3-1", title: "3.1 扫描成像类传感器", type: "leaf", status: "completed" },
            { id: "l-3-2", title: "3.2 雷达成像仪", type: "leaf", status: "completed" }
          ]
        },
        { 
          id: "ch-4", title: "4. 遥感图像数字处理的基础知识", type: "chapter", status: "completed",
          children: [
            { id: "l-4-1", title: "4.1 遥感图像的表示形式", type: "leaf", status: "completed" },
            { id: "l-4-2", title: "4.2 遥感图像处理系统", type: "leaf", status: "completed" }
          ]
        }
      ]
    },
    {
      id: "cat-3",
      title: "图像校正与增强",
      type: "category",
      status: "active", // Current Focus
      children: [
        { 
          id: "ch-5", title: "5. 遥感图像的几何处理", type: "chapter", status: "active",
          children: [
            { id: "l-5-1", title: "5.1 遥感传感器的构像方程", type: "leaf", status: "active" },
            { id: "l-5-2", title: "5.2 遥感图像的几何变形", type: "leaf", status: "active" },
            { id: "l-5-3", title: "5.3 遥感图像的几何纠正", type: "leaf", status: "active" },
            { id: "l-5-4", title: "5.4 图像间的自动配准", type: "leaf", status: "active" }
          ]
        },
        { 
          id: "ch-6", title: "6. 遥感图像的辐射处理", type: "chapter", status: "locked",
          children: [
            { id: "l-6-1", title: "6.1 遥感图像的辐射处理", type: "leaf", status: "locked" },
            { id: "l-6-2", title: "6.2 遥感图像辐射增强", type: "leaf", status: "locked" },
            { id: "l-6-3", title: "6.3 遥感图像融合", type: "leaf", status: "locked" }
          ]
        }
      ]
    },
    {
      id: "cat-4",
      title: "图像解译与分类",
      type: "category",
      status: "locked",
      children: [
        { 
          id: "ch-7", title: "7. 遥感图像判读", type: "chapter", status: "locked",
          children: [
            { id: "l-7-1", title: "7.1 景物特征和判读标志", type: "leaf", status: "locked" },
            { id: "l-7-2", title: "7.2 遥感图像目视判读举例", type: "leaf", status: "locked" }
          ]
        },
        { 
          id: "ch-8", title: "8. 遥感图像自动识别分类", type: "chapter", status: "locked",
          children: [
            { id: "l-8-1", title: "8.1 基础知识", type: "leaf", status: "locked" },
            { id: "l-8-2", title: "8.2 特征变换及特征选择", type: "leaf", status: "locked" },
            { id: "l-8-3", title: "8.3 监督分类", type: "leaf", status: "locked" },
            { id: "l-8-4", title: "8.4 非监督分类", type: "leaf", status: "locked" },
            { id: "l-8-5", title: "8.5 分类后处理和误差分析", type: "leaf", status: "locked" },
            { id: "l-8-6", title: "8.6 计算机自动分类新方法", type: "leaf", status: "locked" }
          ]
        }
      ]
    }
  ]
};

// --- 2. CONFIG & HELPERS ---
const CONFIG = {
    // Layout - Highly Compact for Mobile Fit
    // [Root, Category, Chapter, Leaf]
    LEVEL_X_OFFSET: [0, 170, 330, 490], 
    MACRO_GAP_Y: 70, 
    MICRO_GAP_Y: 55, 
    
    // Interaction
    SHOW_LEAF_THRESHOLD: 1.0, 
    SHEET_MIN_HEIGHT: 180,
    SHEET_MAX_HEIGHT: 600,
};

interface VisualNode {
    id: string;
    title: string;
    type: 'root' | 'category' | 'chapter' | 'leaf' | 'add-placeholder';
    x: number;
    y: number;
    status?: string; 
    data?: any; 
}

interface VisualLink {
    source: VisualNode;
    target: VisualNode;
    style?: 'solid' | 'dashed';
}

const getDistance = (p1: React.PointerEvent, p2: React.PointerEvent) => {
    return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
};

const CourseDetailStudy: React.FC<CourseDetailStudyProps> = ({ onNavigate, courseId }) => {
  // --- STATE ---
  const [courseData, setCourseData] = useState(INITIAL_DATA);
  const [isEditMode, setIsEditMode] = useState(false);

  // API State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Knowledge Points State
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [showWeakPointsOnly, setShowWeakPointsOnly] = useState(false);
  const [knowledgeModalMode, setKnowledgeModalMode] = useState<'create' | 'edit'>('create');
  const [editingKnowledgePoint, setEditingKnowledgePoint] = useState<KnowledgePoint | null>(null);
  const [knowledgeFormData, setKnowledgeFormData] = useState({ name: '', description: '', chapterId: '' });
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [showKnowledgeDeleteConfirm, setShowKnowledgeDeleteConfirm] = useState<string | null>(null);

  // Fetch Knowledge Points
  // 获取知识点列表（按章节筛选）
  const fetchKnowledgePoints = useCallback(async (chapterId?: string) => {
    setLoading(true);
    try {
      let response;
      if (showWeakPointsOnly) {
        response = await getWeakPoints({ chapterId });
      } else {
        response = await getKnowledgePointList({ chapterId });
      }
      if (response.success && response.data) {
        setKnowledgePoints(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch knowledge points:', err);
    } finally {
      setLoading(false);
    }
  }, [showWeakPointsOnly]);

  // Create Knowledge Point
  const handleCreateKnowledgePoint = async () => {
    if (!knowledgeFormData.name.trim() || !knowledgeFormData.chapterId) return;
    setLoading(true);
    try {
      const response = await createKnowledgePoint({
        chapterId: knowledgeFormData.chapterId,
        name: knowledgeFormData.name,
        description: knowledgeFormData.description,
      });
      if (response.success) {
        setShowKnowledgeModal(false);
        setKnowledgeFormData({ name: '', description: '', chapterId: '' });
        fetchKnowledgePoints(knowledgeFormData.chapterId);
      } else {
        setError(response.error || '创建知识点失败');
      }
    } catch (err) {
      setError('创建知识点失败');
    } finally {
      setLoading(false);
    }
  };

  // Update Knowledge Point
  const handleUpdateKnowledgePoint = async () => {
    if (!editingKnowledgePoint || !knowledgeFormData.name.trim()) return;
    setLoading(true);
    try {
      const response = await updateKnowledgePoint(editingKnowledgePoint.id, {
        name: knowledgeFormData.name,
        description: knowledgeFormData.description,
      });
      if (response.success) {
        setShowKnowledgeModal(false);
        setEditingKnowledgePoint(null);
        setKnowledgeFormData({ name: '', description: '' });
        fetchKnowledgePoints();
      } else {
        setError(response.error || '更新知识点失败');
      }
    } catch (err) {
      setError('更新知识点失败');
    } finally {
      setLoading(false);
    }
  };

  // Delete Knowledge Point
  const handleDeleteKnowledgePoint = async (id: string) => {
    setLoading(true);
    try {
      const response = await deleteKnowledgePoint(id);
      if (response.success) {
        setShowKnowledgeDeleteConfirm(null);
        fetchKnowledgePoints();
      } else {
        setError(response.error || '删除知识点失败');
      }
    } catch (err) {
      setError('删除知识点失败');
    } finally {
      setLoading(false);
    }
  };

  // Update Mastery
  const handleUpdateMastery = async (id: string, status: string, masteryLevel?: number) => {
    setLoading(true);
    try {
      const response = await updateMastery(id, { status, masteryLevel });
      if (response.success) {
        fetchKnowledgePoints();
      } else {
        setError(response.error || '更新掌握度失败');
      }
    } catch (err) {
      setError('更新掌握度失败');
    } finally {
      setLoading(false);
    }
  };

  // Open Knowledge Point Modal
  const openKnowledgeModal = (mode: 'create' | 'edit', point?: KnowledgePoint) => {
    setKnowledgeModalMode(mode);
    if (mode === 'edit' && point) {
      setEditingKnowledgePoint(point);
      setKnowledgeFormData({ name: point.name, description: point.description || '' });
    } else {
      setEditingKnowledgePoint(null);
      setKnowledgeFormData({ name: '', description: '' });
    }
    setShowKnowledgeModal(true);
  };

  // Batch Import State
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchInputText, setBatchInputText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState<string>('NEED_REVIEW');
  const [showBatchStatusModal, setShowBatchStatusModal] = useState(false);

  // Batch Import Handler
  const handleBatchImport = async () => {
    if (!batchInputText.trim()) return;
    const lines = batchInputText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    setLoading(true);
    try {
      const items = lines.map(name => ({
        courseId: '550e8400-e29b-41d4-a716-446655440001',
        name: name.trim(),
        status: 'NEED_REVIEW',
      }));
      const response = await batchCreateKnowledgePoints(items);
      if (response.success) {
        setShowBatchImport(false);
        setBatchInputText('');
        fetchKnowledgePoints();
      } else {
        setError(response.error || '批量导入失败');
      }
    } catch (err) {
      setError('批量导入失败');
    } finally {
      setLoading(false);
    }
  };

  // Batch Update Status Handler
  const handleBatchUpdateStatus = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const response = await batchUpdateStatus(selectedIds, batchStatus);
      if (response.success) {
        setShowBatchStatusModal(false);
        setSelectedIds([]);
        fetchKnowledgePoints();
      } else {
        setError(response.error || '批量更新失败');
      }
    } catch (err) {
      setError('批量更新失败');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select All
  const toggleSelectAll = () => {
    if (selectedIds.length === knowledgePoints.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(knowledgePoints.map(p => p.id));
    }
  };

  // Fetch Knowledge Points on mount and when filter changes
  useEffect(() => {
    fetchKnowledgePoints();
  }, [fetchKnowledgePoints, courseId]);

  // Fetch Chapters from API
  const fetchChapters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getChapterList({ courseId: courseId || undefined });
      if (response.success && response.data) {
        setChapters(response.data);
      } else {
        setError(response.error || '加载章节失败');
      }
    } catch (err) {
      setError('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Create Chapter
  const handleCreateChapter = async () => {
    if (!formData.name.trim() || !courseId) return;
    setLoading(true);
    try {
      const response = await createChapter({
        courseId: courseId,
        name: formData.name,
        description: formData.description,
        order: chapters.length + 1,
      });
      if (response.success) {
        setShowModal(false);
        setFormData({ name: '', description: '' });
        fetchChapters();
      } else {
        setError(response.error || '创建失败');
      }
    } catch (err) {
      setError('创建失败');
    } finally {
      setLoading(false);
    }
  };

  // Update Chapter
  const handleUpdateChapter = async () => {
    if (!editingChapter || !formData.name.trim()) return;
    setLoading(true);
    try {
      const response = await updateChapter(editingChapter.id, {
        name: formData.name,
        description: formData.description,
      });
      if (response.success) {
        setShowModal(false);
        setEditingChapter(null);
        setFormData({ name: '', description: '' });
        fetchChapters();
      } else {
        setError(response.error || '更新失败');
      }
    } catch (err) {
      setError('更新失败');
    } finally {
      setLoading(false);
    }
  };

  // Delete Chapter
  const handleDeleteChapter = async (id: string) => {
    setLoading(true);
    try {
      const response = await deleteChapter(id);
      if (response.success) {
        setShowDeleteConfirm(null);
        fetchChapters();
      } else {
        setError(response.error || '删除失败');
      }
    } catch (err) {
      setError('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (chapter: Chapter) => {
    setModalMode('edit');
    setEditingChapter(chapter);
    setFormData({ name: chapter.name, description: chapter.description || '' });
    setShowModal(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    setEditingChapter(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  // Initial fetch
  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);
  
  // Focus state
  const [focusedChapterId, setFocusedChapterId] = useState<string | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  // Canvas
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 }); 
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [hasAutoFit, setHasAutoFit] = useState(false);

  // Double Tap Logic
  const lastTap = useRef({ time: 0, id: '' });

  // Pinch Zoom
  const evCache = useRef<Map<number, React.PointerEvent>>(new Map());
  const prevDiff = useRef(-1);

  // Bottom Sheet
  const [sheetHeight, setSheetHeight] = useState(CONFIG.SHEET_MIN_HEIGHT);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const sheetStartY = useRef(0);
  const sheetStartHeight = useRef(0);

  // Semantic Zoom Mode
  const isMicro = transform.scale >= CONFIG.SHOW_LEAF_THRESHOLD;

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
        // Optimization: Reduced bottom padding to 50 (from 100) to allow larger initial scale
        const desiredHeight = treeHeight + 50; 
        let scale = clientHeight / desiredHeight;
        // Optimization: Increased max initial scale to 1.1
        scale = Math.min(Math.max(scale, 0.6), 1.1);

        const treeCenterY = treeHeight / 2;
        const screenCenterY = clientHeight / 2;
        
        const initialY = screenCenterY - (treeCenterY * scale) + 60;
        
        // Align L1 (Category) at approx 50px from left for balanced view
        const initialX = 50 - (CONFIG.LEVEL_X_OFFSET[1] * scale);

        setTransform({ x: initialX, y: initialY, scale: scale });
    }
  };

  // --- CHAPTER FOCUS (Deep Zoom) ---
  const focusChapter = (nodeId: string) => {
      setFocusedChapterId(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      
      if (node && containerRef.current) {
          const { clientHeight } = containerRef.current;
          
          // Adjusted scale to 0.9 to ensure both L2 and L3 fit comfortably
          const targetScale = 0.9; 
          
          // Center the node vertically
          const targetY = (clientHeight / 2) - (node.y * targetScale);

          // Horizontal Positioning:
          // Place the L2 (Chapter) node's left edge at approx 50px from screen left.
          const targetX = 50 - (node.x * targetScale);
          
          setTransform({ x: targetX, y: targetY, scale: targetScale });
          
          setHighlightedNodeId(nodeId);
          setTimeout(() => setHighlightedNodeId(null), 1000);
      }
  };

  // --- LAYOUT ENGINE (useMemo) ---
  const { nodes, links, spine, treeHeight } = useMemo(() => {
    const nodes: VisualNode[] = [];
    const links: VisualLink[] = [];
    let currentY = 0;

    const traverse = (data: any, level: number, parentNode?: VisualNode) => {
        // Force show leaves if their parent is the focused chapter, even if scale is low
        const isParentFocused = parentNode && parentNode.id === focusedChapterId;
        const shouldShow = isMicro || isParentFocused;

        // Hide leaves if not in micro mode AND parent isn't focused
        if (level === 3 && !shouldShow) return null;

        const node: VisualNode = {
            id: data.id || `node-${Math.random()}`,
            title: data.title,
            type: data.type || 'root',
            x: CONFIG.LEVEL_X_OFFSET[level],
            y: 0,
            status: data.status,
            data: data
        };

        const childNodes: VisualNode[] = [];
        if (data.children && data.children.length > 0) {
            data.children.forEach((child: any) => {
                const childNode = traverse(child, level + 1, node);
                if (childNode) childNodes.push(childNode);
            });
        }

        // EDIT MODE: Inject "Add Node" Placeholder
        if (isEditMode && level === 2 && data.status !== 'locked' && shouldShow) {
             const placeholderNode: VisualNode = {
                 id: `add-${data.id}`,
                 title: "添加知识点",
                 type: 'add-placeholder',
                 x: CONFIG.LEVEL_X_OFFSET[level + 1],
                 y: 0,
                 status: 'placeholder'
             };
             childNodes.push(placeholderNode);
        }

        if (childNodes.length === 0) {
            node.y = currentY;
            currentY += (level === 2 && shouldShow) ? CONFIG.MICRO_GAP_Y : CONFIG.MACRO_GAP_Y;
        } else {
            childNodes.forEach(child => {
                 if (child.type === 'add-placeholder') {
                     child.y = currentY;
                     currentY += CONFIG.MICRO_GAP_Y;
                 }
            });

            const firstY = childNodes[0].y;
            const lastY = childNodes[childNodes.length - 1].y;
            node.y = (firstY + lastY) / 2;
        }

        nodes.push(node);
        if (parentNode) {
            links.push({ 
                source: parentNode, 
                target: node, 
                style: data.status === 'locked' ? 'dashed' : 'solid' 
            });
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

    return { nodes, links, spine: spineData, treeHeight: currentY };
  }, [courseData, isEditMode, isMicro, focusedChapterId]);


  // --- AUTO-FIT ON MOUNT ---
  useEffect(() => {
     if (containerRef.current && !hasAutoFit && treeHeight > 0) {
         handleResetView();
         setHasAutoFit(true);
     }
  }, [treeHeight, hasAutoFit]);


  // --- INTERACTION HANDLERS ---
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

    // Pinch Zoom
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

    // Pan
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
    if (e.ctrlKey) {
        e.preventDefault();
        const zoomSensitivity = 0.002;
        const newScale = Math.min(Math.max(0.4, transform.scale - e.deltaY * zoomSensitivity), 2.5);
        setTransform(prev => ({ ...prev, scale: newScale }));
    } else {
        setTransform(prev => ({ ...prev, y: prev.y - e.deltaY }));
    }
  };

  // Node Double Tap Handler (Manual implementation to work with pointer capture)
  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string, type: string) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTap.current.time < DOUBLE_TAP_DELAY && lastTap.current.id === nodeId) {
          // Double Tap Detected
          if (type === 'chapter') {
             e.preventDefault();
             e.stopPropagation(); // Stop propagation to prevent drag start on second tap
             focusChapter(nodeId);
          }
      }
      
      lastTap.current = { time: now, id: nodeId };
  };

  // Sheet Dragging
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
    if (newHeight < CONFIG.SHEET_MIN_HEIGHT) newHeight = CONFIG.SHEET_MIN_HEIGHT;
    if (newHeight > CONFIG.SHEET_MAX_HEIGHT) {
        newHeight = CONFIG.SHEET_MAX_HEIGHT + (newHeight - CONFIG.SHEET_MAX_HEIGHT) * 0.2;
    }
    setSheetHeight(newHeight);
  };

  const handleSheetDragEnd = (e: React.PointerEvent) => {
    setIsSheetDragging(false);
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    if (sheetHeight > 300) setSheetHeight(500);
    else setSheetHeight(CONFIG.SHEET_MIN_HEIGHT);
  };

  const getBezierPath = (link: VisualLink) => {
    const srcX = link.source.x + (link.source.type === 'root' ? 140 : 160); 
    const srcY = link.source.y;
    const tgtX = link.target.x;
    const tgtY = link.target.y;
    const midX = (srcX + tgtX) / 2;
    return `M ${srcX} ${srcY} C ${midX} ${srcY}, ${midX} ${tgtY}, ${tgtX} ${tgtY}`;
  };

  return (
    <div className="h-screen w-full bg-[#F1F5F9] overflow-hidden relative font-sans text-slate-800 flex flex-col">
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

        {/* Create/Edit Modal */}
        {showModal && (
            <div className="absolute inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">
                            {modalMode === 'create' ? '新建章节' : '编辑章节'}
                        </h3>
                        <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">章节名称</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="请输入章节名称"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">描述（可选）</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="请输入章节描述"
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-3 mt-5">
                        <button
                            onClick={() => setShowModal(false)}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={modalMode === 'create' ? handleCreateChapter : handleUpdateChapter}
                            disabled={!formData.name.trim() || loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {modalMode === 'create' ? '创建' : '保存'}
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
                            onClick={() => handleDeleteChapter(showDeleteConfirm)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                        >
                            删除
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Knowledge Point Modal */}
        {showKnowledgeModal && (
            <div className="absolute inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">
                            {knowledgeModalMode === 'create' ? '新建知识点' : '编辑知识点'}
                        </h3>
                        <button onClick={() => setShowKnowledgeModal(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {knowledgeModalMode === 'create' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">所属章节</label>
                                <select
                                    value={knowledgeFormData.chapterId}
                                    onChange={(e) => setKnowledgeFormData({ ...knowledgeFormData, chapterId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">请选择章节</option>
                                    {chapters.map((ch) => (
                                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">知识点名称</label>
                            <input
                                type="text"
                                value={knowledgeFormData.name}
                                onChange={(e) => setKnowledgeFormData({ ...knowledgeFormData, name: e.target.value })}
                                placeholder="请输入知识点名称"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">描述（可选）</label>
                            <textarea
                                value={knowledgeFormData.description}
                                onChange={(e) => setKnowledgeFormData({ ...knowledgeFormData, description: e.target.value })}
                                placeholder="请输入知识点描述"
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-3 mt-5">
                        <button
                            onClick={() => setShowKnowledgeModal(false)}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={knowledgeModalMode === 'create' ? handleCreateKnowledgePoint : handleUpdateKnowledgePoint}
                            disabled={!knowledgeFormData.name.trim() || (knowledgeModalMode === 'create' && !knowledgeFormData.chapterId) || loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {knowledgeModalMode === 'create' ? '创建' : '保存'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Knowledge Point Delete Confirmation */}
        {showKnowledgeDeleteConfirm && (
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
                            onClick={() => setShowKnowledgeDeleteConfirm(null)}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={() => handleDeleteKnowledgePoint(showKnowledgeDeleteConfirm)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                        >
                            删除
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Batch Import Modal */}
        {showBatchImport && (
            <div className="absolute inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">批量导入知识点</h3>
                        <button onClick={() => setShowBatchImport(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">每行一个知识点名称</p>
                    <textarea
                        value={batchInputText}
                        onChange={(e) => setBatchInputText(e.target.value)}
                        placeholder="知识点1&#10;知识点2&#10;知识点3"
                        rows={8}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    />
                    <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
                        <span>{batchInputText.split('\n').filter(l => l.trim()).length} 个知识点</span>
                    </div>
                    <div className="flex space-x-3 mt-5">
                        <button
                            onClick={() => setShowBatchImport(false)}
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleBatchImport}
                            disabled={!batchInputText.trim() || loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            导入
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Batch Update Status Modal */}
        {showBatchStatusModal && (
            <div className="absolute inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">批量更新状态</h3>
                        <button onClick={() => setShowBatchStatusModal(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">已选择 {selectedIds.length} 个知识点</p>
                    <div className="space-y-2">
                        {[
                            { value: 'TODAY_REVIEW', label: '今日复习', color: 'bg-blue-100 text-blue-600' },
                            { value: 'NEED_REVIEW', label: '待复习', color: 'bg-yellow-100 text-yellow-600' },
                            { value: 'WEAK', label: '薄弱点', color: 'bg-red-100 text-red-600' },
                            { value: 'MASTERED', label: '已掌握', color: 'bg-green-100 text-green-600' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => { setBatchStatus(option.value); handleBatchUpdateStatus(); }}
                                className={`w-full p-3 rounded-xl border border-slate-200 text-left font-medium hover:bg-slate-50 ${batchStatus === option.value ? 'ring-2 ring-blue-500' : ''}`}
                            >
                                <span className={`text-xs px-2 py-1 rounded-full ${option.color}`}>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- 1. HEADER --- */}
        <div className="absolute top-0 left-0 right-0 z-30 pt-12 pb-4 px-6 bg-gradient-to-b from-white/95 via-white/80 to-transparent pointer-events-none flex items-center justify-between">
             <div className="pointer-events-auto flex items-center">
                <button onClick={() => onNavigate(AppView.COURSES)} className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mr-3 active:scale-95 transition-transform">
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
                        遥感原理与应用
                    </h1>
                    <div className="flex items-center space-x-2 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Live Learning</span>
                    </div>
                </div>
             </div>
             
             {/* Edit Mode Toggle */}
             <div className="pointer-events-auto">
                 <button 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all ${
                        isEditMode 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-white border-slate-200 text-slate-500 shadow-sm'
                    }`}
                 >
                     <Edit3 size={14} />
                     <span className="text-xs font-bold">{isEditMode ? '完成' : '编辑'}</span>
                 </button>
             </div>
        </div>

        {/* --- 2. DYNAMIC VIEWPORT CANVAS --- */}
        <div 
            ref={containerRef}
            className="absolute top-0 left-0 right-0 z-0 touch-none overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 ease-out"
            style={{ bottom: sheetHeight }} 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
        >
             <div 
                className="absolute inset-[-200%] opacity-40 pointer-events-none"
                style={{
                    transform: `translate(${transform.x % 40}px, ${transform.y % 40}px)`,
                    backgroundImage: 'linear-gradient(#CBD5E1 1px, transparent 1px), linear-gradient(90deg, #CBD5E1 1px, transparent 1px)',
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
                        {/* Spine */}
                        {spine && (
                            <line 
                                x1={spine.x} y1={spine.yTop} 
                                x2={spine.x} y2={spine.yBottom} 
                                stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" 
                                className="opacity-50"
                            />
                        )}
                        {/* Spine Connectors */}
                        {nodes.filter(n => n.type === 'category' && spine).map((node, i) => (
                             <line 
                                key={`spine-con-${i}`}
                                x1={spine!.x} y1={node.y}
                                x2={node.x} y2={node.y}
                                stroke="#CBD5E1" strokeWidth="2"
                             />
                        ))}
                        {/* Links */}
                        {links.map((link, i) => (
                            <path 
                                key={i}
                                d={getBezierPath(link)}
                                fill="none"
                                stroke={link.style === 'dashed' ? '#E2E8F0' : '#94A3B8'} 
                                strokeWidth={link.target.type === 'leaf' ? 1 : 2}
                                strokeDasharray={link.style === 'dashed' ? "6 6" : ""}
                                className="transition-all duration-300"
                            />
                        ))}
                    </g>
                </svg>

                {/* Nodes */}
                {nodes.map(node => {
                    const isLocked = node.status === 'locked';
                    const isActive = node.status === 'active';
                    const isCompleted = node.status === 'completed';
                    const isHighlighted = highlightedNodeId === node.id;
                    const isPlaceholder = node.type === 'add-placeholder';

                    return (
                        <div 
                            key={node.id}
                            className={`absolute flex items-center justify-center transform -translate-y-1/2 transition-all duration-500 ease-out`}
                            style={{ 
                                left: node.x, 
                                top: node.y,
                                zIndex: isActive ? 20 : 10,
                                transform: `translateY(-50%) scale(${isHighlighted ? 1.1 : 1})`
                            }}
                        >
                            {/* Root Node */}
                            {node.type === 'root' && (
                                <div className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl border-4 border-slate-100 min-w-[160px] text-center opacity-80">
                                    <span className="font-bold text-lg whitespace-nowrap">{node.title}</span>
                                </div>
                            )}

                            {/* Category Node */}
                            {node.type === 'category' && (
                                <div className={`px-4 py-2 rounded-2xl shadow-sm min-w-[140px] text-center border-2 transition-all ${
                                    isLocked 
                                    ? 'bg-slate-100 border-slate-200 text-slate-400' 
                                    : isActive 
                                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-4 ring-emerald-100' 
                                        : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}>
                                    <div className="flex items-center justify-center space-x-2">
                                        {isLocked && <Lock size={12} />}
                                        <span className="font-bold text-sm whitespace-nowrap">{node.title}</span>
                                    </div>
                                    {isEditMode && !isLocked && (
                                        <div className="absolute -top-2 -right-2 flex space-x-1 animate-in zoom-in">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditModal(node.data as Chapter); }}
                                                className="bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-blue-500 shadow-sm"
                                            >
                                                <Edit3 size={10} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Chapter & Leaf Nodes */}
                            {(node.type === 'chapter' || node.type === 'leaf') && (
                                 <div 
                                    className={`relative px-4 py-3 rounded-xl shadow-sm min-w-[180px] border transition-all duration-500 flex items-center justify-between group cursor-pointer ${
                                        isLocked
                                        ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-80'
                                        : isActive
                                            ? 'bg-white border-emerald-500 ring-4 ring-emerald-100 shadow-emerald-200 shadow-lg'
                                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                                    }`}
                                    onPointerDown={(e) => handleNodePointerDown(e, node.id, node.type)}
                                 >
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-xl bg-emerald-400 opacity-0 animate-ping pointer-events-none duration-1000"></div>
                                    )}

                                    <div className="flex items-center space-x-2 overflow-hidden">
                                        {isLocked ? <Lock size={14} /> : (
                                            isCompleted ? <CheckCircle2 size={16} className="text-blue-500" /> : <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        )}
                                        <span className={`text-xs font-bold truncate ${isActive ? 'text-emerald-800' : ''}`}>{node.title}</span>
                                    </div>

                                    {/* Edit Mode Controls */}
                                    {isEditMode && !isLocked && (
                                        <div className="absolute -top-2 -right-2 flex space-x-1 scale-100 transition-transform">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(node.id); }}
                                                className="bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-red-500 shadow-sm z-30"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Placeholder Node (Edit Mode Only) */}
                            {isPlaceholder && (
                                <div
                                    onClick={openCreateModal}
                                    className="border-2 border-dashed border-slate-300 rounded-xl px-4 py-2 flex items-center space-x-2 cursor-pointer hover:border-blue-400 hover:text-blue-500 text-slate-400 bg-white/50 min-w-[140px] active:scale-95 transition-transform"
                                >
                                    <Plus size={14} />
                                    <span className="text-xs font-bold">添加知识点</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
        
        {/* --- 3. CONTROLS --- */}
        <div className="absolute bottom-[240px] right-4 flex flex-col space-y-3 z-30" style={{ bottom: sheetHeight + 80 }}>
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
                className="w-10 h-10 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-600 active:bg-blue-50 transition-colors"
            >
                <RotateCcw size={18} />
            </button>
        </div>

        {/* --- 4. FAB: CLASSROOM RECORDER --- */}
        <div 
            className="absolute right-6 z-50 transition-all duration-300 ease-out"
            style={{ bottom: sheetHeight + 20 }}
        >
            <button 
                onClick={() => onNavigate(AppView.RECORDER)}
                className="group relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[24px] shadow-[0_15px_30px_-5px_rgba(59,130,246,0.4)] active:scale-90 transition-all duration-300 hover:-translate-y-1"
            >
                <div className="absolute inset-0 rounded-[24px] bg-white/20 animate-pulse"></div>
                <div className="relative">
                    <Mic size={24} className="text-white drop-shadow-md" />
                    <div className="absolute -top-1 -right-2 bg-red-500 w-3 h-3 rounded-full border-2 border-indigo-600"></div>
                    <div className="absolute bottom-1 right-1 bg-white/20 rounded-full p-0.5">
                        <Plus size={8} className="text-white" strokeWidth={4} />
                    </div>
                </div>
            </button>
        </div>

        {/* --- 5. BOTTOM SHEET --- */}
        <div 
            className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-[32px] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)] flex flex-col"
            style={{ height: sheetHeight, transition: isSheetDragging ? 'none' : 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        >
            {/* Drag Handle */}
            <div 
                className="w-full pt-4 pb-2 flex flex-col items-center flex-none bg-white rounded-t-[32px] border-b border-slate-50 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={handleSheetDragStart}
                onPointerMove={handleSheetDragMove}
                onPointerUp={handleSheetDragEnd}
            >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-3"></div>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* Left: Timeline */}
                <div className="w-1/2 h-full overflow-y-auto border-r border-slate-100 px-4 py-4">
                    <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider pl-2">Timeline</h3>
                    <div className="relative border-l-2 border-slate-100 ml-2 space-y-6 pb-20">
                        {[
                            { id: 'sess-1', date: '10.08', title: '电磁波谱', relatedNodeId: 'ch-1', chapterIndex: 1 },
                            { id: 'sess-2', date: '10.10', title: '卫星轨道', relatedNodeId: 'ch-2', chapterIndex: 2 },
                            { id: 'sess-3', date: '10.12', title: '成像原理', relatedNodeId: 'ch-3', chapterIndex: 3 },
                            { id: 'sess-4', date: '10.15', title: '几何处理', relatedNodeId: 'ch-5', active: true, chapterIndex: 5 },
                        ].map((sess) => (
                            <div 
                                key={sess.id} 
                                onClick={() => focusChapter(sess.relatedNodeId)}
                                className={`relative pl-4 cursor-pointer group transition-all`}
                            >
                                <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-colors ${sess.active ? 'bg-emerald-500 border-emerald-200' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}></div>
                                <div>
                                    <span className={`text-xs font-bold ${sess.active ? 'text-emerald-600' : 'text-slate-500'}`}>{sess.date}</span>
                                    <div className={`text-sm font-bold ${sess.active ? 'text-slate-800' : 'text-slate-600'} line-clamp-1`}>{sess.title}</div>
                                    <div className="text-[9px] text-slate-400 mt-0.5">(对应第{sess.chapterIndex}章)</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Knowledge Points */}
                <div className="w-1/2 h-full overflow-y-auto px-4 py-4 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">知识点</h3>
                        <div className="flex items-center space-x-1">
                            {selectedIds.length > 0 ? (
                                <>
                                    <span className="text-xs text-blue-600 font-medium mr-1">{selectedIds.length}</span>
                                    <button
                                        onClick={() => setShowBatchStatusModal(true)}
                                        className="p-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                                        title="批量更新状态"
                                    >
                                        <AlertTriangle size={14} />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedIds([]); }}
                                        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                        title="取消选择"
                                    >
                                        <X size={14} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={toggleSelectAll}
                                        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                        title="全选"
                                    >
                                        <CheckCircle2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowBatchImport(true)}
                                        className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                        title="批量导入"
                                    >
                                        <Plus size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowWeakPointsOnly(!showWeakPointsOnly)}
                                        className={`p-1.5 rounded-lg transition-colors ${showWeakPointsOnly ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        title="只看薄弱点"
                                    >
                                        <Filter size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    {knowledgePoints.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-xs">暂无知识点</p>
                            <button
                                onClick={() => openKnowledgeModal('create')}
                                className="mt-2 text-xs text-blue-500 hover:underline"
                            >
                                点击添加
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {knowledgePoints.map((point) => (
                                <div
                                    key={point.id}
                                    className={`bg-white p-3 rounded-xl border shadow-sm transition-all ${
                                        selectedIds.includes(point.id) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <button
                                            onClick={() => toggleSelection(point.id)}
                                            className={`mt-1 mr-2 flex-shrink-0 ${
                                                selectedIds.includes(point.id) ? 'text-blue-500' : 'text-slate-300'
                                            }`}
                                        >
                                            <CheckCircle2 size={18} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                                    point.status === 'MASTERED' ? 'bg-green-100 text-green-600' :
                                                    point.status === 'WEAK' ? 'bg-red-100 text-red-600' :
                                                    point.status === 'NEED_REVIEW' ? 'bg-yellow-100 text-yellow-600' :
                                                    'bg-blue-100 text-blue-600'
                                                }`}>
                                                    {point.status === 'MASTERED' ? '已掌握' :
                                                     point.status === 'WEAK' ? '薄弱点' :
                                                     point.status === 'NEED_REVIEW' ? '待复习' : '今日复习'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 truncate">{point.name}</p>
                                            {point.description && (
                                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{point.description}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col space-y-1 ml-2">
                                            <button
                                                onClick={() => openKnowledgeModal('edit', point)}
                                                className="p-1 text-slate-400 hover:text-blue-500"
                                            >
                                                <Edit3 size={12} />
                                            </button>
                                            <button
                                                onClick={() => setShowKnowledgeDeleteConfirm(point.id)}
                                                className="p-1 text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Mastery Level */}
                                    <div className="mt-2 flex items-center space-x-2">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-red-400 to-green-500 transition-all"
                                                style={{ width: `${(point.masteryLevel || 0) * 100}%` }}
                                            />
                                        </div>
                                        <select
                                            value={point.status}
                                            onChange={(e) => handleUpdateMastery(point.id, e.target.value, point.masteryLevel)}
                                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5"
                                        >
                                            <option value="TODAY_REVIEW">今日复习</option>
                                            <option value="NEED_REVIEW">待复习</option>
                                            <option value="WEAK">薄弱点</option>
                                            <option value="MASTERED">已掌握</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

    </div>
  );
};

export default CourseDetailStudy;