import { validationResult } from 'express-validator';
/**
 * 中间件：验证请求参数
 * 在路由中使用 express-validator 定义规则后，使用此中间件检查结果
 */
export function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.type === 'field' ? err.path : 'unknown',
                message: err.msg
            }))
        });
    }
    next();
}
//# sourceMappingURL=validator.js.map