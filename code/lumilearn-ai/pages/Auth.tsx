// =====================================================
// P5 - 用户认证页面（登录/注册）
// =====================================================

import React, { useState, useCallback } from 'react';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { AppView } from '../types';
import { register, login, setToken, setUser } from '../src/api/auth';
import type { User as UserType } from '../types';

interface AuthProps {
  onNavigate: (view: AppView, data?: any) => void;
  onLoginSuccess?: (user: UserType) => void;
}

type AuthMode = 'login' | 'register';

const Auth: React.FC<AuthProps> = ({ onNavigate, onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Handle login
  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await login({ email, password });
      if (response.success && response.data) {
        // Save token and user
        setToken(response.data.token);
        setUser(response.data.user);
        // Notify parent component
        onLoginSuccess?.(response.data.user);
        // Navigate to dashboard
        onNavigate(AppView.DASHBOARD);
      } else {
        setError(response.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [email, password, onNavigate, onLoginSuccess]);

  // Handle register
  const handleRegister = useCallback(async () => {
    if (!username || !email || !password) {
      setError('请填写所有必填项');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6个字符');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await register({
        username,
        email,
        password,
        displayName: displayName || username,
      });
      if (response.success && response.data) {
        // Save token and user
        setToken(response.data.token);
        setUser(response.data.user);
        // Notify parent component
        onLoginSuccess?.(response.data.user);
        // Navigate to dashboard
        onNavigate(AppView.DASHBOARD);
      } else {
        setError(response.error || '注册失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [username, email, password, confirmPassword, displayName, onNavigate, onLoginSuccess]);

  // Toggle mode
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden relative font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-12 px-6">
        <button
          onClick={() => onNavigate(AppView.DASHBOARD)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 py-20">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">溯光智习</h1>
          <p className="text-white/60 text-sm mt-1">LumiTrace AI</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl">
          {/* Mode Tabs */}
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              注册
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">用户名 *</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="3-20个字符"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                邮箱 {mode === 'register' && '*'}
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                密码 {mode === 'register' && '*'}
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6个字符"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">确认密码 *</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">显示名称（可选）</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="昵称"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform flex items-center justify-center"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                mode === 'login' ? '登录' : '注册'
              )}
            </button>
          </div>

          {/* Switch Mode */}
          <div className="mt-4 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-slate-500 hover:text-blue-600 font-medium"
            >
              {mode === 'login' ? '还没有账号？立即注册' : '已有账号？立即登录'}
            </button>
          </div>
        </div>

        {/* Guest Mode */}
        <button
          onClick={() => onNavigate(AppView.DASHBOARD)}
          className="mt-6 w-full py-3 text-white/60 text-sm font-medium hover:text-white transition-colors"
        >
          暂不登录，直接体验
        </button>
      </div>
    </div>
  );
};

export default Auth;
