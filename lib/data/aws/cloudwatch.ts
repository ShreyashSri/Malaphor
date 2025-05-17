import { generateTimestamp } from '../../utils';

export interface CloudWatchMetric {
  id: string;
  metricName: string;
  namespace: string;
  dimensions?: {
    name: string;
    value: string;
  }[];
  statistic: "Average" | "Sum" | "Maximum" | "Minimum" | "SampleCount";
  period: number;
  datapoints: {
    timestamp: string;
    value: number;
    unit: string;
  }[];
}

export interface CloudWatchAlarm {
  id: string;
  service: string;
  resource: string;
  metric: string;
  threshold: string;
  value: string;
  status: "ALARM" | "OK" | "INSUFFICIENT_DATA";
  timestamp: string;
}

export interface CloudWatchLog {
  timestamp: string;
  service: string;
  level: "ERROR" | "WARN" | "INFO" | "DEBUG";
  message: string;
  logGroup: string;
  logStream: string;
}

export const cloudWatchMetrics: CloudWatchMetric[] = [
  {
    id: "metric-1",
    metricName: "CPUUtilization",
    namespace: "AWS/EC2",
    dimensions: [
      { name: "InstanceId", value: "i-1234567890abcdef0" }
    ],
    statistic: "Average",
    period: 300,
    datapoints: Array.from({ length: 24 }, (_, i) => ({
      timestamp: generateTimestamp(0, 23 - i),
      value: 25 + Math.random() * 30,
      unit: "Percent"
    }))
  },
  {
    id: "metric-2",
    metricName: "Invocations",
    namespace: "AWS/Lambda",
    dimensions: [
      { name: "FunctionName", value: "malaphor-api-processor" }
    ],
    statistic: "Sum",
    period: 300,
    datapoints: Array.from({ length: 24 }, (_, i) => ({
      timestamp: generateTimestamp(0, 23 - i),
      value: Math.floor(100 + Math.random() * 500),
      unit: "Count"
    }))
  },
  {
    id: "metric-3",
    metricName: "Errors",
    namespace: "AWS/Lambda",
    dimensions: [
      { name: "FunctionName", value: "malaphor-api-processor" }
    ],
    statistic: "Sum",
    period: 300,
    datapoints: Array.from({ length: 24 }, (_, i) => ({
      timestamp: generateTimestamp(0, 23 - i),
      value: Math.floor(Math.random() * 10),
      unit: "Count"
    }))
  },
  {
    id: "metric-4",
    metricName: "5XXError",
    namespace: "AWS/ApiGateway",
    dimensions: [
      { name: "ApiName", value: "malaphor-api" }
    ],
    statistic: "Sum",
    period: 300,
    datapoints: Array.from({ length: 24 }, (_, i) => ({
      timestamp: generateTimestamp(0, 23 - i),
      value: i === 10 ? 12 : Math.floor(Math.random() * 3),
      unit: "Count"
    }))
  },
  {
    id: "metric-5",
    metricName: "FreeStorageSpace",
    namespace: "AWS/RDS",
    dimensions: [
      { name: "DBInstanceIdentifier", value: "malaphor-db" }
    ],
    statistic: "Average",
    period: 300,
    datapoints: Array.from({ length: 24 }, (_, i) => ({
      timestamp: generateTimestamp(0, 23 - i),
      value: 8000 - (Math.random() * 100),
      unit: "Megabytes"
    }))
  },
  {
    id: "metric-6",
    metricName: "TargetResponseTime",
    namespace: "AWS/ApplicationELB",
    dimensions: [
      { name: "LoadBalancer", value: "app/malaphor-lb/1a2b3c4d5e6f" }
    ],
    statistic: "Average",
    period: 300,
    datapoints: Array.from({ length: 24 }, (_, i) => ({
      timestamp: generateTimestamp(0, 23 - i),
      value: 200 + (i === 5 ? 800 : Math.random() * 300),
      unit: "Milliseconds"
    }))
  }
];

export const cloudWatchAlarms: CloudWatchAlarm[] = [
  { 
    id: "alarm-1", 
    service: "malaphor-api", 
    resource: "Lambda Function", 
    metric: "Errors", 
    threshold: "> 5", 
    value: "8", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 0.5)
  },
  { 
    id: "alarm-2", 
    service: "malaphor-api", 
    resource: "API Gateway", 
    metric: "Latency", 
    threshold: "> 500ms", 
    value: "620ms", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 1)
  },
  { 
    id: "alarm-3", 
    service: "malaphor-dashboard", 
    resource: "CloudFront", 
    metric: "5xx Errors", 
    threshold: "> 0", 
    value: "3", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 2)
  },
  { 
    id: "alarm-4", 
    service: "malaphor-worker", 
    resource: "SQS Queue", 
    metric: "ApproximateAgeOfOldestMessage", 
    threshold: "> 10min", 
    value: "15min", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 3)
  },
  { 
    id: "alarm-5", 
    service: "malaphor-database", 
    resource: "RDS Instance", 
    metric: "CPUUtilization", 
    threshold: "> 80%", 
    value: "92%", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 0.2)
  },
  { 
    id: "alarm-6", 
    service: "malaphor-cache", 
    resource: "ElastiCache", 
    metric: "FreeableMemory", 
    threshold: "< 100MB", 
    value: "45MB", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 0.7)
  },
  { 
    id: "alarm-7", 
    service: "malaphor-auth", 
    resource: "Cognito", 
    metric: "FailedSignIn", 
    threshold: "> 10", 
    value: "24", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 0.4)
  },
  { 
    id: "alarm-8", 
    service: "malaphor-cdn", 
    resource: "CloudFront", 
    metric: "4xxErrors", 
    threshold: "> 5%", 
    value: "1.2%", 
    status: "OK", 
    timestamp: generateTimestamp(0, 1.2)
  },
  { 
    id: "alarm-9", 
    service: "malaphor-api", 
    resource: "API Gateway", 
    metric: "Count", 
    threshold: "< 10/min", 
    value: "145/min", 
    status: "OK", 
    timestamp: generateTimestamp(0, 5)
  },
  { 
    id: "alarm-10", 
    service: "malaphor-storage", 
    resource: "S3 Bucket", 
    metric: "4xxErrors", 
    threshold: "> 10", 
    value: "25", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 0.9)
  },
  { 
    id: "alarm-11", 
    service: "malaphor-notifications", 
    resource: "SNS Topic", 
    metric: "NumberOfNotificationsFailed", 
    threshold: "> 0", 
    value: "12", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 0.15)
  },
  { 
    id: "alarm-12", 
    service: "malaphor-payments", 
    resource: "Lambda Function", 
    metric: "Duration", 
    threshold: "> 5000ms", 
    value: "7850ms", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 0.25)
  },
  { 
    id: "alarm-13", 
    service: "malaphor-imageprocessor", 
    resource: "Lambda Function", 
    metric: "Throttles", 
    threshold: "> 0", 
    value: "8", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 0.35)
  },
  { 
    id: "alarm-14", 
    service: "malaphor-orders", 
    resource: "DynamoDB Table", 
    metric: "ThrottledRequests", 
    threshold: "> 0", 
    value: "45", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 0.45)
  },
  { 
    id: "alarm-15", 
    service: "malaphor-search", 
    resource: "Elasticsearch", 
    metric: "ClusterStatus", 
    threshold: "!= green", 
    value: "yellow", 
    status: "ALARM", 
    timestamp: generateTimestamp(0, 0.55)
  }
];

export const cloudWatchLogs: CloudWatchLog[] = [
  { 
    timestamp: generateTimestamp(0, 0.05), 
    service: "malaphor-api", 
    level: "ERROR", 
    message: "Failed to connect to database: Connection timed out",
    logGroup: "malaphor-api",
    logStream: "error"
  },
  {
    timestamp: generateTimestamp(0, 0.08),
    service: "malaphor-api",
    level: "WARN",
    message: "High memory usage detected: 85% of allocated memory",
    logGroup: "malaphor-api",
    logStream: "warning"
  },
  {
    timestamp: generateTimestamp(0, 0.1),
    service: "malaphor-dashboard",
    level: "ERROR",
    message: "API Gateway returned 503 Service Unavailable",
    logGroup: "malaphor-dashboard",
    logStream: "error"
  },
  {
    timestamp: generateTimestamp(0, 0.15),
    service: "malaphor-worker",
    level: "INFO",
    message: "Successfully processed 1250 items from queue",
    logGroup: "malaphor-worker",
    logStream: "info"
  },
  {
    timestamp: generateTimestamp(0, 0.2),
    service: "malaphor-worker",
    level: "WARN",
    message: "Queue depth increasing, consider scaling up worker count",
    logGroup: "malaphor-worker",
    logStream: "warning"
  },
  {
    timestamp: generateTimestamp(0, 0.25),
    service: "malaphor-analytics",
    level: "INFO",
    message: "Daily data processing completed successfully",
    logGroup: "malaphor-analytics",
    logStream: "info"
  },
  {
    timestamp: generateTimestamp(0, 0.3),
    service: "malaphor-auth",
    level: "WARN",
    message: "Multiple failed login attempts detected for user id: 51423",
    logGroup: "malaphor-auth",
    logStream: "warning"
  },
  {
    timestamp: generateTimestamp(0, 0.4),
    service: "malaphor-api",
    level: "ERROR",
    message: "External payment service integration failed with status code 502",
    logGroup: "malaphor-api",
    logStream: "error"
  },
  {
    timestamp: generateTimestamp(0, 0.01),
    service: "malaphor-database",
    level: "ERROR",
    message: "Database replication lag exceeding threshold: 120 seconds",
    logGroup: "malaphor-database",
    logStream: "error"
  },
  {
    timestamp: generateTimestamp(0, 0.02),
    service: "malaphor-api",
    level: "ERROR",
    message: "Lambda function timeout after 30 seconds: handler crashed during image processing",
    logGroup: "malaphor-api",
    logStream: "error"
  },
  {
    timestamp: generateTimestamp(0, 0.03),
    service: "malaphor-auth",
    level: "ERROR",
    message: "OAuth provider token validation failed: Invalid token signature",
    logGroup: "malaphor-auth",
    logStream: "error"
  },
  {
    timestamp: generateTimestamp(0, 0.12),
    service: "malaphor-cdn",
    level: "WARN",
    message: "Origin server response time increased by 250%",
    logGroup: "malaphor-cdn",
    logStream: "warning"
  },
  {
    timestamp: generateTimestamp(0, 0.22),
    service: "malaphor-api",
    level: "INFO",
    message: "Auto-scaling group adding 2 new instances due to increased traffic",
    logGroup: "malaphor-api",
    logStream: "info"
  },
  {
    timestamp: generateTimestamp(0, 0.27),
    service: "malaphor-cache",
    level: "WARN",
    message: "Cache hit ratio dropped below 75%, investigating potential cache invalidation issues",
    logGroup: "malaphor-cache",
    logStream: "warning"
  },
  {
    timestamp: generateTimestamp(0, 0.33),
    service: "malaphor-storage",
    level: "ERROR",
    message: "S3 bucket policy update failed: Insufficient permissions for service role",
    logGroup: "malaphor-storage",
    logStream: "error"
  },
  {
    timestamp: generateTimestamp(0, 0.35),
    service: "malaphor-security",
    level: "ERROR",
    message: "WAF rule triggered: Unusual request pattern detected from IP range 192.168.x.x",
    logGroup: "malaphor-security",
    logStream: "error"
  },
  {
    timestamp: generateTimestamp(0, 0.45),
    service: "malaphor-deployment",
    level: "INFO",
    message: "CodeDeploy successfully deployed version 2.8.5 to production environment",
    logGroup: "malaphor-deployment",
    logStream: "info"
  },
  {
    timestamp: generateTimestamp(0, 0.55),
    service: "malaphor-network",
    level: "WARN",
    message: "VPC flow logs indicating unusual traffic pattern to port 22",
    logGroup: "malaphor-network",
    logStream: "warning"
  },
  {
    timestamp: generateTimestamp(0, 0.65),
    service: "malaphor-database",
    level: "INFO",
    message: "RDS backup completed successfully: malaphor-prod-db-20240522",
    logGroup: "malaphor-database",
    logStream: "info"
  },
  {
    timestamp: generateTimestamp(0, 0.75),
    service: "malaphor-monitoring",
    level: "DEBUG",
    message: "CloudWatch alarm 'High CPU Utilization' entered ALARM state",
    logGroup: "malaphor-monitoring",
    logStream: "debug"
  }
]; 