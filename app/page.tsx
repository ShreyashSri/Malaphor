"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Info, Shield, BarChart, FileText, Route, CloudCog } from "lucide-react"
import CloudResourceGraph from "@/components/cloud-resource-graph"
import AnomalyList from "@/components/anomaly-list"
import MetricsPanel from "@/components/metrics-panel"
import SecurityPanel from "@/components/security-panel"
import ResourceAnalysisPanel from "@/components/resource-analysis-panel"
import ReportPanel from "@/components/report-panel"
import PathAnalysisPanel from "@/components/path-analysis-panel"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Welcome from "@/components/welcome"
import AwsDashboard from "@/components/aws/AwsDashboard"
import { 
  fetchCloudGraph, 
  fetchAnomalies, 
  fetchMetrics, 
  fetchAwsDeployments, 
  fetchAwsHealthChecks, 
  fetchAwsServices,
  AwsDeployment,
  AwsHealthCheck,
  AwsService
} from "@/lib/api"
import useApiStatus from "@/hooks/use-api-status"

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

interface Metrics {
  totalResources: number
  riskScore: number
  anomaliesDetected: number
  criticalAlerts: number
}

export default function Dashboard() {
  const { isApiOnline, isChecking, errorMessage, checkApiStatus, offlineMode, toggleOfflineMode } = useApiStatus()
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(false)
  const [cloudGraph, setCloudGraph] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] })
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [metrics, setMetrics] = useState<Metrics>({
    totalResources: 0,
    riskScore: 0,
    anomaliesDetected: 0,
    criticalAlerts: 0,
  })
  const [awsDeployments, setAwsDeployments] = useState<AwsDeployment[]>([])
  const [awsHealthChecks, setAwsHealthChecks] = useState<AwsHealthCheck[]>([])
  const [awsServices, setAwsServices] = useState<AwsService[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize welcomeDismissed state from localStorage after mount
  useEffect(() => {
    const savedWelcomeDismissed = typeof window !== 'undefined'
      ? localStorage.getItem('welcomeDismissed') === 'true'
      : false;
    setWelcomeDismissed(savedWelcomeDismissed);
  }, []);

  const handleDismissWelcome = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('welcomeDismissed', 'true');
    }
    setWelcomeDismissed(true);
  }

  // Mock data for new components
  const securityData = {
    findings: [
      {
        type: "Public Access",
        severity: "high" as const,
        resource: "S3 Bucket",
        provider: "AWS",
        message: "Public access enabled on production bucket",
      },
      {
        type: "Weak Password",
        severity: "medium" as const,
        resource: "IAM User",
        provider: "AWS",
        message: "Password policy not enforced",
      },
    ],
    score: {
      overall: 75,
      high: 2,
      medium: 5,
      low: 8,
    },
  }

  const resourceData = {
    metrics: [
      {
        value: "$1,245.67",
        label: "Monthly Cost",
        change: { value: "+12%", direction: "increase" as const },
      },
      {
        value: "42%",
        label: "CPU Utilization",
        change: { value: "+2%", direction: "neutral" as const },
      },
      {
        value: "68%",
        label: "Memory Usage",
        change: { value: "+8%", direction: "increase" as const },
      },
      {
        value: "5.2TB",
        label: "Total Storage",
        change: { value: "+0.8TB", direction: "increase" as const },
      },
    ],
    resourceDistribution: [
      { type: "Compute Instances", count: 12, percentage: 48 },
      { type: "Storage Services", count: 8, percentage: 32 },
      { type: "Networking Resources", count: 4, percentage: 16 },
      { type: "Other Services", count: 1, percentage: 4 },
    ],
    recommendations: [
      {
        title: "Resize underutilized instances",
        description: "3 instances have been running at <20% CPU utilization for the past 30 days.",
        potentialSavings: "Potential Monthly Savings: $320",
      },
      {
        title: "Remove unattached storage volumes",
        description: "5 storage volumes are not attached to any resources.",
        potentialSavings: "Potential Monthly Savings: $45",
      },
    ],
  }

  const pathData = {
    paths: [
      {
        id: "1",
        nodes: [
          { id: "1", type: "IAM User", name: "admin-user", provider: "AWS" },
          { id: "2", type: "Role", name: "admin-role", provider: "AWS" },
          { id: "3", type: "S3 Bucket", name: "sensitive-data", provider: "AWS" },
        ],
        risk: "high" as const,
        description: "Direct access path from admin user to sensitive data bucket",
      },
    ],
  }

  const reportData = {
    scheduledReports: [],
    onGenerateReport: (format: string) => {
      console.log("Generating report in format:", format)
    },
    onScheduleReport: (frequency: string, recipients: string[]) => {
      console.log("Scheduling report:", { frequency, recipients })
    },
  }

  useEffect(() => {
    async function loadData() {
      if (offlineMode) return
      
      setIsLoading(true)
      try {
        const [graphData, anomalyData, metricsData, deployments, healthChecks, services] = await Promise.all([
          fetchCloudGraph(),
          fetchAnomalies(),
          fetchMetrics(),
          fetchAwsDeployments(),
          fetchAwsHealthChecks(),
          fetchAwsServices(),
        ])

        setCloudGraph(graphData)
        setAnomalies(anomalyData)
        setMetrics(metricsData)
        setAwsDeployments(deployments)
        setAwsHealthChecks(healthChecks)
        setAwsServices(services)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [offlineMode])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header apiStatus={isApiOnline} />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="container mx-auto">
          {!isChecking && !isApiOnline && !offlineMode && (
            <Alert className="mb-6 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-600 dark:text-yellow-400">API Connection Issue</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{errorMessage || 'Failed to connect to the API'}</span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={checkApiStatus}>
                    Retry Connection
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleOfflineMode}>
                    Work Offline
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!welcomeDismissed && <Welcome onDismiss={handleDismissWelcome} />}

          <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Malaphor Dashboard</h1>
              <p className="text-muted-foreground">AI-Enhanced Threat Hunting for Cloud Environments</p>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!isApiOnline && !offlineMode}
            >
              Run New Analysis
            </Button>
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
            <TabsList className="grid grid-cols-7 w-full max-w-3xl">
              <TabsTrigger value="graph">
                <Route className="w-4 h-4 mr-2" />
                Graph
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="resources">
                <BarChart className="w-4 h-4 mr-2" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="paths">
                <Route className="w-4 h-4 mr-2" />
                Paths
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="anomalies">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Anomalies
              </TabsTrigger>
              <TabsTrigger value="aws">
              <CloudCog className="w-4 h-4 mr-2" />
              AWS
            </TabsTrigger>
            <TabsTrigger value="aws">
              <CloudCog className="w-4 h-4 mr-2" />
              AWS
            </TabsTrigger>
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

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Analysis</CardTitle>
                  <CardDescription>Comprehensive security findings and risk assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                    </div>
                  ) : (
                    <SecurityPanel findings={securityData.findings} score={securityData.score} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resource Analysis</CardTitle>
                  <CardDescription>Resource utilization, distribution, and optimization recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                    </div>
                  ) : (
                    <ResourceAnalysisPanel
                      metrics={resourceData.metrics}
                      resourceDistribution={resourceData.resourceDistribution}
                      recommendations={resourceData.recommendations}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paths" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Access Path Analysis</CardTitle>
                  <CardDescription>Identified risky access paths in your cloud environment</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                    </div>
                  ) : (
                    <PathAnalysisPanel paths={pathData.paths} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report Generation</CardTitle>
                  <CardDescription>Generate and schedule security reports</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                    </div>
                  ) : (
                    <ReportPanel {...reportData} />
                  )}
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
  
          <TabsContent value="aws" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AWS Cloud Management</CardTitle>
                <CardDescription>
                  Comprehensive management of AWS cloud resources, deployments, and services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                  </div>
                ) : (
                  <AwsDashboard />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aws" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AWS Cloud Management</CardTitle>
                <CardDescription>
                  Comprehensive management of AWS cloud resources, deployments, and services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                  </div>
                ) : (
                  <AwsDashboard />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
