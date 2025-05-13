import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useSimulationContext } from '../context/SimulationContext';

interface DataPoint {
  day: number;
  susceptible: number;
  exposed: number;
  infected: number;
  recovered: number;
  deceased: number;
}

const LineGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { simulationState, simulationData } = useSimulationContext();
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (!simulationData?.nodes) return;

    const newDataPoint = {
      day: simulationState.currentDay,
      susceptible: simulationData.nodes.filter(n => n.status === 'S').length,
      exposed: simulationData.nodes.filter(n => n.status === 'E').length,
      infected: simulationData.nodes.filter(n => n.status === 'I').length,
      recovered: simulationData.nodes.filter(n => n.status === 'R').length,
      deceased: simulationData.nodes.filter(n => n.status === 'D').length,
    };

    setHistoricalData(prev => [...prev, newDataPoint]);
  }, [simulationState.currentDay, simulationData]);

  useEffect(() => {
    if (!svgRef.current || historicalData.length === 0) return;

    const margin = { top: 20, right: 60, bottom: 30, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const totalNodes = simulationData?.nodes.length || 0;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, Math.max(10, simulationState.currentDay)])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, totalNodes])
      .range([height, 0]);

    // Create line generator
    const line = d3.line<{ day: number; value: number }>()
      .x(d => xScale(d.day))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .attr('color', '#9CA3AF');

    svg.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .attr('color', '#9CA3AF');

    // Add lines for each SEIRD compartment
    const compartments = [
      { name: 'susceptible', color: '#10b981' },
      { name: 'exposed', color: '#f59e0b' },
      { name: 'infected', color: '#ef4444' },
      { name: 'recovered', color: '#3b82f6' },
      { name: 'deceased', color: '#6b7280' },
    ];

    compartments.forEach(compartment => {
      const compartmentData = historicalData.map(d => ({
        day: d.day,
        value: d[compartment.name as keyof typeof d],
      }));

      svg.append('path')
        .datum(compartmentData)
        .attr('fill', 'none')
        .attr('stroke', compartment.color)
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // Add legend
    const legend = svg.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'start')
      .selectAll('g')
      .data(compartments)
      .join('g')
      .attr('transform', (d, i) => `translate(${width - 100},${i * 20})`);

    legend.append('rect')
      .attr('x', 0)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => d.color);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .attr('fill', '#9CA3AF')
      .text(d => d.name.charAt(0).toUpperCase() + d.name.slice(1));

  }, [historicalData, simulationData, simulationState.currentDay]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ minHeight: '150px' }}
    />
  );
};

export default LineGraph;
