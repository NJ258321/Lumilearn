// =====================================================
// KnowledgeGraph - 知识图谱可视化组件
// 展示知识点关系图谱
// =====================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Network, ZoomIn, ZoomOut, RotateCcw, Loader2, AlertCircle, RefreshCw, ChevronDown, GripVertical } from 'lucide-react'
import * as d3 from 'd3'
import { getKnowledgeRelations, KnowledgeGraphData, KnowledgeRelationType, getRelationTypeLabel, getRelationTypeColor } from '../api/knowledgeRelations'

// 节点类型（用于D3）
interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  status?: string
  masteryScore?: number
  type: 'root' | 'prerequisite' | 'related'
}

// 边类型（用于D3）
interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  relationType: KnowledgeRelationType
  weight: number
}

interface KnowledgeGraphProps {
  knowledgePointId: string
  depth?: number
  onNodeClick?: (nodeId: string, nodeName: string) => void
  className?: string
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  knowledgePointId,
  depth = 2,
  onNodeClick,
  className = '',
}) => {
  // Refs
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<KnowledgeGraphData | null>(null)
  const [zoom, setZoom] = useState(1)
  const [filter, setFilter] = useState<KnowledgeRelationType | 'all'>('all')
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredLink, setHoveredLink] = useState<GraphLink | null>(null)

  // 加载知识图谱
  const loadGraph = async () => {
    if (!knowledgePointId) return

    setLoading(true)
    setError(null)

    try {
      const response = await getKnowledgeRelations(knowledgePointId, depth)
      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || '加载失败')
      }
    } catch (err) {
      setError('加载知识图谱失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGraph()
  }, [knowledgePointId, depth])

  // 构建 D3 图数据
  const buildGraphData = useCallback(() => {
    if (!data) return { nodes: [], links: [] }

    const nodes: GraphNode[] = []
    const links: GraphLink[] = []

    // 添加根节点
    nodes.push({
      id: data.root.id,
      name: data.root.name,
      status: data.root.status,
      masteryScore: data.root.masteryScore,
      type: 'root',
    })

    // 添加前置知识节点
    data.prerequisites.forEach(p => {
      nodes.push({
        id: p.id,
        name: p.name,
        status: p.status,
        masteryScore: p.masteryScore,
        type: 'prerequisite',
      })
      // 添加边
      links.push({
        source: data.root.id,
        target: p.id,
        relationType: 'PREREQUISITE',
        weight: 1,
      })
    })

    // 添加相关知识节点
    data.related.forEach(r => {
      nodes.push({
        id: r.id,
        name: r.name,
        status: r.status,
        masteryScore: r.masteryScore,
        type: 'related',
      })
      // 添加边
      links.push({
        source: data.root.id,
        target: r.id,
        relationType: 'RELATED',
        weight: 0.8,
      })
    })

    // 过滤边
    const filteredLinks = links.filter(
      l => filter === 'all' || l.relationType === filter
    )

    return { nodes, links: filteredLinks }
  }, [data, filter])

  // 初始化 D3 力导向图
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight || 400

    // 清除之前的图
    d3.select(svgRef.current).selectAll('*').remove()

    const { nodes, links } = buildGraphData()

    if (nodes.length === 0) return

    // 创建 SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // 添加缩放行为
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        setZoom(event.transform.k)
      })

    svg.call(zoomBehavior)

    // 创建主组
    const g = svg.append('g')

    // 创建力导向模拟
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50))

    simulationRef.current = simulation

    // 绘制边
    const link = g.append('g')
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', (d) => d.relationType === 'RELATED' ? '5,5' : 'none')
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this).attr('stroke', '#0ea5e9').attr('stroke-width', 3)
        setHoveredLink(d)
      })
      .on('mouseleave', function() {
        d3.select(this).attr('stroke', '#cbd5e1').attr('stroke-width', 2)
        setHoveredLink(null)
      })

    // 绘制边标签
    const linkLabels = g.append('g')
      .selectAll<SVGTextElement, GraphLink>('text')
      .data(links)
      .join('text')
      .attr('font-size', 10)
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .text((d) => getRelationTypeLabel(d.relationType))
      .style('opacity', 0)
      .style('pointer-events', 'none')

    // 绘制节点
    const node = g.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        setSelectedNode(d)
        onNodeClick?.(d.id, d.name)
      })

    // 节点圆形背景
    node.append('circle')
      .attr('r', (d: GraphNode) => d.type === 'root' ? 35 : 25)
      .attr('fill', (d: GraphNode) => getNodeColor(d.status, d.type))
      .attr('stroke', (d: GraphNode) => d.type === 'root' ? '#0284c7' : '#94a3b8')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#shadow)')

    // 节点文字
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: GraphNode) => d.type === 'root' ? 45 : 35)
      .attr('font-size', (d: GraphNode) => d.type === 'root' ? 12 : 10)
      .attr('fill', '#334155')
      .text((d: GraphNode) => d.name.length > 8 ? d.name.substring(0, 8) + '...' : d.name)

    // 添加掌握度分数
    node.filter((d: GraphNode) => d.masteryScore !== undefined)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', 10)
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text((d: GraphNode) => `${d.masteryScore}%`)

    // 添加阴影滤镜
    const defs = svg.append('defs')
    const filter = defs.append('filter')
      .attr('id', 'shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')

    filter.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('stdDeviation', 3)
      .attr('flood-opacity', 0.15)

    // 模拟tick更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', (d: GraphLink) => (d.source as GraphNode).x!)
        .attr('y1', (d: GraphLink) => (d.source as GraphNode).y!)
        .attr('x2', (d: GraphLink) => (d.target as GraphNode).x!)
        .attr('y2', (d: GraphLink) => (d.target as GraphNode).y!)

      linkLabels
        .attr('x', (d: GraphLink) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', (d: GraphLink) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2)

      node.attr('transform', (d: GraphNode) => `translate(${d.x},${d.y})`)
    })

    // 拖拽函数
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    // 清理函数
    return () => {
      simulation.stop()
    }
  }, [data, buildGraphData, onNodeClick])

  // 获取节点颜色
  const getNodeColor = (status?: string, type?: string): string => {
    if (type === 'root') return '#0ea5e9'
    switch (status) {
      case 'MASTERED': return '#22c55e'
      case 'WEAK': return '#ef4444'
      case 'NEED_REVIEW': return '#f59e0b'
      case 'TODAY_REVIEW': return '#8b5cf6'
      default: return '#64748b'
    }
  }

  // 获取状态标签
  const getStatusLabel = (status?: string): string => {
    switch (status) {
      case 'MASTERED': return '已掌握'
      case 'WEAK': return '薄弱'
      case 'NEED_REVIEW': return '待复习'
      case 'TODAY_REVIEW': return '今日复习'
      default: return '未学习'
    }
  }

  // 过滤后的关系
  const filteredRelations = data?.relations.filter(
    r => filter === 'all' || r.relationType === filter
  ) || []

  // 缩放操作
  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
        1.3
      )
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
        0.7
      )
    }
  }

  const handleResetZoom = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      )
    }
  }

  // 加载中
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
        <span className="text-slate-500">加载知识图谱...</span>
      </div>
    )
  }

  // 错误状态
  if (error || !data) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-xl ${className}`}>
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle size={20} />
          <span>{error || '无法加载知识图谱'}</span>
        </div>
        <button
          onClick={loadGraph}
          className="mt-3 flex items-center space-x-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 text-sm transition-colors"
        >
          <RefreshCw size={14} />
          <span>重试</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      {/* 标题和控制栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-800 flex items-center space-x-2">
          <Network size={18} className="text-blue-500" />
          <span>知识图谱</span>
          {/* 悬停关系提示 */}
          {hoveredLink && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {getRelationTypeLabel(hoveredLink.relationType)}
            </span>
          )}
        </h3>
        <div className="flex items-center space-x-2">
          {/* 关系类型筛选 */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as KnowledgeRelationType | 'all')}
              className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">全部关系</option>
              <option value="PREREQUISITE">前置知识</option>
              <option value="RELATED">相关知识</option>
              <option value="EXTENDS">扩展知识</option>
              <option value="EXAMPLE">示例关系</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* 缩放控制 */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            title="缩小"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-slate-400 min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            title="放大"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            title="重置"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* 图谱可视化区域 - D3力导向图 */}
      <div
        ref={containerRef}
        className="relative min-h-[400px] bg-slate-50 rounded-lg overflow-hidden touch-pan-y"
      >
        {/* SVG画布 */}
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ touchAction: 'none' }}
        />

        {/* 节点详情弹窗 */}
        {selectedNode && (
          <div className="absolute top-2 left-2 bg-white rounded-lg shadow-lg p-3 text-sm z-10 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-slate-800">{selectedNode.name}</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <GripVertical size={14} />
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">状态:</span>
                <span className={`px-1.5 py-0.5 rounded ${
                  selectedNode.status === 'MASTERED' ? 'bg-green-100 text-green-700' :
                  selectedNode.status === 'WEAK' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {getStatusLabel(selectedNode.status)}
                </span>
              </div>
              {selectedNode.masteryScore !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">掌握度:</span>
                  <span className="text-blue-600 font-medium">{selectedNode.masteryScore}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 操作提示 */}
        <div className="absolute bottom-2 right-2 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">
          拖拽节点 · 滚轮缩放 · 点击查看
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 mb-2">节点状态</p>
        <div className="flex flex-wrap gap-3 mb-3">
          <LegendItem label="根节点" color="bg-sky-500" />
          <LegendItem label="已掌握" color="bg-green-500" />
          <LegendItem label="薄弱" color="bg-red-500" />
          <LegendItem label="待复习" color="bg-amber-500" />
        </div>
        <p className="text-xs text-slate-400 mb-2">关系类型</p>
        <div className="flex flex-wrap gap-3">
          <LegendItem type="PREREQUISITE" label="前置知识" color="bg-blue-500" />
          <LegendItem type="RELATED" label="相关知识" color="bg-green-500" />
          <LegendItem type="EXTENDS" label="扩展知识" color="bg-purple-500" />
          <LegendItem type="EXAMPLE" label="示例关系" color="bg-orange-500" />
        </div>
      </div>
    </div>
  )
}

// 图例项组件
interface LegendItemProps {
  type: string
  label: string
  color: string
}

const LegendItem: React.FC<LegendItemProps> = ({ label, color }) => (
  <div className="flex items-center space-x-1.5">
    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className="text-xs text-slate-500">{label}</span>
  </div>
)

export default KnowledgeGraph
