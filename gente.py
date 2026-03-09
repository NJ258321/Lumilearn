import datetime as dt
import matplotlib
import matplotlib.pyplot as plt
from matplotlib.patches import Patch

# =========================
# 中文字体配置
# =========================
matplotlib.rcParams['font.sans-serif'] = [
    'SimHei', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC'
]
matplotlib.rcParams['axes.unicode_minus'] = False

# =========================
# 任务列表
# =========================
tasks = [
    # Phase 1
    ("需求洞察 & 竞品分析", dt.date(2025, 12, 1), dt.date(2025, 12, 8)),
    ("系统架构设计（端-边-云）", dt.date(2025, 12, 3), dt.date(2025, 12, 15)),
    ("数据库 ER 设计（MySQL / Neo4j）", dt.date(2025, 12, 8), dt.date(2025, 12, 18)),
    ("高保真 UI / UX 原型设计", dt.date(2025, 12, 6), dt.date(2025, 12, 20)),
    ("项目计划书撰写与定稿", dt.date(2025, 12, 10), dt.date(2025, 12, 20)),

    # Phase 2
    ("移动端音视频采集模块开发", dt.date(2025, 12, 21), dt.date(2026, 1, 15)),
    ("静默录音 & 本地 VAD 实现", dt.date(2025, 12, 28), dt.date(2026, 1, 18)),
    ("前端核心页面静态搭建", dt.date(2025, 12, 24), dt.date(2026, 1, 20)),
    ("端侧图像矫正（OpenCV）POC", dt.date(2026, 1, 2), dt.date(2026, 1, 20)),
    ("多模态时间对齐算法验证", dt.date(2026, 1, 8), dt.date(2026, 1, 25)),

    # Phase 3
    ("云端微服务框架搭建（FastAPI）", dt.date(2026, 1, 21), dt.date(2026, 2, 8)),
    ("图数据库 / 向量库部署与调优", dt.date(2026, 1, 25), dt.date(2026, 2, 10)),
    ("非结构化数据 → 知识图谱构建流水线", dt.date(2026, 1, 28), dt.date(2026, 2, 18)),
    ("助学智能体：短板诊断 Agent", dt.date(2026, 2, 1), dt.date(2026, 2, 18)),
    ("助学智能体：众源补位 Agent", dt.date(2026, 2, 5), dt.date(2026, 2, 22)),
    ("端云接口联调与数据闭环", dt.date(2026, 2, 5), dt.date(2026, 2, 25)),

    # Phase 4
    ("时光机回溯性能优化", dt.date(2026, 2, 20), dt.date(2026, 3, 5)),
    ("知识图谱渲染性能优化", dt.date(2026, 2, 25), dt.date(2026, 3, 8)),
    ("RAG 检索策略微调", dt.date(2026, 3, 1), dt.date(2026, 3, 10)),
    ("系统压力测试 & UAT", dt.date(2026, 3, 3), dt.date(2026, 3, 15)),

    # Phase 5
    ("典型课程数据填充", dt.date(2026, 3, 11), dt.date(2026, 3, 25)),
    ("产品演示视频 & 路演 PPT", dt.date(2026, 3, 20), dt.date(2026, 4, 5)),
]

# =========================
# 切割日期
# =========================
CUT_OFF_DATE = dt.date(2026, 2, 1)

# =========================
# 绘图准备
# =========================
fig, ax = plt.subplots(figsize=(14, 10))

y_positions = list(range(len(tasks)))[::-1]

# 遍历每个任务，判断是否跨越 2.1
for i, (name, start, end) in enumerate(tasks):
    y = y_positions[i]

    # 任务完全在 2.1 前
    if end <= CUT_OFF_DATE:
        ax.barh(y, (end - start).days, left=start, color="#4CAF50")
    # 任务完全在 2.1 后
    elif start >= CUT_OFF_DATE:
        ax.barh(y, (end - start).days, left=start, color="#CFD8DC")
    # 跨越 2.1，分成两段
    else:
        # 绿色部分
        green_duration = (CUT_OFF_DATE - start).days
        ax.barh(y, green_duration, left=start, color="#4CAF50")
        # 灰色部分
        gray_duration = (end - CUT_OFF_DATE).days
        ax.barh(y, gray_duration, left=CUT_OFF_DATE, color="#CFD8DC")

# =========================
# 坐标与标题
# =========================
task_names = [t[0] for t in tasks]
ax.set_yticks(y_positions)
ax.set_yticklabels(task_names)
ax.set_xlabel("时间")
ax.set_title("“溯光智习”项目子任务甘特图（以 2026-02-01 为界限）")
fig.autofmt_xdate()

# =========================
# 图例
# =========================
legend_elements = [
    Patch(facecolor="#4CAF50", label="已完成（截至 2026-02-01）"),
    Patch(facecolor="#CFD8DC", label="未完成")
]
ax.legend(handles=legend_elements, loc="lower right", frameon=False)

plt.tight_layout()
plt.show()
