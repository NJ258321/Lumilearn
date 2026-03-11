/**
 * 全局错误处理中间件
 * ERR-01: 全局错误边界
 */
import { type Request, type Response, type NextFunction } from 'express';
/**
 * 异步处理包装器
 * 用于捕获异步函数中的错误并传递给错误处理中间件
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * 404 未找到中间件
 */
export declare function notFoundHandler(req: Request, res: Response): void;
/**
 * 全局错误处理中间件
 */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
/**
 * 未捕获的异步异常处理
 */
export declare function setupUncaughtExceptionHandler(): void;
declare const _default: {
    asyncHandler: typeof asyncHandler;
    notFoundHandler: typeof notFoundHandler;
    errorHandler: typeof errorHandler;
    setupUncaughtExceptionHandler: typeof setupUncaughtExceptionHandler;
};
export default _default;
//# sourceMappingURL=errorHandler.d.ts.map