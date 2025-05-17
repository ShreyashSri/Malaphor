"use client"

import { useEffect, useRef, useState } from "react"
import { Network } from "vis-network"
import { DataSet } from "vis-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, Filter, RotateCw, Maximize } from "lucide-react"

interface Node {
  id: string
  label: string
  title?: string
  group?: string
  shape?: string
  color?: {
    background?: string
    border?: string
    highlight?: {
      background?: string
      border?: string
    }
  }
  font?: {
    color?: string
  }
}

interface Edge {
  id: string
  from: string
  to: string
  label?: string
  title?: string
  color?: string
  width?: number
  dashes?: boolean
  arrows?: {
    to?: {
      enabled?: boolean
      type?: string
    }
  }
}

interface GraphData {
  nodes: Node[]
  edges: Edge[]
}

interface Props {
  data: GraphData
}

export default function CloudResourceGraph({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
  const [layoutPhysics, setLayoutPhysics] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  const groups = ["all", ...Array.from(new Set(data.nodes.map((node) => node.group || "unknown")))]

  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return

    // Define node styles based on resource type
    const styledNodes = data.nodes.map((node) => {
      const baseStyles = {
        ...node,
        shape: "dot",
        size: 15,
        font: { color: "#333", size: 12 },
      }

      // Customize based on group/type
      switch (node.group) {
        case "compute":
          return {
            ...baseStyles,
            color: { background: "#4285F4", border: "#3367D6" },
            shape: "hexagon",
          }
        case "storage":
          return {
            ...baseStyles,
            color: { background: "#34A853", border: "#0F9D58" },
            shape: "database",
          }
        case "network":
          return {
            ...baseStyles,
            color: { background: "#9C27B0", border: "#7B1FA2" },
            shape: "diamond",
          }
        case "identity":
          return {
            ...baseStyles,
            color: { background: "#F4B400", border: "#F09300" },
            shape: "icon",
            icon: {
              face: '"Font Awesome 5 Free"',
              code: "\uf007",
              size: 20,
              color: "#F09300",
            },
          }
        default:
          return {
            ...baseStyles,
            color: { background: "#9E9E9E", border: "#757575" },
          }
      }
    })

    // Create datasets
    const nodes = new DataSet<Node>(styledNodes)
    const edges = new DataSet<Edge>(data.edges)

    // Configure vis-network options
    const options = {
      nodes: {
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        width: 1.5,
        shadow: true,
        smooth: {
          enabled: true,
          type: "continuous",
          roundness: 0.5,
        },
      },
      physics: {
        enabled: layoutPhysics,
        stabilization: {
          iterations: 200,
        },
        barnesHut: {
          gravitationalConstant: -5000,
          springConstant: 0.04,
          springLength: 95,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
      },
    }

    // Initialize network
    networkRef.current = new Network(containerRef.current, { nodes, edges }, options)

    // Add event listeners
    networkRef.current.on("click", (params) => {
      if (params.nodes.length) {
        const nodeId = params.nodes[0]
        const node = nodes.get(nodeId)
        console.log("Selected node:", node)

        // Highlight connected edges
        const connectedEdges = networkRef.current?.getConnectedEdges(nodeId) || []
        edges.update(
          data.edges.map((edge) => {
            if (connectedEdges.includes(edge.id)) {
              return { ...edge, width: 3, color: "#E91E63" }
            }
            return { ...edge, width: 1.5, color: undefined }
          }),
        )
      }
    })

    // Clean up
    return () => {
      networkRef.current?.destroy()
    }
  }, [data, layoutPhysics])

  // Filter by group
  useEffect(() => {
    if (!networkRef.current) return

    const filteredNodeIds = data.nodes
      .filter((node) => selectedGroup === "all" || node.group === selectedGroup)
      .map((node) => node.id)

    networkRef.current.setData({
      nodes: new DataSet(
        data.nodes.map((node) => ({
          ...node,
          hidden: !filteredNodeIds.includes(node.id),
        })),
      ),
      edges: new DataSet(
        data.edges.map((edge) => ({
          ...edge,
          hidden: !(filteredNodeIds.includes(edge.from) && filteredNodeIds.includes(edge.to)),
        })),
      ),
    })
  }, [selectedGroup, data])

  // Handle zoom level changes
  useEffect(() => {
    if (networkRef.current) {
      networkRef.current.moveTo({
        scale: zoomLevel,
        animation: {
          duration: 300,
          easingFunction: "easeInOutCubic",
        },
      })
    }
  }, [zoomLevel])

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 2.5))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.4))
  }

  const togglePhysics = () => {
    setLayoutPhysics(!layoutPhysics)
  }

  const resetView = () => {
    networkRef.current?.fit()
    setZoomLevel(1)
  }

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-8 w-8">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Slider
            className="w-32"
            value={[zoomLevel]}
            min={0.4}
            max={2.5}
            step={0.1}
            onValueChange={(vals) => setZoomLevel(vals[0])}
          />
          <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-8 w-8">
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 md:ml-3">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group.charAt(0).toUpperCase() + group.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePhysics}
            className={`h-8 w-8 ${layoutPhysics ? "bg-blue-100 dark:bg-blue-900/30" : ""}`}
            title={layoutPhysics ? "Disable physics simulation" : "Enable physics simulation"}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={resetView} className="h-8 w-8" title="Reset view">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleFullscreen}
            className="h-8 w-8"
            title="Toggle fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1" />
    </div>
  )
}
