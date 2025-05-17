import { generateTimestamp } from '../../utils';

export interface SystemsManagerChange {
  id: string;
  executionId: string;
  documentName: string;
  status: "Success" | "Failed" | "InProgress" | "Pending" | "TimedOut" | "Cancelling" | "Cancelled";
  targets: string[];
  startTime: string;
  endTime?: string;
  complianceStatus?: "COMPLIANT" | "NON_COMPLIANT";
  parameters?: {
    [key: string]: string[];
  };
}

export const systemsManagerChanges: SystemsManagerChange[] = [
  {
    id: "change-1",
    executionId: "exec-a1b2c3d4e5f6g7h8",
    documentName: "AWS-ApplyAnsiblePlaybooks",
    status: "Success",
    targets: ["i-1234567890abcdef0", "i-0987654321fedcba0"],
    startTime: generateTimestamp(1, 0),
    endTime: generateTimestamp(1, 0.1),
    complianceStatus: "COMPLIANT",
    parameters: {
      sourceType: ["S3"],
      sourceInfo: ["{\"path\":\"s3://malaphor-deployment-bucket/playbooks/api-deployment.yaml\"}"]
    }
  },
  {
    id: "change-2",
    executionId: "exec-h7g6f5e4d3c2b1a0",
    documentName: "AWS-RunPatchBaseline",
    status: "Success",
    targets: ["i-1234567890abcdef0", "i-0987654321fedcba0", "i-abcdef1234567890"],
    startTime: generateTimestamp(2, 0),
    endTime: generateTimestamp(2, 1),
    complianceStatus: "COMPLIANT",
    parameters: {
      operation: ["Install"],
      rebootOption: ["RebootIfNeeded"]
    }
  },
  {
    id: "change-3",
    executionId: "exec-z9y8x7w6v5u4t3s2",
    documentName: "AWS-ConfigureAWSPackage",
    status: "InProgress",
    targets: ["i-abcdef1234567890"],
    startTime: generateTimestamp(0, 0.5),
    parameters: {
      action: ["Install"],
      name: ["AmazonCloudWatchAgent"]
    }
  },
  {
    id: "change-4",
    executionId: "exec-p9o8i7u6y5t4r3e2",
    documentName: "AWS-RunShellScript",
    status: "Failed",
    targets: ["i-0987654321fedcba0"],
    startTime: generateTimestamp(0, 4),
    endTime: generateTimestamp(0, 4.1),
    complianceStatus: "NON_COMPLIANT",
    parameters: {
      commands: ["systemctl restart malaphor-api.service"],
      workingDirectory: ["/opt/malaphor"],
      executionTimeout: ["3600"]
    }
  },
  {
    id: "change-5",
    executionId: "exec-q1w2e3r4t5y6u7i8",
    documentName: "AWS-UpdateSSMAgent",
    status: "Success",
    targets: ["i-1234567890abcdef0", "i-0987654321fedcba0", "i-abcdef1234567890", "i-fedcba0987654321"],
    startTime: generateTimestamp(3, 0),
    endTime: generateTimestamp(3, 0.2),
    complianceStatus: "COMPLIANT",
    parameters: {
      allowDowngrade: ["false"],
      version: ["latest"]
    }
  },
  {
    id: "change-6",
    executionId: "exec-a2s3d4f5g6h7j8k9",
    documentName: "AWS-ApplyChefRecipes",
    status: "Success",
    targets: ["i-1234567890abcdef0", "i-0987654321fedcba0"],
    startTime: generateTimestamp(4, 0),
    endTime: generateTimestamp(4, 0.5),
    complianceStatus: "COMPLIANT",
    parameters: {
      sourceType: ["S3"],
      sourceInfo: ["{\"path\":\"s3://malaphor-deployment-bucket/chef/cookbooks\"}"],
      runList: ["recipe[malaphor::deploy]"],
      chefClientVersion: ["14.10.9"]
    }
  }
]; 