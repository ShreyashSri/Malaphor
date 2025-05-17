import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Clock, GitBranch, GitCommit, GitPullRequest } from "lucide-react";

export default function CodeCicdTab() {
  const [deploymentView, setDeploymentView] = useState<"pipeline" | "list">("pipeline");
  
  // Simulated Pipeline Executions
  const pipelineExecutions = [
    {
      id: 'exec-1',
      pipelineName: 'malaphor-api-pipeline',
      status: 'Succeeded',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      lastUpdateTime: new Date(Date.now() - 3540000).toISOString(),
      trigger: {
        triggerType: 'GitPush',
        triggerDetail: 'Push to main branch'
      },
      artifactRevisions: [
        {
          revisionId: 'a1b2c3d4e5f6g7h8i9j0'
        }
      ],
      stages: [
        { id: 'stage-1', name: 'Source', status: 'SUCCEEDED' },
        { id: 'stage-2', name: 'Build', status: 'SUCCEEDED' },
        { id: 'stage-3', name: 'Test', status: 'SUCCEEDED' },
        { id: 'stage-4', name: 'Deploy', status: 'SUCCEEDED' }
      ]
    },
    {
      id: 'exec-2',
      pipelineName: 'malaphor-worker-pipeline',
      status: 'InProgress',
      startTime: new Date(Date.now() - 1800000).toISOString(),
      lastUpdateTime: new Date(Date.now() - 1740000).toISOString(),
      trigger: {
        triggerType: 'Manual',
        triggerDetail: 'Triggered by user'
      },
      artifactRevisions: [
        {
          revisionId: 'b2c3d4e5f6g7h8i9j0k1'
        }
      ],
      stages: [
        { id: 'stage-1', name: 'Source', status: 'SUCCEEDED' },
        { id: 'stage-2', name: 'Build', status: 'SUCCEEDED' },
        { id: 'stage-3', name: 'Test', status: 'IN_PROGRESS' },
        { id: 'stage-4', name: 'Deploy', status: 'NOT_STARTED' }
      ]
    },
    {
      id: 'exec-3',
      pipelineName: 'malaphor-auth-pipeline',
      status: 'Failed',
      startTime: new Date(Date.now() - 7200000).toISOString(),
      lastUpdateTime: new Date(Date.now() - 7140000).toISOString(),
      trigger: {
        triggerType: 'GitPush',
        triggerDetail: 'Push to feature branch'
      },
      artifactRevisions: [
        {
          revisionId: 'c3d4e5f6g7h8i9j0k1l2'
        }
      ],
      stages: [
        { id: 'stage-1', name: 'Source', status: 'SUCCEEDED' },
        { id: 'stage-2', name: 'Build', status: 'SUCCEEDED' },
        { id: 'stage-3', name: 'Test', status: 'FAILED', 
          actionStates: [
            { 
              actionName: 'UnitTests', 
              status: 'FAILED', 
              latestExecution: {
                errorDetails: {
                  message: 'Tests failed: 3 of 120 tests failed'
                }
              }
            }
          ]
        },
        { id: 'stage-4', name: 'Deploy', status: 'NOT_STARTED' }
      ]
    }
  ];
  
  // View in AWS Console
  const handleViewAwsConsole = (service: string) => {
    alert(`Opening AWS Console: ${service}`);
  };
  
  // View commit details
  const handleViewCommitDetails = (commitId: string) => {
    alert(`Opening commit details for ${commitId}`);
  };
  
  // Create pull request
  const handleCreatePR = () => {
    alert('Opening pull request creation page');
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">AWS CodePipeline</h3>
          <div className="flex items-center space-x-2">
            <Select value={deploymentView} onValueChange={(value) => setDeploymentView(value as "pipeline" | "list")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="View Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pipeline">Pipeline View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {deploymentView === "pipeline" ? (
          <div className="space-y-6">
            {pipelineExecutions.map((execution) => (
              <div key={execution.id} className="rounded-md border p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{execution.pipelineName}</h4>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Trigger:</span> {execution.trigger.triggerDetail || execution.trigger.triggerType}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={`${
                      execution.status === "Succeeded" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                        : execution.status === "Failed"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {execution.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      <GitCommit className="inline h-4 w-4 mr-1" />
                      {execution.artifactRevisions?.[0]?.revisionId.substring(0, 8)}
                    </div>
                  </div>
                </div>
                
                {/* Pipeline stages visualization */}
                <div className="flex items-center mt-4 mb-2">
                  {execution.stages.map((stage, i) => (
                    <div key={stage.id} className="flex-1 flex flex-col items-center relative">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        stage.status === "SUCCEEDED" 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" 
                          : stage.status === "FAILED"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                          : stage.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {stage.status === "SUCCEEDED" && <CheckCircle2 className="h-5 w-5" />}
                        {stage.status === "FAILED" && <AlertCircle className="h-5 w-5" />}
                        {stage.status === "IN_PROGRESS" && <Clock className="h-5 w-5" />}
                      </div>
                      <div className="mt-2 text-xs font-medium">{stage.name}</div>
                      
                      {/* Connect stages with line if not the last stage */}
                      {i < execution.stages.length - 1 && (
                        <div className="absolute h-0.5 bg-gray-200 dark:bg-gray-700 w-full top-4 left-1/2" style={{ width: '50%' }}></div>
                      )}
                      
                      {/* Connect stages with line if not the first stage */}
                      {i > 0 && (
                        <div className="absolute h-0.5 bg-gray-200 dark:bg-gray-700 w-full top-4 right-1/2" style={{ width: '50%' }}></div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Stage actions - only shown for the failed stages */}
                {execution.stages.filter(s => s.status === "FAILED").map(stage => (
                  <div key={`${stage.id}-actions`} className="mt-3 bg-red-50 dark:bg-red-900/10 p-3 rounded-md">
                    <div className="font-medium text-sm text-red-800 dark:text-red-300">Failure in {stage.name} Stage:</div>
                    <div className="mt-1 text-sm">
                      {stage.actionStates
                        .filter(action => action.status === "FAILED")
                        .map(action => (
                          <div key={action.actionName} className="mt-1">
                            <span className="font-medium">{action.actionName}:</span> {action.latestExecution?.errorDetails?.message || "Unknown error"}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
                
                <div className="mt-3 text-xs text-muted-foreground">
                  Started {new Date(execution.startTime).toLocaleString()} • 
                  Last updated {new Date(execution.lastUpdateTime).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commit</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Last Stage</TableHead>
                  <TableHead>Trigger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelineExecutions.map(execution => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">{execution.pipelineName}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          execution.status === "Succeeded"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : execution.status === "Failed"
                            ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                      >
                        {execution.status === "Succeeded" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {execution.status === "Failed" && <AlertCircle className="mr-1 h-3 w-3" />}
                        {execution.status === "InProgress" && <Clock className="mr-1 h-3 w-3" />}
                        {execution.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {execution.artifactRevisions?.[0]?.revisionId.substring(0, 8)}
                    </TableCell>
                    <TableCell>{new Date(execution.startTime).toLocaleString()}</TableCell>
                    <TableCell>
                      {execution.stages[execution.stages.length - 1]?.name}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {execution.trigger.triggerDetail || execution.trigger.triggerType}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="mt-4 flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleViewAwsConsole("CodePipeline")}>
            <GitBranch className="h-4 w-4 mr-2" />
            View in AWS Console
          </Button>
                    <Button size="sm" variant="outline" onClick={() => handleViewCommitDetails("latest")}>            <GitCommit className="h-4 w-4 mr-2" />            View Commit Details          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 