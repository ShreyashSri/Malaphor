import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, ShieldAlert, CloudCog } from "lucide-react"

interface MetricsProps {
  metrics: {
    totalResources: number
    riskScore: number
    anomaliesDetected: number
    criticalAlerts: number
  }
}

export default function MetricsPanel({ metrics }: MetricsProps) {
  // Determine risk level color
  const getRiskColor = (score: number) => {
    if (score >= 75) return "text-red-500"
    if (score >= 50) return "text-orange-500"
    if (score >= 25) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-baseline">
            <span className={getRiskColor(metrics.riskScore)}>{metrics.riskScore}</span>
            <span className="text-sm text-muted-foreground ml-1">/100</span>
          </div>
          <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                metrics.riskScore >= 75
                  ? "bg-red-500"
                  : metrics.riskScore >= 50
                    ? "bg-orange-500"
                    : metrics.riskScore >= 25
                      ? "bg-yellow-500"
                      : "bg-green-500"
              }`}
              style={{ width: `${metrics.riskScore}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.riskScore >= 75
              ? "Critical"
              : metrics.riskScore >= 50
                ? "High"
                : metrics.riskScore >= 25
                  ? "Medium"
                  : "Low"}{" "}
            risk level
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
          <CloudCog className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalResources.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Monitored cloud assets across all regions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.anomaliesDetected}</div>
          <p className="text-xs text-muted-foreground">Unusual patterns detected in the last 24 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.criticalAlerts}</div>
          <p className="text-xs text-muted-foreground">High-severity security issues requiring attention</p>
        </CardContent>
      </Card>
    </>
  )
}
