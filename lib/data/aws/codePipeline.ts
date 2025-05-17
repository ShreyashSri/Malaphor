import { generateTimestamp, generateCommitHash } from '../../utils';

export interface CodePipelineStage {
  id: string;
  name: string;
  status: "SUCCEEDED" | "FAILED" | "IN_PROGRESS" | "CANCELLED" | "STOPPING" | "STOPPED";
  actionStates: {
    actionName: string;
    status: "SUCCEEDED" | "FAILED" | "IN_PROGRESS";
    latestExecution?: {
      status: string;
      errorDetails?: {
        message: string;
      };
    };
  }[];
  transitionState?: {
    enabled: boolean;
  };
}

export interface CodePipelineExecution {
  id: string;
  pipelineName: string;
  status: "Succeeded" | "Failed" | "InProgress" | "Stopped" | "Stopping";
  artifactRevisions?: {
    name: string;
    revisionId: string;
    revisionUrl?: string;
  }[];
  stages: CodePipelineStage[];
  startTime: string;
  lastUpdateTime: string;
  trigger: {
    triggerType: "CloudWatchEvent" | "Manual" | "GitHook" | "AutomatedRollback";
    triggerDetail?: string;
  };
}

export const codePipelineExecutions: CodePipelineExecution[] = [
  {
    id: "exec-1234567890",
    pipelineName: "malaphor-api-pipeline",
    status: "Succeeded",
    artifactRevisions: [
      {
        name: "SourceCode",
        revisionId: "a1b2c3d4e5f6g7h8i9j0",
        revisionUrl: "https://github.com/example/malaphor/commit/a1b2c3d4e5"
      }
    ],
    stages: [
      {
        id: "stage-source",
        name: "Source",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "SourceAction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-build",
        name: "Build",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "BuildAction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-test",
        name: "Test",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "UnitTests",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          },
          {
            actionName: "IntegrationTests",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-deploy",
        name: "Deploy",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "DeployAction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      }
    ],
    startTime: generateTimestamp(0, 1),
    lastUpdateTime: generateTimestamp(0, 0.5),
    trigger: {
      triggerType: "GitHook",
      triggerDetail: "Push to main branch"
    }
  },
  {
    id: "exec-0987654321",
    pipelineName: "malaphor-frontend-pipeline",
    status: "InProgress",
    artifactRevisions: [
      {
        name: "SourceCode",
        revisionId: "z9y8x7w6v5u4t3s2r1q0",
        revisionUrl: "https://github.com/example/malaphor/commit/z9y8x7w6v5"
      }
    ],
    stages: [
      {
        id: "stage-source",
        name: "Source",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "SourceAction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-build",
        name: "Build",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "BuildAction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-test",
        name: "Test",
        status: "IN_PROGRESS",
        actionStates: [
          {
            actionName: "UnitTests",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          },
          {
            actionName: "IntegrationTests",
            status: "IN_PROGRESS",
            latestExecution: {
              status: "IN_PROGRESS"
            }
          }
        ]
      },
      {
        id: "stage-deploy",
        name: "Deploy",
        status: "IN_PROGRESS",
        actionStates: [
          {
            actionName: "DeployAction",
            status: "IN_PROGRESS"
          }
        ]
      }
    ],
    startTime: generateTimestamp(0, 0.5),
    lastUpdateTime: generateTimestamp(0, 0.1),
    trigger: {
      triggerType: "Manual",
      triggerDetail: "Started by user"
    }
  },
  {
    id: "exec-1357924680",
    pipelineName: "malaphor-worker-pipeline",
    status: "Failed",
    artifactRevisions: [
      {
        name: "SourceCode",
        revisionId: "j9i8h7g6f5e4d3c2b1a0",
        revisionUrl: "https://github.com/example/malaphor/commit/j9i8h7g6f5"
      }
    ],
    stages: [
      {
        id: "stage-source",
        name: "Source",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "SourceAction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-build",
        name: "Build",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "BuildAction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-test",
        name: "Test",
        status: "FAILED",
        actionStates: [
          {
            actionName: "UnitTests",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          },
          {
            actionName: "IntegrationTests",
            status: "FAILED",
            latestExecution: {
              status: "FAILED",
              errorDetails: {
                message: "Integration test database connection timeout"
              }
            }
          }
        ]
      }
    ],
    startTime: generateTimestamp(0, 2),
    lastUpdateTime: generateTimestamp(0, 1.9),
    trigger: {
      triggerType: "CloudWatchEvent",
      triggerDetail: "Scheduled build"
    }
  },
  {
    id: "exec-3692581470",
    pipelineName: "malaphor-analytics-pipeline",
    status: "Succeeded",
    artifactRevisions: [
      {
        name: "SourceCode",
        revisionId: generateCommitHash(),
        revisionUrl: `https://github.com/example/malaphor/commit/${generateCommitHash().substring(0, 10)}`
      }
    ],
    stages: [
      {
        id: "stage-source",
        name: "Source",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "SourceAction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-build",
        name: "Build",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "BuildAction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-test",
        name: "Test",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "UnitTests",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-deploy",
        name: "Deploy",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "DeployToStaging",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          },
          {
            actionName: "ApprovalToProduction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          },
          {
            actionName: "DeployToProduction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      }
    ],
    startTime: generateTimestamp(1, 2),
    lastUpdateTime: generateTimestamp(1, 0),
    trigger: {
      triggerType: "GitHook",
      triggerDetail: "Merge pull request #42"
    }
  },
  {
    id: "exec-5678901234",
    pipelineName: "malaphor-auth-pipeline",
    status: "Stopped",
    artifactRevisions: [
      {
        name: "SourceCode",
        revisionId: generateCommitHash(),
        revisionUrl: `https://github.com/example/malaphor/commit/${generateCommitHash().substring(0, 10)}`
      }
    ],
    stages: [
      {
        id: "stage-source",
        name: "Source",
        status: "SUCCEEDED",
        actionStates: [
          {
            actionName: "SourceAction",
            status: "SUCCEEDED",
            latestExecution: {
              status: "SUCCEEDED"
            }
          }
        ]
      },
      {
        id: "stage-build",
        name: "Build",
        status: "STOPPED",
        actionStates: [
          {
            actionName: "BuildAction",
            status: "IN_PROGRESS",
            latestExecution: {
              status: "STOPPED"
            }
          }
        ]
      }
    ],
    startTime: generateTimestamp(2, 10),
    lastUpdateTime: generateTimestamp(2, 9.5),
    trigger: {
      triggerType: "Manual",
      triggerDetail: "Started and stopped by user"
    }
  }
]; 