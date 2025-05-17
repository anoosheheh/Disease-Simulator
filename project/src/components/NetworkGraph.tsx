import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useSimulationContext } from '../context/SimulationContext';
import { NodeData, LinkData } from '../types/simulationTypes';

const NetworkGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  const hasInitialized = useRef(false);
  const { simulationData } = useSimulationContext();
  const [nodeGroupRef, setNodeGroupRef] = useState<d3.Selection<SVGCircleElement, NodeData, SVGGElement, unknown> | null>(null);

  const getNodeColor = (node: NodeData) => {
    switch (node.status) {
      case 'I': return '#ef4444';
      case 'R': return '#3b82f6';
      case 'D': return '#6b7280';
      case 'E': return '#f59e0b';
      case 'S': return '#10b981';
      default: return '#22c55e';
    }
  };

  const getNodeRadius = (node: NodeData) => 5 + (node.age / 20);

  useEffect(() => {
    if (!svgRef.current || !simulationData?.nodes || !simulationData?.links) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Only run once
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Set initial positions if not already present
    simulationData.nodes.forEach(node => {
      node.x ??= Math.random() * width;
      node.y ??= Math.random() * height;
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

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
    tooltipRef.current = tooltip;

    const simulation = d3.forceSimulation<NodeData>(simulationData.nodes)
      .force('link', d3.forceLink<NodeData, LinkData>(simulationData.links).id(d => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-30))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(d => getNodeRadius(d) + 5))
      .on('end', () => {
        // Lock node positions once simulation ends
        simulationData.nodes.forEach(node => {
          node.fx = node.x;
          node.fy = node.y;
        });
        simulation.stop();
      });

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
        tooltip.style('opacity', 0).classed('hidden', true);
      });

    nodes
      .attr('cx', d => d.x || 0)
      .attr('cy', d => d.y || 0);

    setNodeGroupRef(nodes as d3.Selection<SVGCircleElement, NodeData, SVGGElement, unknown>);

    simulation.on('tick', () => {
      links
        .attr('x1', d => (typeof d.source === 'object' ? d.source.x : simulationData.nodes.find(n => n.id === d.source)?.x) || 0)
        .attr('y1', d => (typeof d.source === 'object' ? d.source.y : simulationData.nodes.find(n => n.id === d.source)?.y) || 0)
        .attr('x2', d => (typeof d.target === 'object' ? d.target.x : simulationData.nodes.find(n => n.id === d.target)?.x) || 0)
        .attr('y2', d => (typeof d.target === 'object' ? d.target.y : simulationData.nodes.find(n => n.id === d.target)?.y) || 0);

      nodes
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);
    });
    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [simulationData]);

  useEffect(() => {
    // On future updates, only change color
    if (!simulationData?.nodes || !nodeGroupRef) return;

    nodeGroupRef
      .data(simulationData.nodes)
      .transition()
      .duration(300)
      .attr('fill', getNodeColor);
  }, [simulationData, nodeGroupRef]);

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
