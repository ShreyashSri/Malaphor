"use client"

import { useState } from "react"
import { AlertTriangle, AlertCircle, AlertOctagon, ArrowRight, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface Anomaly {
  id: string
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  timestamp: string
  resourceIds: string[]
  resourceType: string
  affectedResources: {
    id: string
    name: string
    type: string
  }[]
  detectionMethod: string
  suggestedAction: string
  isNew?: boolean
}

interface AnomalyListProps {
  anomalies: Anomaly[]
}

export default function AnomalyList({ anomalies }: AnomalyListProps) {
  const [expandedAnomalies, setExpandedAnomalies] = useState<{ [key: string]: boolean }>({})

  const toggleAnomaly = (id: string) => {
    setExpandedAnomalies((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertOctagon className="h-5 w-5 text-red-600" />
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "medium":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "low":
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/30"
    }
  }

  if (anomalies.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-3 dark:bg-green-900/20 mb-4">
          <div className="rounded-full bg-green-200 p-2 dark:bg-green-900/50">
            <AlertCircle className="h-6 w-6 text-green-700 dark:text-green-400" />
          </div>
        </div>
        <h3 className="text-lg font-medium">No Anomalies Detected</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your cloud environment appears to be operating normally.
        </p>
      </div>
    )
  }

  // Sort anomalies by severity (critical first) and then by timestamp (newest first)
  const sortedAnomalies = [...anomalies].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const severityComparison = severityOrder[a.severity] - severityOrder[b.severity]

    if (severityComparison !== 0) return severityComparison

    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return (
    <div className="space-y-4">
      {sortedAnomalies.map((anomaly) => (
        <Collapsible
          key={anomaly.id}
          open={expandedAnomalies[anomaly.id]}
          onOpenChange={() => toggleAnomaly(anomaly.id)}
          className={`border rounded-lg overflow-hidden ${getSeverityColor(anomaly.severity)}`}
        >
          <div className="p-4 flex items-start">
            <div className="mr-3 mt-0.5">{getSeverityIcon(anomaly.severity)}</div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{anomaly.title}</h3>
                  {anomaly.isNew && (
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100"
                    >
                      New
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="capitalize">
                  {anomaly.severity}
                </Badge>
              </div>

              <p className="text-sm">{anomaly.description}</p>

              <div className="flex items-center text-xs mt-2">
                <Clock className="h-3 w-3 mr-1" />
                <span>{new Date(anomaly.timestamp).toLocaleString()}</span>
                <span className="mx-2">•</span>
                <span>{anomaly.resourceType}</span>
              </div>
            </div>

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2">
                {expandedAnomalies[anomaly.id] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0">
              <div className="border-t my-2 opacity-40" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Detection Method</h4>
                  <p className="text-sm">{anomaly.detectionMethod}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-1">Affected Resources</h4>
                  <ul className="text-sm space-y-1">
                    {anomaly.affectedResources.map((resource) => (
                      <li key={resource.id} className="flex items-center">
                        <ArrowRight className="h-3 w-3 mr-1" />
                        <span>
                          {resource.name} ({resource.type})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">Recommended Action</h4>
                <p className="text-sm">{anomaly.suggestedAction}</p>
              </div>

              <div className="flex justify-end mt-4">
                <Button size="sm" variant="outline">
                  Ignore
                </Button>
                <Button size="sm" className="ml-2 bg-blue-600 hover:bg-blue-700">
                  Investigate
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
