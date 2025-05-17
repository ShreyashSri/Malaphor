"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Info } from "lucide-react"
import CloudResourceGraph from "@/components/cloud-resource-graph"
import AnomalyList from "@/components/anomaly-list"
import MetricsPanel from "@/components/metrics-panel"
import { fetchCloudGraph, fetchAnomalies, fetchMetrics } from "@/lib/api"

export default function Dashboard() {
  const [cloudGraph, setCloudGraph] = useState({ nodes: [], edges: [] })
  const [anomalies, setAnomalies] = useState([])
  const [metrics, setMetrics] = useState({
    totalResources: 0,
    riskScore: 0,
    anomaliesDetected: 0,
    criticalAlerts: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [graphData, anomalyData, metricsData] = await Promise.all([
          fetchCloudGraph(),
          fetchAnomalies(),
          fetchMetrics(),
        ])

        setCloudGraph(graphData)
        setAnomalies(anomalyData)
        setMetrics(metricsData)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="container mx-auto">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Malaphor Dashboard</h1>
            <p className="text-muted-foreground">AI-Enhanced Threat Hunting for Cloud Environments</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">Run New Analysis</Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <MetricsPanel metrics={metrics} />
        </div>

        {/* Critical Alerts */}
        {anomalies.filter((a) => a.severity === "critical").length > 0 && (
          <Alert className="mb-6 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-600 dark:text-red-400">Critical Anomalies Detected</AlertTitle>
            <AlertDescription>
              {anomalies.filter((a) => a.severity === "critical").length} critical security anomalies have been detected
              in your cloud environment.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="graph" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="graph">Resource Graph</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cloud Resource Relationship Graph</CardTitle>
                <CardDescription>
                  Visualizing connections between cloud resources, identities, and configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px] w-full border-t">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                    </div>
                  ) : (
                    <CloudResourceGraph data={cloudGraph} />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detected Anomalies</CardTitle>
                <CardDescription>
                  Unusual patterns and potential security threats detected by GNN analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                  </div>
                ) : (
                  <AnomalyList anomalies={anomalies} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Insights</CardTitle>
                <CardDescription>Actionable intelligence derived from graph analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Identity Access Patterns</AlertTitle>
                    <AlertDescription>
                      3 service accounts have excessive permissions that violate least privilege principles.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Resource Configuration Analysis</AlertTitle>
                    <AlertDescription>
                      5 storage buckets have public access enabled, creating potential data exposure risks.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Network Connectivity Insights</AlertTitle>
                    <AlertDescription>
                      Several instances in the production VPC have unnecessary connectivity to development environments.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
