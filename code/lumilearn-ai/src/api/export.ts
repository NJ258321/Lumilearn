// =====================================================
// P5 - 数据导出/同步 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type {
  ApiResponse,
  ExportDataRequest,
  ExportDataResponse,
  ExportReportRequest,
  ExportReportResponse,
  SyncStatus,
  TriggerSyncRequest,
  TriggerSyncResponse,
  ImportDataRequest,
  ImportDataResponse,
} from '../../types'

/**
 * 导出学习数据
 * @param data 导出请求信息
 */
export async function exportData(
  data: ExportDataRequest
): Promise<ApiResponse<ExportDataResponse>> {
  try {
    return await api.post<ExportDataResponse>(API_CONFIG.endpoints.export.data, data)
  } catch (error) {
    console.error('[export] exportData error:', error)
    return { success: false, error: '导出数据失败' }
  }
}

/**
 * 导出学习报告
 * @param data 导出报告请求信息
 */
export async function exportReport(
  data: ExportReportRequest
): Promise<ApiResponse<ExportReportResponse>> {
  try {
    return await api.post<ExportReportResponse>(API_CONFIG.endpoints.export.report, data)
  } catch (error) {
    console.error('[export] exportReport error:', error)
    return { success: false, error: '导出报告失败' }
  }
}

/**
 * 获取同步状态
 */
export async function getSyncStatus(): Promise<ApiResponse<SyncStatus>> {
  try {
    return await api.get<SyncStatus>(API_CONFIG.endpoints.sync.status)
  } catch (error) {
    console.error('[export] getSyncStatus error:', error)
    return { success: false, error: '获取同步状态失败' }
  }
}

/**
 * 触发同步
 * @param data 同步请求信息
 */
export async function triggerSync(
  data?: TriggerSyncRequest
): Promise<ApiResponse<TriggerSyncResponse>> {
  try {
    return await api.post<TriggerSyncResponse>(
      API_CONFIG.endpoints.sync.trigger,
      data
    )
  } catch (error) {
    console.error('[export] triggerSync error:', error)
    return { success: false, error: '触发同步失败' }
  }
}

/**
 * 导入数据
 * @param data 导入请求信息
 */
export async function importData(
  data: ImportDataRequest
): Promise<ApiResponse<ImportDataResponse>> {
  try {
    return await api.post<ImportDataResponse>(API_CONFIG.endpoints.import.data, data)
  } catch (error) {
    console.error('[export] importData error:', error)
    return { success: false, error: '导入数据失败' }
  }
}
