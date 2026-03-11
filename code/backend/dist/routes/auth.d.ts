import { type Request } from 'express';
declare const router: import("express-serve-static-core").Router;
/**
 * 从请求头获取用户 ID（中间件）
 */
export declare function getUserIdFromRequest(req: Request): string | null;
/**
 * 验证用户是否为管理员（中间件）
 */
export declare function isAdmin(req: Request): boolean;
export default router;
//# sourceMappingURL=auth.d.ts.map