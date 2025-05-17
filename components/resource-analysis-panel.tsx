import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Server, HardDrive, Lightbulb, TrendingUp, TrendingDown, Database } from "lucide-react"

interface Metric {
  value: string
  label: string
  change: {
    value: string
    direction: "increase" | "decrease" | "neutral"
  }
}

interface ResourceDistribution {
  type: string
  count: number
  percentage: number
}

interface OptimizationRecommendation {
  title: string
  description: string
  potentialSavings: string
}

interface ResourceAnalysisPanelProps {
  metrics: Metric[]
  resourceDistribution: ResourceDistribution[]
  recommendations: OptimizationRecommendation[]
}

export default function ResourceAnalysisPanel({
  metrics,
  resourceDistribution,
  recommendations,
}: ResourceAnalysisPanelProps) {
  const getChangeColor = (direction: string) => {
    switch (direction) {
      case "increase":
        return "text-red-500"
      case "decrease":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  const getChangeIcon = (direction: string) => {
    switch (direction) {
      case "increase":
        return <TrendingUp className="w-4 h-4" />
      case "decrease":
        return <TrendingDown className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Section */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className="text-sm text-muted-foreground">{metric.label}</span>
              </div>
              <div className={`flex items-center ${getChangeColor(metric.change.direction)}`}>
                {getChangeIcon(metric.change.direction)}
                <span className="ml-1 text-sm">{metric.change.value}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Resource Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resource Distribution</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            {resourceDistribution.map((resource, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{resource.type}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{resource.count}</span>
                  <span className="text-sm text-muted-foreground">({resource.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center">
            {/* Placeholder for chart */}
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Chart</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Optimization Recommendations */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Optimization Recommendations</h3>
        </div>
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{recommendation.title}</h4>
                <span className="text-sm text-green-500">{recommendation.potentialSavings}</span>
              </div>
              <p className="text-sm text-muted-foreground">{recommendation.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Utilization Trends */}
      <Card className="p-6">
        <Tabs defaultValue="cpu">
          <TabsList>
            <TabsTrigger value="cpu">CPU</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>
          <TabsContent value="cpu" className="mt-4">
            <div className="h-64 border rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">CPU utilization chart</span>
            </div>
          </TabsContent>
          <TabsContent value="memory" className="mt-4">
            <div className="h-64 border rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Memory utilization chart</span>
            </div>
          </TabsContent>
          <TabsContent value="storage" className="mt-4">
            <div className="h-64 border rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Storage utilization chart</span>
            </div>
          </TabsContent>
          <TabsContent value="network" className="mt-4">
            <div className="h-64 border rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Network utilization chart</span>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
} 