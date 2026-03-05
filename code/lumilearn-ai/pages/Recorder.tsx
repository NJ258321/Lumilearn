
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Camera, Flag, Upload, ArrowLeft, ChevronDown, Play, Zap, Type, X, Search, Check, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { MOCK_COURSES } from '../constants';
import { createStudyRecord } from '../src/api/studyRecords';
import { uploadAudio, uploadImage } from '../src/api/upload';

interface RecorderProps {
  onBack: () => void;
  initialCourseName?: string;
}

const Recorder: React.FC<RecorderProps> = ({ onBack, initialCourseName }) => {
  // 修改初始状态：默认为暂停，计时从 0 开始
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [imageCount] = useState(3);
  const [noteText, setNoteText] = useState('');

  // 课程选择状态
  const [courseName, setCourseName] = useState(initialCourseName || "遥感原理与应用");
  const [showPicker, setShowPicker] = useState(false);
  const [searchText, setSearchText] = useState('');

  // API State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Save State
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedImages, setRecordedImages] = useState<string[]>([]);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Save Study Record Handler
  const handleSaveRecord = async () => {
    if (!recordTitle.trim()) {
      setError('请输入记录标题');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get course ID (using mock data for now)
      const course = MOCK_COURSES.find(c => c.name === courseName);
      const courseId = course?.id || '550e8400-e29b-41d4-a716-446655440001';

      const response = await createStudyRecord({
        courseId,
        chapterId: '550e8400-e29b-41d4-a716-446655440002', // 使用测试章节ID
        title: recordTitle,
        date: new Date().toISOString(),
        audioUrl: recordedAudioUrl || undefined,
        notes: noteText || undefined,
        duration: duration,
        status: 'RECORDING',
      });

      if (response.success) {
        setSuccess('学习记录保存成功！');
        setShowSaveConfirm(false);
        // Reset form
        setRecordTitle('');
        setNoteText('');
        setRecordedAudioUrl(null);
        setRecordedImages([]);
        setDuration(0);
        // Navigate back after short delay
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        setError(response.error || '保存失败');
      }
    } catch (err) {
      setError('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
    } catch (err) {
      setError('无法访问麦克风，请检查权限');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 计时器逻辑
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 过滤课程列表
  const filteredCourses = MOCK_COURSES.filter(c => 
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-[#F7F9FC] text-slate-800 relative font-sans overflow-hidden">
      
      {/* 【1】顶部状态栏区域 */}
      <div className="pt-10 px-6 pb-2 flex justify-between items-center z-10">
        <div className="flex items-center space-x-1 group cursor-pointer active:opacity-70 transition-opacity">
          <span className={`${isRecording ? 'text-blue-600' : 'text-slate-400'} text-sm font-bold tracking-wide transition-colors`}>
            {isRecording ? '正在采集' : '已暂停'}
          </span>
          <ChevronDown size={14} className={isRecording ? 'text-blue-600' : 'text-slate-400'} />
        </div>

        <div className="flex items-center space-x-3">
            {/* 保存按钮 - 当有时长或笔记时显示 */}
            {(duration > 0 || noteText) && !isRecording && (
                <button
                    onClick={() => {
                        setRecordTitle(`${courseName} - ${formatTime(duration)}`);
                        setShowSaveConfirm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg active:scale-95 transition-transform"
                >
                    保存
                </button>
            )}
            <div className="bg-[#2D1B22]/10 border border-red-500/10 px-3 py-1.5 rounded-full flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-slate-300'}`}></div>
                <span className="text-sm font-mono font-bold tracking-widest text-slate-800">{formatTime(duration)}</span>
            </div>
        </div>
      </div>

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

      {/* Success Toast */}
      {success && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-in slide-in-from-top">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">{success}</span>
          </div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
          <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-800">保存学习记录</h3>
                      <button onClick={() => setShowSaveConfirm(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">记录标题</label>
                          <input
                              type="text"
                              value={recordTitle}
                              onChange={(e) => setRecordTitle(e.target.value)}
                              placeholder="请输入记录标题"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                      </div>
                      <div className="text-sm text-slate-500 space-y-1">
                          <p>课程：{courseName}</p>
                          <p>时长：{formatTime(duration)}</p>
                          {recordedAudioUrl && <p className="text-green-600">已录制音频</p>}
                          {noteText && <p>笔记字数：{noteText.length}</p>}
                      </div>
                  </div>
                  <div className="flex space-x-3 mt-5">
                      <button
                          onClick={() => setShowSaveConfirm(false)}
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                      >
                          取消
                      </button>
                      <button
                          onClick={handleSaveRecord}
                          disabled={!recordTitle.trim() || loading}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                          {loading ? <Loader2 className="animate-spin" size={18} /> : '保存'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 【2】课程信息区 - 可点击切换 */}
      <div 
        className="px-6 mb-3 z-10 flex items-center cursor-pointer active:opacity-70 transition-opacity group"
        onClick={() => setShowPicker(true)}
      >
        <h1 className="text-3xl font-black tracking-tight text-slate-900 truncate pr-2 max-w-[85%]">{courseName}</h1>
        <div className="bg-slate-100 p-1 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            <ChevronDown size={20} />
        </div>
      </div>

      {/* 【3】AI 语音采集区 */}
      <div className="px-6 mb-3 z-10">
        <div className="bg-white border border-slate-100 rounded-[28px] p-4 relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-lg ${isRecording ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'} flex items-center justify-center transition-colors`}>
                        <Mic size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">AI 语义音频流</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${isRecording ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'} px-3 py-1 rounded-full border transition-colors`}>
                    <Zap size={10} className={`${isRecording ? 'text-blue-500 fill-blue-500' : 'text-slate-300'}`} />
                    <span className={`text-[9px] font-bold ${isRecording ? 'text-blue-600' : 'text-slate-400'}`}>
                        {isRecording ? '正在捕获重点' : '就绪'}
                    </span>
                </div>
            </div>

            {/* 音频波形图动画 */}
            <div className="flex items-end justify-between h-10 mb-2 px-2">
                {[...Array(32)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-1 rounded-full transition-all duration-300 ${isRecording ? 'bg-blue-400/60' : 'bg-slate-200'}`}
                        style={{ 
                            height: isRecording ? `${Math.random() * 80 + 20}%` : '10%',
                            backgroundColor: i === 12 || i === 22 ? (isRecording ? '#EF4444' : '#CBD5E1') : '',
                        }}
                    >
                    </div>
                ))}
            </div>

            <div className="text-center">
                <p className={`text-[10px] font-medium text-slate-400 ${isRecording ? 'animate-pulse' : ''}`}>
                    {isRecording ? '正在生成语义标记点...' : '等待开始录制'}
                </p>
            </div>
        </div>
      </div>

      {/* 【4】随心记区域 - 拉长高度至 h-60 (约 240px) */}
      <div className="px-6 mb-3 z-10 h-60 flex flex-col">
        <div className="bg-white border border-slate-100 rounded-[28px] p-5 flex-1 flex flex-col shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
                <Type size={14} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700">随心记</h3>
            </div>
            <textarea 
                className="flex-1 w-full bg-transparent resize-none outline-none text-sm text-slate-600 placeholder:text-slate-300 leading-relaxed"
                placeholder="输入关键词或灵感，系统将自动对齐时间轴..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
            ></textarea>
        </div>
      </div>

      {/* 【5】多模态采集入口 - 精确调整 mb 使其底端位于暂停按钮上方 3px */}
      <div className="px-6 mb-[131px] z-10 grid grid-cols-2 gap-3">
        {/* 拍摄入口 */}
        <button className="bg-white border border-slate-100 rounded-[24px] h-28 flex flex-col items-center justify-center space-y-2 active:scale-95 transition-transform shadow-sm">
            <div className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center">
                <Camera size={20} className="text-slate-400" />
            </div>
            <div className="text-center">
                <div className="text-xs font-bold text-slate-700">拍摄</div>
                <div className="text-[9px] text-slate-400 tracking-wider">智能检测</div>
            </div>
        </button>

        {/* 图片预览卡片 */}
        <div className="relative h-28 group cursor-pointer active:scale-95 transition-transform">
            <div className="absolute top-1 left-1 right-[-2px] bottom-[-2px] bg-white rounded-[24px] border border-slate-100 -z-10 shadow-sm"></div>
            <div className="w-full h-full bg-white border border-slate-100 rounded-[24px] overflow-hidden flex flex-col shadow-sm">
                <div className="flex-1 relative bg-slate-100">
                    <img 
                        src="https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=200" 
                        className="w-full h-full object-cover"
                        alt="Preview"
                    />
                </div>
                <div className="bg-slate-900 py-1 flex items-center justify-center space-x-2">
                    <Camera size={10} className="text-white/60" />
                    <span className="text-[9px] font-bold text-white/90">{imageCount} 张</span>
                </div>
            </div>
        </div>
      </div>

      {/* 【6】底部主操作区 */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#F7F9FC] via-[#F7F9FC]/95 to-transparent z-20 px-10 flex flex-col items-center justify-end pb-8">
        
        <div className="flex items-end justify-between w-full max-w-sm">
            {/* 上传按钮 */}
            <button className="flex flex-col items-center space-y-1 group active:scale-90 transition-transform translate-y-3">
                <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shadow-sm">
                    <Upload size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-1">上传</span>
            </button>

            {/* 中心主按钮 */}
            <div className="flex flex-col items-center space-y-2 translate-y-3">
                <button
                    onClick={() => isRecording ? stopRecording() : startRecording()}
                    className={`w-24 h-24 rounded-[32px] flex items-center justify-center transition-all duration-300 transform active:scale-90 shadow-2xl ${
                        isRecording
                        ? 'bg-[#E11D48] shadow-[0_15px_40px_rgba(225,29,72,0.35)]'
                        : 'bg-blue-600 shadow-[0_15px_40px_rgba(37,99,235,0.35)]'
                    }`}
                >
                    {isRecording ? <Square size={32} fill="white" className="text-white" /> : <Play size={32} fill="white" className="text-white ml-1" />}
                </button>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRecording ? '点击暂停' : '点击继续'}</span>
            </div>

            {/* 返回按钮 */}
            <button 
                onClick={onBack}
                className="flex flex-col items-center space-y-1 group active:scale-90 transition-transform translate-y-3"
            >
                <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-800 transition-colors shadow-sm">
                    <ArrowLeft size={24} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-1">返回</span>
            </button>
        </div>
      </div>

      {/* 侧边快捷标记 */}
      <button className="absolute right-4 top-[45%] -translate-y-1/2 z-20 w-11 h-11 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-400 active:bg-blue-50 active:text-blue-600 transition-all">
        <Flag size={18} />
      </button>

      {/* 【7】课程选择 Picker (Bottom Sheet) */}
      {showPicker && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowPicker(false)}></div>
             <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 z-[110] shadow-2xl animate-in slide-in-from-bottom h-[65vh] flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-black text-slate-800">切换采集课程</h3>
                     <button onClick={() => setShowPicker(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                         <X size={20} />
                     </button>
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

                 {/* 课程列表 */}
                 <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2.5 pb-6">
                     {/* 如果当前课程不在列表中且有值，作为一个选项显示 */}
                     {courseName && !filteredCourses.find(c => c.name === courseName) && !searchText && (
                         <button 
                            onClick={() => setShowPicker(false)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-blue-500 bg-blue-50 transition-all"
                         >
                             <div className="flex flex-col items-start">
                                 <span className="text-sm font-bold text-blue-700">{courseName}</span>
                                 <span className="text-[10px] text-blue-400 mt-0.5">当前课程 (临时)</span>
                             </div>
                             <Check size={18} className="text-blue-600" />
                         </button>
                     )}

                     {filteredCourses.map(course => {
                         const isSelected = courseName === course.name;
                         return (
                            <button 
                                key={course.id}
                                onClick={() => {
                                    setCourseName(course.name);
                                    setShowPicker(false);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-98 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200'}`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{course.name}</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">{course.semester} · {course.type === 'major' ? '专业课' : '选修'}</span>
                                </div>
                                {isSelected && <Check size={18} className="text-blue-600" />}
                            </button>
                         )
                     })}
                     
                     {/* 如果没有匹配结果或想添加自定义 */}
                     {searchText && !filteredCourses.find(c => c.name === searchText) && (
                         <button 
                            onClick={() => {
                               setCourseName(searchText);
                               setShowPicker(false);
                            }}
                            className="w-full flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors active:scale-95"
                         >
                             <span className="text-xs font-bold">+ 使用自定义课程 "{searchText}"</span>
                         </button>
                     )}
                 </div>
             </div>
        </div>
      )}

    </div>
  );
};

export default Recorder;
