"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Network } from "vis-network"
import { DataSet } from "vis-data"
import { useTheme } from "next-themes"

interface AnalysisGraphProps {
  analysis: any
}

export function AnalysisGraph({ analysis }: AnalysisGraphProps) {
  const networkRef = useRef<HTMLDivElement>(null)
  const networkInstance = useRef<Network | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!analysis || !networkRef.current) return

    // Create nodes and edges from analysis data
    const nodes = new DataSet<any>()
    const edges = new DataSet<any>()

    // Add user nodes
    const users = new Set<string>()
    const resources = new Set<string>()
    const actions = new Set<string>()

    // Process findings to extract relationships
    analysis.findings.forEach((finding: any) => {
      const event = finding.event
      
      // Add user node
      if (event.userIdentity?.userName && !users.has(event.userIdentity.userName)) {
        users.add(event.userIdentity.userName)
        nodes.add({
          id: `user_${event.userIdentity.userName}`,
          label: event.userIdentity.userName,
          group: "user",
          title: `User: ${event.userIdentity.userName}\nSeverity: ${finding.severity}\nType: ${finding.type}`,
          color: {
            background: "#4CAF50",
            border: "#388E3C",
            highlight: {
              background: "#81C784",
              border: "#4CAF50"
            }
          },
          font: {
            color: theme === "dark" ? "#FFFFFF" : "#000000",
            size: 14,
            face: "Inter"
          }
        })
      }

      // Add resource nodes
      if (event.resources) {
        event.resources.forEach((resource: any) => {
          if (resource.ARN && !resources.has(resource.ARN)) {
            resources.add(resource.ARN)
            const resourceName = resource.ARN.split("/").pop() || resource.ARN
            nodes.add({
              id: `resource_${resource.ARN}`,
              label: resourceName,
              group: "resource",
              title: `Resource: ${resource.ARN}\nSeverity: ${finding.severity}\nType: ${finding.type}`,
              color: {
                background: "#2196F3",
                border: "#1976D2",
                highlight: {
                  background: "#64B5F6",
                  border: "#2196F3"
                }
              },
              font: {
                color: theme === "dark" ? "#FFFFFF" : "#000000",
                size: 14,
                face: "Inter"
              }
            })
          }
        })
      }

      // Add action node
      if (event.eventName && !actions.has(event.eventName)) {
        actions.add(event.eventName)
        nodes.add({
          id: `action_${event.eventName}`,
          label: event.eventName,
          group: "action",
          title: `Action: ${event.eventName}\nSeverity: ${finding.severity}\nType: ${finding.type}`,
          color: {
            background: "#FF9800",
            border: "#F57C00",
            highlight: {
              background: "#FFB74D",
              border: "#FF9800"
            }
          },
          font: {
            color: theme === "dark" ? "#FFFFFF" : "#000000",
            size: 14,
            face: "Inter"
          }
        })
      }

      // Add edges
      if (event.userIdentity?.userName && event.eventName) {
        edges.add({
          from: `user_${event.userIdentity.userName}`,
          to: `action_${event.eventName}`,
          arrows: "to",
          title: "performed",
          color: {
            color: "#4CAF50",
            highlight: "#81C784",
            opacity: 0.8
          },
          width: 2,
          smooth: {
            enabled: true,
            type: "curvedCW",
            roundness: 0.2
          }
        })
      }

      if (event.eventName && event.resources) {
        event.resources.forEach((resource: any) => {
          if (resource.ARN) {
            edges.add({
              from: `action_${event.eventName}`,
              to: `resource_${resource.ARN}`,
              arrows: "to",
              title: "affected",
              color: {
                color: "#FF9800",
                highlight: "#FFB74D",
                opacity: 0.8
              },
              width: 2,
              smooth: {
                enabled: true,
                type: "curvedCW",
                roundness: 0.2
              }
            })
          }
        })
      }
    })

    // Network configuration
    const options = {
      nodes: {
        shape: "dot",
        size: 20,
        font: {
          size: 14,
          face: "Inter",
          color: theme === "dark" ? "#FFFFFF" : "#000000"
        },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        width: 2,
        font: {
          size: 12,
          face: "Inter",
          color: theme === "dark" ? "#FFFFFF" : "#666666",
          strokeWidth: 0
        },
        shadow: true,
        smooth: {
          enabled: true,
          type: "curvedCW",
          roundness: 0.2
        }
      },
      groups: {
        user: {
          shape: "dot",
          color: {
            background: "#4CAF50",
            border: "#388E3C",
            highlight: {
              background: "#81C784",
              border: "#4CAF50"
            }
          }
        },
        resource: {
          shape: "diamond",
          color: {
            background: "#2196F3",
            border: "#1976D2",
            highlight: {
              background: "#64B5F6",
              border: "#2196F3"
            }
          }
        },
        action: {
          shape: "square",
          color: {
            background: "#FF9800",
            border: "#F57C00",
            highlight: {
              background: "#FFB74D",
              border: "#FF9800"
            }
          }
        }
      },
      physics: {
        stabilization: {
          iterations: 100,
          fit: true
        },
        barnesHut: {
          gravitationalConstant: -2000,
          springLength: 200,
          springConstant: 0.04,
          damping: 0.09
        },
        maxVelocity: 50,
        minVelocity: 0.1
      },
      layout: {
        improvedLayout: true,
        randomSeed: 42
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true
      }
    }

    // Create network
    if (networkInstance.current) {
      networkInstance.current.destroy()
    }

    networkInstance.current = new Network(
      networkRef.current,
      { nodes, edges },
      options
    )

    // Add event listeners
    networkInstance.current.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0]
        const node = nodes.get(nodeId)
        console.log("Clicked node:", node)
      }
    })

    return () => {
      if (networkInstance.current) {
        networkInstance.current.destroy()
      }
    }
  }, [analysis, theme])

  return (
    <div className="space-y-4">
      <div className="h-[600px] w-full rounded-lg border border-gray-200 dark:border-gray-800" ref={networkRef} />
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="h-4 w-4 rounded-full bg-[#4CAF50] mr-2" />
          <span>Users</span>
        </div>
        <div className="flex items-center">
          <div className="h-4 w-4 rounded-full bg-[#2196F3] mr-2" />
          <span>Resources</span>
        </div>
        <div className="flex items-center">
          <div className="h-4 w-4 rounded-full bg-[#FF9800] mr-2" />
          <span>Actions</span>
        </div>
      </div>
    </div>
  )
} 