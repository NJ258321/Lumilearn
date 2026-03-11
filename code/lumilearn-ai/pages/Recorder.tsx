
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Camera, Flag, Upload, ArrowLeft, ChevronDown, Play, Zap, Type, X, Search, Check, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Course, Chapter } from '../types';
import { getCourseList } from '../src/api/courses';
import { getChapterList } from '../src/api/chapters';
import { createStudyRecord } from '../src/api/studyRecords';
import { uploadAudio, uploadImage, uploadDocument, deleteFile } from '../src/api/upload';

interface RecorderProps {
  onBack: () => void;
  initialCourseName?: string;
}

const Recorder: React.FC<RecorderProps> = ({ onBack, initialCourseName }) => {
  // 修改初始状态：默认为暂停，计时从 0 开始
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [noteText, setNoteText] = useState('');

  // API 数据
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // 课程和章节选择状态
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [courseName, setCourseName] = useState(initialCourseName || '');
  const [showPicker, setShowPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [searchText, setSearchText] = useState('');

  // 加载课程列表
  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const response = await getCourseList();
      if (response.success && response.data) {
        setCourses(response.data);
        // 如果有初始课程名，找到对应的ID
        if (initialCourseName) {
          const course = response.data.find(c => c.name === initialCourseName);
          if (course) {
            setSelectedCourseId(course.id);
            setCourseName(course.name);
          }
        } else if (response.data.length > 0) {
          setSelectedCourseId(response.data[0].id);
          setCourseName(response.data[0].name);
        }
      }
    } catch (err) {
      console.error('加载课程失败', err);
    } finally {
      setCoursesLoading(false);
    }
  }, [initialCourseName]);

  // 加载章节列表
  const fetchChapters = useCallback(async (courseId: string) => {
    try {
      const response = await getChapterList({ courseId });
      if (response.success && response.data) {
        setChapters(response.data);
        // 默认选择第一个章节
        if (response.data.length > 0) {
          setSelectedChapterId(response.data[0].id);
        }
      }
    } catch (err) {
      console.error('加载章节失败', err);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // 课程变化时加载章节
  useEffect(() => {
    if (selectedCourseId) {
      fetchChapters(selectedCourseId);
      // 更新课程名称
      const course = courses.find(c => c.id === selectedCourseId);
      if (course) {
        setCourseName(course.name);
      }
      setSelectedChapterId('');
    }
  }, [selectedCourseId, courses, fetchChapters]);

  // API State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 显示成功消息并2秒后自动清除
  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => {
      setSuccess(null);
    }, 2000);
  };

  // Save State
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedImages, setRecordedImages] = useState<string[]>([]);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 上传状态
  const [uploading, setUploading] = useState(false);

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp3'];
    if (!allowedTypes.includes(file.type)) {
      setError('仅支持 MP3、WAV、M4A 格式的音频文件');
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await uploadAudio(file);
      if (response.success && response.data) {
        setRecordedAudioUrl(response.data.url);
        showSuccess('音频上传成功！');
      } else {
        setError(response.error || '上传失败');
      }
    } catch (err) {
      setError('上传失败，请重试');
    } finally {
      setUploading(false);
      // 清空input以便再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 触发文件选择
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // 图片上传相关
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ url: string; originalName: string }[]>([]);

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 验证文件
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const fileArray = Array.prototype.slice.call(files) as File[];
    const validFiles = fileArray.filter((file: File) => {
      if (!allowedTypes.includes(file.type)) {
        setError(`不支持 ${file.name} 格式，仅支持 JPG、PNG、GIF、WebP 格式`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} 超过5MB限制`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImageUploading(true);
    setError(null);

    try {
      const newImages: { url: string; originalName: string }[] = [];

      for (const file of validFiles) {
        const response = await uploadImage(file);
        if (response.success && response.data) {
          newImages.push({
            url: response.data.url,
            originalName: response.data.originalName
          });
        } else {
          setError(response.error || `${file.name} 上传失败`);
        }
      }

      if (newImages.length > 0) {
        setUploadedImages(prev => [...prev, ...newImages]);
        setImageCount(prev => prev + newImages.length);
        showSuccess(`成功上传 ${newImages.length} 张图片`);
      }
    } catch (err) {
      setError('图片上传失败，请重试');
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // 触发图片选择
  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  // 删除已上传的图片
  const removeImage = async (index: number) => {
    const imageToRemove = uploadedImages[index];
    if (imageToRemove) {
      try {
        // 从URL中提取文件名
        const filename = imageToRemove.url.split('/').pop();
        if (filename) {
          await deleteFile(filename);
        }
      } catch (err) {
        console.error('删除图片失败', err);
      }
    }
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setImageCount(prev => prev - 1);
  };

  // 文档上传相关
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<{ url: string; originalName: string } | null>(null);

  // 处理文档上传
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (!allowedTypes.includes(file.type)) {
      setError('仅支持 PDF、Word、PowerPoint 格式的文档');
      return;
    }

    // 验证文件大小（50MB）
    if (file.size > 50 * 1024 * 1024) {
      setError('文档大小不能超过 50MB');
      return;
    }

    setDocumentUploading(true);
    setError(null);

    try {
      const response = await uploadDocument(file);
      if (response.success && response.data) {
        setUploadedDocument({
          url: response.data.url,
          originalName: response.data.originalName
        });
        showSuccess('文档上传成功！');
      } else {
        setError(response.error || '上传失败');
      }
    } catch (err) {
      setError('上传失败，请重试');
    } finally {
      setDocumentUploading(false);
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    }
  };

  // 触发文档选择
  const triggerDocumentUpload = () => {
    documentInputRef.current?.click();
  };

  // 删除已上传的文档
  const removeDocument = async () => {
    if (uploadedDocument) {
      try {
        // 从URL中提取文件名
        const filename = uploadedDocument.url.split('/').pop();
        if (filename) {
          await deleteFile(filename);
        }
      } catch (err) {
        console.error('删除文档失败', err);
      }
    }
    setUploadedDocument(null);
  };

  // Save Study Record Handler
  const handleSaveRecord = async () => {
    if (!recordTitle.trim()) {
      setError('请输入记录标题');
      return;
    }
    if (!selectedCourseId) {
      setError('请选择课程');
      return;
    }
    if (!selectedChapterId) {
      setError('请选择章节');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 如果有本地录制的音频，先上传
      let audioUrl = recordedAudioUrl;
      if (recordedAudioUrl && recordedAudioUrl.startsWith('blob:')) {
        // 将blob URL转换为File并上传，使用blob的实际类型
        const response = await fetch(recordedAudioUrl);
        const blob = await response.blob();
        // 从blob类型推断文件扩展名
        const extension = blob.type.includes('mp4') ? 'm4a' : 'webm';
        const file = new File([blob], `recording.${extension}`, { type: blob.type });
        console.log('上传音频文件类型:', blob.type);
        const uploadRes = await uploadAudio(file);
        if (uploadRes.success && uploadRes.data) {
          audioUrl = uploadRes.data.url;
        }
      }

      // 获取上传的图片URL列表
      const imageUrls = uploadedImages.map(img => img.url);

      const response = await createStudyRecord({
        courseId: selectedCourseId,
        chapterId: selectedChapterId,
        title: recordTitle,
        date: new Date().toISOString(),
        audioUrl: audioUrl || undefined,
        notes: noteText || undefined,
        duration: duration,
        status: audioUrl ? 'COMPLETED' : 'RECORDING',
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      if (response.success) {
        showSuccess('学习记录保存成功！');
        setShowSaveConfirm(false);
        // Reset form
        setRecordTitle('');
        setNoteText('');
        setRecordedAudioUrl(null);
        setRecordedImages([]);
        setDuration(0);
        setImageCount(0);
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
      // 先创建一个 audio 元素来实时播放麦克风声音，以便调试
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      console.log('麦克风获取成功', stream.getAudioTracks()[0].getSettings());

      // 创建一个 audio 元素实时播放麦克风输入，用于调试
      const audioElement = new Audio();
      audioElement.srcObject = stream;
      audioElement.autoplay = true;
      audioElement.volume = 1;
      console.log('实时播放元素已创建，请听是否有声音');

      // 优先使用兼容性好的格式
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }
      console.log('使用的MIME类型:', mimeType || '浏览器默认');

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        console.log('收到音频数据块:', e.data.size, 'bytes');
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // 停止实时播放
        audioElement.srcObject = null;

        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        console.log('录音完成，Blob大小:', blob.size, 'bytes');
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
    } catch (err) {
      console.error('录音失败:', err);
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

  // 过滤课程列表 - 使用真实的 courses 状态
  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-[#F7F9FC] text-slate-800 relative font-sans overflow-hidden">

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/m4a,audio/x-m4a,audio/mp3"
        onChange={handleFileUpload}
        className="hidden"
      />
      {/* 隐藏的图片文件输入 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />
      {/* 隐藏的文档文件输入 */}
      <input
        ref={documentInputRef}
        type="file"
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        onChange={handleDocumentUpload}
        className="hidden"
      />

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
                      {/* 录音预览 */}
                      {recordedAudioUrl && (
                        <div className="mt-3">
                          <audio controls src={recordedAudioUrl} className="w-full h-8" />
                        </div>
                      )}
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
      <div className="px-6 mb-3 z-10">
        {/* 课程选择 */}
        <div
          className="flex items-center cursor-pointer active:opacity-70 transition-opacity group"
          onClick={() => setShowPicker(true)}
        >
          <h1 className="text-3xl font-black tracking-tight text-slate-900 truncate pr-2 max-w-[85%]">
            {coursesLoading ? '加载中...' : courseName || '请选择课程'}
          </h1>
          <div className="bg-slate-100 p-1 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
              <ChevronDown size={20} />
          </div>
        </div>
        {/* 章节选择 */}
        {selectedCourseId && (
          <div
            className="flex items-center cursor-pointer mt-2 active:opacity-70 transition-opacity group"
            onClick={() => setShowChapterPicker(true)}
          >
            <span className="text-sm font-medium text-slate-500 truncate pr-2">
              {chapters.length > 0
                ? chapters.find(c => c.id === selectedChapterId)?.name || '请选择章节'
                : '暂无章节'}
            </span>
            {chapters.length > 0 && (
              <ChevronDown size={16} className="text-slate-400" />
            )}
          </div>
        )}
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                  <Type size={14} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-700">随心记</h3>
              </div>
              {/* 文档上传按钮 */}
              {uploadedDocument ? (
                <button
                  onClick={removeDocument}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  删除文档
                </button>
              ) : (
                <button
                  onClick={triggerDocumentUpload}
                  disabled={documentUploading}
                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 disabled:opacity-50"
                >
                  {documentUploading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Upload size={12} />
                  )}
                  上传文档
                </button>
              )}
            </div>
            {/* 已上传文档显示 */}
            {uploadedDocument && (
              <div className="mb-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-xs text-blue-600 truncate">{uploadedDocument.originalName}</span>
                <button onClick={removeDocument} className="text-blue-400 hover:text-blue-600">
                  <X size={14} />
                </button>
              </div>
            )}
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
        {/* 拍摄入口 - 点击上传图片 */}
        <button
          onClick={triggerImageUpload}
          disabled={imageUploading}
          className="bg-white border border-slate-100 rounded-[24px] h-28 flex flex-col items-center justify-center space-y-2 active:scale-95 transition-transform shadow-sm disabled:opacity-50"
        >
            <div className="w-10 h-10 rounded-full border border-slate-100 bg-slate-50 flex items-center justify-center">
                {imageUploading ? (
                  <Loader2 size={20} className="text-blue-500 animate-spin" />
                ) : (
                  <Camera size={20} className="text-slate-400" />
                )}
            </div>
            <div className="text-center">
                <div className="text-xs font-bold text-slate-700">拍摄</div>
                <div className="text-[9px] text-slate-400 tracking-wider">上传图片</div>
            </div>
        </button>

        {/* 图片预览卡片 - 点击查看/上传更多 */}
        <div
          onClick={triggerImageUpload}
          className="relative h-28 group cursor-pointer active:scale-95 transition-transform"
        >
            <div className="absolute top-1 left-1 right-[-2px] bottom-[-2px] bg-white rounded-[24px] border border-slate-100 -z-10 shadow-sm"></div>
            <div className="w-full h-full bg-white border border-slate-100 rounded-[24px] overflow-hidden flex flex-col shadow-sm">
                <div className="flex-1 relative bg-slate-100">
                    {uploadedImages.length > 0 ? (
                      <>
                        <img
                          src={uploadedImages[uploadedImages.length - 1].url}
                          className="w-full h-full object-cover"
                          alt="Preview"
                        />
                        {uploadedImages.length > 1 && (
                          <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                            +{uploadedImages.length - 1}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Camera size={24} />
                      </div>
                    )}
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
            <button
              onClick={triggerFileUpload}
              disabled={uploading}
              className="flex flex-col items-center space-y-1 group active:scale-90 transition-transform translate-y-3 disabled:opacity-50"
            >
                <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shadow-sm">
                    {uploading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <Upload size={24} />
                    )}
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
                            onClick={() => {
                                setSelectedCourseId(''); // 清空课程ID，表示自定义课程
                                setShowPicker(false);
                            }}
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
                                    setSelectedCourseId(course.id);
                                    setCourseName(course.name);
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
                     
                     {/* 如果没有匹配结果或想添加自定义 */}
                     {searchText && !filteredCourses.find(c => c.name === searchText) && (
                         <button
                            onClick={() => {
                               setCourseName(searchText);
                               setSelectedCourseId(''); // 清空课程ID，表示自定义课程
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

      {/* 【8】章节选择 Picker (Bottom Sheet) */}
      {showChapterPicker && selectedCourseId && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowChapterPicker(false)}></div>
             <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 z-[110] shadow-2xl animate-in slide-in-from-bottom h-[65vh] flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-black text-slate-800">选择章节</h3>
                     <button onClick={() => setShowChapterPicker(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                         <X size={20} />
                     </button>
                 </div>

                 {/* 章节列表 */}
                 <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2.5 pb-6">
                     {chapters.length === 0 ? (
                         <div className="text-center py-8 text-slate-400">
                             该课程暂无章节，请先添加章节
                         </div>
                     ) : (
                         chapters.map((chapter) => {
                             const isSelected = selectedChapterId === chapter.id;
                             return (
                                <button
                                    key={chapter.id}
                                    onClick={() => {
                                        setSelectedChapterId(chapter.id);
                                        setShowChapterPicker(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-98 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200'}`}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {chapter.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">排序: #{chapter.order}</span>
                                    </div>
                                    {isSelected && <Check size={18} className="text-blue-600" />}
                                </button>
                             )
                         })
                     )}
                 </div>
             </div>
        </div>
      )}

    </div>
  );
};

export default Recorder;
