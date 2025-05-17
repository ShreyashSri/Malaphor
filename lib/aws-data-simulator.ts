import { AwsDeployment, AwsHealthCheck, AwsService, CommitInfo } from './api';

// =====================================================
// MOCK DATA CONFIGURATION - CUSTOMIZABLE PARAMETERS
// =====================================================

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
  'recommendation-engine',
  'malaphor-frontend',
  'security-monitoring-service',
  'cache-manager-service',
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
  { name: 'ap-southeast-1', weight: 5 },
  { name: 'ap-southeast-2', weight: 5 },
];

// AWS resource types
const awsResourceTypes = [
  'Lambda',
  'EC2',
  'RDS',
  'DynamoDB',
  'S3',
  'ECS',
  'EKS',
  'CloudFront',
  'API Gateway',
  'ElastiCache',
  'SQS',
  'SNS',
  'CloudFormation',
  'Route53',
  'IAM',
];

// User names for commits and deployments with realistic roles
const userNames = [
  'John Doe (DevOps)',
  'Jane Smith (SRE)',
  'David Johnson (Developer)',
  'Sarah Williams (DevOps)',
  'Michael Brown (SRE)',
  'Emma Garcia (Developer)',
  'Alex Wilson (DevOps)',
  'Olivia Martinez (Developer)',
  'CI/CD Pipeline',
  'GitHub Actions',
  'AWS CodePipeline',
  'Jenkins',
];

// Repositories for services
const serviceRepositories = [
  'malaphor/api-service',
  'malaphor/auth-service',
  'malaphor/worker-service',
  'malaphor/scheduler-service',
  'malaphor/notification-service',
  'malaphor/data-processing',
  'malaphor/user-analytics',
  'malaphor/payment-service',
  'malaphor/recommendation-engine',
  'malaphor/frontend',
  'malaphor/security-monitoring',
  'malaphor/cache-manager',
];

// Simulated outage scenarios - more realistic cluster failures
const outageScenarios = [
  {
    name: 'Database Connectivity Issue',
    resources: ['RDS', 'DynamoDB'],
    affectedServices: ['malaphor-api', 'auth-service', 'payment-processing-service'],
    recoveryTime: { min: 5, max: 15 }, // minutes
    messages: [
      'Database connection timeout',
      'Connection pool exhausted',
      'Read replica lag exceeding threshold',
      'Database CPU utilization at 100%',
      'Storage I/O throttling detected',
    ]
  },
  {
    name: 'Network Connectivity Disruption',
    resources: ['EC2', 'Lambda', 'API Gateway'],
    affectedServices: ['malaphor-api', 'malaphor-worker', 'user-analytics-service'],
    recoveryTime: { min: 3, max: 10 },
    messages: [
      'Network packet loss detected',
      'DNS resolution failure',
      'VPC peering connection down',
      'Route table misconfiguration',
      'Security group rules blocking traffic',
    ]
  },
  {
    name: 'Container Orchestration Failure',
    resources: ['ECS', 'EKS'],
    affectedServices: ['malaphor-worker', 'data-processing-service', 'recommendation-engine'],
    recoveryTime: { min: 8, max: 20 },
    messages: [
      'Node failure in EKS cluster',
      'Container OOM errors',
      'Failed scheduling of new pods',
      'Service discovery issues',
      'Resource quota exceeded',
    ]
  },
  {
    name: 'CDN and Frontend Issues',
    resources: ['CloudFront', 'S3'],
    affectedServices: ['malaphor-frontend'],
    recoveryTime: { min: 2, max: 7 },
    messages: [
      'CloudFront distribution error',
      'Origin access identity failure',
      'Cache invalidation failure',
      'SSL certificate expiration',
      'Route53 health check failing',
    ]
  },
  {
    name: 'Serverless Execution Environment Issues',
    resources: ['Lambda', 'SQS', 'SNS'],
    affectedServices: ['malaphor-notification', 'malaphor-scheduler'],
    recoveryTime: { min: 4, max: 12 },
    messages: [
      'Lambda concurrency limit reached',
      'Lambda cold start latency spike',
      'SQS delay queue backlog',
      'Message processing timeout',
      'Event source mapping error',
    ]
  },
];

// =====================================================
// STATE MANAGEMENT - INTERNAL SIMULATOR STATE
// =====================================================

// Cached data
let cachedDeployments: AwsDeployment[] = [];
let cachedHealthChecks: AwsHealthCheck[] = [];
let cachedServices: AwsService[] = [];
let simulationInterval: NodeJS.Timeout | null = null;
let isSimulationRunning = false;

// Active issue tracking
let activeIssues: {
  scenarioName: string;
  affectedService: string;
  region: string;
  startTime: Date;
  expectedRecoveryTime: Date;
  autoRecovery: boolean;
}[] = [];

// Service dependency graph for realistic cascade failures
const serviceDependencies: Record<string, string[]> = {
  'malaphor-api': ['malaphor-auth', 'data-processing-service', 'cache-manager-service'],
  'malaphor-auth': ['cache-manager-service'],
  'malaphor-frontend': ['malaphor-api', 'user-analytics-service'],
  'payment-processing-service': ['malaphor-auth', 'malaphor-notification'],
  'user-analytics-service': ['data-processing-service', 'recommendation-engine'],
  'recommendation-engine': ['data-processing-service'],
  'malaphor-notification': ['malaphor-worker'],
  'security-monitoring-service': [],
};

// =====================================================
// HELPER FUNCTIONS - UTILITIES FOR DATA GENERATION
// =====================================================

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItemWithWeight<T>(items: { name: string; weight: number }[]): string {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.name;
    }
  }
  
  return items[0].name; // Fallback
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

function generateRandomVersion(): string {
  const major = getRandomInt(1, 5);
  const minor = getRandomInt(0, 9);
  const patch = getRandomInt(0, 20);
  
  // 20% chance of having a pre-release tag
  const preRelease = getRandomBool(0.2) 
    ? `-${getRandomItem(['alpha', 'beta', 'rc'])}.${getRandomInt(1, 5)}` 
    : '';
  
  return `${major}.${minor}.${patch}${preRelease}`;
}

function generateRandomCommitHash(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomTimestamp(daysBack = 30): string {
  const now = new Date();
  const randomTimestamp = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return randomTimestamp.toISOString();
}

function generateRandomMessage(service: string): string {
  const messages = [
    `Added new feature to ${service}`,
    `Fixed critical bug in ${service}`,
    `Performance improvements for ${service}`,
    `Updated dependencies for ${service}`,
    `Security patch for ${service}`,
    `Refactored ${service} code`,
    `Added unit tests for ${service}`,
    `Documentation updates for ${service}`,
    `Configuration changes for ${service}`,
    `Integration with new service for ${service}`,
    `Deploy feature flag system for ${service}`,
    `Release ${service} version ${generateRandomVersion()}`,
    `Fixed memory leak in ${service}`,
    `Optimized database queries for ${service}`,
    `Added monitoring and logging to ${service}`,
    `Implemented circuit breaker in ${service}`,
    `Updated API documentation for ${service}`,
    `Added health check endpoint to ${service}`,
    `Containerized ${service} for Kubernetes deployment`,
    `Migrated ${service} to serverless architecture`,
  ];
  
  return getRandomItem(messages);
}

// Get repository for a service
function getRepositoryForService(service: string): string {
  const normalizedService = service.toLowerCase().replace(/-/g, '');
  const repo = serviceRepositories.find(r => r.toLowerCase().includes(normalizedService));
  return repo || `malaphor/${service}`;
}

// =====================================================
// DATA GENERATORS - CREATE MOCK AWS DATA
// =====================================================

function generateAwsDeployment(count = 1): AwsDeployment[] {
  const deployments: AwsDeployment[] = [];
  
  for (let i = 0; i < count; i++) {
    const service = getRandomItem(awsServiceNames);
    const version = generateRandomVersion();
    const commit = generateRandomCommitHash();
    const timestampStr = generateRandomTimestamp();
    const timestamp = new Date(timestampStr);
    const status: 'success' | 'failure' | 'in-progress' = 
      getRandomBool(0.7) ? 'success' : (getRandomBool(0.6) ? 'failure' : 'in-progress');
    const environment = getRandomBool(0.9) ? getRandomItem(awsEnvironments) : undefined;
    const region = getRandomItemWithWeight(awsRegions);
    const triggeredBy = getRandomItem(userNames);
    
    // Duration based on status
    const duration = status === 'in-progress' 
      ? null 
      : getRandomInt(30, 600); // Between 30s and 10m
    
    deployments.push({
      id: `deploy-${Date.now()}-${i}`,
      service,
      version,
      status,
      environment,
      timestamp: timestampStr,
      commit,
      commitUrl: `https://github.com/${getRepositoryForService(service)}/commit/${commit}`,
      triggeredBy,
      region,
      duration,
      artifacts: {
        imageTag: `${service}:${version}`,
        buildId: `build-${Date.now().toString(36)}-${i}`
      }
    });
  }
  
  return deployments;
}

function generateAwsHealthCheck(count = 92): AwsHealthCheck[] {
  const healthChecks: AwsHealthCheck[] = [];
  
  // Create exactly 16 healthy resources
  for (let i = 0; i < 16; i++) {
    const service = getRandomItem(awsServiceNames);
    const resourceType = getRandomItem(awsResourceTypes);
    const resource = `${service}-${resourceType.toLowerCase().replace(' ', '-')}-${getRandomInt(1, 5)}`;
    const region = getRandomItemWithWeight(awsRegions);
    
    healthChecks.push({
      id: `health-${Date.now()}-${i}`,
      service,
      resource,
      resourceType,
      status: 'healthy',
      message: 'Service operating normally',
      timestamp: new Date().toISOString(),
      region,
      lastChecked: new Date().toISOString(),
      metrics: {
        responseTime: getRandomInt(10, 200),
        successRate: getRandomInt(98, 100)
      }
    });
  }
  
  // Create exactly 36 degraded resources
  for (let i = 0; i < 36; i++) {
    const service = getRandomItem(awsServiceNames);
    const resourceType = getRandomItem(awsResourceTypes);
    const resource = `${service}-${resourceType.toLowerCase().replace(' ', '-')}-${getRandomInt(1, 5)}`;
    const region = getRandomItemWithWeight(awsRegions);
    
    healthChecks.push({
      id: `health-${Date.now()}-${i + 16}`,
      service,
      resource,
      resourceType,
      status: 'degraded',
      message: getRandomItem([
        'High latency detected',
        'Elevated error rate',
        'Resource utilization above threshold',
        'Reduced throughput detected',
      ]),
      timestamp: new Date().toISOString(),
      region,
      lastChecked: new Date().toISOString(),
      metrics: {
        responseTime: getRandomInt(300, 800),
        successRate: getRandomInt(85, 97)
      }
    });
  }
  
  // Create exactly 40 unhealthy resources
  for (let i = 0; i < 40; i++) {
    const service = getRandomItem(awsServiceNames);
    const resourceType = getRandomItem(awsResourceTypes);
    const resource = `${service}-${resourceType.toLowerCase().replace(' ', '-')}-${getRandomInt(1, 5)}`;
    const region = getRandomItemWithWeight(awsRegions);
    
    healthChecks.push({
      id: `health-${Date.now()}-${i + 52}`,
      service,
      resource,
      resourceType,
      status: 'unhealthy',
      message: getRandomItem([
        'Service unavailable',
        'Connection timeouts',
        'Database connection failures',
        'Critical error rate',
        'Resource exhaustion',
      ]),
      timestamp: new Date().toISOString(),
      region,
      lastChecked: new Date().toISOString(),
      metrics: {
        responseTime: getRandomInt(900, 5000),
        successRate: getRandomInt(0, 84)
      }
    });
  }
  
  return healthChecks;
}

function generateCommitInfo(service: string, count = 1): CommitInfo[] {
  const commits: CommitInfo[] = [];
  
  for (let i = 0; i < count; i++) {
    commits.push({
      hash: generateRandomCommitHash(),
      message: generateRandomMessage(service),
      author: getRandomItem(userNames),
      timestamp: generateRandomTimestamp(14), // Last 14 days
    });
  }
  
  return commits;
}

function generateAwsServices(): AwsService[] {
  const services: AwsService[] = [];
  
  for (const serviceName of awsServiceNames) {
    const region = getRandomItemWithWeight(awsRegions);
    const environment = getRandomItem(awsEnvironments);
    const type = getRandomBool(0.7) ? 'Containerized' : 'Serverless';
    const status = getRandomBool(0.9) ? 'active' : 'inactive';
    const repository = getRepositoryForService(serviceName);
    
    // Generate commit history
    const commits = generateCommitInfo(serviceName, getRandomInt(3, 8));
    
    // Generate service metrics
    const metrics = {
      cpu: getRandomInt(5, 80),
      memory: getRandomInt(10, 90),
      network: getRandomInt(100, 5000),
      cost: getRandomInt(50, 500) + getRandomInt(0, 99) / 100
    };
    
    // Generate resource distribution
    const resources = [];
    const resourceTypes = [...awsResourceTypes];
    const resourceCount = getRandomInt(2, 5);
    
    for (let i = 0; i < resourceCount; i++) {
      if (resourceTypes.length === 0) break;
      
      const typeIndex = getRandomInt(0, resourceTypes.length - 1);
      const type = resourceTypes.splice(typeIndex, 1)[0];
      
      resources.push({
        type,
        count: getRandomInt(1, 10)
      });
    }
    
    // Calculate version history
    const versionCount = getRandomInt(3, 8);
    const versions = [];
    
    for (let i = 0; i < versionCount; i++) {
      versions.push(generateRandomVersion());
    }
    
    // Add dependencies
    const dependencies = serviceDependencies[serviceName] || [];
    
    services.push({
      id: `service-${serviceName}-${region}`,
      name: serviceName,
      region,
      environment,
      type,
      status,
      createdAt: generateRandomTimestamp(180), // Last 6 months
      lastDeployment: generateRandomTimestamp(7), // Last week
      lastUpdatedAt: generateRandomTimestamp(2), // Last 2 days
      repository,
      commits,
      versions,
      resources,
      metrics,
      dependencies,
      tags: {
        team: getRandomItem(['platform', 'frontend', 'backend', 'data', 'security']),
        costCenter: getRandomItem(['eng-1001', 'eng-1002', 'eng-1003']),
        priority: getRandomItem(['high', 'medium', 'low'])
      }
    });
  }
  
  return services;
}

// =====================================================
// PUBLIC FUNCTIONS - API FOR SIMULATION CONTROL
// =====================================================

export function initializeAwsData() {
  if (cachedDeployments.length === 0) {
    // Initial data loading
    cachedDeployments = generateAwsDeployment(15);
    cachedHealthChecks = generateAwsHealthCheck();
    cachedServices = generateAwsServices();
    
    // Sort deployments by timestamp (newest first)
    cachedDeployments.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

// Fetch data functions
export function fetchAwsDeployments(): AwsDeployment[] {
  if (cachedDeployments.length === 0) {
    initializeAwsData();
  }
  return [...cachedDeployments];
}

export function fetchAwsHealthChecks(): AwsHealthCheck[] {
  if (cachedHealthChecks.length === 0) {
    initializeAwsData();
  }
  return [...cachedHealthChecks];
}

export function fetchAwsServices(): AwsService[] {
  if (cachedServices.length === 0) {
    initializeAwsData();
  }
  return [...cachedServices];
}

// Simulation event functions
export function simulateNewDeployment() {
  // Generate 1-3 new deployments
  const newDeployments = generateAwsDeployment(getRandomInt(1, 3));
  
  // Add to the beginning of the array
  cachedDeployments.unshift(...newDeployments);
  
  // Keep the array at a reasonable size
  if (cachedDeployments.length > 100) {
    cachedDeployments = cachedDeployments.slice(0, 100);
  }
  
  return newDeployments;
}

export function simulateDeploymentStatusChange(deploymentId: string, newStatus: 'success' | 'failure' | 'in-progress') {
  const deployment = cachedDeployments.find(d => d.id === deploymentId);
  
  if (deployment && deployment.status === 'in-progress') {
    deployment.status = newStatus;
    
    if (newStatus !== 'in-progress') {
      // Set duration if the deployment is complete
      deployment.duration = getRandomInt(30, 600);
    }
    
    return deployment;
  }
  
  return null;
}

export function simulateHealthStatusChange(percent = 0.2) {
  // Update a percentage of health checks randomly
  const checkCount = Math.max(1, Math.floor(cachedHealthChecks.length * percent));
  const updatedHealthChecks: AwsHealthCheck[] = [];
  
  // First, process active issues
  activeIssues.forEach(issue => {
    const now = new Date();
    const affectedChecks = cachedHealthChecks.filter(
      check => check.service === issue.affectedService && check.region === issue.region
    );
    
    // If issue is past recovery time and auto-recovery is enabled, recover the service
    if (issue.autoRecovery && now > issue.expectedRecoveryTime) {
      simulateAwsRecovery(issue.affectedService, issue.region);
      return;
    }
    
    // Otherwise, ensure affected services show degraded/unhealthy status
    affectedChecks.forEach(check => {
      // Only make it worse, not better (during active issue)
      if (check.status === 'healthy') {
        // Find an unhealthy/degraded check to swap with to maintain distributions
        const swapCandidates = cachedHealthChecks.filter(c => 
          c.status !== 'healthy' && 
          !affectedChecks.includes(c) &&
          !updatedHealthChecks.includes(c)
        );
        
        if (swapCandidates.length > 0) {
          const swapWith = getRandomItem(swapCandidates);
          const originalStatus = swapWith.status;
          
          // Swap statuses while keeping messages consistent
          check.status = originalStatus;
          swapWith.status = 'healthy';
          
          // Update messages to match status
          if (check.status === 'degraded') {
            check.message = getRandomItem([
              'High latency detected',
              'Elevated error rate',
              'Resource utilization above threshold',
              'Reduced throughput detected',
            ]);
          } else {
            check.message = getRandomItem([
              'Service unavailable',
              'Connection timeouts',
              'Database connection failures',
              'Critical error rate',
              'Resource exhaustion',
            ]);
          }
          swapWith.message = 'Service operating normally';
          
          // Update metrics to reflect status
          if (check.status === 'unhealthy') {
            check.metrics.responseTime = getRandomInt(900, 5000);
            check.metrics.successRate = getRandomInt(0, 84);
          } else {
            check.metrics.responseTime = getRandomInt(300, 800);
            check.metrics.successRate = getRandomInt(85, 97);
          }
          
          swapWith.metrics.responseTime = getRandomInt(10, 200);
          swapWith.metrics.successRate = getRandomInt(98, 100);
          
          updatedHealthChecks.push(check);
          updatedHealthChecks.push(swapWith);
        }
      }
    });
  });
  
  // Get current counts of each status
  const healthyCounts = cachedHealthChecks.filter(h => h.status === 'healthy').length;
  const degradedCounts = cachedHealthChecks.filter(h => h.status === 'degraded').length;
  const unhealthyCounts = cachedHealthChecks.filter(h => h.status === 'unhealthy').length;
  
  // Random indices to update (excluding those already updated)
  const indicesToUpdate = new Set<number>();
  const eligibleIndices = cachedHealthChecks
    .map((_, index) => index)
    .filter(index => !updatedHealthChecks.includes(cachedHealthChecks[index]));
  
  while (indicesToUpdate.size < Math.min(checkCount, eligibleIndices.length)) {
    const randomIndex = getRandomInt(0, eligibleIndices.length - 1);
    indicesToUpdate.add(eligibleIndices[randomIndex]);
    eligibleIndices.splice(randomIndex, 1);
  }
  
  // For each pair of indices to update, swap status
  const indices = Array.from(indicesToUpdate);
  for (let i = 0; i < indices.length; i += 2) {
    if (i + 1 < indices.length) {
      const check1 = cachedHealthChecks[indices[i]];
      const check2 = cachedHealthChecks[indices[i + 1]];
      
      // Swap statuses
      const temp = check1.status;
      check1.status = check2.status;
      check2.status = temp;
      
      // Update messages and metrics for check1
      if (check1.status === 'healthy') {
        check1.message = 'Service operating normally';
        check1.metrics.responseTime = getRandomInt(10, 200);
        check1.metrics.successRate = getRandomInt(98, 100);
      } else if (check1.status === 'degraded') {
        check1.message = getRandomItem([
          'High latency detected',
          'Elevated error rate',
          'Resource utilization above threshold',
          'Reduced throughput detected',
        ]);
        check1.metrics.responseTime = getRandomInt(300, 800);
        check1.metrics.successRate = getRandomInt(85, 97);
      } else {
        check1.message = getRandomItem([
          'Service unavailable',
          'Connection timeouts',
          'Database connection failures',
          'Critical error rate',
          'Resource exhaustion',
        ]);
        check1.metrics.responseTime = getRandomInt(900, 5000);
        check1.metrics.successRate = getRandomInt(0, 84);
      }
      
      // Update messages and metrics for check2
      if (check2.status === 'healthy') {
        check2.message = 'Service operating normally';
        check2.metrics.responseTime = getRandomInt(10, 200);
        check2.metrics.successRate = getRandomInt(98, 100);
      } else if (check2.status === 'degraded') {
        check2.message = getRandomItem([
          'High latency detected',
          'Elevated error rate',
          'Resource utilization above threshold',
          'Reduced throughput detected',
        ]);
        check2.metrics.responseTime = getRandomInt(300, 800);
        check2.metrics.successRate = getRandomInt(85, 97);
      } else {
        check2.message = getRandomItem([
          'Service unavailable',
          'Connection timeouts',
          'Database connection failures',
          'Critical error rate',
          'Resource exhaustion',
        ]);
        check2.metrics.responseTime = getRandomInt(900, 5000);
        check2.metrics.successRate = getRandomInt(0, 84);
      }
      
      // Update timestamps
      check1.lastChecked = new Date().toISOString();
      check2.lastChecked = new Date().toISOString();
      
      updatedHealthChecks.push(check1);
      updatedHealthChecks.push(check2);
    } else {
      // If we have an odd number of indices, just update the metrics/timestamp for the last one
      const healthCheck = cachedHealthChecks[indices[i]];
      healthCheck.lastChecked = new Date().toISOString();
      
      if (healthCheck.status === 'healthy') {
        healthCheck.metrics.responseTime = getRandomInt(10, 200);
        healthCheck.metrics.successRate = getRandomInt(98, 100);
      } else if (healthCheck.status === 'degraded') {
        healthCheck.metrics.responseTime = getRandomInt(300, 800);
        healthCheck.metrics.successRate = getRandomInt(85, 97);
      } else {
        healthCheck.metrics.responseTime = getRandomInt(900, 5000);
        healthCheck.metrics.successRate = getRandomInt(0, 84);
      }
      
      updatedHealthChecks.push(healthCheck);
    }
  }
  
  return updatedHealthChecks;
}

export function simulateAwsIssue() {
  // Select an outage scenario
  const scenario = getRandomItem(outageScenarios);
  const affectedService = getRandomItem(awsServiceNames);
  const affectedResourceTypes = scenario.resources.length > 0 
    ? scenario.resources 
    : awsResourceTypes;
  const region = getRandomItemWithWeight(awsRegions);
  
  // Calculate expected recovery time - between 5 and 15 minutes
  const recoveryMinutes = getRandomInt(5, 15);
  const expectedRecoveryTime = new Date(Date.now() + (recoveryMinutes * 60 * 1000));
  
  // Auto-recover 80% of the time
  const autoRecovery = getRandomBool(0.8);
  
  // Record active issue
  activeIssues.push({
    affectedService,
    region,
    scenarioName: scenario.name,
    expectedRecoveryTime,
    startTime: new Date(),
    autoRecovery
  });
  
  const changes: any[] = [];
  
  // 1. Create or modify health checks to show degraded or unhealthy
  // Find any healthy resources for the affected service in the region
  const healthyChecks = cachedHealthChecks.filter(
    h => h.service === affectedService && 
    h.region === region && 
    h.status === 'healthy'
  );
  
  // Find unhealthy resources from other services or regions that can be made healthy
  // to maintain distribution
  const candidatesToMakeHealthy = cachedHealthChecks.filter(
    h => h.status !== 'healthy' && 
    !(h.service === affectedService && h.region === region)
  );
  
  // For each resource we want to make unhealthy, swap with a resource we can make healthy
  for (let i = 0; i < Math.min(getRandomInt(2, 4), healthyChecks.length); i++) {
    if (candidatesToMakeHealthy.length > i) {
      const resourceToDegrade = healthyChecks[i];
      const resourceToImprove = candidatesToMakeHealthy[i];
      
      // Swap statuses
      resourceToDegrade.status = resourceToImprove.status;
      resourceToImprove.status = 'healthy';
      
      // Update messages
      resourceToDegrade.message = getRandomItem(scenario.messages);
      resourceToImprove.message = 'Service operating normally';
      
      // Update timestamps
      resourceToDegrade.lastChecked = new Date().toISOString();
      resourceToImprove.lastChecked = new Date().toISOString();
      
      // Update metrics
      if (resourceToDegrade.status === 'unhealthy') {
        resourceToDegrade.metrics.responseTime = getRandomInt(900, 5000);
        resourceToDegrade.metrics.successRate = getRandomInt(0, 84);
      } else {
        resourceToDegrade.metrics.responseTime = getRandomInt(300, 800);
        resourceToDegrade.metrics.successRate = getRandomInt(85, 97);
      }
      
      resourceToImprove.metrics.responseTime = getRandomInt(10, 200);
      resourceToImprove.metrics.successRate = getRandomInt(98, 100);
      
      changes.push({ type: 'healthCheck', action: 'updated', id: resourceToDegrade.id });
      changes.push({ type: 'healthCheck', action: 'updated', id: resourceToImprove.id });
    }
  }
  
  // If we didn't have enough healthy checks for the affected service,
  // we'll still maintain the distribution by finding other checks to swap
  if (healthyChecks.length === 0) {
    // Find any healthy resources for other services
    const otherHealthyChecks = cachedHealthChecks.filter(
      h => h.status === 'healthy' && 
      !(h.service === affectedService && h.region === region)
    ).slice(0, getRandomInt(2, 4));
    
    // Create new "unhealthy" checks for the affected service 
    // by swapping status with healthy checks from other services
    for (let i = 0; i < otherHealthyChecks.length; i++) {
      const healthyCheck = otherHealthyChecks[i];
      
      // Create a new check for the affected service with the status from the healthy check
      const resourceType = getRandomItem(affectedResourceTypes);
      const resource = `${affectedService}-${resourceType.toLowerCase().replace(' ', '-')}-${getRandomInt(1, 5)}`;
      
      const newHealthCheck: AwsHealthCheck = {
        id: `health-${Date.now()}-${i}`,
        service: affectedService,
        resource,
        resourceType,
        status: getRandomBool(0.7) ? 'unhealthy' : 'degraded',
        message: getRandomItem(scenario.messages),
        timestamp: new Date().toISOString(),
        region,
        lastChecked: new Date().toISOString(),
        metrics: {
          responseTime: getRandomInt(900, 5000),
          successRate: getRandomInt(0, 84)
        }
      };
      
      // Make the previously healthy check unhealthy
      healthyCheck.status = newHealthCheck.status;
      healthyCheck.message = getRandomItem(scenario.messages);
      healthyCheck.lastChecked = new Date().toISOString();
      
      if (healthyCheck.status === 'unhealthy') {
        healthyCheck.metrics.responseTime = getRandomInt(900, 5000);
        healthyCheck.metrics.successRate = getRandomInt(0, 84);
      } else {
        healthyCheck.metrics.responseTime = getRandomInt(300, 800);
        healthyCheck.metrics.successRate = getRandomInt(85, 97);
      }
      
      // Make the new check healthy to maintain distribution
      newHealthCheck.status = 'healthy';
      newHealthCheck.message = 'Service operating normally';
      newHealthCheck.metrics.responseTime = getRandomInt(10, 200);
      newHealthCheck.metrics.successRate = getRandomInt(98, 100);
      
      cachedHealthChecks.push(newHealthCheck);
      changes.push({ type: 'healthCheck', action: 'updated', id: healthyCheck.id });
      changes.push({ type: 'healthCheck', action: 'added', id: newHealthCheck.id });
    }
  }
  
  // 2. Create a failed deployment
  const failedDeployment = generateAwsDeployment(1)[0];
  failedDeployment.service = affectedService;
  failedDeployment.region = region;
  failedDeployment.status = 'failure';
  failedDeployment.duration = getRandomInt(30, 180);
  
  cachedDeployments.unshift(failedDeployment);
  changes.push({ type: 'deployment', action: 'added', id: failedDeployment.id });
  
  // 3. Potentially create cascade failures for dependent services
  const dependentServices = Object.entries(serviceDependencies)
    .filter(([service, deps]) => deps.includes(affectedService))
    .map(([svc]) => svc);
  
  if (dependentServices.length > 0 && getRandomBool(0.7)) {
    // Select 1-2 dependent services that will also be affected
    const cascadeCount = Math.min(dependentServices.length, getRandomInt(1, 2));
    const cascadeServices = [];
    
    for (let i = 0; i < cascadeCount; i++) {
      if (dependentServices.length === 0) break;
      
      const idx = getRandomInt(0, dependentServices.length - 1);
      cascadeServices.push(dependentServices.splice(idx, 1)[0]);
    }
    
    // For each cascade service, follow the same pattern:
    // Find a healthy resource in other service to make degraded,
    // and find an unhealthy resource to make healthy
    cascadeServices.forEach(service => {
      // Find healthy resources for this service
      const healthyServiceChecks = cachedHealthChecks.filter(
        h => h.service === service && h.status === 'healthy'
      );
      
      // Find unhealthy resources from other services
      const unhealthyOtherChecks = cachedHealthChecks.filter(
        h => h.service !== service && h.service !== affectedService && h.status !== 'healthy'
      );
      
      if (healthyServiceChecks.length > 0 && unhealthyOtherChecks.length > 0) {
        const healthyCheck = healthyServiceChecks[0];
        const unhealthyCheck = unhealthyOtherChecks[0];
        
        // Make healthy check degraded
        healthyCheck.status = 'degraded';
        healthyCheck.message = `Degraded due to dependency on ${affectedService}`;
        healthyCheck.lastChecked = new Date().toISOString();
        healthyCheck.metrics.responseTime = getRandomInt(300, 800);
        healthyCheck.metrics.successRate = getRandomInt(85, 97);
        
        // Make unhealthy check healthy
        unhealthyCheck.status = 'healthy';
        unhealthyCheck.message = 'Service operating normally';
        unhealthyCheck.lastChecked = new Date().toISOString();
        unhealthyCheck.metrics.responseTime = getRandomInt(10, 200);
        unhealthyCheck.metrics.successRate = getRandomInt(98, 100);
        
        changes.push({ type: 'healthCheck', action: 'updated', id: healthyCheck.id, cascade: true });
        changes.push({ type: 'healthCheck', action: 'updated', id: unhealthyCheck.id });
      }
    });
  }
  
  return { 
    affectedService, 
    region, 
    changes,
    issue: scenario.name,
    expectedRecoveryTime: expectedRecoveryTime.toISOString(),
    cascadeServices: dependentServices
  };
}

export function simulateAwsRecovery(service: string, region: string) {
  const changes: any[] = [];
  
  // Remove from active issues
  const issueIndex = activeIssues.findIndex(i => 
    i.affectedService === service && i.region === region
  );
  
  if (issueIndex >= 0) {
    activeIssues.splice(issueIndex, 1);
  }
  
  // Find degraded/unhealthy resources for this service and region
  const affectedChecks = cachedHealthChecks.filter(check => 
    check.service === service && 
    check.region === region && 
    check.status !== 'healthy'
  );
  
  // Find healthy resources from other services/regions that can be swapped
  const healthyChecksFromOthers = cachedHealthChecks.filter(check => 
    (check.service !== service || check.region !== region) && 
    check.status === 'healthy'
  );
  
  // Maintain distribution by swapping statuses
  const recoveryAction = getRandomItem([
    'Service restart',
    'Configuration rollback',
    'Resource scaling',
    'Failover to backup',
    'Circuit breaker activation',
    'Database fallback',
    'Manual intervention',
  ]);
  
  const cascadeRecoveries: string[] = [];
  
  // For each affected check, find a healthy check to swap with
  affectedChecks.forEach((check, index) => {
    if (index < healthyChecksFromOthers.length) {
      const healthyCheck = healthyChecksFromOthers[index];
      
      // Swap statuses
      const originalStatus = check.status;
      check.status = 'healthy';
      healthyCheck.status = originalStatus;
      
      // Update messages
      check.message = 'Service operating normally';
      if (originalStatus === 'degraded') {
        healthyCheck.message = getRandomItem([
          'High latency detected',
          'Elevated error rate',
          'Resource utilization above threshold',
          'Reduced throughput detected',
        ]);
        healthyCheck.metrics.responseTime = getRandomInt(300, 800);
        healthyCheck.metrics.successRate = getRandomInt(85, 97);
      } else {
        healthyCheck.message = getRandomItem([
          'Service unavailable',
          'Connection timeouts',
          'Database connection failures',
          'Critical error rate',
          'Resource exhaustion',
        ]);
        healthyCheck.metrics.responseTime = getRandomInt(900, 5000);
        healthyCheck.metrics.successRate = getRandomInt(0, 84);
      }
      
      // Update metrics
      check.metrics.responseTime = getRandomInt(10, 200);
      check.metrics.successRate = getRandomInt(98, 100);
      
      // Update timestamps
      check.lastChecked = new Date().toISOString();
      healthyCheck.lastChecked = new Date().toISOString();
      
      changes.push({ 
        type: 'healthCheck', 
        action: 'updated', 
        id: check.id, 
        recoveryAction
      });
      
      changes.push({ 
        type: 'healthCheck', 
        action: 'updated', 
        id: healthyCheck.id 
      });
    }
  });
  
  // Handle dependent services that might have been affected by cascading failures
  const dependentServices = Object.entries(serviceDependencies)
    .filter(([svc, deps]) => deps.includes(service))
    .map(([svc]) => svc);
  
  dependentServices.forEach(depService => {
    // Check if there's a degraded health check for this dependent service
    const degradedChecks = cachedHealthChecks.filter(check => 
      check.service === depService && 
      check.region === region && 
      check.status !== 'healthy' &&
      check.message.includes(service)
    );
    
    // Find healthy resources from other services that can be swapped
    const healthySwapCandidates = cachedHealthChecks.filter(check => 
      check.service !== depService && 
      check.service !== service &&
      check.status === 'healthy' &&
      !healthyChecksFromOthers.includes(check)
    );
    
    // For each degraded check, swap with a healthy check
    degradedChecks.forEach((check, index) => {
      if (index < healthySwapCandidates.length) {
        const healthyCheck = healthySwapCandidates[index];
        
        // Swap statuses
        const originalStatus = check.status;
        check.status = 'healthy';
        healthyCheck.status = originalStatus;
        
        // Update messages
        check.message = 'Service operating normally';
        if (originalStatus === 'degraded') {
          healthyCheck.message = getRandomItem([
            'High latency detected',
            'Elevated error rate',
            'Resource utilization above threshold',
            'Reduced throughput detected',
          ]);
          healthyCheck.metrics.responseTime = getRandomInt(300, 800);
          healthyCheck.metrics.successRate = getRandomInt(85, 97);
        } else {
          healthyCheck.message = getRandomItem([
            'Service unavailable',
            'Connection timeouts',
            'Database connection failures',
            'Critical error rate',
            'Resource exhaustion',
          ]);
          healthyCheck.metrics.responseTime = getRandomInt(900, 5000);
          healthyCheck.metrics.successRate = getRandomInt(0, 84);
        }
        
        // Update metrics
        check.metrics.responseTime = getRandomInt(10, 200);
        check.metrics.successRate = getRandomInt(98, 100);
        
        // Update timestamps
        check.lastChecked = new Date().toISOString();
        healthyCheck.lastChecked = new Date().toISOString();
        
        changes.push({ 
          type: 'healthCheck', 
          action: 'updated', 
          id: check.id, 
          cascade: true 
        });
        
        changes.push({ 
          type: 'healthCheck', 
          action: 'updated', 
          id: healthyCheck.id 
        });
        
        cascadeRecoveries.push(depService);
      }
    });
  });
  
  return {
    service,
    region,
    changes,
    recoveryAction,
    cascadeRecoveries: [...new Set(cascadeRecoveries)]
  };
}

// Simulation control
export function startAwsSimulation(interval = 10000) {
  if (isSimulationRunning) {
    return false;
  }
  
  initializeAwsData();
  isSimulationRunning = true;
  
  simulationInterval = setInterval(() => {
    // 15% chance to create a new deployment
    if (Math.random() < 0.15) {
      simulateNewDeployment();
    }
    
    // 20% chance to update health status
    if (Math.random() < 0.2) {
      simulateHealthStatusChange();
    }
    
    // 5% chance to create an issue (only if no active issues)
    if (Math.random() < 0.05 && activeIssues.length === 0) {
      simulateAwsIssue();
    }
    
    // Update in-progress deployments
    const inProgressDeployments = cachedDeployments.filter(d => d.status === 'in-progress');
    inProgressDeployments.forEach(deployment => {
      // 30% chance to complete an in-progress deployment
      if (Math.random() < 0.3) {
        simulateDeploymentStatusChange(
          deployment.id, 
          getRandomBool(0.8) ? 'success' : 'failure'
        );
      }
    });
    
    // Check for auto-recovery of active issues
    const now = new Date();
    activeIssues.forEach(issue => {
      if (issue.autoRecovery && now > issue.expectedRecoveryTime) {
        simulateAwsRecovery(issue.affectedService, issue.region);
      }
    });
    
  }, interval);
  
  return true;
}

export function stopAwsSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    isSimulationRunning = false;
    return true;
  }
  
  return false;
}

// Export the simulator
export default {
  fetchAwsDeployments,
  fetchAwsHealthChecks,
  fetchAwsServices,
  simulateNewDeployment,
  simulateHealthStatusChange,
  simulateAwsIssue,
  simulateAwsRecovery,
  startAwsSimulation,
  stopAwsSimulation
}; 

// Additional simulation functions for specific operations

/**
 * Simulates a deployment operation for a service
 * @returns Details about the simulated deployment
 */
export function simulateServiceDeployment() {
  // Pick a random service to deploy
  const service = getRandomItem(awsServiceNames);
  const region = getRandomItemWithWeight(awsRegions);
  const environment = getRandomItem(awsEnvironments);
  const version = generateRandomVersion();
  
  // Create a new deployment record
  const deployment: AwsDeployment = {
    id: `deploy-${Date.now()}-manual`,
    service,
    version,
    status: 'in-progress',
    environment,
    timestamp: new Date().toISOString(),
    commit: generateRandomCommitHash(),
    commitUrl: `https://github.com/${getRepositoryForService(service)}/commit/${generateRandomCommitHash()}`,
    triggeredBy: 'Manual Deployment',
    region,
    duration: null,
    artifacts: {
      imageTag: `${service}:${version}`,
      buildId: `build-${Date.now().toString(36)}-manual`
    }
  };
  
  // Add to deployments list
  cachedDeployments.unshift(deployment);
  
  // Schedule completion after a short delay
  setTimeout(() => {
    // 80% chance of success, 20% chance of failure
    const success = getRandomBool(0.8);
    deployment.status = success ? 'success' : 'failure';
    deployment.duration = getRandomInt(30, 300);
    
    // If successful, update the service's version
    if (success) {
      const serviceObj = cachedServices.find(s => s.name === service && s.region === region);
      if (serviceObj) {
        if (!serviceObj.versions) {
          serviceObj.versions = [];
        }
        serviceObj.versions.unshift(version);
        serviceObj.lastDeployment = new Date().toISOString();
        serviceObj.lastUpdatedAt = new Date().toISOString();
      }
    }
  }, getRandomInt(5000, 20000));
  
  return {
    id: deployment.id,
    service,
    version,
    region,
    environment,
    status: 'in-progress',
    message: `Deploying ${service} version ${version} to ${environment} (${region})`,
  };
}

/**
 * Simulates a security scan operation
 * @returns Details about the simulated security scan
 */
export function simulateSecurityScan() {
  // Choose random services to scan
  const servicesCount = getRandomInt(2, 5);
  const servicesToScan = [];
  
  for (let i = 0; i < servicesCount; i++) {
    servicesToScan.push(getRandomItem(awsServiceNames));
  }
  
  // Create scan results: 20% chance of finding issues
  const foundIssues = getRandomBool(0.2);
  
  // If issues found, create or update health checks
  if (foundIssues) {
    const service = getRandomItem(servicesToScan);
    const region = getRandomItemWithWeight(awsRegions);
    const resourceType = getRandomItem(['IAM', 'S3', 'EC2', 'RDS']);
    const resource = `${service}-${resourceType.toLowerCase().replace(' ', '-')}-${getRandomInt(1, 5)}`;
    
    // Create a new security warning health check
    const securityCheck: AwsHealthCheck = {
      id: `security-${Date.now()}-${resource}`,
      service,
      resource,
      resourceType,
      status: 'degraded',
      message: getRandomItem([
        'Security misconfiguration detected',
        'Vulnerable dependency found',
        'Unused IAM permissions',
        'Public access enabled',
        'Encryption not enabled',
      ]),
      timestamp: new Date().toISOString(),
      region,
      lastChecked: new Date().toISOString(),
      metrics: {
        responseTime: 0,
        successRate: 0
      }
    };
    
    cachedHealthChecks.push(securityCheck);
    
    return {
      scanId: `scan-${Date.now()}`,
      services: servicesToScan,
      status: 'completed',
      findings: [
        {
          service,
          resource,
          severity: 'medium',
          message: securityCheck.message
        }
      ],
      message: `Security scan completed with findings on ${service}`
    };
  }
  
  return {
    scanId: `scan-${Date.now()}`,
    services: servicesToScan,
    status: 'completed',
    findings: [],
    message: 'Security scan completed with no findings'
  };
} 