import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useSimulationContext } from '../context/SimulationContext';
import { NodeData, LinkData } from '../types/simulationTypes';

const NetworkGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeSelectionRef = useRef<d3.Selection<SVGCircleElement, NodeData, SVGGElement, unknown> | null>(null);
  const hasInitialized = useRef(false);

  const { simulationData } = useSimulationContext();

  const getNodeColor = (node: NodeData) => {
    switch (node.status) {
      case 'I': return '#ef4444'; // Red
      case 'R': return '#3b82f6'; // Blue
      case 'D': return '#6b7280'; // Gray
      case 'E': return '#f59e0b'; 
      default: return '#10b981'; // Green
    }
  };

  const getNodeRadius = (node: NodeData) => 5 + (node.age / 20);

  useEffect(() => {
    if (hasInitialized.current) return;
    if (!svgRef.current || !simulationData?.nodes || !simulationData?.links) return;

    hasInitialized.current = true;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    simulationData.nodes.forEach(node => {
      node.x ??= Math.random() * width;
      node.y ??= Math.random() * height;
    });

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on('zoom', (event) => {
          g.attr('transform', event.transform.toString());
        })
    );

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'absolute hidden bg-gray-900 text-white p-2 rounded shadow-lg text-xs')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const simulation = d3.forceSimulation<NodeData>(simulationData.nodes)
      .force('link', d3.forceLink<NodeData, LinkData>(simulationData.links).id(d => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-30))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(d => getNodeRadius(d) + 5))
      .on('end', () => simulation.stop());

    const links = g.append('g')
      .selectAll('line')
      .data(simulationData.links)
      .join('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-opacity', d => (d.weight || 0) * 0.7 + 0.3)
      .attr('stroke-width', d => (d.weight || 0) * 2 + 0.5);

    const nodes = g.append('g')
      .selectAll('circle')
      .data(simulationData.nodes)
      .join('circle')
      .attr('r', getNodeRadius)
      .attr('fill', getNodeColor)
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 1.5)
      .on('mouseover', (event, d) => {
        tooltip
          .html(`
            <div><strong>ID:</strong> ${d.id}</div>
            <div><strong>Age:</strong> ${d.age}</div>
            <div><strong>Status:</strong> ${d.status}</div>
            <div><strong>Days infected:</strong> ${d.daysInfected || 0}</div>
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`)
          .style('opacity', 1)
          .classed('hidden', false);
      })
      .on('mouseout', () => {
        tooltip
          .style('opacity', 0)
          .classed('hidden', true);
      });

    const dragBehavior = d3.drag<SVGCircleElement, NodeData>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodes.call(dragBehavior as any);

    simulation.on('tick', () => {
      links
        .attr('x1', d => (d.source as NodeData).x || 0)
        .attr('y1', d => (d.source as NodeData).y || 0)
        .attr('x2', d => (d.target as NodeData).x || 0)
        .attr('y2', d => (d.target as NodeData).y || 0);

      nodes
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);
    });

    nodeSelectionRef.current = nodes as d3.Selection<SVGCircleElement, NodeData, SVGGElement, unknown>;
  }, [simulationData]);

  useEffect(() => {
    if (nodeSelectionRef.current && simulationData?.nodes) {
      nodeSelectionRef.current
        .data(simulationData.nodes)
        .transition()
        .duration(300)
        .attr('fill', d => getNodeColor(d));
    }
  }, [simulationData]);

  if (!simulationData?.nodes) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading network data...
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <svg
        ref={svgRef}
        className="w-full h-full bg-gray-900 rounded-lg"
        data-testid="network-graph"
      />
    </div>
  );
};

export default NetworkGraph;