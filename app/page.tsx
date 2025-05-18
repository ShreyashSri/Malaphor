"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Info, Shield, BarChart, FileText, Route, CloudCog, Security, MessageSquare } from "lucide-react"
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
import { Box, Typography, Grid } from '@mui/material';
import Link from 'next/link';
import { Security as SecurityIcon, Analytics as AnalyticsIcon, Chat as ChatIcon } from '@mui/icons-material';

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

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
          Welcome to Malaphor
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          AI-Powered Cloud Security Analysis
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link
              href="/security"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
            >
              Start Analysis
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="pt-6">
          <div className="flow-root bg-white dark:bg-gray-800 rounded-lg px-6 pb-8">
            <div className="-mt-6">
              <div>
                <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                  <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                Security Analysis
              </h3>
              <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                Upload your CloudTrail logs for comprehensive security analysis and threat detection.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <div className="flow-root bg-white dark:bg-gray-800 rounded-lg px-6 pb-8">
            <div className="-mt-6">
              <div>
                <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                  <BarChart className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                Detailed Insights
              </h3>
              <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                Get detailed insights into your cloud security posture with actionable recommendations.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <div className="flow-root bg-white dark:bg-gray-800 rounded-lg px-6 pb-8">
            <div className="-mt-6">
              <div>
                <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                AI Assistant
              </h3>
              <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                Chat with our AI assistant to understand your security findings and get help.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mt-24 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          How It Works
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              1. Upload Logs
            </h3>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
              Upload your AWS CloudTrail logs in JSON format
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              2. Analysis
            </h3>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
              Our AI analyzes your logs for security issues and patterns
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              3. Get Insights
            </h3>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
              Receive detailed findings and recommendations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
