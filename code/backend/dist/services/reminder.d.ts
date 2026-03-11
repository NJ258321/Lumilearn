/**
 * 定时提醒服务
 * 用于在后台定时检查并触发学习提醒
 */
/**
 * 初始化提醒服务
 * 每分钟检查一次是否有需要触发的提醒
 */
export declare function initReminderService(): void;
/**
 * 停止提醒服务
 */
export declare function stopReminderService(): void;
/**
 * 生成每日学习提醒
 * 根据用户设置自动创建每日学习提醒
 */
export declare function generateDailyStudyReminder(userId: string, reminderTime?: string): Promise<void>;
/**
 * 根据复习计划生成复习提醒
 */
export declare function generateReviewReminders(userId: string): Promise<void>;
/**
 * 清理过期的提醒
 * 删除已完成的非重复提醒
 */
export declare function cleanupExpiredReminders(): Promise<void>;
//# sourceMappingURL=reminder.d.ts.map