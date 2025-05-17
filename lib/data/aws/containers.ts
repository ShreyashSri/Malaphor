import { generateTimestamp } from '../../utils';

export interface ContainerDeployment {
  id: string;
  serviceName: string;
  clusterName: string;
  taskDefinition: string;
  desiredCount: number;
  runningCount: number;
  pendingCount: number;
  deploymentStatus: "PRIMARY" | "ACTIVE" | "INACTIVE";
  events: {
    id: string;
    message: string;
    timestamp: string;
  }[];
  lastDeploymentTime: string;
  deploymentType: "ECS" | "EKS";
  environment?: string;
  duration?: string;
}

export const containerDeployments: ContainerDeployment[] = [
  {
    id: "deploy-ecs-1",
    serviceName: "malaphor-api",
    clusterName: "malaphor-cluster",
    taskDefinition: "malaphor-api:42",
    desiredCount: 4,
    runningCount: 4,
    pendingCount: 0,
    deploymentStatus: "PRIMARY",
    events: [
      {
        id: "event-1",
        message: "service malaphor-api has reached a steady state.",
        timestamp: generateTimestamp(0, 1)
      },
      {
        id: "event-2",
        message: "taskSet [ec2,ecs] has reached a steady state.",
        timestamp: generateTimestamp(0, 1.1)
      }
    ],
    lastDeploymentTime: generateTimestamp(1, 0),
    deploymentType: "ECS",
    environment: "production",
    duration: "2m 45s"
  },
  {
    id: "deploy-ecs-2",
    serviceName: "malaphor-worker",
    clusterName: "malaphor-cluster",
    taskDefinition: "malaphor-worker:28",
    desiredCount: 2,
    runningCount: 1,
    pendingCount: 1,
    deploymentStatus: "ACTIVE",
    events: [
      {
        id: "event-3",
        message: "service malaphor-worker has started 1 tasks: task a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6.",
        timestamp: generateTimestamp(0, 0.05)
      },
      {
        id: "event-4",
        message: "service malaphor-worker has started 1 tasks: task q7r8s9t0-u1v2-w3x4-y5z6-a1b2c3d4e5f6.",
        timestamp: generateTimestamp(0, 0.1)
      }
    ],
    lastDeploymentTime: generateTimestamp(0, 0.5),
    deploymentType: "ECS",
    environment: "staging",
    duration: "1m 30s"
  },
  {
    id: "deploy-eks-1",
    serviceName: "malaphor-dashboard",
    clusterName: "malaphor-k8s-cluster",
    taskDefinition: "malaphor-dashboard-deployment",
    desiredCount: 3,
    runningCount: 3,
    pendingCount: 0,
    deploymentStatus: "PRIMARY",
    events: [
      {
        id: "event-5",
        message: "Scaled up replica set malaphor-dashboard-abc123 to 3",
        timestamp: generateTimestamp(0, 2)
      }
    ],
    lastDeploymentTime: generateTimestamp(0, 20),
    deploymentType: "EKS",
    environment: "production",
    duration: "3m 15s"
  },
  {
    id: "deploy-ecs-3",
    serviceName: "malaphor-auth",
    clusterName: "malaphor-cluster",
    taskDefinition: "malaphor-auth:15",
    desiredCount: 2,
    runningCount: 2,
    pendingCount: 0,
    deploymentStatus: "PRIMARY",
    events: [
      {
        id: "event-6",
        message: "service malaphor-auth has reached a steady state.",
        timestamp: generateTimestamp(0, 3)
      }
    ],
    lastDeploymentTime: generateTimestamp(2, 0),
    deploymentType: "ECS",
    environment: "production",
    duration: "2m 10s"
  },
  {
    id: "deploy-eks-2",
    serviceName: "malaphor-analytics",
    clusterName: "malaphor-k8s-cluster",
    taskDefinition: "malaphor-analytics-deployment",
    desiredCount: 2,
    runningCount: 0,
    pendingCount: 2,
    deploymentStatus: "ACTIVE",
    events: [
      {
        id: "event-7",
        message: "Created pod: malaphor-analytics-xyz789",
        timestamp: generateTimestamp(0, 0.02)
      },
      {
        id: "event-8",
        message: "Created pod: malaphor-analytics-abc456",
        timestamp: generateTimestamp(0, 0.03)
      }
    ],
    lastDeploymentTime: generateTimestamp(0, 0.1),
    deploymentType: "EKS",
    environment: "staging",
    duration: "In progress"
  },
  {
    id: "deploy-ecs-4",
    serviceName: "malaphor-reporting",
    clusterName: "malaphor-cluster",
    taskDefinition: "malaphor-reporting:8",
    desiredCount: 1,
    runningCount: 1,
    pendingCount: 0,
    deploymentStatus: "PRIMARY",
    events: [
      {
        id: "event-9",
        message: "service malaphor-reporting has reached a steady state.",
        timestamp: generateTimestamp(1, 12)
      }
    ],
    lastDeploymentTime: generateTimestamp(3, 0),
    deploymentType: "ECS",
    environment: "development",
    duration: "1m 55s"
  }
]; 