import { NextResponse } from "next/server"

// This would connect to your backend metrics service in production
export async function GET() {
  const mockMetrics = {
    totalResources: 25,
    riskScore: 68,
    anomaliesDetected: 5,
    criticalAlerts: 2
  }

  return NextResponse.json(mockMetrics)
} 