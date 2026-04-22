/**
 * useAdminDashboard - 管理员大屏数据Hook
 * 管理数据加载、自动刷新、加载状态
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardOverview } from '../types/admin';
import { mockDashboardData } from '../../data/mockAdminData';

interface UseAdminDashboardReturn {
  data: DashboardOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdate: Date | null;
}

export const useAdminDashboard = (): UseAdminDashboardReturn => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const prevDataRef = useRef<DashboardOverview | null>(null);

  // 获取数据
  const fetchData = useCallback(async () => {
    try {
      // 模拟API调用
      // 实际项目中替换为真实API:
      // const response = await fetch('/api/admin/dashboard/overview');
      // const data = await response.json();
      // setData(data);

      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 300));

      // 更新数据
      setData(mockDashboardData);
      prevDataRef.current = mockDashboardData;
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('数据加载失败:', err);
      setError('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // 5秒自动刷新
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // 监听数据变化，记录是否需要触发动画
  const hasDataChanged = useCallback(() => {
    if (!prevDataRef.current || !data) return true;
    return prevDataRef.current.users.total !== data.users.total;
  }, [data]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    lastUpdate
  };
};

export default useAdminDashboard;