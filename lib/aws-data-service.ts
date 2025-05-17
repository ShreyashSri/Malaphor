import { AwsDeployment, AwsHealthCheck, AwsService } from "./api";

// Mock AWS resources with realistic names
const awsServiceNames = [
  'malaphor-api',
  'malaphor-auth',
  'malaphor-worker',
  'malaphor-scheduler',
  'malaphor-notification',
  'data-processing-service',
  'user-analytics-service',
  'payment-processing-service',
];

const awsEnvironments = [
  'production',
  'staging',
  'development',
  'qa',
  'demo',
];

// AWS regions with realistic weights (more likely to use common regions)
const awsRegions = [
  { name: 'us-east-1', weight: 30 },
  { name: 'us-east-2', weight: 15 },
  { name: 'us-west-1', weight: 10 },
  { name: 'us-west-2', weight: 20 },
  { name: 'eu-west-1', weight: 15 },
  { name: 'eu-central-1', weight: 15 },
  { name: 'ap-northeast-1', weight: 10 },
  { name: 'ap-southeast-1', weight: 10 },
];

// Common instance types
const instanceTypes = [
  't3.micro',
  't3.small',
  't3.medium',
  'm5.large',
  'c5.large',
  'r5.large',
];

// Service types
const serviceTypes = [
  { type: 'Lambda', weight: 30 },
  { type: 'ECS', weight: 25 },
  { type: 'EC2', weight: 20 },
  { type: 'EKS', weight: 15 },
  { type: 'Fargate', weight: 10 },
];

// Task definitions for container services
const taskDefinitions = [
  'api-service:32',
  'auth-service:18',
  'worker-service:12',
  'notification-service:9',
  'analytics-service:7',
];

// Cluster names
const clusterNames = [
  'production-cluster',
  'staging-cluster',
  'development-cluster',
  'shared-services-cluster',
];

// Health status with weights
const healthStatuses = [
  { status: 'healthy', weight: 70 },
  { status: 'degraded', weight: 20 },
  { status: 'unhealthy', weight: 10 },
];

// Deployment status with weights
const deploymentStatuses = [
  { status: 'success', weight: 75 },
  { status: 'failure', weight: 15 },
  { status: 'in-progress', weight: 10 },
];

// Common resources for health checks
const resourceTypes = [
  'ALB',
  'ECS Service',
  'Lambda function',
  'EC2 Instance',
  'RDS Database',
  'ElastiCache',
  'DynamoDB Table',
];

// Common CloudWatch metrics
const cloudWatchMetrics = [
  'CPUUtilization',
  'MemoryUtilization',
  'NetworkIn',
  'NetworkOut',
  'DiskReadOps',
  'DiskWriteOps',
  'ResponseTime',
  'ErrorRate',
  'RequestCount',
  '5XXError',
  '4XXError',
];

// Common IAM roles
const iamRoles = [
  'ServiceRole',
  'ExecutionRole',
  'TaskRole',
  'AutoScalingRole',
  'LambdaExecutionRole',
];

// Generate random string with specified length
function randomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate random ID
function generateId(): string {
  return `aws-${randomString(8)}-${Date.now().toString().slice(-4)}`;
}

// Generate random version number
function generateVersion(): string {
  const major = Math.floor(Math.random() * 5) + 1;
  const minor = Math.floor(Math.random() * 10);
  const patch = Math.floor(Math.random() * 20);
  return `${major}.${minor}.${patch}`;
}

// Generate random commit hash
function generateCommitHash(): string {
  return randomString(7);
}

// Generate random timestamp within past 30 days
function generateTimestamp(maxDaysAgo = 30): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * maxDaysAgo);
  const hoursAgo = Math.floor(Math.random() * 24);
  const minutesAgo = Math.floor(Math.random() * 60);
  
  now.setDate(now.getDate() - daysAgo);
  now.setHours(now.getHours() - hoursAgo);
  now.setMinutes(now.getMinutes() - minutesAgo);
  
  return now;
}

// Get random item with weighted probability
function getWeightedRandomItem<T extends { weight: number }>(items: T[]): Omit<T, 'weight'> {
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      // Create a new object without the weight property
      const { weight, ...result } = item;
      return result as Omit<T, 'weight'>;
    }
  }
  
  // Fallback to first item if something goes wrong
  const { weight, ...result } = items[0];
  return result as Omit<T, 'weight'>;
}

// Get random item from array
function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Generate random number within range
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Simulate real-world metrics with fluctuations
function simulateMetric(baseValue: number, volatilityPercent = 10): number {
  const volatility = baseValue * (volatilityPercent / 100);
  const change = (Math.random() * volatility * 2) - volatility;
  return Math.max(0, baseValue + change);
}

// Generate a random deployment
export function generateDeployment(
  customService?: string,
  customStatus?: string,
  customEnv?: string
): AwsDeployment {
  const service = customService || getRandomItem(awsServiceNames);
  const version = generateVersion();
  const status = customStatus || getWeightedRandomItem(deploymentStatuses).status;
  const environment = customEnv || getRandomItem(awsEnvironments);
  const timestamp = generateTimestamp(7).toISOString(); // Past week
  const commit = generateCommitHash();
  
  // Random users
  const users = [
    'John Doe',
    'Jane Smith',
    'Mike Johnson',
    'Sarah Williams',
    'Alex Chen',
    'Maria Garcia',
    'DevOps Team',
    'CI/CD Pipeline',
  ];
  
  return {
    id: generateId(),
    service,
    version,
    status,
    environment,
    timestamp,
    commit,
    commitUrl: `https://github.com/malaphor/${service}/commit/${commit}`,
    triggeredBy: getRandomItem(users),
    region: getWeightedRandomItem(awsRegions).name,
    duration: status === 'in-progress' ? null : getRandomNumber(30, 600),
    artifacts: {
      imageTag: `${service}:${version}`,
      buildId: `build-${randomString(6)}`,
    },
  };
}

// Generate a batch of deployments
export function generateDeployments(count = 10): AwsDeployment[] {
  const deployments: AwsDeployment[] = [];
  
  // Make sure each service has at least one deployment
  for (let i = 0; i < Math.min(count, awsServiceNames.length); i++) {
    deployments.push(generateDeployment(awsServiceNames[i]));
  }
  
  // Fill the rest with random deployments
  for (let i = deployments.length; i < count; i++) {
    deployments.push(generateDeployment());
  }
  
  // Sort by timestamp (most recent first)
  deployments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return deployments;
}

// Generate a health check
export function generateHealthCheck(customService?: string): AwsHealthCheck {
  const service = customService || getRandomItem(awsServiceNames);
  const status = getWeightedRandomItem(healthStatuses).status;
  const resourceType = getRandomItem(resourceTypes);
  
  // If unhealthy or degraded, create appropriate issue messages
  let message = 'All systems operational';
  if (status === 'degraded') {
    const issues = [
      'High latency detected',
      'Increased error rate',
      'Throttling occurring',
      'Resource utilization above threshold',
    ];
    message = getRandomItem(issues);
  } else if (status === 'unhealthy') {
    const issues = [
      'Service unreachable',
      'Connection timeout',
      'Database connection errors',
      'Critical error rate',
      'Out of memory',
    ];
    message = getRandomItem(issues);
  }
  
  return {
    id: generateId(),
    service,
    resource: `${service}-${resourceType.toLowerCase().replace(' ', '-')}`,
    resourceType,
    status,
    message,
    timestamp: new Date().toISOString(),
    region: getWeightedRandomItem(awsRegions).name,
    lastChecked: new Date().toISOString(),
    metrics: {
      responseTime: simulateMetric(status === 'healthy' ? 150 : status === 'degraded' ? 500 : 2000),
      successRate: simulateMetric(status === 'healthy' ? 99.9 : status === 'degraded' ? 95 : 80),
    },
  };
}

// Generate a batch of health checks
export function generateHealthChecks(count = 15): AwsHealthCheck[] {
  const healthChecks: AwsHealthCheck[] = [];
  
  // Make sure each service has at least one health check
  for (let i = 0; i < Math.min(count, awsServiceNames.length); i++) {
    healthChecks.push(generateHealthCheck(awsServiceNames[i]));
  }
  
  // Fill the rest with random health checks
  for (let i = healthChecks.length; i < count; i++) {
    healthChecks.push(generateHealthCheck());
  }
  
  return healthChecks;
}

// Generate an AWS service
export function generateAwsService(customName?: string): AwsService {
  const name = customName || getRandomItem(awsServiceNames);
  const serviceType = getWeightedRandomItem(serviceTypes).type;
  
  const versions = [];
  const versionCount = getRandomNumber(3, 8);
  
  for (let i = 0; i < versionCount; i++) {
    const version = generateVersion();
    const deployedAt = generateTimestamp(30);
    
    versions.push({
      version,
      deployedAt: deployedAt.toISOString(),
      status: i === 0 ? 'active' : 'inactive',
      commits: Array(getRandomNumber(1, 5)).fill(0).map(() => ({
        hash: generateCommitHash(),
        message: `feat: ${getRandomItem([
          'Add new feature',
          'Fix bug in processing',
          'Update dependencies',
          'Improve performance',
          'Refactor code',
          'Add unit tests',
          'Update documentation',
        ])}`,
        author: getRandomItem([
          'John Doe',
          'Jane Smith',
          'Mike Johnson',
          'Sarah Williams',
          'Alex Chen',
        ]),
        timestamp: new Date(deployedAt.getTime() - getRandomNumber(1, 24) * 60 * 60 * 1000).toISOString(),
      })),
    });
  }
  
  // Sort versions by deployedAt (newest first)
  versions.sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
  
  return {
    id: generateId(),
    name,
    type: serviceType,
    region: getWeightedRandomItem(awsRegions).name,
    status: Math.random() > 0.2 ? 'running' : Math.random() > 0.5 ? 'stopped' : 'updating',
    createdAt: generateTimestamp(365).toISOString(), // Within past year
    lastUpdatedAt: generateTimestamp(30).toISOString(), // Within past month
    versions,
    resources: {
      instanceType: serviceType === 'EC2' ? getRandomItem(instanceTypes) : null,
      containerRepository: serviceType === 'ECS' || serviceType === 'EKS' ? `${name}-repo` : null,
      lambdaFunction: serviceType === 'Lambda' ? `${name}-function` : null,
    },
    metrics: {
      cpu: simulateMetric(45),
      memory: simulateMetric(60),
      requests: simulateMetric(1000),
      errors: simulateMetric(5),
    },
    deploymentStrategy: getRandomItem(['Blue/Green', 'Rolling', 'Canary', 'All at once']),
    autoScaling: {
      enabled: Math.random() > 0.3,
      minCapacity: getRandomNumber(1, 3),
      maxCapacity: getRandomNumber(5, 10),
      desiredCapacity: getRandomNumber(2, 5),
    },
    tags: {
      Environment: getRandomItem(awsEnvironments),
      Project: 'Malaphor',
      Team: getRandomItem(['Backend', 'Frontend', 'DevOps', 'Data', 'Platform']),
    },
  };
}

// Generate a batch of AWS services
export function generateAwsServices(count = 8): AwsService[] {
  const services: AwsService[] = [];
  
  // Make sure each named service is included
  for (let i = 0; i < Math.min(count, awsServiceNames.length); i++) {
    services.push(generateAwsService(awsServiceNames[i]));
  }
  
  // Fill the rest with random services
  for (let i = services.length; i < count; i++) {
    services.push(generateAwsService());
  }
  
  return services;
}

// Generate CloudWatch data for a specific metric
export function generateCloudWatchData(
  metricName: string, 
  dataPoints = 60, 
  timeRangeHours = 3,
  baseValue = 50,
  volatility = 20
): any {
  const now = new Date();
  const data = [];
  
  for (let i = 0; i < dataPoints; i++) {
    // Generate timestamp going back in time
    const timestamp = new Date(now.getTime() - ((timeRangeHours * 3600000 * i) / dataPoints));
    
    // Generate value with realistic fluctuations
    const value = simulateMetric(baseValue, volatility);
    
    data.push({
      timestamp: timestamp.toISOString(),
      value,
    });
  }
  
  return {
    metricName,
    namespace: 'AWS/Custom',
    datapoints: data,
    unit: metricName.toLowerCase().includes('utilization') ? 'Percent' : 
          metricName.toLowerCase().includes('count') ? 'Count' :
          metricName.toLowerCase().includes('time') ? 'Milliseconds' : 'None',
  };
}

// Simulate real-time data changes - returns updated data that fluctuates
export function updateDeploymentsData(existing: AwsDeployment[]): AwsDeployment[] {
  const updated = [...existing];
  
  // Simulate changes:
  // 1. Update in-progress deployments
  // 2. Sometimes add new deployments
  // 3. Sometimes fail or complete in-progress deployments
  
  // Update in-progress deployments
  updated.forEach((deployment, index) => {
    if (deployment.status === 'in-progress') {
      // 70% chance to complete, 30% chance to fail
      const newStatus = Math.random() > 0.3 ? 'success' : 'failure';
      updated[index] = {
        ...deployment,
        status: newStatus,
        duration: getRandomNumber(30, 600),
      };
    }
  });
  
  // 15% chance to add a new deployment
  if (Math.random() < 0.15) {
    const newDeployment = generateDeployment(undefined, 'in-progress');
    updated.unshift(newDeployment); // Add to beginning (most recent)
    
    // Keep list size reasonable
    if (updated.length > 20) {
      updated.pop(); // Remove oldest deployment
    }
  }
  
  return updated;
}

// Update health checks with realistic changes
export function updateHealthChecks(existing: AwsHealthCheck[]): AwsHealthCheck[] {
  const updated = [...existing];
  
  // Update random health checks - small chance of status changes
  updated.forEach((check, index) => {
    const now = new Date().toISOString();
    
    // Update last checked timestamp
    updated[index] = {
      ...check,
      lastChecked: now,
      metrics: {
        ...check.metrics,
        responseTime: simulateMetric(check.metrics.responseTime, 10),
        successRate: simulateMetric(check.metrics.successRate, 2),
      },
    };
    
    // Small chance to change status
    const statusChange = Math.random();
    if (statusChange < 0.05) {
      if (check.status === 'healthy') {
        // 5% chance for healthy to become degraded
        updated[index].status = 'degraded';
        updated[index].message = 'High latency detected';
        updated[index].timestamp = now;
      } else if (check.status === 'degraded') {
        // Degraded can improve or worsen
        if (statusChange < 0.025) {
          updated[index].status = 'unhealthy';
          updated[index].message = 'Service unreachable';
        } else {
          updated[index].status = 'healthy';
          updated[index].message = 'All systems operational';
        }
        updated[index].timestamp = now;
      } else if (check.status === 'unhealthy') {
        // 4% chance for unhealthy to become degraded
        if (statusChange < 0.04) {
          updated[index].status = 'degraded';
          updated[index].message = 'Increased error rate';
          updated[index].timestamp = now;
        }
      }
    }
  });
  
  return updated;
}

// Simulate CloudWatch metrics changes
export function updateCloudWatchMetrics(metrics: any[]): any[] {
  return metrics.map(metric => {
    // Shift data points forward in time
    const datapoints = [...metric.datapoints];
    
    // Remove oldest point
    datapoints.shift();
    
    // Add new point
    const lastPoint = datapoints[datapoints.length - 1];
    const newValue = simulateMetric(lastPoint.value, 10);
    const now = new Date();
    
    datapoints.push({
      timestamp: now.toISOString(),
      value: newValue,
    });
    
    return {
      ...metric,
      datapoints,
    };
  });
}

// Class to handle simulated AWS data with real-time updates
export class AwsDataSimulator {
  private deployments: AwsDeployment[] = [];
  private healthChecks: AwsHealthCheck[] = [];
  private services: AwsService[] = [];
  private metrics: any[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Map<string, Function[]> = new Map();
  
  constructor() {
    // Initialize with random data
    this.deployments = generateDeployments(12);
    this.healthChecks = generateHealthChecks(15);
    this.services = generateAwsServices(8);
    
    // Generate some common CloudWatch metrics
    this.metrics = [
      generateCloudWatchData('CPUUtilization', 60, 3, 45, 20),
      generateCloudWatchData('MemoryUtilization', 60, 3, 60, 15),
      generateCloudWatchData('RequestCount', 60, 3, 1000, 30),
      generateCloudWatchData('ErrorRate', 60, 3, 2, 50),
      generateCloudWatchData('ResponseTime', 60, 3, 150, 25),
    ];
  }
  
  // Start simulated real-time updates
  public startRealtimeUpdates(intervalMs: number = 10000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      // Update data
      this.deployments = updateDeploymentsData(this.deployments);
      this.healthChecks = updateHealthChecks(this.healthChecks);
      this.metrics = updateCloudWatchMetrics(this.metrics);
      
      // Notify subscribers
      this.notifySubscribers('deployments', this.deployments);
      this.notifySubscribers('healthChecks', this.healthChecks);
      this.notifySubscribers('metrics', this.metrics);
    }, intervalMs);
  }
  
  // Stop simulated updates
  public stopRealtimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  // Get deployments with optional filtering
  public getDeployments(options: { 
    service?: string, 
    status?: string,
    environment?: string,
    limit?: number
  } = {}): AwsDeployment[] {
    let result = [...this.deployments];
    
    if (options.service) {
      result = result.filter(d => d.service === options.service);
    }
    
    if (options.status) {
      result = result.filter(d => d.status === options.status);
    }
    
    if (options.environment) {
      result = result.filter(d => d.environment === options.environment);
    }
    
    if (options.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
  
  // Get health checks with optional filtering
  public getHealthChecks(options: {
    service?: string,
    status?: string,
    limit?: number
  } = {}): AwsHealthCheck[] {
    let result = [...this.healthChecks];
    
    if (options.service) {
      result = result.filter(h => h.service === options.service);
    }
    
    if (options.status) {
      result = result.filter(h => h.status === options.status);
    }
    
    if (options.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
  
  // Get services with optional filtering
  public getServices(options: {
    type?: string,
    status?: string,
    limit?: number
  } = {}): AwsService[] {
    let result = [...this.services];
    
    if (options.type) {
      result = result.filter(s => s.type === options.type);
    }
    
    if (options.status) {
      result = result.filter(s => s.status === options.status);
    }
    
    if (options.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
  
  // Get metrics
  public getMetrics(): any[] {
    return [...this.metrics];
  }
  
  // Create a new deployment and add it to the list
  public createDeployment(
    service: string,
    environment: string,
    version?: string
  ): AwsDeployment {
    const newDeployment = generateDeployment(service, 'in-progress', environment);
    
    if (version) {
      newDeployment.version = version;
    }
    
    this.deployments.unshift(newDeployment);
    
    // Notify subscribers
    this.notifySubscribers('deployments', this.deployments);
    
    return newDeployment;
  }
  
  // Subscribe to data updates
  public subscribe(dataType: string, callback: Function): () => void {
    if (!this.subscribers.has(dataType)) {
      this.subscribers.set(dataType, []);
    }
    
    this.subscribers.get(dataType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(dataType) || [];
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  // Notify subscribers of data updates
  private notifySubscribers(dataType: string, data: any): void {
    const callbacks = this.subscribers.get(dataType) || [];
    callbacks.forEach(callback => callback(data));
  }
  
  // Trigger a simulated issue for demo purposes
  public triggerSimulatedIssue(service: string): void {
    // 1. Create failing health checks
    const healthCheck = this.healthChecks.find(h => h.service === service);
    if (healthCheck) {
      const index = this.healthChecks.indexOf(healthCheck);
      this.healthChecks[index] = {
        ...healthCheck,
        status: 'unhealthy',
        message: 'Critical error detected',
        timestamp: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        metrics: {
          ...healthCheck.metrics,
          responseTime: 3500,
          successRate: 65,
        },
      };
    }
    
    // 2. Create a failed deployment
    const newDeployment = generateDeployment(service, 'failure');
    this.deployments.unshift(newDeployment);
    
    // 3. Update metrics to show problems
    this.metrics = this.metrics.map(metric => {
      if (metric.metricName === 'ErrorRate') {
        return {
          ...metric,
          datapoints: metric.datapoints.map((dp: any, i: number) => {
            // Make the most recent points show high error rates
            if (i > metric.datapoints.length - 10) {
              return {
                ...dp,
                value: dp.value * 10,
              };
            }
            return dp;
          }),
        };
      }
      
      if (metric.metricName === 'ResponseTime') {
        return {
          ...metric,
          datapoints: metric.datapoints.map((dp: any, i: number) => {
            // Make the most recent points show high response times
            if (i > metric.datapoints.length - 10) {
              return {
                ...dp,
                value: dp.value * 5,
              };
            }
            return dp;
          }),
        };
      }
      
      return metric;
    });
    
    // Notify subscribers
    this.notifySubscribers('deployments', this.deployments);
    this.notifySubscribers('healthChecks', this.healthChecks);
    this.notifySubscribers('metrics', this.metrics);
  }
  
  // Trigger a simulated recovery for demo purposes
  public triggerSimulatedRecovery(service: string): void {
    // 1. Update health checks to healthy
    const healthCheck = this.healthChecks.find(h => h.service === service);
    if (healthCheck) {
      const index = this.healthChecks.indexOf(healthCheck);
      this.healthChecks[index] = {
        ...healthCheck,
        status: 'healthy',
        message: 'All systems operational',
        timestamp: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        metrics: {
          ...healthCheck.metrics,
          responseTime: 120,
          successRate: 99.9,
        },
      };
    }
    
    // 2. Create a successful deployment
    const newDeployment = generateDeployment(service, 'success');
    this.deployments.unshift(newDeployment);
    
    // 3. Update metrics to show recovery
    this.metrics = this.metrics.map(metric => {
      if (metric.metricName === 'ErrorRate') {
        return {
          ...metric,
          datapoints: metric.datapoints.map((dp: any, i: number) => {
            // Make the most recent points show low error rates
            if (i > metric.datapoints.length - 10) {
              return {
                ...dp,
                value: 1.2,
              };
            }
            return dp;
          }),
        };
      }
      
      if (metric.metricName === 'ResponseTime') {
        return {
          ...metric,
          datapoints: metric.datapoints.map((dp: any, i: number) => {
            // Make the most recent points show good response times
            if (i > metric.datapoints.length - 10) {
              return {
                ...dp,
                value: 120,
              };
            }
            return dp;
          }),
        };
      }
      
      return metric;
    });
    
    // Notify subscribers
    this.notifySubscribers('deployments', this.deployments);
    this.notifySubscribers('healthChecks', this.healthChecks);
    this.notifySubscribers('metrics', this.metrics);
  }
}

// Create and export a singleton instance
export const awsDataSimulator = new AwsDataSimulator(); 