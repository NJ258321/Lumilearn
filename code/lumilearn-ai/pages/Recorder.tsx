
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API 类型声明
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
import { Mic, Square, Camera, Flag, Upload, ArrowLeft, ChevronDown, Play, Zap, Type, X, Search, Check, Loader2, AlertCircle, CheckCircle, Pause, Download, RotateCcw, Plus, BookOpen } from 'lucide-react';
import { Course, Chapter } from '../types';
import { getCourseList, createCourse } from '../src/api/courses';
import { getChapterList, createChapter } from '../src/api/chapters';
import { createStudyRecord, getStudyRecordList } from '../src/api/studyRecords';
import { uploadAudio, uploadImage, uploadDocument, deleteFile } from '../src/api/upload';
import { semanticAnalysis } from '../src/api/audio';
import { batchCreateTimeMarks } from '../src/api/timeMarks';
import { convertPPT } from '../src/api/pptConverter';
import { API_CONFIG } from '../src/api/request';

// 获取完整图片URL
const getFullImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_CONFIG.BASE_URL}${url}`;
};

interface RecorderProps {
  onBack: () => void;
  onSaveSuccess?: (recordId: string) => void;
  initialCourseName?: string;
}

// 本地时间标记类型
interface LocalTimeMark {
  id: string;
  timestamp: number;
  type: 'EMPHASIS' | 'QUESTION' | 'NOTE';
  content?: string;
}

const Recorder: React.FC<RecorderProps> = ({ onBack, onSaveSuccess, initialCourseName }) => {
  // 修改初始状态：默认为暂停，计时从 0 开始
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [noteText, setNoteText] = useState('');
  
  // 本地时间标记（录音过程中暂存）
  const [localTimeMarks, setLocalTimeMarks] = useState<LocalTimeMark[]>([]);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markContent, setMarkContent] = useState('');
  const [markType, setMarkType] = useState<'EMPHASIS' | 'QUESTION' | 'NOTE'>('EMPHASIS');

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

  // 加载课程列表（只显示本学期课程：学习中和复习中）
  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      // 并行获取学习中和复习中的课程
      const [studyingRes, reviewingRes] = await Promise.all([
        getCourseList({ status: 'STUDYING' }),
        getCourseList({ status: 'REVIEWING' })
      ]);
      
      const studyingCourses = studyingRes.success && studyingRes.data ? studyingRes.data : [];
      const reviewingCourses = reviewingRes.success && reviewingRes.data ? reviewingRes.data : [];
      
      // 合并课程列表
      const activeCourses = [...studyingCourses, ...reviewingCourses];
      
      if (activeCourses.length > 0) {
        setCourses(activeCourses);
        // 如果有初始课程名，找到对应的ID
        if (initialCourseName) {
          const course = activeCourses.find(c => c.name === initialCourseName);
          if (course) {
            setSelectedCourseId(course.id);
            setCourseName(course.name);
          }
        } else {
          // 默认选择第一个进行中的课程
          setSelectedCourseId(activeCourses[0].id);
          setCourseName(activeCourses[0].name);
        }
      } else {
        setCourses([]);
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

  // 创建新章节
  const createNewChapter = async (chapterName: string) => {
    if (!selectedCourseId) {
      alert('请先选择课程');
      return;
    }
    try {
      const response = await createChapter({
        name: chapterName,
        courseId: selectedCourseId,
        order: chapters.length + 1
      });
      if (response.success && response.data) {
        // 刷新章节列表
        await fetchChapters(selectedCourseId);
        // 选择新创建的章节
        setSelectedChapterId(response.data.id);
        setShowChapterPicker(false);
        alert('章节创建成功！');
      } else {
        alert(response.error || '创建章节失败');
      }
    } catch (err) {
      console.error('创建章节失败', err);
      alert('创建章节失败');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // 初始化语音识别 - 只在组件挂载时执行一次
  useEffect(() => {
    // 使用 ref 来跟踪录制状态，避免闭包问题
    const isRecordingRef = { current: false };

    // 检查浏览器是否支持Web Speech API
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setTranscriptionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      // 处理识别结果
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }

        if (finalTranscript) {
          console.log('识别到文字:', finalTranscript);
          setTranscription(prev => prev + finalTranscript);
        }
      };

      // 处理错误
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('语音识别错误:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setIsTranscribing(false);
        }
      };

      // 处理识别结束
      recognition.onend = () => {
        // 只有当仍在录制状态时才重新启动
        if (isRecordingRef.current) {
          console.log('识别结束，重新启动...');
          try {
            recognition.start();
          } catch (e) {
            console.error('重新启动语音识别失败:', e);
          }
        }
      };

      // 保存对 isRecordingRef 的引用，以便在回调中使用
      (recognition as any)._isRecordingRef = isRecordingRef;
      recognitionRef.current = recognition;
    } else {
      setTranscriptionSupported(false);
      console.log('浏览器不支持Web Speech API');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // 空依赖数组，只执行一次

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
  const [customChapterName, setCustomChapterName] = useState(''); // 自定义章节名
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedImages, setRecordedImages] = useState<string[]>([]);

  // 弹窗内音频播放状态
  const [isPopupPlaying, setIsPopupPlaying] = useState(false);
  const [popupCurrentTime, setPopupCurrentTime] = useState(0);
  const [popupDuration, setPopupDuration] = useState(0);
  const popupAudioRef = useRef<HTMLAudioElement | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 语音识别相关
  const [transcription, setTranscription] = useState<string>('');  // 转写文本
  const [isTranscribing, setIsTranscribing] = useState(false);  // 是否正在转写
  const [transcriptionSupported, setTranscriptionSupported] = useState(false);  // 是否支持语音识别
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 音频声浪相关
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(32).fill(0));  // 声浪级别
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // 上传状态
  const [uploading, setUploading] = useState(false);

  // 处理文件上传（音频或文档）
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 定义允许的文件类型
    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp3', 'audio/webm', 'audio/ogg'];
    const allowedDocumentTypes = [
      'application/pdf'  // 只接受PDF，PPT请用户自行转换
    ];

    const isAudio = allowedAudioTypes.includes(file.type);
    const isDocument = allowedDocumentTypes.includes(file.type);

    if (!isAudio && !isDocument) {
      setError('音频支持 MP3、WAV、M4A、WebM；文档仅支持 PDF（PPT请先转换为PDF）');
      return;
    }

    // 根据文件类型验证大小
    const maxAudioSize = 50 * 1024 * 1024; // 50MB
    const maxDocumentSize = 50 * 1024 * 1024; // 50MB

    if (isAudio && file.size > maxAudioSize) {
      setError('音频文件大小不能超过 50MB');
      return;
    }
    if (isDocument && file.size > maxDocumentSize) {
      setError('文档文件大小不能超过 50MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      if (isDocument) {
        // 上传文档
        const response = await uploadDocument(file);
        if (response.success && response.data) {
          setUploadedDocument({
            url: response.data.url,
            originalName: response.data.originalName
          });
          
          // PDF直接保存URL
          console.log('[Recorder] PDF uploaded:', response.data.url);
          setHasPDF(true);
          showSuccess('PDF 上传成功！');
        } else {
          setError(response.error || '上传失败');
        }
      } else {
        // 上传音频
        const response = await uploadAudio(file);
        if (response.success && response.data) {
          setRecordedAudioUrl(response.data.url);
          // 对于上传的音频文件，设置一个默认时长（用于显示保存按钮）
          // 实际时长会在后端分析时更新
          if (duration === 0) {
            setDuration(1); // 设置1秒作为标记，表示有音频
          }
          showSuccess('音频上传成功！请点击保存按钮完成分析');
        } else {
          setError(response.error || '上传失败');
        }
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
  const cameraInputRef = useRef<HTMLInputElement>(null);  // 新增：用于直接拍照
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

  // 触发图片选择（从相册）
  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  // 触发直接拍照（调用摄像头）
  const triggerCameraCapture = () => {
    cameraInputRef.current?.click();
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
  const [hasPDF, setHasPDF] = useState(false);  // 是否上传了PDF课件

  // 转换 PPT 为图片（调用后端 API）
  const convertAndUploadPPT = async (serverFilePath: string): Promise<string[]> => {
    console.log('[Recorder] Converting PPT via backend API:', serverFilePath);
    
    const result = await convertPPT(serverFilePath);
    
    if (!result.success || !result.data) {
      console.error('[Recorder] PPT conversion failed:', result.error);
      throw new Error(result.error || 'PPT conversion failed');
    }
    
    console.log(`[Recorder] PPT converted: ${result.data.pageCount} pages, ${result.data.imageUrls.length} images uploaded`);
    return result.data.imageUrls;
  };

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
      // 1. 上传原始文档
      const response = await uploadDocument(file);
      if (response.success && response.data) {
        setUploadedDocument({
          url: response.data.url,
          originalName: response.data.originalName
        });
        
        // 2. PDF上传成功
        console.log('[Recorder] PDF uploaded:', response.data.url);
        setHasPDF(true);
        showSuccess('PDF 上传成功！');
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
    setPptContent(null);
  };

  // Save Study Record Handler
  const handleSaveRecord = async () => {
    if (!recordTitle.trim()) {
      setError('请输入记录标题');
      return;
    }

    // 验证课程和章节
    let finalCourseId = selectedCourseId;
    let finalChapterId = selectedChapterId;

    if (!selectedCourseId && !courseName) {
      setError('请选择课程');
      return;
    }

    // 如果是自定义课程
    if (!selectedCourseId && courseName) {
      if (!customChapterName.trim()) {
        setError('请输入章节名称');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. 创建课程
        const courseRes = await createCourse({
          name: courseName,
          type: 'PROFESSIONAL',
          status: 'STUDYING'
        });

        if (!courseRes.success || !courseRes.data) {
          setError(courseRes.error || '创建课程失败');
          setLoading(false);
          return;
        }

        finalCourseId = courseRes.data.id;

        // 2. 创建章节
        const chapterRes = await createChapter({
          courseId: finalCourseId,
          name: customChapterName.trim(),
          order: 1
        });

        if (!chapterRes.success || !chapterRes.data) {
          setError(chapterRes.error || '创建章节失败');
          setLoading(false);
          return;
        }

        finalChapterId = chapterRes.data.id;

      } catch (err) {
        setError('创建课程或章节失败，请重试');
        setLoading(false);
        return;
      }
    } else if (selectedCourseId && !selectedChapterId) {
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

      // 合并笔记文本和语音转写文本
      const combinedNotes = [transcription, noteText].filter(Boolean).join('\n\n---\n\n');
      
      console.log('[Recorder] Saving study record with:');
      console.log('[Recorder] - transcription length:', transcription?.length || 0);
      console.log('[Recorder] - noteText length:', noteText?.length || 0);
      console.log('[Recorder] - combinedNotes length:', combinedNotes?.length || 0);
      console.log('[Recorder] - combinedNotes preview:', combinedNotes?.substring(0, 200));
      
      const response = await createStudyRecord({
        courseId: finalCourseId,
        chapterId: finalChapterId,
        title: recordTitle,
        date: new Date().toISOString(),
        audioUrl: audioUrl || undefined,
        documentUrl: uploadedDocument?.url || undefined,
        notes: combinedNotes || undefined,
        duration: duration,
        status: (audioUrl || uploadedDocument || hasPDF) ? 'COMPLETED' : 'RECORDING',
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      if (response.success) {
        // 保存成功后，进行多模态AI分析
        const recordId = response.data?.id;
        const hasAudio = !!audioUrl;
        const hasDocument = !!uploadedDocument;
        const hasImages = uploadedImages.length > 0;
        
        console.log('[Recorder] 学习记录保存成功，recordId:', recordId);
        console.log('[Recorder] 内容统计:', { audio: hasAudio, document: hasDocument, images: hasImages });
        
        // 批量创建本地时间标记（必须在多模态分析之前完成，确保标记被保存）
        console.log('[Recorder] 检查时间标记:', { recordId, marksCount: localTimeMarks.length, marks: localTimeMarks });
        if (recordId && localTimeMarks.length > 0) {
          try {
            console.log('[Recorder] 开始批量创建时间标记:', localTimeMarks.length);
            const timeMarksToCreate = localTimeMarks.map(mark => ({
              type: mark.type,
              timestamp: mark.timestamp,
              content: mark.content,
            }));
            console.log('[Recorder] 准备发送的时间标记:', timeMarksToCreate);
            
            const marksRes = await batchCreateTimeMarks(recordId, timeMarksToCreate);
            console.log('[Recorder] 批量创建时间标记响应:', marksRes);
            if (marksRes.success) {
              console.log('[Recorder] 时间标记创建成功，数量:', marksRes.data?.count);
              // 标记创建成功后，等待一小段时间确保数据库写入完成
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              console.warn('[Recorder] 时间标记创建失败:', marksRes.error);
            }
          } catch (markErr) {
            console.error('[Recorder] 批量创建时间标记异常:', markErr);
          }
        } else {
          console.log('[Recorder] 跳过创建时间标记:', { hasRecordId: !!recordId, marksLength: localTimeMarks.length });
        }
        
        // 多模态分析（在标记创建完成后执行）
        if (recordId && (hasAudio || hasDocument || hasImages)) {
          try {
            console.log('[Recorder] 开始多模态分析，学习记录ID:', recordId);
            
            // 导入多模态分析API
            const { analyzeMultimodal } = await import('../src/api/multimodal');
            const analysisRes = await analyzeMultimodal(recordId);

            if (analysisRes.success && analysisRes.data) {
              console.log('[Recorder] 多模态分析完成:', {
                audio: analysisRes.data.audioMarksCount,
                ppt: analysisRes.data.pptMarksCount,
                images: analysisRes.data.imageMarksCount,
                total: analysisRes.data.totalMarks
              });
            } else {
              console.warn('[Recorder] 多模态分析失败:', analysisRes.error);
            }
          } catch (analysisErr) {
            console.error('[Recorder] 多模态分析异常:', analysisErr);
          }
        }

        showSuccess('学习记录保存成功！');
        setShowSaveConfirm(false);
        // Reset form
        setRecordTitle('');
        setCustomChapterName('');
        setNoteText('');
        setRecordedAudioUrl(null);
        setRecordedImages([]);
        setDuration(0);
        setImageCount(0);
        setHasPDF(false);
        setUploadedDocument(null);
        setUploadedImages([]);
        setLocalTimeMarks([]); // 清空本地标记
        // Navigate to TimeMachine or back after short delay
        setTimeout(() => {
          if (onSaveSuccess && response.data?.id) {
            onSaveSuccess(response.data.id);
          } else {
            onBack();
          }
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

  // 处理旗子按钮点击 - 添加时间标记
  const handleFlagClick = () => {
    if (!isRecording) {
      // 未录音时提示
      return;
    }
    setMarkContent('');
    setMarkType('EMPHASIS');
    setShowMarkModal(true);
  };

  // 确认添加标记
  const confirmAddMark = () => {
    const newMark: LocalTimeMark = {
      id: `local-${Date.now()}`,
      timestamp: duration * 1000, // 转换为毫秒
      type: markType,
      content: markContent.trim() || undefined,
    };
    setLocalTimeMarks(prev => [...prev, newMark]);
    setShowMarkModal(false);
    setMarkContent('');
  };

  // 取消添加标记
  const cancelAddMark = () => {
    setShowMarkModal(false);
    setMarkContent('');
  };

  // 删除本地标记
  const removeLocalMark = (id: string) => {
    setLocalTimeMarks(prev => prev.filter(m => m.id !== id));
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

      // 创建音频分析器 - 用于声浪可视化
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      // 将麦克风连接到分析器
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // 开始声浪动画循环
      const updateAudioLevels = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // 将频率数据转换为声浪级别（0-1）
        const levels: number[] = [];
        const step = Math.floor(bufferLength / 32);
        for (let i = 0; i < 32; i++) {
          const value = dataArray[i * step];
          levels.push(value / 255);
        }

        setAudioLevels(levels);

        // 继续更新
        animationRef.current = requestAnimationFrame(updateAudioLevels);
      };

      // 开始声浪动画
      updateAudioLevels();

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

      // 如果已经有录音数据，说明是继续录音，不要清空 chunks
      const isResume = chunksRef.current.length > 0;

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      // 只有第一次开始时才清空 chunks，继续时不清空
      if (!isResume) {
        chunksRef.current = [];
      }

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
      // 启动语音识别
      if (recognitionRef.current && transcriptionSupported) {
        try {
          // 更新录制状态引用，让识别器的回调知道当前状态
          (recognitionRef.current as any)._isRecordingRef.current = true;

          // 如果是继续录音，先停止识别再重启
          if (isResume) {
            recognitionRef.current.stop();
          }
          recognitionRef.current.start();
          setIsTranscribing(true);
          console.log('语音识别已启动');
        } catch (err) {
          console.error('启动语音识别失败:', err);
        }
      }

      setIsRecording(true);
      // 只有第一次开始时才重置时长，继续时不重置
      // 只有第一次开始时才清空转写文本
      if (!isResume) {
        setDuration(0);
        setTranscription('');
      }
    } catch (err) {
      console.error('录音失败:', err);
      setError('无法访问麦克风，请检查权限');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // 停止声浪动画
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // 清理音频分析器
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      }

      // 重置声浪级别
      setAudioLevels(new Array(32).fill(0));

      // 停止语音识别
      if (recognitionRef.current) {
        try {
          // 更新录制状态引用
          (recognitionRef.current as any)._isRecordingRef.current = false;
          recognitionRef.current.stop();
          setIsTranscribing(false);
          console.log('语音识别已停止，转写内容:', transcription);
        } catch (err) {
          console.error('停止语音识别失败:', err);
        }
      }

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

  // 弹窗关闭时停止音频
  useEffect(() => {
    if (!showSaveConfirm && popupAudioRef.current) {
      popupAudioRef.current.pause();
      popupAudioRef.current.currentTime = 0;
      setIsPopupPlaying(false);
      setPopupCurrentTime(0);
    }
  }, [showSaveConfirm]);

  // 获取完整音频 URL（处理相对路径）
  const getFullAudioUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${API_CONFIG.BASE_URL}${url}`;
    }
    return url;
  };

  // 弹窗打开时获取音频时长
  useEffect(() => {
    if (showSaveConfirm && recordedAudioUrl) {
      // 重置状态
      setPopupCurrentTime(0);
      setPopupDuration(0);

      // 使用 audio 元素获取时长（兼容性更好）
      const fetchAudioDuration = async () => {
        const audioUrl = getFullAudioUrl(recordedAudioUrl);
        console.log('[Recorder] 尝试获取音频时长:', audioUrl);
        
        const audio = new Audio();
        
        // 处理跨域
        audio.crossOrigin = 'anonymous';
        audio.src = audioUrl;
        audio.preload = 'metadata';
        
        // 设置超时
        const timeout = setTimeout(() => {
          console.warn('[Recorder] 获取音频时长超时');
          // 如果是 blob URL，尝试通过 fetch 获取
          if (recordedAudioUrl.startsWith('blob:')) {
            fetchBlobDuration(recordedAudioUrl);
          }
        }, 3000);
        
        audio.onloadedmetadata = () => {
          clearTimeout(timeout);
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            console.log('[Recorder] 音频时长:', audio.duration);
            setPopupDuration(audio.duration);
            // 同时更新学习记录时长
            setDuration(Math.floor(audio.duration));
          }
        };
        
        audio.oncanplaythrough = () => {
          clearTimeout(timeout);
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            console.log('[Recorder] 音频时长 (canplaythrough):', audio.duration);
            setPopupDuration(audio.duration);
            setDuration(Math.floor(audio.duration));
          }
        };
        
        audio.onerror = (e) => {
          clearTimeout(timeout);
          console.warn('[Recorder] 无法获取音频时长:', e);
          // 尝试备用方案
          fetchBlobDuration(audioUrl);
        };
        
        // 尝试加载
        audio.load();
      };
      
      // 备用方案：通过 fetch 获取 blob 然后使用 AudioContext
      const fetchBlobDuration = async (url: string) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          
          // 根据文件大小估算时长（假设平均比特率 128kbps）
          // 128kbps = 16KB/s
          const estimatedDuration = Math.floor(blob.size / 16000);
          if (estimatedDuration > 0) {
            console.log('[Recorder] 估算音频时长:', estimatedDuration);
            setPopupDuration(estimatedDuration);
            setDuration(estimatedDuration);
            return;
          }
          
          // 尝试使用 AudioContext
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await blob.arrayBuffer();
          
          try {
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log('[Recorder] AudioContext 时长:', audioBuffer.duration);
            setPopupDuration(audioBuffer.duration);
            setDuration(Math.floor(audioBuffer.duration));
          } catch (decodeErr) {
            console.warn('[Recorder] AudioContext 解码失败，使用估算时长');
            // 使用估算时长
            if (estimatedDuration > 0) {
              setPopupDuration(estimatedDuration);
              setDuration(estimatedDuration);
            }
          } finally {
            audioContext.close();
          }
        } catch (err) {
          console.error('[Recorder] fetchBlobDuration 失败:', err);
        }
      };

      fetchAudioDuration();
    }
  }, [showSaveConfirm, recordedAudioUrl]);

  const formatTime = (sec: number) => {
    // 处理无效值
    if (!sec || !isFinite(sec) || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 过滤课程列表 - 使用真实的 courses 状态
  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-[#F7F9FC] text-slate-800 relative font-sans overflow-hidden">

      {/* 隐藏的文件输入（支持音频和文档） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/m4a,audio/x-m4a,audio/mp3,audio/webm,audio/ogg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileUpload}
        className="hidden"
      />
      {/* 隐藏的图片文件输入 - 从相册选择 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />
      {/* 隐藏的摄像头拍照输入 - 直接调用摄像头 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        capture="environment"
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
            {/* 保存按钮 - 当有时长、笔记或已上传音频时显示 */}
            {(duration > 0 || noteText || recordedAudioUrl) && !isRecording && (
                <button
                    onClick={async () => {
                        // 获取章节名称
                        let chapterName = '';
                        if (selectedCourseId && selectedChapterId) {
                            // 已有章节
                            const chapter = chapters.find(c => c.id === selectedChapterId);
                            chapterName = chapter?.name || '';
                        } else if (!selectedCourseId && customChapterName) {
                            // 新建章节
                            chapterName = customChapterName;
                        }

                        // 生成标题
                        let title = `${courseName}`;
                        if (chapterName) {
                            title += `-${chapterName}`;
                        }

                        // 如果是已有章节，查询该章节已有多少条学习记录
                        if (selectedCourseId && selectedChapterId) {
                            const recordsRes = await getStudyRecordList({ chapterId: selectedChapterId });
                            if (recordsRes.success && recordsRes.data) {
                                const recordCount = recordsRes.data.length;
                                if (recordCount > 0) {
                                    // 不是第一次录制，添加序号 n+1
                                    title += `-${recordCount + 1}`;
                                }
                            }
                        }

                        // 打开弹窗前重置音频播放状态
                        setIsPopupPlaying(false);
                        setPopupCurrentTime(0);
                        setRecordTitle(title);
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
                          {/* 如果是自定义课程，显示章节输入框 */}
                          {!selectedCourseId && courseName && (
                            <div className="mt-2">
                              <label className="block text-xs font-medium text-slate-600 mb-1">章节（新建）</label>
                              <input
                                  type="text"
                                  value={customChapterName}
                                  onChange={(e) => setCustomChapterName(e.target.value)}
                                  placeholder="请输入章节名称"
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </div>
                          )}
                          {selectedCourseId && <p>章节：{chapters.find(c => c.id === selectedChapterId)?.name || '请选择章节'}</p>}
                          <p>时长：{formatTime(duration)}</p>
                          {recordedAudioUrl && <p className="text-green-600">已录制音频</p>}
                          {uploadedImages.length > 0 && (
                            <p className="text-blue-600">已上传 {uploadedImages.length} 张图片</p>
                          )}
                          {uploadedDocument && (
                            <p className="text-purple-600">已上传文档：{uploadedDocument.originalName} {hasPDF && '(PDF课件)'}</p>
                          )}
                          {noteText && <p>笔记字数：{noteText.length}</p>}
                      </div>
                      {/* 录音预览 - 自定义播放器 */}
                      {recordedAudioUrl && (
                        <div className="mt-3 bg-slate-50 rounded-lg p-3">
                          {/* 隐藏的 audio 元素 */}
                          <audio
                            ref={popupAudioRef}
                            src={recordedAudioUrl}
                            preload="auto"
                            onTimeUpdate={() => {
                              if (popupAudioRef.current) {
                                setPopupCurrentTime(popupAudioRef.current.currentTime);
                              }
                            }}
                            onLoadedMetadata={() => {
                              console.log('loadedmetadata triggered, duration:', popupAudioRef.current?.duration);
                              if (popupAudioRef.current) {
                                setPopupDuration(popupAudioRef.current.duration || 0);
                              }
                            }}
                            onEnded={() => setIsPopupPlaying(false)}
                          />

                          <div className="flex items-center space-x-3">
                            {/* 播放/暂停按钮 */}
                            <button
                              onClick={() => {
                                if (popupAudioRef.current) {
                                  if (isPopupPlaying) {
                                    popupAudioRef.current.pause();
                                  } else {
                                    popupAudioRef.current.play();
                                  }
                                  setIsPopupPlaying(!isPopupPlaying);
                                }
                              }}
                              className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                            >
                              {isPopupPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                            </button>

                            {/* 进度条和时间 */}
                            <div className="flex-1 min-w-0">
                              {/* 进度条 */}
                              <div
                                className="h-1.5 bg-slate-200 rounded-full cursor-pointer relative group"
                                onClick={(e) => {
                                  if (popupAudioRef.current && popupDuration) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const percent = (e.clientX - rect.left) / rect.width;
                                    popupAudioRef.current.currentTime = percent * popupDuration;
                                  }
                                }}
                              >
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{ width: popupDuration ? `${(popupCurrentTime / popupDuration) * 100}%` : '0%' }}
                                />
                              </div>
                              {/* 时间显示：已播放/总时长 */}
                              <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>{formatTime(popupCurrentTime)}</span>
                                <span>/ {formatTime(popupDuration)}</span>
                              </div>
                            </div>

                            {/* 下载按钮 - 一直可点击 */}
                            <button
                              onClick={() => {
                                if (recordedAudioUrl) {
                                  const a = document.createElement('a');
                                  a.href = recordedAudioUrl;
                                  a.download = `录音_${new Date().toISOString().slice(0, 10)}.webm`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                              title="下载录音"
                            >
                              <Download size={18} />
                            </button>
                          </div>
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
                          disabled={!recordTitle.trim() || loading || (!selectedCourseId && !customChapterName.trim())}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                          {loading ? <Loader2 className="animate-spin" size={18} /> : '保存'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 标记弹窗 */}
      {showMarkModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={cancelAddMark}
          />
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 z-[110] shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800">添加标记</h3>
              <button onClick={cancelAddMark} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            
            {/* 标记类型选择 */}
            <div className="mb-4">
              <p className="text-sm font-bold text-slate-600 mb-3">标记类型</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setMarkType('EMPHASIS')}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
                    markType === 'EMPHASIS'
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                      : 'bg-slate-50 text-slate-600 border-2 border-transparent'
                  }`}
                >
                  <span className="mr-1">⭐</span> 重点
                </button>
                <button
                  onClick={() => setMarkType('QUESTION')}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
                    markType === 'QUESTION'
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-slate-50 text-slate-600 border-2 border-transparent'
                  }`}
                >
                  <span className="mr-1">❓</span> 疑问
                </button>
                <button
                  onClick={() => setMarkType('NOTE')}
                  className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
                    markType === 'NOTE'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-slate-50 text-slate-600 border-2 border-transparent'
                  }`}
                >
                  <span className="mr-1">📝</span> 笔记
                </button>
              </div>
            </div>

            {/* 当前时间显示 */}
            <div className="mb-4 p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">标记时间</p>
              <p className="text-lg font-black text-slate-800">
                {Math.floor(duration / 60).toString().padStart(2, '0')}:
                {(duration % 60).toString().padStart(2, '0')}
              </p>
            </div>

            {/* 备注输入 */}
            <div className="mb-6">
              <p className="text-sm font-bold text-slate-600 mb-3">备注（可选）</p>
              <textarea
                value={markContent}
                onChange={(e) => setMarkContent(e.target.value)}
                placeholder="输入标记内容..."
                className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* 按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={cancelAddMark}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={confirmAddMark}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                添加标记
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 【2】课程信息区 - 可点击切换 */}
      <div className="px-6 mb-3 z-10 flex-shrink-0">
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
        {/* 章节选择 - 数据库课程 */}
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
        {/* 章节输入 - 自定义课程 */}
        {!selectedCourseId && courseName && (
          <div className="mt-2">
            <input
              type="text"
              value={customChapterName}
              onChange={(e) => setCustomChapterName(e.target.value)}
              placeholder="输入章节名称"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* 【3】中间可滚动内容区 */}
      <div className="flex-1 overflow-y-auto z-10 pb-44">

      {/* 【3.1】AI 语音采集区 */}
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
                    <Zap size={10} className={`${isRecording || isTranscribing ? 'text-blue-500 fill-blue-500' : 'text-slate-300'}`} />
                    <span className={`text-[9px] font-bold ${isRecording ? 'text-blue-600' : 'text-slate-400'}`}>
                        {isRecording ? (isTranscribing ? '实时转写中' : '正在录音') : (transcription ? '转写完成' : '就绪')}
                    </span>
                </div>
            </div>

            {/* 音频声浪动画 - 中间对称设计 */}
            <div className="relative h-12 mb-2 px-2">
                {/* 中间基准线 */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -translate-y-1/2" />

                {/* 波形从中间向两边扩散 */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-end justify-center gap-[2px] h-full">
                        {/* 左边 - 从中间向左 */}
                        {audioLevels.slice(0, 16).reverse().map((level, i) => {
                            const index = 15 - i;  // 反转索引
                            const minHeight = 4;
                            const maxAddHeight = 44;
                            const height = isRecording ? (minHeight + level * maxAddHeight) : minHeight;
                            const isPeak = isRecording && level > 0.6;
                            const distanceFromCenter = i / 15;  // 离中心越远渐变越弱

                            return (
                                <div
                                    key={`left-${index}`}
                                    className="w-1.5 rounded-full transition-all duration-75"
                                    style={{
                                        height: `${height}%`,
                                        background: isRecording
                                            ? `linear-gradient(to top, rgba(239, 68, 68, ${0.8 - distanceFromCenter * 0.3}), rgba(59, 130, 246, ${0.9 - distanceFromCenter * 0.4}))`
                                            : 'rgba(203, 213, 225, 0.5)',
                                        boxShadow: isPeak ? '0 0 8px rgba(239, 68, 68, 0.5)' : 'none',
                                    }}
                                />
                            );
                        })}

                        {/* 中心点 */}
                        <div
                            className={`w-1.5 h-1.5 rounded-full mx-0.5 transition-all duration-300 ${isRecording ? 'bg-blue-500 scale-125' : 'bg-slate-300'}`}
                        />

                        {/* 右边 - 从中间向右 */}
                        {audioLevels.slice(16).map((level, i) => {
                            const index = i;
                            const minHeight = 4;
                            const maxAddHeight = 44;
                            const height = isRecording ? (minHeight + level * maxAddHeight) : minHeight;
                            const isPeak = isRecording && level > 0.6;
                            const distanceFromCenter = i / 15;

                            return (
                                <div
                                    key={`right-${index}`}
                                    className="w-1.5 rounded-full transition-all duration-75"
                                    style={{
                                        height: `${height}%`,
                                        background: isRecording
                                            ? `linear-gradient(to top, rgba(239, 68, 68, ${0.8 - distanceFromCenter * 0.3}), rgba(59, 130, 246, ${0.9 - distanceFromCenter * 0.4}))`
                                            : 'rgba(203, 213, 225, 0.5)',
                                        boxShadow: isPeak ? '0 0 8px rgba(239, 68, 68, 0.5)' : 'none',
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* 录音时的脉冲动画 */}
                {isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    </div>
                )}
            </div>

            {/* 转写结果显示区域 */}
            {(transcription || isTranscribing) && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg max-h-20 overflow-y-auto">
                    <p className={`text-xs text-slate-600 ${isTranscribing ? 'animate-pulse' : ''}`}>
                        {transcription || (isTranscribing ? '正在识别语音...' : '')}
                    </p>
                </div>
            )}

            {/* 将转写添加到随心记的按钮 */}
            {transcription && !isRecording && (
                <button
                    onClick={() => setNoteText(prev => prev + (prev ? '\n' : '') + transcription)}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-600 flex items-center space-x-1"
                >
                    <Type size={12} />
                    <span>添加到随心记</span>
                </button>
            )}

            {/* 不支持语音识别的提示 */}
            {!transcriptionSupported && !isRecording && (
                <div className="text-center">
                    <p className="text-[10px] font-medium text-slate-400">
                        等待开始录制
                    </p>
                </div>
            )}

            {isRecording && (
                <div className="text-center">
                    <p className={`text-[10px] font-medium text-slate-400 ${isRecording ? 'animate-pulse' : ''}`}>
                        {isTranscribing ? '正在实时转写...' : '正在录音...'}
                    </p>
                </div>
            )}
        </div>
      </div>

      {/* 【3.5】实时标记列表 - 当有标记时显示 */}
      {localTimeMarks.length > 0 && (
        <div className="px-6 mb-3 z-10">
          <div className="bg-white border border-slate-100 rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Flag size={14} className="text-blue-500" />
                <h3 className="text-sm font-bold text-slate-700">实时标记</h3>
                <span className="text-xs text-slate-400">({localTimeMarks.length})</span>
              </div>
              <button
                onClick={() => setLocalTimeMarks([])}
                className="text-xs text-red-500 hover:text-red-600"
              >
                清空
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {localTimeMarks.map((mark) => (
                <div
                  key={mark.id}
                  className={`flex items-center justify-between p-2 rounded-xl ${
                    mark.type === 'EMPHASIS'
                      ? 'bg-yellow-50 border border-yellow-100'
                      : mark.type === 'QUESTION'
                      ? 'bg-purple-50 border border-purple-100'
                      : 'bg-blue-50 border border-blue-100'
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-xs">
                      {mark.type === 'EMPHASIS' ? '⭐' : mark.type === 'QUESTION' ? '❓' : '📝'}
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      {Math.floor(mark.timestamp / 60000).toString().padStart(2, '0')}:
                      {Math.floor((mark.timestamp % 60000) / 1000).toString().padStart(2, '0')}
                    </span>
                    {mark.content && (
                      <span className="text-xs text-slate-500 truncate flex-1">{mark.content}</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeLocalMark(mark.id)}
                    className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-blue-600 truncate">{uploadedDocument.originalName}</span>
                  <button onClick={removeDocument} className="text-blue-400 hover:text-blue-600">
                    <X size={14} />
                  </button>
                </div>
                {/* PDF 标记 */}
                {hasPDF && (
                  <div className="mt-2">
                    <p className="text-[10px] text-blue-500 mb-1">PDF 课件</p>
                    <p className="text-[10px] text-slate-500">可在时光机中查看完整课件</p>
                  </div>
                )}
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
        {/* 拍摄入口 - 点击直接拍照 */}
        <button
          onClick={triggerCameraCapture}
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
                <div className="text-[9px] text-slate-400 tracking-wider">直接拍摄</div>
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
                          src={getFullImageUrl(uploadedImages[uploadedImages.length - 1].url)}
                          className="w-full h-full object-cover"
                          alt="Preview"
                          onError={(e) => {
                            console.error('Image load error:', uploadedImages[uploadedImages.length - 1].url);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
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

      {/* 中间可滚动内容区结束 */}
      </div>

      {/* 【6】底部主操作区 */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#F7F9FC] via-[#F7F9FC]/95 to-transparent z-20 px-10 flex flex-col items-center justify-end pb-8 pointer-events-none">
        
        <div className="flex items-end justify-between w-full max-w-sm pointer-events-auto">
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
      <button 
        onClick={handleFlagClick}
        className={`absolute right-4 top-[45%] -translate-y-1/2 z-20 w-11 h-11 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isRecording 
            ? 'text-blue-500 hover:bg-blue-50 active:scale-95' 
            : 'text-slate-300 cursor-not-allowed'
        }`}
        disabled={!isRecording}
      >
        <Flag size={18} />
        {localTimeMarks.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {localTimeMarks.length}
          </span>
        )}
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

                     {filteredCourses.length === 0 && !searchText && (
                         <div className="flex flex-col items-center justify-center py-12 text-center">
                             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                 <BookOpen size={28} className="text-slate-400" />
                             </div>
                             <p className="text-sm font-bold text-slate-600 mb-1">暂无本学期课程</p>
                             <p className="text-xs text-slate-400">请先添加学习中的课程</p>
                         </div>
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

                 {/* 新建章节按钮 */}
                 <button
                     onClick={() => {
                         const newName = prompt('请输入新章节名称：');
                         if (newName && newName.trim()) {
                             createNewChapter(newName.trim());
                         }
                     }}
                     className="w-full mb-4 p-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                 >
                     <Plus size={18} />
                     新建章节
                 </button>

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
