import { generateTimestamp } from '../../utils';

export interface ServiceMetric {
  id: string;
  serviceName: string;
  metricName: string;
  value: number;
  unit: string;
  timestamp: string;
  trend: "increasing" | "decreasing" | "stable";
  percentChange?: number;
}

export interface ServiceUsage {
  id: string;
  serviceName: string;
  resourceType: string;
  usageAmount: number;
  usageUnit: string;
  costEstimate: number;
  billingPeriod: string;
}

export interface ServicePerformance {
  serviceName: string;
  responseTime: {
    p50: number;
    p90: number;
    p99: number;
  };
  errorRate: number;
  successRate: number;
  throughput: number;
  timestamp: string;
  region: string;
}

export interface ServiceHealth {
  serviceName: string;
  status: "healthy" | "degraded" | "unhealthy";
  lastChecked: string;
  issues: {
    id: string;
    description: string;
    severity: "critical" | "high" | "medium" | "low";
    timestamp: string;
  }[];
}

// Service metrics for analytics
export const serviceMetrics: ServiceMetric[] = [
  {
    id: "sm-1",
    serviceName: "malaphor-api",
    metricName: "requestCount",
    value: 45267,
    unit: "count",
    timestamp: generateTimestamp(0, 1),
    trend: "increasing",
    percentChange: 12.5
  },
  {
    id: "sm-2",
    serviceName: "malaphor-api",
    metricName: "averageLatency",
    value: 187,
    unit: "ms",
    timestamp: generateTimestamp(0, 1),
    trend: "decreasing",
    percentChange: -5.2
  },
  {
    id: "sm-3",
    serviceName: "malaphor-dashboard",
    metricName: "pageViews",
    value: 12843,
    unit: "count",
    timestamp: generateTimestamp(0, 1),
    trend: "increasing",
    percentChange: 8.7
  },
  {
    id: "sm-4",
    serviceName: "malaphor-dashboard",
    metricName: "loadTime",
    value: 1.42,
    unit: "seconds",
    timestamp: generateTimestamp(0, 1),
    trend: "stable",
    percentChange: 0.3
  },
  {
    id: "sm-5",
    serviceName: "malaphor-worker",
    metricName: "processingTime",
    value: 320,
    unit: "ms",
    timestamp: generateTimestamp(0, 1),
    trend: "decreasing",
    percentChange: -15.6
  },
  {
    id: "sm-6",
    serviceName: "malaphor-worker",
    metricName: "queueDepth",
    value: 156,
    unit: "count",
    timestamp: generateTimestamp(0, 1),
    trend: "increasing",
    percentChange: 22.4
  },
  {
    id: "sm-7",
    serviceName: "malaphor-auth",
    metricName: "loginAttempts",
    value: 8954,
    unit: "count",
    timestamp: generateTimestamp(0, 1),
    trend: "increasing",
    percentChange: 5.1
  },
  {
    id: "sm-8",
    serviceName: "malaphor-auth",
    metricName: "failedLogins",
    value: 247,
    unit: "count",
    timestamp: generateTimestamp(0, 1),
    trend: "increasing",
    percentChange: 18.2
  }
];

// Service usage data
export const serviceUsage: ServiceUsage[] = [
  {
    id: "su-1",
    serviceName: "malaphor-api",
    resourceType: "Lambda",
    usageAmount: 2560000,
    usageUnit: "invocations",
    costEstimate: 425.30,
    billingPeriod: "MTD"
  },
  {
    id: "su-2",
    serviceName: "malaphor-dashboard",
    resourceType: "CloudFront",
    usageAmount: 512,
    usageUnit: "GB",
    costEstimate: 55.80,
    billingPeriod: "MTD"
  },
  {
    id: "su-3",
    serviceName: "malaphor-worker",
    resourceType: "EC2",
    usageAmount: 1460,
    usageUnit: "instance-hours",
    costEstimate: 186.45,
    billingPeriod: "MTD"
  },
  {
    id: "su-4",
    serviceName: "malaphor-api",
    resourceType: "DynamoDB",
    usageAmount: 24.5,
    usageUnit: "GB",
    costEstimate: 36.75,
    billingPeriod: "MTD"
  },
  {
    id: "su-5",
    serviceName: "malaphor-all",
    resourceType: "S3",
    usageAmount: 128,
    usageUnit: "GB",
    costEstimate: 3.20,
    billingPeriod: "MTD"
  }
];

// Service performance data
export const servicePerformance: ServicePerformance[] = [
  {
    serviceName: "malaphor-api",
    responseTime: {
      p50: 120,
      p90: 250,
      p99: 480
    },
    errorRate: 0.8,
    successRate: 99.2,
    throughput: 450,
    timestamp: generateTimestamp(0, 0.5),
    region: "us-east-1"
  },
  {
    serviceName: "malaphor-dashboard",
    responseTime: {
      p50: 85,
      p90: 180,
      p99: 350
    },
    errorRate: 0.3,
    successRate: 99.7,
    throughput: 240,
    timestamp: generateTimestamp(0, 0.5),
    region: "us-east-1"
  },
  {
    serviceName: "malaphor-worker",
    responseTime: {
      p50: 320,
      p90: 580,
      p99: 980
    },
    errorRate: 1.2,
    successRate: 98.8,
    throughput: 180,
    timestamp: generateTimestamp(0, 0.5),
    region: "us-east-1"
  },
  {
    serviceName: "malaphor-auth",
    responseTime: {
      p50: 90,
      p90: 185,
      p99: 340
    },
    errorRate: 0.5,
    successRate: 99.5,
    throughput: 320,
    timestamp: generateTimestamp(0, 0.5),
    region: "us-east-1"
  },
  {
    serviceName: "malaphor-analytics",
    responseTime: {
      p50: 480,
      p90: 920,
      p99: 1450
    },
    errorRate: 2.1,
    successRate: 97.9,
    throughput: 70,
    timestamp: generateTimestamp(0, 0.5),
    region: "us-east-1"
  }
];

// Service health status
export const serviceHealth: ServiceHealth[] = [
  {
    serviceName: "malaphor-api",
    status: "degraded",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-1",
        description: "Elevated error rates in database connections",
        severity: "high",
        timestamp: generateTimestamp(0, 1.5)
      }
    ]
  },
  {
    serviceName: "malaphor-dashboard",
    status: "healthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: []
  },
  {
    serviceName: "malaphor-worker",
    status: "degraded",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-2",
        description: "Increasing queue depth, processing lag",
        severity: "medium",
        timestamp: generateTimestamp(0, 2.5)
      }
    ]
  },
  {
    serviceName: "malaphor-auth",
    status: "unhealthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-3",
        description: "Authentication failures for 3rd party OAuth provider",
        severity: "critical",
        timestamp: generateTimestamp(0, 0.8)
      },
      {
        id: "issue-4",
        description: "Increased login failures from specific IP ranges",
        severity: "high",
        timestamp: generateTimestamp(0, 1.2)
      }
    ]
  },
  {
    serviceName: "malaphor-analytics",
    status: "healthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: []
  },
  {
    serviceName: "malaphor-reporting",
    status: "healthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: []
  },
  {
    serviceName: "malaphor-cache",
    status: "unhealthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-5",
        description: "Cache eviction rate exceeding threshold",
        severity: "critical",
        timestamp: generateTimestamp(0, 0.3)
      }
    ]
  },
  {
    serviceName: "malaphor-search",
    status: "degraded",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-6",
        description: "High latency on search queries",
        severity: "medium",
        timestamp: generateTimestamp(0, 0.5)
      }
    ]
  },
  {
    serviceName: "malaphor-payments",
    status: "unhealthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-7",
        description: "Payment gateway connection interrupted",
        severity: "critical",
        timestamp: generateTimestamp(0, 0.2)
      }
    ]
  },
  {
    serviceName: "malaphor-inventory",
    status: "degraded",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-8",
        description: "Synchronization lag with warehouse systems",
        severity: "medium",
        timestamp: generateTimestamp(0, 1.0)
      }
    ]
  },
  {
    serviceName: "malaphor-notifications",
    status: "degraded",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-9",
        description: "High delivery failure rate for push notifications",
        severity: "high",
        timestamp: generateTimestamp(0, 0.7)
      }
    ]
  },
  {
    serviceName: "malaphor-recommendations",
    status: "unhealthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-10",
        description: "ML model prediction errors exceeding threshold",
        severity: "high",
        timestamp: generateTimestamp(0, 0.6)
      }
    ]
  },
  {
    serviceName: "malaphor-cdn",
    status: "healthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: []
  },
  {
    serviceName: "malaphor-media",
    status: "degraded",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-11",
        description: "Video transcoding service backlog",
        severity: "medium",
        timestamp: generateTimestamp(0, 1.3)
      }
    ]
  },
  {
    serviceName: "malaphor-fileupload",
    status: "degraded",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-12",
        description: "Slow upload speeds for large files",
        severity: "medium",
        timestamp: generateTimestamp(0, 0.9)
      }
    ]
  },
  {
    serviceName: "malaphor-billing",
    status: "unhealthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-13",
        description: "Invoice generation service unresponsive",
        severity: "critical",
        timestamp: generateTimestamp(0, 0.4)
      }
    ]
  },
  {
    serviceName: "malaphor-messaging",
    status: "degraded",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-14",
        description: "Message delivery delays exceeding SLA",
        severity: "high",
        timestamp: generateTimestamp(0, 1.1)
      }
    ]
  },
  {
    serviceName: "malaphor-userprofiles",
    status: "degraded",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-15",
        description: "Profile image rendering errors",
        severity: "low",
        timestamp: generateTimestamp(0, 1.4)
      }
    ]
  },
  {
    serviceName: "malaphor-contentdelivery",
    status: "degraded",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-16",
        description: "Content distribution delays in specific regions",
        severity: "medium",
        timestamp: generateTimestamp(0, 0.95)
      }
    ]
  },
  {
    serviceName: "malaphor-database",
    status: "unhealthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: [
      {
        id: "issue-17",
        description: "Database replication lag exceeding threshold",
        severity: "critical",
        timestamp: generateTimestamp(0, 0.25)
      }
    ]
  },
  {
    serviceName: "malaphor-feedback",
    status: "healthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: []
  },
  {
    serviceName: "malaphor-security",
    status: "healthy",
    lastChecked: generateTimestamp(0, 0.1),
    issues: []
  }
]; 