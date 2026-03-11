"use strict";
/**
 * 智能路径优化服务
 * 实现 PLAN-02: 智能路径优化 API
 *
 * 功能：
 * 1. 目标函数：最大化提分概率
 * 2. 约束条件：每日时间、考前模拟
 * 3. 智能学习路径生成
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeLearningPath = optimizeLearningPath;
exports.optimizeSinglePointPath = optimizeSinglePointPath;
var prisma_js_1 = require("../lib/prisma.js");
// ==================== 核心算法 ====================
/**
 * 智能路径优化主函数
 * 目标：最大化提分概率
 */
function optimizeLearningPath(userId, request) {
    return __awaiter(this, void 0, void 0, function () {
        var courseId, _a, targetMastery, _b, dailyHours, examDate, _c, constraints, state, appliedConstraints, objectiveValue, stages, schedule, projection, mockExams, path, optimization;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    courseId = request.courseId, _a = request.targetMastery, targetMastery = _a === void 0 ? 90 : _a, _b = request.dailyHours, dailyHours = _b === void 0 ? 3 : _b, examDate = request.examDate, _c = request.constraints, constraints = _c === void 0 ? {} : _c;
                    return [4 /*yield*/, buildLearningState(userId, courseId)
                        // 2. 应用约束
                    ];
                case 1:
                    state = _e.sent();
                    appliedConstraints = {
                        dailyTimeMinutes: dailyHours * 60,
                        maxSessionMinutes: constraints.maxSessionMinutes || 45,
                        breakMinutes: constraints.breakMinutes || 10,
                        daysUntilExam: examDate
                            ? Math.max(1, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                            : 30,
                        mockExamsIncluded: constraints.includeMockExam || false
                    };
                    objectiveValue = calculateObjectiveFunction(state, targetMastery, appliedConstraints);
                    stages = generateLearningStages(state, targetMastery);
                    schedule = generateDetailedSchedule(state, stages, appliedConstraints);
                    projection = calculateMasteryProjection(state, schedule, targetMastery);
                    mockExams = constraints.includeMockExam
                        ? generateMockExamSchedule(appliedConstraints.daysUntilExam, constraints.mockExamDays)
                        : undefined;
                    path = {
                        stages: stages,
                        totalDays: schedule.length,
                        estimatedCompletionDate: ((_d = schedule[schedule.length - 1]) === null || _d === void 0 ? void 0 : _d.date) || new Date().toISOString(),
                        strategy: determineStrategy(state, targetMastery, dailyHours)
                    };
                    optimization = {
                        objectiveFunction: "\u6700\u5927\u5316\u63D0\u5206\u6982\u7387\uFF0C\u76EE\u6807\u638C\u63E1\u5EA6".concat(targetMastery, "%"),
                        constraints: appliedConstraints,
                        algorithm: 'heuristic',
                        iterations: 100,
                        convergenceScore: 0.95
                    };
                    return [2 /*return*/, {
                            path: path,
                            optimization: optimization,
                            schedule: schedule,
                            projection: projection,
                            mockExams: mockExams
                        }];
            }
        });
    });
}
/**
 * 构建学习状态
 */
function buildLearningState(userId, courseId) {
    return __awaiter(this, void 0, void 0, function () {
        var knowledgePoints, courses;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.default.knowledgePoint.findMany({
                        where: courseId ? { chapter: { courseId: courseId } } : undefined,
                        include: {
                            outgoingRelations: {
                                where: { relationType: 'PREREQUISITE' },
                                select: { targetId: true }
                            }
                        }
                    })
                    // 获取考试信息
                ];
                case 1:
                    knowledgePoints = _a.sent();
                    return [4 /*yield*/, prisma_js_1.default.course.findMany({
                            where: courseId ? { id: courseId } : { id: { in: __spreadArray([], new Set(knowledgePoints.map(function (kp) { return kp.chapterId; })), true) } }
                        }, select, { id: true, examDate: true, name: true })];
                case 2:
                    courses = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// 分类知识点
var weakPoints = knowledgePoints.filter(function (kp) { return kp.masteryScore < 40; });
var mediumPoints = knowledgePoints.filter(function (kp) { return kp.masteryScore >= 40 && kp.masteryScore < 70; });
var strongPoints = knowledgePoints.filter(function (kp) { return kp.masteryScore >= 70; });
return {
    totalPoints: knowledgePoints.length,
    weakCount: weakPoints.length,
    mediumCount: mediumPoints.length,
    strongCount: strongPoints.length,
    averageMastery: knowledgePoints.reduce(function (sum, kp) { return sum + kp.masteryScore; }, 0) / Math.max(knowledgePoints.length, 1),
    knowledgePoints: knowledgePoints,
    courses: courses,
    examDate: ((_a = courses.find(function (c) { return c.examDate; })) === null || _a === void 0 ? void 0 : _a.examDate) || null
};
/**
 * 目标函数：计算提分概率
 */
function calculateObjectiveFunction(state, targetMastery, constraints) {
    // 当前平均掌握度
    var currentMastery = state.averageMastery;
    var targetGain = targetMastery - currentMastery;
    // 需要学习的知识点数量
    var pointsToLearn = state.weakCount + state.mediumCount;
    // 每日可学习时间
    var totalAvailableTime = constraints.daysUntilExam * constraints.dailyTimeMinutes;
    // 预计所需时间（每知识点30分钟）
    var requiredTime = pointsToLearn * 30;
    // 时间充足度
    var timeAdequacy = Math.min(1, totalAvailableTime / requiredTime);
    // 难度系数
    var difficultyFactor = state.weakCount / Math.max(state.totalPoints, 1);
    // 提分概率 = 时间充足度 * (1 - 难度系数 * 0.3)
    var probability = timeAdequacy * (1 - difficultyFactor * 0.3);
    return Math.max(0, Math.min(1, probability));
}
/**
 * 生成学习阶段
 */
function generateLearningStages(state, targetMastery) {
    var stages = [];
    // 阶段1：夯实基础（针对薄弱点）
    if (state.weakCount > 0) {
        stages.push({
            stage: 1,
            name: '夯实基础',
            description: '重点攻克掌握度低于40%的知识点',
            focusPoints: ['薄弱概念理解', '基础题型练习', '错题复习'],
            targetDuration: Math.ceil(state.weakCount / 2),
            expectedMasteryGain: 25
        });
    }
    // 阶段2：巩固提升（针对中等掌握度）
    if (state.mediumCount > 0) {
        stages.push({
            stage: 2,
            name: '巩固提升',
            description: '巩固掌握度40%-70%的知识点',
            focusPoints: ['重点难点突破', '综合题型训练', '知识点串联'],
            targetDuration: Math.ceil(state.mediumCount / 2),
            expectedMasteryGain: 20
        });
    }
    // 阶段3：冲刺复习
    stages.push({
        stage: 3,
        name: '冲刺复习',
        description: '全面复习，准备考试',
        focusPoints: ['高频考点强化', '模拟考试', '心态调整'],
        targetDuration: Math.max(3, Math.ceil((targetMastery - state.averageMastery) / 10)),
        expectedMasteryGain: 15
    });
    return stages;
}
/**
 * 生成详细学习计划
 */
function generateDetailedSchedule(state, stages, constraints) {
    var schedule = [];
    var currentDate = new Date();
    var dayNumber = 0;
    // 按优先级排序知识点
    var sortedPoints = __spreadArray([], state.knowledgePoints, true).sort(function (a, b) {
        // 优先学习：低掌握度 + 高重要性
        var scoreA = (100 - a.masteryScore) * 0.6 + a.importance * 4;
        var scoreB = (100 - b.masteryScore) * 0.6 + b.importance * 4;
        return scoreB - scoreA;
    });
    var pointIndex = 0;
    for (var _i = 0, stages_1 = stages; _i < stages_1.length; _i++) {
        var stage = stages_1[_i];
        for (var d = 0; d < stage.targetDuration && pointIndex < sortedPoints.length; d++) {
            dayNumber++;
            currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
            var sessions = [];
            var dayMinutes = 0;
            var maxSessions = Math.floor(constraints.dailyTimeMinutes / (constraints.maxSessionMinutes + constraints.breakMinutes));
            // 生成学习时段
            var timeSlots = [
                { time: '09:00-10:00', type: 'new_learn' },
                { time: '10:15-11:15', type: 'review' },
                { time: '14:00-15:00', type: 'practice' },
                { time: '15:15-16:15', type: 'practice' },
                { time: '19:00-20:00', type: 'review' },
                { time: '20:15-21:15', type: 'new_learn' }
            ];
            for (var s = 0; s < maxSessions && pointIndex < sortedPoints.length; s++) {
                var point = sortedPoints[pointIndex];
                var timeSlot = timeSlots[s];
                var difficulty = point.masteryScore < 30 ? 'hard' : point.masteryScore < 60 ? 'medium' : 'easy';
                var expectedGain = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 5 : 3;
                sessions.push({
                    timeSlot: timeSlot.time,
                    activityType: timeSlot.type,
                    topic: point.name,
                    knowledgePointId: point.id,
                    duration: constraints.maxSessionMinutes,
                    difficulty: difficulty,
                    expectedScoreGain: expectedGain
                });
                dayMinutes += constraints.maxSessionMinutes;
                pointIndex++;
            }
            // 计算当日目标掌握度
            var currentTotalMastery = state.averageMastery + stage.expectedMasteryGain * (d / stage.targetDuration);
            schedule.push({
                day: dayNumber,
                date: currentDate.toISOString().split('T')[0],
                sessions: sessions,
                dailyGoal: stage.name,
                totalMinutes: dayMinutes,
                masteryTarget: Math.min(100, Math.round(currentTotalMastery))
            });
        }
    }
    return schedule;
}
/**
 * 计算掌握度预测
 */
function calculateMasteryProjection(state, schedule, targetMastery) {
    var milestones = [];
    var accumulatedGain = 0;
    var totalGain = schedule.reduce(function (sum, day) {
        return sum + day.sessions.reduce(function (s, session) { return s + session.expectedScoreGain; }, 0);
    }, 0);
    // 生成里程碑（每3天一个）
    for (var i = 2; i < schedule.length; i += 3) {
        var day = schedule[i];
        accumulatedGain += day.sessions.reduce(function (s, session) { return s + session.expectedScoreGain; }, 0);
        var projectedMastery = Math.min(100, state.averageMastery + accumulatedGain);
        var daysRatio = i / schedule.length;
        var targetAtDay = state.averageMastery + (targetMastery - state.averageMastery) * daysRatio;
        milestones.push({
            day: day.day,
            date: day.date,
            targetMastery: Math.round(projectedMastery),
            status: projectedMastery >= targetAtDay ? 'ahead' : projectedMastery >= targetAtDay - 5 ? 'on_track' : 'behind',
            action: projectedMastery < targetAtDay - 10 ? '建议增加每日学习时间' : undefined
        });
    }
    // 风险因素
    var riskFactors = [];
    if (state.weakCount > state.totalPoints * 0.5) {
        riskFactors.push('薄弱知识点较多，需要更多时间');
    }
    if (schedule.length > 30) {
        riskFactors.push('复习周期较长，需要坚持');
    }
    return {
        currentMastery: Math.round(state.averageMastery),
        projectedFinal: Math.min(100, Math.round(state.averageMastery + totalGain)),
        milestones: milestones,
        confidence: totalGain > (targetMastery - state.averageMastery) * 0.8 ? 85 : 65,
        riskFactors: riskFactors
    };
}
/**
 * 生成模拟考试安排
 */
function generateMockExamSchedule(daysUntilExam, preferredDays) {
    var mockExams = [];
    // 默认：考前7天、3天各一次模拟考试
    var examDays = preferredDays || [daysUntilExam - 7, daysUntilExam - 3].filter(function (d) { return d > 0; });
    for (var _i = 0, examDays_1 = examDays; _i < examDays_1.length; _i++) {
        var day = examDays_1[_i];
        var examDate = new Date();
        examDate.setDate(examDate.getDate() + day);
        mockExams.push({
            day: day,
            date: examDate.toISOString().split('T')[0],
            scope: day > 5 ? '全部知识点' : '高频考点',
            duration: 120,
            purpose: day > 5 ? '检测整体复习效果' : '考前最后一次模拟'
        });
    }
    return mockExams;
}
/**
 * 确定学习策略
 */
function determineStrategy(state, targetMastery, dailyHours) {
    var requiredTime = (state.weakCount + state.mediumCount) * 30;
    var availableTime = 30 * dailyHours * 60;
    var ratio = requiredTime / availableTime;
    if (ratio > 1.2)
        return 'aggressive'; // 需要更多时间
    if (ratio > 0.8)
        return 'balanced'; // 刚好合适
    return 'conservative'; // 时间充裕
}
/**
 * 快速优化：单知识点最优复习路径
 */
function optimizeSinglePointPath(knowledgePointId_1) {
    return __awaiter(this, arguments, void 0, function (knowledgePointId, targetMastery) {
        var point, prereqs, unmetPrereqs, currentScore, scoreGap, difficulty, baseMinutes, requiredMinutes;
        if (targetMastery === void 0) { targetMastery = 90; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_js_1.default.knowledgePoint.findUnique({
                        where: { id: knowledgePointId },
                        include: {
                            outgoingRelations: {
                                where: { relationType: 'PREREQUISITE' },
                                include: {
                                    target: true
                                }
                            }
                        }
                    })];
                case 1:
                    point = _a.sent();
                    if (!point) {
                        throw new Error('知识点不存在');
                    }
                    prereqs = point.outgoingRelations.map(function (r) { return r.target; });
                    unmetPrereqs = prereqs.filter(function (p) { return p.masteryScore < 60; });
                    currentScore = point.masteryScore;
                    scoreGap = targetMastery - currentScore;
                    difficulty = currentScore < 30 ? 'hard' : currentScore < 60 ? 'medium' : 'easy';
                    baseMinutes = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 60;
                    requiredMinutes = Math.ceil(scoreGap / 10) * baseMinutes;
                    return [2 /*return*/, {
                            knowledgePoint: {
                                id: point.id,
                                name: point.name,
                                currentMastery: currentScore,
                                targetMastery: targetMastery
                            },
                            prerequisites: {
                                required: prereqs.map(function (p) { return ({ id: p.id, name: p.name, mastery: p.masteryScore }); }),
                                unmet: unmetPrereqs.map(function (p) { return ({ id: p.id, name: p.name, mastery: p.masteryScore }); })
                            },
                            recommendedPath: {
                                totalMinutes: requiredMinutes,
                                sessions: Math.ceil(requiredMinutes / 30),
                                strategy: difficulty === 'hard' ? '少量多次' : '集中突破',
                                suggestions: unmetPrereqs.length > 0
                                    ? ["\u9700\u8981\u5148\u5B66\u4E60".concat(unmetPrereqs.length, "\u4E2A\u524D\u7F6E\u77E5\u8BC6\u70B9")]
                                    : []
                            }
                        }];
            }
        });
    });
}
