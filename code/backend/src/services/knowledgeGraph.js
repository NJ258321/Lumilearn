"use strict";
/**
 * 知识图谱分析服务
 * 实现 KG-01: 短板发现算法
 *
 * 功能：
 * 1. 检测前置概念缺失
 * 2. 检测高频引用但低覆盖节点
 * 3. 生成结构性没学懂预警
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectWeaknesses = detectWeaknesses;
exports.detectGraphGaps = detectGraphGaps;
exports.getLearningPath = getLearningPath;
exports.calculateImportance = calculateImportance;
var prisma_js_1 = require("../lib/prisma.js");
// ==================== 核心算法实现 ====================
/**
 * 短板发现算法主入口
 * 分析课程或全部知识点的学习短板
 */
function detectWeaknesses(options) {
    return __awaiter(this, void 0, void 0, function () {
        var courseId, userId, _a, minPriority, knowledgePoints, weakPoints, warnings, _i, knowledgePoints_1, point, issues, missingPrerequisites, avgScore, incomingCount, isHighReference, isLowCoverage, _b, issues_1, issue, criticalPoints, urgentPoints, lowCoveragePoints, orphanedPoints, allScores, averageMasteryScore, statistics;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    courseId = options.courseId, userId = options.userId, _a = options.minPriority, minPriority = _a === void 0 ? 0 : _a;
                    return [4 /*yield*/, prisma_js_1.default.knowledgePoint.findMany({
                            where: courseId ? { chapter: { courseId: courseId } } : undefined,
                            include: {
                                chapter: {
                                    select: { id: true, name: true, courseId: true }
                                },
                                outgoingRelations: {
                                    where: { relationType: 'PREREQUISITE' },
                                    include: {
                                        target: {
                                            select: { id: true, name: true, masteryScore: true, status: true }
                                        }
                                    }
                                },
                                incomingRelations: {
                                    where: { relationType: 'PREREQUISITE' },
                                    include: {
                                        source: {
                                            select: { id: true, name: true, masteryScore: true, status: true }
                                        }
                                    }
                                }
                            }
                        })];
                case 1:
                    knowledgePoints = _c.sent();
                    if (knowledgePoints.length === 0) {
                        return [2 /*return*/, {
                                courseId: courseId,
                                totalKnowledgePoints: 0,
                                weakPoints: [],
                                warnings: [],
                                statistics: {
                                    totalPrerequisiteGaps: 0,
                                    totalLowCoveragePoints: 0,
                                    totalStructuralGaps: 0,
                                    averageMasteryScore: 0,
                                    criticalCount: 0,
                                    urgentCount: 0
                                }
                            }];
                    }
                    weakPoints = [];
                    warnings = [];
                    // 2. 遍历每个知识点，分析短板
                    for (_i = 0, knowledgePoints_1 = knowledgePoints; _i < knowledgePoints_1.length; _i++) {
                        point = knowledgePoints_1[_i];
                        issues = [];
                        missingPrerequisites = point.outgoingRelations
                            .filter(function (rel) { return rel.target.masteryScore < 30 || rel.target.status === 'NEED_REVIEW'; })
                            .map(function (rel) { return rel.target; });
                        if (missingPrerequisites.length > 0) {
                            avgScore = missingPrerequisites.reduce(function (sum, p) { return sum + p.masteryScore; }, 0) / missingPrerequisites.length;
                            issues.push({
                                type: 'missing_prerequisite',
                                priority: Math.min(10, Math.floor((100 - avgScore) / 10) + 1),
                                suggestion: "\u524D\u7F6E\u6982\u5FF5\u672A\u638C\u63E1\uFF1A".concat(missingPrerequisites.map(function (p) { return p.name; }).join('、')),
                                prerequisiteStatus: avgScore < 30 ? 'missing' : 'weak'
                            });
                        }
                        incomingCount = point.incomingRelations.length;
                        isHighReference = incomingCount >= 3 // 被3个以上知识点引用
                        ;
                        isLowCoverage = point.masteryScore < 60 || point.status === 'WEAK';
                        if (isHighReference && isLowCoverage) {
                            issues.push({
                                type: 'low_coverage',
                                priority: Math.min(10, Math.floor((100 - point.masteryScore) / 10) + incomingCount),
                                suggestion: "\u88AB".concat(incomingCount, "\u4E2A\u77E5\u8BC6\u70B9\u5F15\u7528\uFF0C\u4F46\u638C\u63E1\u5EA6\u4EC5").concat(point.masteryScore, "%\uFF0C\u5EFA\u8BAE\u4F18\u5148\u5DE9\u56FA")
                            });
                        }
                        // 2.3 检测结构性缺口（前置概念缺失超过阈值）
                        if (missingPrerequisites.length >= 2) {
                            issues.push({
                                type: 'structural_gap',
                                priority: Math.min(10, missingPrerequisites.length + 3),
                                suggestion: "\u6709".concat(missingPrerequisites.length, "\u4E2A\u524D\u7F6E\u6982\u5FF5\u672A\u638C\u63E1\uFF0C\u5B66\u4E60\u8DEF\u5F84\u5B58\u5728\u7ED3\u6784\u6027\u65AD\u5C42")
                            });
                        }
                        // 将问题点加入结果
                        for (_b = 0, issues_1 = issues; _b < issues_1.length; _b++) {
                            issue = issues_1[_b];
                            if (issue.priority >= minPriority) {
                                weakPoints.push({
                                    id: point.id,
                                    name: point.name,
                                    masteryScore: point.masteryScore,
                                    status: point.status,
                                    issue: issue.type,
                                    relatedCount: incomingCount,
                                    prerequisiteStatus: issue.prerequisiteStatus,
                                    suggestion: issue.suggestion,
                                    priority: issue.priority
                                });
                            }
                        }
                    }
                    criticalPoints = weakPoints.filter(function (w) { return w.priority >= 8; });
                    urgentPoints = weakPoints.filter(function (w) { return w.priority >= 5 && w.priority < 8; });
                    if (criticalPoints.length > 0) {
                        warnings.push({
                            type: 'prerequisite_gap',
                            severity: 'high',
                            message: "\u53D1\u73B0".concat(criticalPoints.length, "\u4E2A\u5173\u952E\u77E5\u8BC6\u70B9\u5B58\u5728\u4E25\u91CD\u524D\u7F6E\u6982\u5FF5\u7F3A\u5931"),
                            affectedPoints: criticalPoints.map(function (p) { return p.id; }),
                            recommendation: '建议立即停止新知识学习，优先补齐这些知识点的前置概念'
                        });
                    }
                    lowCoveragePoints = weakPoints.filter(function (w) { return w.issue === 'low_coverage'; });
                    if (lowCoveragePoints.length >= 3) {
                        warnings.push({
                            type: 'coverage_gap',
                            severity: 'high',
                            message: "\u6709".concat(lowCoveragePoints.length, "\u4E2A\u9AD8\u9891\u5F15\u7528\u77E5\u8BC6\u70B9\u638C\u63E1\u5EA6\u4E0D\u8DB3"),
                            affectedPoints: lowCoveragePoints.map(function (p) { return p.id; }),
                            recommendation: '这些知识点是其他知识点的学习基础，建议优先巩固'
                        });
                    }
                    orphanedPoints = knowledgePoints.filter(function (p) {
                        return p.incomingRelations.length === 0 &&
                            p.outgoingRelations.length === 0 &&
                            p.masteryScore < 50;
                    });
                    if (orphanedPoints.length > 0) {
                        warnings.push({
                            type: 'learning_path_broken',
                            severity: 'medium',
                            message: "\u53D1\u73B0".concat(orphanedPoints.length, "\u4E2A\u5B64\u7ACB\u77E5\u8BC6\u70B9\uFF0C\u672A\u4E0E\u5176\u4ED6\u77E5\u8BC6\u70B9\u5EFA\u7ACB\u8054\u7CFB"),
                            affectedPoints: orphanedPoints.map(function (p) { return p.id; }),
                            recommendation: '建议为这些知识点建立知识关联，形成完整学习路径'
                        });
                    }
                    allScores = knowledgePoints.map(function (p) { return p.masteryScore; });
                    averageMasteryScore = allScores.reduce(function (a, b) { return a + b; }, 0) / allScores.length;
                    statistics = {
                        totalPrerequisiteGaps: weakPoints.filter(function (w) { return w.issue === 'missing_prerequisite'; }).length,
                        totalLowCoveragePoints: weakPoints.filter(function (w) { return w.issue === 'low_coverage'; }).length,
                        totalStructuralGaps: weakPoints.filter(function (w) { return w.issue === 'structural_gap'; }).length,
                        averageMasteryScore: Math.round(averageMasteryScore),
                        criticalCount: criticalPoints.length,
                        urgentCount: urgentPoints.length
                    };
                    // 按优先级排序
                    weakPoints.sort(function (a, b) { return b.priority - a.priority; });
                    return [2 /*return*/, {
                            courseId: courseId,
                            totalKnowledgePoints: knowledgePoints.length,
                            weakPoints: weakPoints,
                            warnings: warnings,
                            statistics: statistics
                        }];
            }
        });
    });
}
/**
 * 图谱缺口检测
 * 检测知识图谱的完整性问题
 */
function detectGraphGaps(courseId) {
    return __awaiter(this, void 0, void 0, function () {
        function hasCycle(nodeId, path) {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            var node = knowledgePoints.find(function (p) { return p.id === nodeId; });
            if (!node)
                return null;
            for (var _i = 0, _a = node.outgoingRelations; _i < _a.length; _i++) {
                var rel = _a[_i];
                if (rel.relationType === 'PREREQUISITE') {
                    if (!visited.has(rel.targetId)) {
                        var cycle = hasCycle(rel.targetId, __spreadArray(__spreadArray([], path, true), [nodeId], false));
                        if (cycle)
                            return cycle;
                    }
                    else if (recursionStack.has(rel.targetId)) {
                        return __spreadArray(__spreadArray([], path, true), [nodeId, rel.targetId], false);
                    }
                }
            }
            recursionStack.delete(nodeId);
            return null;
        }
        var knowledgePoints, gaps, _i, knowledgePoints_2, point, _a, knowledgePoints_3, point, prerequisites, visited, recursionStack, _b, knowledgePoints_4, point, cycle, maxPossibleGaps, gapPenalty, completenessScore;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, prisma_js_1.default.knowledgePoint.findMany({
                        where: courseId ? { chapter: { courseId: courseId } } : undefined,
                        include: {
                            outgoingRelations: true,
                            incomingRelations: true
                        }
                    })];
                case 1:
                    knowledgePoints = _c.sent();
                    gaps = [];
                    // 1. 检测孤立节点
                    for (_i = 0, knowledgePoints_2 = knowledgePoints; _i < knowledgePoints_2.length; _i++) {
                        point = knowledgePoints_2[_i];
                        if (point.incomingRelations.length === 0 && point.outgoingRelations.length === 0) {
                            gaps.push({
                                type: 'orphaned_node',
                                nodeId: point.id,
                                nodeName: point.name,
                                description: "\u77E5\u8BC6\u70B9\"".concat(point.name, "\"\u672A\u4E0E\u4EFB\u4F55\u5176\u4ED6\u77E5\u8BC6\u70B9\u5EFA\u7ACB\u5173\u8054"),
                                severity: 'low'
                            });
                        }
                    }
                    // 2. 检测前置概念缺失
                    for (_a = 0, knowledgePoints_3 = knowledgePoints; _a < knowledgePoints_3.length; _a++) {
                        point = knowledgePoints_3[_a];
                        prerequisites = point.outgoingRelations.filter(function (r) { return r.relationType === 'PREREQUISITE'; });
                        // 如果一个重要知识点没有任何前置概念，可能不完整
                        if (prerequisites.length === 0 && point.importance >= 7) {
                            gaps.push({
                                type: 'missing_prerequisite',
                                nodeId: point.id,
                                nodeName: point.name,
                                description: "\u91CD\u8981\u77E5\u8BC6\u70B9\"".concat(point.name, "\"\u7F3A\u5C11\u524D\u7F6E\u6982\u5FF5\u5B9A\u4E49"),
                                severity: point.importance >= 9 ? 'high' : 'medium'
                            });
                        }
                    }
                    visited = new Set();
                    recursionStack = new Set();
                    for (_b = 0, knowledgePoints_4 = knowledgePoints; _b < knowledgePoints_4.length; _b++) {
                        point = knowledgePoints_4[_b];
                        visited.clear();
                        recursionStack.clear();
                        cycle = hasCycle(point.id, []);
                        if (cycle) {
                            gaps.push({
                                type: 'circular_dependency',
                                description: "\u53D1\u73B0\u5FAA\u73AF\u524D\u7F6E\u4F9D\u8D56: ".concat(cycle.join(' -> ')),
                                severity: 'high'
                            });
                            break; // 只报告一个循环
                        }
                    }
                    maxPossibleGaps = knowledgePoints.length;
                    gapPenalty = gaps.reduce(function (sum, gap) {
                        switch (gap.severity) {
                            case 'high': return sum + 15;
                            case 'medium': return sum + 10;
                            case 'low': return sum + 5;
                            default: return sum;
                        }
                    }, 0);
                    completenessScore = Math.max(0, 100 - Math.min(100, gapPenalty));
                    return [2 /*return*/, {
                            isComplete: gaps.length === 0,
                            gaps: gaps,
                            completenessScore: completenessScore
                        }];
            }
        });
    });
}
/**
 * 获取学习路径建议
 * 基于图结构分析，推荐最优学习顺序
 */
function getLearningPath(knowledgePointId) {
    return __awaiter(this, void 0, void 0, function () {
        function getAllPrereqs(pointId) {
            return __awaiter(this, void 0, void 0, function () {
                var relations, _loop_1, _i, relations_1, rel;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, prisma_js_1.default.knowledgeRelation.findMany({
                                where: {
                                    targetId: pointId,
                                    relationType: 'PREREQUISITE'
                                },
                                include: {
                                    source: {
                                        select: { id: true, name: true, masteryScore: true }
                                    }
                                }
                            })];
                        case 1:
                            relations = _a.sent();
                            _loop_1 = function (rel) {
                                var prereq;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            prereq = rel.source;
                                            if (!!prerequisites.find(function (p) { return p.id === prereq.id; })) return [3 /*break*/, 2];
                                            prerequisites.push(prereq);
                                            return [4 /*yield*/, getAllPrereqs(prereq.id)];
                                        case 1:
                                            _b.sent();
                                            _b.label = 2;
                                        case 2: return [2 /*return*/];
                                    }
                                });
                            };
                            _i = 0, relations_1 = relations;
                            _a.label = 2;
                        case 2:
                            if (!(_i < relations_1.length)) return [3 /*break*/, 5];
                            rel = relations_1[_i];
                            return [5 /*yield**/, _loop_1(rel)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        var targetPoint, prerequisites, path, weakCount, estimatedTime, recommendations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.default.knowledgePoint.findUnique({
                        where: { id: knowledgePointId }
                    })];
                case 1:
                    targetPoint = _a.sent();
                    if (!targetPoint) {
                        throw new Error('知识点不存在');
                    }
                    prerequisites = [];
                    return [4 /*yield*/, getAllPrereqs(knowledgePointId)
                        // 构建学习路径
                    ];
                case 2:
                    _a.sent();
                    path = __spreadArray(__spreadArray([], prerequisites.filter(function (p) { return p.masteryScore < 60; }).map(function (p) { return ({
                        id: p.id,
                        name: p.name,
                        type: 'prerequisite'
                    }); }), true), [
                        {
                            id: targetPoint.id,
                            name: targetPoint.name,
                            type: 'current'
                        }
                    ], false);
                    weakCount = prerequisites.filter(function (p) { return p.masteryScore < 60; }).length;
                    estimatedTime = weakCount * 15 + 30 // 加上当前知识点的时间
                    ;
                    recommendations = [];
                    if (weakCount > 0) {
                        recommendations.push("\u5EFA\u8BAE\u5148\u5B66\u4E60".concat(weakCount, "\u4E2A\u524D\u7F6E\u77E5\u8BC6\u70B9"));
                    }
                    if (targetPoint.masteryScore < 60) {
                        recommendations.push('当前知识点掌握度不足，建议先巩固');
                    }
                    if (prerequisites.length > 5) {
                        recommendations.push('前置知识较多，建议分批学习');
                    }
                    return [2 /*return*/, {
                            path: path,
                            estimatedTime: estimatedTime,
                            recommendations: recommendations
                        }];
            }
        });
    });
}
/**
 * 计算知识点的重要性分数
 * 基于：被引用次数 * 重要性权重 + 难度系数
 */
function calculateImportance(knowledgePointId) {
    return __awaiter(this, void 0, void 0, function () {
        var point, referenceCount, baseScore, referenceScore, difficultyScore;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.default.knowledgePoint.findUnique({
                        where: { id: knowledgePointId }
                    })];
                case 1:
                    point = _a.sent();
                    if (!point) {
                        throw new Error('知识点不存在');
                    }
                    return [4 /*yield*/, prisma_js_1.default.knowledgeRelation.count({
                            where: {
                                targetId: knowledgePointId,
                                relationType: 'PREREQUISITE'
                            }
                        })
                        // 基础分数：重要性 * 10
                    ];
                case 2:
                    referenceCount = _a.sent();
                    baseScore = point.importance * 10;
                    referenceScore = referenceCount * 5;
                    difficultyScore = Math.max(0, 100 - point.masteryScore);
                    return [2 /*return*/, {
                            baseScore: baseScore,
                            referenceScore: referenceScore,
                            difficultyScore: difficultyScore,
                            totalScore: baseScore + referenceScore + difficultyScore
                        }];
            }
        });
    });
}
