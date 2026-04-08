/**
 * KnowledgeGraph - 知识图谱可视化组件
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { KnowledgeGraphData, GraphNode, GraphLink } from '../../src/types/admin';
import { COURSE_COLORS } from '../../src/types/admin';
import Card from './Card';
import './KnowledgeGraph.css';

interface KnowledgeGraphProps {
  graphData: KnowledgeGraphData;
}

interface TooltipData {
  node: GraphNode;
  x: number;
  y: number;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ graphData }) => {
  const safeGraphData = graphData || { nodes: [], links: [] };
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // 响应式尺寸
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.max(width - 40, 400), height: Math.max(height - 80, 300) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3图谱渲染
  useEffect(() => {
    if (!svgRef.current || !safeGraphData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // 创建缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 创建主组
    const g = svg.append('g');

    // 模拟数据（处理d3需要的source/target对象）
    const nodes = safeGraphData.nodes.map(d => ({ ...d }));
    const links = safeGraphData.links.map(d => ({
      ...d,
      source: nodes.find(n => n.id === d.source),
      target: nodes.find(n => n.id === d.target)
    })).filter(d => d.source && d.target);

    // 力导向模拟 - 紧凑布局，不同簇靠近各自中心
    const categoryPositions: Record<string, {x: number, y: number}> = {
      math: {x: width * 0.25, y: height * 0.3},
      physics: {x: width * 0.75, y: height * 0.3},
      computer: {x: width * 0.5, y: height * 0.5},
      chemistry: {x: width * 0.2, y: height * 0.75},
      biology: {x: width * 0.8, y: height * 0.75},
      english: {x: width * 0.5, y: height * 0.85}
    };

    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links as any)
        .id((d: any) => d.id)
        .distance(30)
        .strength(1))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.importance * 0.6 + 4))
      // 让同类别节点聚集在一起
      .force('x', d3.forceX((d: any) => categoryPositions[d.category]?.x || width / 2).strength(0.15))
      .force('y', d3.forceY((d: any) => categoryPositions[d.category]?.y || height / 2).strength(0.15));

    // 绘制边
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.15)')
      .attr('stroke-width', (d: any) => Math.max(1, d.weight / 3));

    // 绘制节点
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // 节点圆形 - 紧凑大小
    node.append('circle')
      .attr('r', (d: any) => d.importance + 3)
      .attr('fill', (d: any) => COURSE_COLORS[d.category as keyof typeof COURSE_COLORS] || '#94a3b8')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d: any) => {
        const [x, y] = d3.pointer(event, svgRef.current);
        setTooltip({ node: d, x, y });
      })
      .on('mouseout', () => {
        setTooltip(null);
      });

    // 节点标签
    node.append('text')
      .text((d: any) => d.name)
      .attr('dy', (d: any) => d.importance * 1.5 + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f1f5f9')
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-sans)')
      .style('pointer-events', 'none');

    // 模拟更新
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // 拖拽函数
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [safeGraphData, dimensions]);

  // 统计信息
  const nodeCount = safeGraphData.nodes.length;
  const edgeCount = safeGraphData.links.length;
  const avgDegree = nodeCount > 0 ? (edgeCount * 2 / nodeCount).toFixed(2) : '0';

  return (
    <Card title="全局知识图谱" icon="🌐" hoverable={false}>
      <div className="knowledge-graph" ref={containerRef}>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="graph-svg"
        />

        {/* 统计信息 */}
        <div className="graph-stats">
          <div className="stat-item">
            <span className="stat-value">{nodeCount.toLocaleString()}</span>
            <span className="stat-label">节点</span>
          </div>
          <div className="stat-divider">|</div>
          <div className="stat-item">
            <span className="stat-value">{edgeCount.toLocaleString()}</span>
            <span className="stat-label">边</span>
          </div>
          <div className="stat-divider">|</div>
          <div className="stat-item">
            <span className="stat-value">{avgDegree}</span>
            <span className="stat-label">平均度</span>
          </div>
        </div>

        {/* 图例 */}
        <div className="graph-legend">
          {Object.entries(COURSE_COLORS).map(([key, color]) => (
            <div key={key} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: color }}></span>
              <span className="legend-name">{key}</span>
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="graph-tooltip"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 10
            }}
          >
            <div className="tooltip-name">{tooltip.node.name}</div>
            <div className="tooltip-info">
              <span>课程: {tooltip.node.course}</span>
              <span>重要性: {tooltip.node.importance}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KnowledgeGraph;