import { Request, Response, NextFunction } from 'express';
/**
 * 中间件：验证请求参数
 * 在路由中使用 express-validator 定义规则后，使用此中间件检查结果
 */
export declare function validate(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
//# sourceMappingURL=validator.d.ts.map