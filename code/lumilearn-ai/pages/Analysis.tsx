
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { HelpCircle, AlertCircle, ChevronRight, PlayCircle, Info, BookOpen, ChevronDown, Check, X, Target, Zap, Clock, MessageSquare, Bot, Search, TrendingUp, Brain, BarChart3, Activity, Loader2, Flame, Calendar, Award, BookMarked, Lightbulb, RefreshCw } from 'lucide-react';
import { AppView } from '../types';
import { getKnowledgeMastery, getCourseOverview } from '../src/api/statistics';
import { getCourseList } from '../src/api/courses';
import { getKnowledgeCorrelation, getLearningSequence, getBottlenecks, generateEvaluation, getLearningEfficiency, getComparisonAnalysis } from '../src/api/analysis';
import { getLearningPath } from '../src/api/recommendations';
import type { KnowledgeMastery, KnowledgeCorrelationResponse, LearningSequenceResponse, BottleneckResponse, LearningEvaluation, LearningEfficiency, ComparisonAnalysis, GenerateEvaluationRequest, Course, Bottleneck, LearningPath, CourseOverview } from '../types';

interface AnalysisProps {
  onNavigate: (view: AppView) => void;
  currentCourseId?: string | null;
  onCourseChange?: (id: string) => void;
}

const Analysis: React.FC<AnalysisProps> = ({ onNavigate, currentCourseId, onCourseChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'weak' | 'mastery' | 'correlation' | 'sequence' | 'bottleneck' | 'evaluation' | 'efficiency' | 'compare'>('weak');

  // 本地状态管理当前选中的课程名称和ID，初始化为高等数学或传入的课程
  const [selectedCourseName, setSelectedCourseName] = useState("高等数学");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(currentCourseId || '');

  // P4 - Analysis Data State
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [knowledgeMastery, setKnowledgeMastery] = useState<KnowledgeMastery | null>(null);
  const [knowledgeCorrelation, setKnowledgeCorrelation] = useState<KnowledgeCorrelationResponse | null>(null);
  const [learningSequence, setLearningSequence] = useState<LearningSequenceResponse | null>(null);
  const [bottlenecks, setBottlenecks] = useState<BottleneckResponse | null>(null);
  const [evaluation, setEvaluation] = useState<LearningEvaluation | null>(null);
  const [efficiency, setEfficiency] = useState<LearningEfficiency | null>(null);
  const [comparison, setComparison] = useState<ComparisonAnalysis | null>(null);

  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // 学习特征和推荐策略状态
  const [courseOverview, setCourseOverview] = useState<CourseOverview | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  // 获取学习特征和推荐策略（按课程获取）
  const fetchRecommendations = useCallback(async () => {
    const courseId = selectedCourseId || currentCourseId;
    if (!courseId) return;

    setRecommendationLoading(true);
    try {
      // 获取课程学习概览（学习特征）- 按课程获取
      const overviewRes = await getCourseOverview(courseId);
      if (overviewRes.success && overviewRes.data) {
        setCourseOverview(overviewRes.data);
      }

      // 获取学习路径（推荐策略）
      const pathRes = await getLearningPath(courseId);
      if (pathRes.success && pathRes.data) {
        setLearningPath(pathRes.data);
      }
    } catch (err) {
      console.error('获取推荐数据失败', err);
    } finally {
      setRecommendationLoading(false);
    }
  }, [selectedCourseId, currentCourseId]);

  // P4 - Fetch Knowledge Mastery
  const fetchKnowledgeMastery = useCallback(async () => {
    const courseId = selectedCourseId || currentCourseId;
    if (!courseId) return;
    setAnalysisLoading(true);
    try {
      const response = await getKnowledgeMastery(courseId);
      if (response.success && response.data) {
        setKnowledgeMastery(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch knowledge mastery:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedCourseId, currentCourseId]);

  // P4 - Fetch Knowledge Correlation
  const fetchKnowledgeCorrelation = useCallback(async () => {
    const courseId = selectedCourseId || currentCourseId;
    if (!courseId) return;
    setAnalysisLoading(true);
    try {
      const response = await getKnowledgeCorrelation(courseId);
      if (response.success && response.data) {
        setKnowledgeCorrelation(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch knowledge correlation:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedCourseId, currentCourseId]);

  // P4 - Fetch Learning Sequence
  const fetchLearningSequence = useCallback(async () => {
    const courseId = selectedCourseId || currentCourseId;
    if (!courseId) return;
    setAnalysisLoading(true);
    try {
      const response = await getLearningSequence(courseId);
      if (response.success && response.data) {
        setLearningSequence(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch learning sequence:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedCourseId, currentCourseId]);

  // P4 - Fetch Bottlenecks
  const fetchBottlenecks = useCallback(async () => {
    const courseId = selectedCourseId || currentCourseId;
    if (!courseId) return;
    setAnalysisLoading(true);
    try {
      const response = await getBottlenecks(courseId);
      if (response.success && response.data) {
        setBottlenecks(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch bottlenecks:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedCourseId, currentCourseId]);

  // P4 - Generate Evaluation
  const fetchEvaluation = useCallback(async () => {
    const courseId = selectedCourseId || currentCourseId;
    if (!courseId) return;
    setAnalysisLoading(true);
    try {
      const params: GenerateEvaluationRequest = {
        courseId: courseId,
        timeRange: 'month',
        includeDetails: true
      };
      const response = await generateEvaluation(params);
      if (response.success && response.data) {
        setEvaluation(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch evaluation:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedCourseId, currentCourseId]);

  // P4 - Fetch Efficiency
  const fetchEfficiency = useCallback(async () => {
    const courseId = selectedCourseId || currentCourseId;
    if (!courseId) return;
    setAnalysisLoading(true);
    try {
      const response = await getLearningEfficiency(courseId);
      if (response.success && response.data) {
        setEfficiency(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch efficiency:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedCourseId, currentCourseId]);

  // P4 - Fetch Comparison
  const fetchComparison = useCallback(async () => {
    const courseId = selectedCourseId || currentCourseId;
    if (!courseId) return;
    setAnalysisLoading(true);
    try {
      const response = await getComparisonAnalysis(courseId);
      if (response.success && response.data) {
        setComparison(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedCourseId, currentCourseId]);

  // Tab change handler
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'mastery':
        fetchKnowledgeMastery();
        break;
      case 'correlation':
        fetchKnowledgeCorrelation();
        break;
      case 'sequence':
        fetchLearningSequence();
        break;
      case 'bottleneck':
        fetchBottlenecks();
        break;
      case 'evaluation':
        fetchEvaluation();
        break;
      case 'efficiency':
        fetchEfficiency();
        break;
      case 'compare':
        fetchComparison();
        break;
    }
  };

  const getCardStyles = (color: string) => {
      if (color === 'red') return { iconBg: 'bg-red-500', shadow: 'shadow-red-100', tag: 'text-slate-400', btn: 'bg-[#4285F4]' };
      if (color === 'orange') return { iconBg: 'bg-orange-500', shadow: 'shadow-orange-100', tag: 'text-slate-400', btn: 'bg-orange-500' };
      return { iconBg: 'bg-blue-500', shadow: 'shadow-blue-100', tag: 'text-slate-400', btn: 'bg-blue-500' };
  };

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const response = await getCourseList();
        if (response.success && response.data) {
          setCourses(response.data);
          // Set initial course if not provided
          if (!currentCourseId && response.data.length > 0) {
            setSelectedCourseName(response.data[0].name);
            setSelectedCourseId(response.data[0].id);
          } else if (currentCourseId) {
            // 如果有传入的 currentCourseId，找到对应的课程
            const course = response.data.find(c => c.id === currentCourseId);
            if (course) {
              setSelectedCourseName(course.name);
              setSelectedCourseId(course.id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // 当选中课程变化时，重新获取学习特征和推荐策略数据
  useEffect(() => {
    if (selectedCourseId || currentCourseId) {
      fetchRecommendations();
      // 如果当前是掌握度标签，也刷新掌握度数据
      if (activeTab === 'mastery') {
        fetchKnowledgeMastery();
      }
    }
  }, [selectedCourseId, currentCourseId, fetchRecommendations, activeTab, fetchKnowledgeMastery]);

  // 过滤课程列表 - 使用真实的 courses
  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 从 bottlenecks 转换为 weakPoints 格式
  const weakPoints = React.useMemo(() => {
    if (!bottlenecks?.bottlenecks) return [];
    return bottlenecks.bottlenecks.slice(0, 5).map((bp: Bottleneck, idx: number) => ({
      id: idx,
      title: bp.name,
      desc: bp.reasons.join('；') || `该考点是${bottlenecks.courseName}的薄弱点。`,
      tag: bp.difficulty === 'hard' ? 'Top Weak Point' : (bp.difficulty === 'medium' ? 'High Frequency' : 'Needs Practice'),
      color: bp.difficulty === 'hard' ? 'red' : (bp.difficulty === 'medium' ? 'orange' : 'blue'),
      icon: AlertCircle
    }));
  }, [bottlenecks]);

  return (
    <div className="flex flex-col h-screen bg-[#F7F9FC] font-sans relative overflow-hidden">
      
      {/* 1. 固定头部区域 - 重新设计 */}
      <div className="flex-none z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="pt-[15px] pb-2 px-6 flex justify-between items-center">
          <h1 className="text-xl font-black text-[#1F2937] tracking-tight">知识薄弱点分析</h1>
          <HelpCircle size={20} className="text-slate-400" />
        </div>
        
        {/* 拆分后的课程标题与选择区 */}
        <div className="px-6 pb-5 flex items-center justify-between mt-2">
            <div className="flex items-center space-x-3">
                 <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-sm"></div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none truncate max-w-[200px]">
                    {selectedCourseName}
                 </h2>
            </div>

            <button 
                onClick={() => setShowPicker(true)}
                className="flex items-center space-x-1.5 bg-white border border-slate-200 shadow-sm text-slate-600 px-3 py-1.5 rounded-full transition-all active:scale-95 active:bg-slate-50"
            >
                <span className="text-xs font-bold">切换课程</span>
                <ChevronDown size={14} className="text-slate-400" />
            </button>
        </div>
      </div>

      {/* 2. 可滚动的页面主体内容 */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide z-0">
        <div className="px-6 py-4">
          
          {/* 薄弱点列表 Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-black text-slate-800 flex items-center">
              <span className="w-1.5 h-4 bg-red-500 rounded-full mr-2"></span>
              待攻克薄弱点
            </h2>
            <div
              className="flex items-center space-x-1 text-slate-400 active:text-slate-600 transition-colors cursor-pointer group"
              onClick={() => onNavigate(AppView.WEAK_POINTS, { courseId: selectedCourseId || currentCourseId })}
            >
              <span className="text-[10px] font-bold group-hover:text-blue-500 transition-colors">查看全部</span>
              <ChevronRight size={12} className="group-hover:text-blue-500 transition-colors" />
            </div>
          </div>

          {/* 横向滚动薄弱点卡片 */}
          <div className="flex space-x-3 overflow-x-auto pb-6 -mx-6 px-6 scrollbar-hide snap-x">
             {weakPoints.map(wp => {
                 const styles = getCardStyles(wp.color);
                 return (
                     <div key={wp.id} className="snap-center flex-shrink-0 w-[85%] bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-8 h-8 rounded-xl ${styles.iconBg} flex items-center justify-center shadow-lg ${styles.shadow}`}>
                            <wp.icon size={18} className="text-white" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-800">{wp.title}</h3>
                            <p className={`text-[10px] ${styles.tag} font-bold uppercase tracking-wider`}>{wp.tag}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50 mb-4 font-medium flex-1">
                          {wp.desc}
                        </p>
                        <button className={`w-full py-2.5 ${styles.btn} text-white text-[11px] font-bold rounded-xl shadow-lg active:scale-95 transition-transform`}>
                          立即强化学习
                        </button>
                     </div>
                 )
             })}
          </div>

          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">深度诊断分析</h2>
            <ChevronRight size={14} className="text-slate-300" />
          </div>

          {/* 核心诊断组件 - 从后端获取真实数据 */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden mb-10 flex flex-row h-[320px]">

            {/* 左侧分栏：学习特征 */}
            <div className="w-[55%] border-r border-slate-50 relative p-3 bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                  <Brain size={10} className="text-blue-500" />
                  学习特征
                </h4>
                {recommendationLoading && <Loader2 size={10} className="text-blue-500 animate-spin" />}
              </div>

              {courseOverview ? (
                <div className="flex-1 flex flex-col justify-center space-y-3">
                  {/* 学习时长 */}
                  <div className="bg-white/80 rounded-xl p-3 border border-blue-100/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={12} className="text-purple-500" />
                      <span className="text-[10px] font-bold text-slate-500">学习时长</span>
                    </div>
                    <p className="text-lg font-black text-slate-800">
                      {Math.round(courseOverview.totalStudyTime / 3600)}h
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        {courseOverview.studyDays}天
                      </span>
                    </p>
                  </div>

                  {/* 知识点统计 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/80 rounded-xl p-2.5 border border-green-100/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Award size={10} className="text-green-500" />
                        <span className="text-[9px] font-bold text-slate-500">已掌握</span>
                      </div>
                      <p className="text-lg font-black text-green-600">
                        {courseOverview.masteredCount}
                      </p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-2.5 border border-red-100/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertCircle size={10} className="text-red-500" />
                        <span className="text-[9px] font-bold text-slate-500">薄弱点</span>
                      </div>
                      <p className="text-lg font-black text-red-500">
                        {courseOverview.weakCount}
                      </p>
                    </div>
                  </div>

                  {/* 掌握度 */}
                  <div className="bg-white/80 rounded-xl p-2.5 border border-blue-100/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-slate-500">平均掌握度</span>
                      <span className="text-sm font-black text-blue-600">{courseOverview.averageMasteryScore}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                        style={{ width: `${courseOverview.averageMasteryScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Brain size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-[10px]">暂无学习数据</p>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧分栏：推荐策略 */}
            <div className="w-[45%] p-3 flex flex-col overflow-y-auto scrollbar-hide bg-white">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-tighter flex items-center gap-1">
                  <Lightbulb size={10} className="text-orange-500" />
                  推荐策略
                </h4>
              </div>

              {learningPath && learningPath.recommendedPath ? (
                <div className="space-y-2">
                  {/* 学习策略概述 */}
                  {learningPath.learningStrategy && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-2 border border-orange-100 mb-2">
                      <p className="text-[9px] text-orange-700 leading-relaxed">
                        {learningPath.learningStrategy.description}
                      </p>
                    </div>
                  )}

                  {/* 推荐学习路径 */}
                  <div className="text-[9px] font-bold text-slate-500 mb-1">
                    今日推荐 ({learningPath.recommendedPath.slice(0, 3).length}项)
                  </div>

                  {learningPath.recommendedPath.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 active:scale-95 transition-transform cursor-pointer"
                      onClick={() => onNavigate(AppView.DRILL)}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${
                        item.priority === 'high'
                          ? 'bg-red-100 text-red-600'
                          : item.priority === 'medium'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {item.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{item.name}</p>
                        <p className="text-[8px] text-slate-400 truncate">{item.reason}</p>
                      </div>
                      <ChevronRight size={12} className="text-slate-300" />
                    </div>
                  ))}

                  {/* 预估时间 */}
                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>预计学习时间</span>
                    <span className="font-bold">{Math.round(learningPath.estimatedTotalTime / 60)}分钟</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <Lightbulb size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-[10px]">暂无推荐策略</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* P4 - Advanced Analysis Tabs */}
          <div className="mb-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-1">P4 数据分析</h2>

            {/* Tab Navigation */}
            <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide">
              {[
                { key: 'mastery', label: '掌握度', icon: Brain },
                { key: 'correlation', label: '关联度', icon: Activity },
                { key: 'sequence', label: '学习顺序', icon: TrendingUp },
                { key: 'bottleneck', label: '瓶颈', icon: AlertCircle },
                { key: 'evaluation', label: '评估报告', icon: BarChart3 },
                { key: 'efficiency', label: '效率', icon: Zap },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as typeof activeTab)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  <tab.icon size={12} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              {analysisLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                  <span className="ml-2 text-sm text-slate-500">加载中...</span>
                </div>
              ) : (
                <>
                  {/* Knowledge Mastery Tab */}
                  {activeTab === 'mastery' && knowledgeMastery && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-800">知识点掌握统计</h3>
                        <span className="text-xs text-slate-500">共 {knowledgeMastery.totalPoints} 个</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center p-2 bg-green-50 rounded-xl">
                          <p className="text-lg font-bold text-green-600">{knowledgeMastery.masteredPoints}</p>
                          <p className="text-[10px] text-slate-500">已掌握</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-xl">
                          <p className="text-lg font-bold text-blue-600">{knowledgeMastery.learningPoints}</p>
                          <p className="text-[10px] text-slate-500">学习中</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-xl">
                          <p className="text-lg font-bold text-red-500">{knowledgeMastery.weakPoints}</p>
                          <p className="text-[10px] text-slate-500">薄弱</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-xl">
                          <p className="text-lg font-bold text-slate-600">{knowledgeMastery.averageScore}</p>
                          <p className="text-[10px] text-slate-500">平均分</p>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {knowledgeMastery.points?.slice(0, 5).map((point) => (
                          <div key={point.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <span className="text-xs font-medium text-slate-700 truncate flex-1">{point.name}</span>
                            <span className={`text-[10px] px-2 py-1 rounded-full ${
                              point.status === 'MASTERED' ? 'bg-green-100 text-green-600' :
                              point.status === 'WEAK' ? 'bg-red-100 text-red-500' :
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              {point.masteryScore}分
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Knowledge Correlation Tab */}
                  {activeTab === 'correlation' && knowledgeCorrelation && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-800">知识点关联度</h3>
                        <span className="text-xs text-slate-500">共 {knowledgeCorrelation.totalCorrelations} 条</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {knowledgeCorrelation.correlationMatrix?.slice(0, 5).map((corr, i) => (
                          <div key={i} className="p-2 bg-slate-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-slate-700">{corr.sourceName}</span>
                              <span className="text-[10px] text-slate-400">→</span>
                              <span className="text-xs font-medium text-slate-700">{corr.targetName}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-slate-500">{corr.reason}</span>
                              <span className="text-[10px] font-bold text-blue-600">{corr.correlation}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Sequence Tab */}
                  {activeTab === 'sequence' && learningSequence && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-800">推荐学习顺序</h3>
                        <span className="text-xs text-slate-500">约 {learningSequence.totalEstimatedTime} 分钟</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {learningSequence.suggestedSequence?.slice(0, 5).map((item) => (
                          <div key={item.order} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg">
                            <span className="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                              {item.order}
                            </span>
                            <span className="text-xs font-medium text-slate-700 flex-1 truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottleneck Tab */}
                  {activeTab === 'bottleneck' && bottlenecks && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-800">知识点瓶颈</h3>
                        <span className="text-xs text-slate-500">共 {bottlenecks.bottleneckCount} 个</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {bottlenecks.bottlenecks?.slice(0, 3).map((b) => (
                          <div key={b.knowledgePointId} className="p-2 bg-red-50 rounded-lg border border-red-100">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-700">{b.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                b.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                                b.difficulty === 'medium' ? 'bg-orange-100 text-orange-600' :
                                'bg-green-100 text-green-600'
                              }`}>
                                {b.difficulty === 'hard' ? '困难' : b.difficulty === 'medium' ? '中等' : '简单'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">{b.reasons?.[0]}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evaluation Tab */}
                  {activeTab === 'evaluation' && evaluation && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-800">学习评估报告</h3>
                        <span className="text-lg font-black text-blue-600">{evaluation.grade}</span>
                      </div>
                      <div className="text-center mb-3">
                        <p className="text-3xl font-black text-slate-800">{evaluation.overallScore}</p>
                        <p className="text-[10px] text-slate-500">综合评分</p>
                      </div>
                      <div className="space-y-2 mb-3">
                        {Object.entries(evaluation.dimensions || {}).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <span className="text-xs text-slate-600">
                              {key === 'studyTime' ? '学习时长' :
                               key === 'knowledgeMastery' ? '知识点掌握' :
                               key === 'practice' ? '练习' : '复习'}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-700">{value.score}分</span>
                              <span className="text-[10px] text-slate-400">({value.rating})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <p className="text-[10px] font-bold text-blue-600 mb-1">建议</p>
                          <p className="text-[10px] text-slate-600">{evaluation.suggestions[0]}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Efficiency Tab */}
                  {activeTab === 'efficiency' && efficiency && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-800">学习效率分析</h3>
                        <span className="text-lg font-black text-purple-600">{efficiency.efficiencyScore}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-center p-2 bg-slate-50 rounded-xl">
                          <p className="text-lg font-bold text-slate-700">{efficiency.metrics?.retentionRate ? Math.round(efficiency.metrics.retentionRate * 100) : 0}%</p>
                          <p className="text-[10px] text-slate-500">知识保持率</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-xl">
                          <p className="text-lg font-bold text-slate-700">{efficiency.studyPatterns?.preferredTime || '-'}</p>
                          <p className="text-[10px] text-slate-500">偏好时段</p>
                        </div>
                      </div>
                      {efficiency.recommendations && efficiency.recommendations.length > 0 && (
                        <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-[10px] font-bold text-amber-600 mb-1">效率建议</p>
                          <p className="text-[10px] text-slate-600">{efficiency.recommendations[0]}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Default empty state */}
                  {!knowledgeMastery && !knowledgeCorrelation && !learningSequence && !bottlenecks && !evaluation && !efficiency && (
                    <div className="text-center py-8 text-slate-400">
                      <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs">选择一个分析维度查看数据</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*
          3. 助学机器人 - 使用 absolute 定位
          改为 absolute 并配合父容器 h-screen，使其在手机模拟器容器内“相对固定”，
          而不会飞到屏幕最右侧（解决 desktop 预览时的位置问题）。
      */}
      <div 
        onClick={() => onNavigate(AppView.AGENT)}
        className="absolute bottom-[20%] right-5 z-[100] transition-all active:scale-90"
      >
        <div className="relative cursor-pointer group">
          {/* AI 引导气泡 */}
          <div className="absolute -top-14 right-0 bg-white shadow-2xl border border-blue-100 px-4 py-2.5 rounded-2xl rounded-br-none whitespace-nowrap animate-bounce">
             <span className="text-[10px] font-black text-blue-600">点击进入助学空间</span>
             <div className="absolute -bottom-1.5 right-0 w-3 h-3 bg-white border-r border-b border-blue-100 rotate-45"></div>
          </div>

          {/* 机器人核心视觉 */}
          <div className="w-16 h-16 relative flex items-center justify-center">
             <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
             <img 
               src="https://img.icons8.com/plasticine/200/robot-3.png" 
               alt="Lumi AI" 
               className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform"
             />
             {/* 在线状态呼吸灯 */}
             <div className="absolute -right-1 top-0 bg-[#34D399] p-1.5 rounded-full shadow-lg border-2 border-white ring-4 ring-emerald-50 animate-pulse">
                <Bot size={10} className="text-white" />
             </div>
          </div>
        </div>
      </div>

      {/* 课程选择抽屉逻辑 */}
      {showPicker && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowPicker(false)}></div>
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 z-[120] shadow-2xl animate-in slide-in-from-bottom duration-400 h-[65vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800">切换分析课程</h3>
              <button onClick={() => setShowPicker(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
            </div>

            {/* 搜索框 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center space-x-3 mb-4">
                 <Search size={18} className="text-slate-400" />
                 <input 
                    className="bg-transparent outline-none text-sm font-bold text-slate-700 w-full placeholder:text-slate-400" 
                    placeholder="搜索我的课程..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    autoFocus
                 />
             </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2.5 pb-6">
                 {filteredCourses.map(course => {
                     const isSelected = selectedCourseName === course.name;
                     return (
                        <button 
                            key={course.id}
                            onClick={() => {
                                setSelectedCourseName(course.name);
                                setSelectedCourseId(course.id);
                                setShowPicker(false);
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-98 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200'}`}
                        >
                            <div className="flex flex-col items-start">
                                <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{course.name}</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">{course.semester} · {course.type === 'PROFESSIONAL' ? '专业课' : '选修'}</span>
                            </div>
                            {isSelected && <Check size={18} className="text-blue-600" />}
                        </button>
                     )
                 })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Analysis;
