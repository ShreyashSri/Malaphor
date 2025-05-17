import { Card } from "@/components/ui/card"
import { AlertTriangle, ArrowRight } from "lucide-react"

interface PathNode {
  id: string
  type: string
  name: string
  provider: string
}

interface AccessPath {
  id: string
  nodes: PathNode[]
  risk: "high" | "medium" | "low"
  description: string
}

interface PathAnalysisPanelProps {
  paths: AccessPath[]
}

export default function PathAnalysisPanel({ paths }: PathAnalysisPanelProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-blue-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Risky Access Paths</h3>
        </div>
        {paths.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No risky access paths found
          </p>
        ) : (
          <div className="space-y-6">
            {paths.map((path) => (
              <div key={path.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Path {path.id}</h4>
                  <span className={`text-sm font-medium ${getRiskColor(path.risk)}`}>
                    {path.risk.toUpperCase()} Risk
                  </span>
                </div>
                <div className="space-y-2">
                  {path.nodes.map((node, index) => (
                    <div key={node.id} className="flex items-center">
                      {index > 0 && (
                        <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{node.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({node.type})
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {node.provider}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{path.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
} 