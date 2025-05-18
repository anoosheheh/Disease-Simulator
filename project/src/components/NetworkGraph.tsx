"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import * as d3 from "d3"
import { useSimulationContext } from "../context/SimulationContext"
import type { NodeData, LinkData } from "../types/simulationTypes"

const NetworkGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)
  const { simulationData } = useSimulationContext()
  const [nodeGroupRef, setNodeGroupRef] = useState<d3.Selection<
    SVGCircleElement,
    NodeData,
    SVGGElement,
    unknown
  > | null>(null)
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity)

  // React state for tooltip
  const [tooltipInfo, setTooltipInfo] = useState<{
    visible: boolean
    node: NodeData | null
  }>({
    visible: false,
    node: null,
  })

  const getNodeColor = (node: NodeData) => {
    switch (node.status) {
      case "I":
        return "#ef4444" // Red - Infected
      case "R":
        return "#3b82f6" // Blue - Recovered
      case "D":
        return "#6b7280" // Gray - Deceased
      case "E":
        return "#f59e0b" // Yellow - Exposed
      case "S":
        return "#10b981" // Green - Susceptible
      default:
        return "#22c55e" // Fallback
    }
  }

  const getNodeRadius = (node: NodeData) => 5 + node.age / 20

  useEffect(() => {
    if (!svgRef.current || !simulationData?.nodes || !simulationData?.links) return

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    if (hasInitialized.current) return
    hasInitialized.current = true

    // Set initial positions if not already present
    simulationData.nodes.forEach((node) => {
      node.x ??= Math.random() * width
      node.y ??= Math.random() * height
    })

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const g = svg.append("g")

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString())
        setTransform(event.transform) // Store current transform for tooltip positioning
      })

    // Apply zoom
    svg.call(zoom)

    const simulation = d3
      .forceSimulation<NodeData>(simulationData.nodes)
      .force(
        "link",
        d3
          .forceLink<NodeData, LinkData>(simulationData.links)
          .id((d) => d.id)
          .distance(50),
      )
      .force("charge", d3.forceManyBody().strength(-30))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide((d) => getNodeRadius(d) + 5),
      )
      .on("end", () => {
        simulationData.nodes.forEach((node) => {
          node.fx = node.x
          node.fy = node.y
        })
        simulation.stop()
      })

    const links = g
      .append("g")
      .selectAll("line")
      .data(simulationData.links)
      .join("line")
      .attr("stroke", "#4b5563")
      .attr("stroke-opacity", (d) => (d.weight || 0) * 0.7 + 0.3)
      .attr("stroke-width", (d) => (d.weight || 0) * 2 + 0.5)

    const nodes = g
      .append("g")
      .selectAll("circle")
      .data(simulationData.nodes)
      .join("circle")
      .attr("r", getNodeRadius)
      .attr("fill", getNodeColor)
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", (_, d) => {
        // Show tooltip for this node
        setTooltipInfo({
          visible: true,
          node: d,
        })
      })
      .on("mouseout", () => {
        // Hide tooltip
        setTooltipInfo({
          visible: false,
          node: null,
        })
      })

    nodes.attr("cx", (d) => d.x || 0).attr("cy", (d) => d.y || 0)

    setNodeGroupRef(nodes as d3.Selection<SVGCircleElement, NodeData, SVGGElement, unknown>)

    simulation.on("tick", () => {
      links
        .attr(
          "x1",
          (d) =>
            (typeof d.source === "object" ? d.source.x : simulationData.nodes.find((n) => n.id === d.source)?.x) || 0,
        )
        .attr(
          "y1",
          (d) =>
            (typeof d.source === "object" ? d.source.y : simulationData.nodes.find((n) => n.id === d.source)?.y) || 0,
        )
        .attr(
          "x2",
          (d) =>
            (typeof d.target === "object" ? d.target.x : simulationData.nodes.find((n) => n.id === d.target)?.x) || 0,
        )
        .attr(
          "y2",
          (d) =>
            (typeof d.target === "object" ? d.target.y : simulationData.nodes.find((n) => n.id === d.target)?.y) || 0,
        )

      nodes.attr("cx", (d) => d.x || 0).attr("cy", (d) => d.y || 0)
    })

    return () => {
      simulation.stop()
    }
  }, [simulationData])

  useEffect(() => {
    if (!simulationData?.nodes || !nodeGroupRef) return

    nodeGroupRef.data(simulationData.nodes).transition().duration(300).attr("fill", getNodeColor)
  }, [simulationData, nodeGroupRef])

  if (!simulationData?.nodes) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">Loading network data...</div>
  }

  return (
    <div className="flex-1 relative" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full bg-gray-900 rounded-lg" data-testid="network-graph">
        {/* SVG-based tooltip that stays within the graph */}
        {tooltipInfo.visible && tooltipInfo.node && (
          <g
            transform={`translate(${
              transform.apply([tooltipInfo.node.x || 0, tooltipInfo.node.y || 0])[0]
            }, ${transform.apply([tooltipInfo.node.x || 0, tooltipInfo.node.y || 0])[1]})`}
            className="tooltip-group"
          >
            {/* Tooltip background */}
            <rect
              x="10"
              y="-60"
              width="160"
              height="80"
              rx="5"
              ry="5"
              fill="#1f2937"
              stroke="#4b5563"
              strokeWidth="1"
              opacity="0.95"
            />
            {/* Tooltip content */}
            <text x="20" y="-40" fill="#ffffff" fontSize="12" fontWeight="bold">
              {tooltipInfo.node.id}
            </text>
            <line x1="20" y1="-35" x2="150" y2="-35" stroke="#4b5563" strokeWidth="1" />
            <text x="20" y="-20" fill="#d1d5db" fontSize="10">
              Age: {tooltipInfo.node.age}
            </text>
            <text x="20" y="-5" fill="#d1d5db" fontSize="10">
              Status: {tooltipInfo.node.status}
            </text>
            <text x="20" y="10" fill="#d1d5db" fontSize="10">
              Days infected: {tooltipInfo.node.daysInfected || 0}
            </text>
          </g>
        )}
      </svg>

      {/* Helper text */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-300 bg-gray-800 bg-opacity-80 px-2 py-1 rounded">
        Hover over nodes to see details
      </div>
    </div>
  )
}

export default NetworkGraph
