import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AwsService } from '@/lib/api';
import { 
  Code, 
  Beaker, 
  Shield, 
  CheckCircle2, 
  UploadCloud, 
  CheckSquare,
  GitBranch,
  Check,
  Clock
} from "lucide-react";

interface DeploymentManagementTabProps {
  services: AwsService[];
}

export default function DeploymentManagementTab({ services }: DeploymentManagementTabProps) {
  const [deploymentEnv, setDeploymentEnv] = useState("production");
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Deployment Management</h3>
          <div className="flex items-center space-x-2">
            <Select value={deploymentEnv} onValueChange={setDeploymentEnv}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CI/CD Pipeline Visualization */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">CI/CD Pipeline</h4>
          <div className="border rounded-md p-4">
            <div className="flex flex-col space-y-6">
              {/* Pipeline stages with connection lines */}
              <div className="relative py-4">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                <div className="relative flex justify-between">
                  {/* Build Stage */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                      <Code className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">Build</span>
                    <div className="text-xs text-muted-foreground mt-1">Passed</div>
                  </div>
                  
                  {/* Test Stage */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                      <Beaker className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">Test</span>
                    <div className="text-xs text-muted-foreground mt-1">Passed</div>
                  </div>
                  
                  {/* Security Scan Stage */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                      <Shield className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">Security</span>
                    <div className="text-xs text-muted-foreground mt-1">Passed</div>
                  </div>
                  
                  {/* Approval Stage */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">Approval</span>
                    <div className="text-xs text-muted-foreground mt-1">Approved</div>
                  </div>
                  
                  {/* Deploy Stage */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">Deploy</span>
                    <div className="text-xs text-muted-foreground mt-1">In Progress</div>
                  </div>
                  
                  {/* Verify Stage */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-2">
                      <CheckSquare className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">Verify</span>
                    <div className="text-xs text-muted-foreground mt-1">Pending</div>
                  </div>
                </div>
              </div>
              
              {/* Latest deployment details */}
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-md p-3 mt-4">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm font-medium">Latest Deployment: v2.4.1</div>
                    <div className="text-xs text-muted-foreground">Started: {new Date().toLocaleString()}</div>
                  </div>
                  <Badge>Blue/Green</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* GitOps Integration Section */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">GitOps Integration</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-4">
              <h5 className="text-sm font-medium mb-2">Infrastructure Repository</h5>
              <div className="flex items-center text-sm mb-1">
                <GitBranch className="h-4 w-4 mr-2" />
                <span>malaphor/infrastructure</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3">Last commit: 2 hours ago</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span>CloudFormation</span>
                  <Badge variant="outline">Up to date</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Terraform</span>
                  <Badge variant="outline">Up to date</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Kubernetes</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Drift detected</Badge>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <h5 className="text-sm font-medium mb-2">Approval Process</h5>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1 mr-2">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Code Review</div>
                    <div className="text-xs text-muted-foreground">Approved by John Doe</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1 mr-2">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Security Review</div>
                    <div className="text-xs text-muted-foreground">Approved by Security Team</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1 mr-2">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">QA Verification</div>
                    <div className="text-xs text-muted-foreground">Approved by QA Team</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1 mr-2">
                    <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium">Production Approval</div>
                    <div className="text-xs text-muted-foreground">Pending final approval</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Deployment Metrics Section */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Deployment Metrics</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-md p-4">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">94%</div>
                <div className="text-sm mt-1">Deployment Success Rate</div>
                <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
              </div>
            </div>
            <div className="border rounded-md p-4">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold">17</div>
                <div className="text-sm mt-1">Deployments This Month</div>
                <div className="text-xs text-muted-foreground mt-1">+5 from last month</div>
              </div>
            </div>
            <div className="border rounded-md p-4">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">12m</div>
                <div className="text-sm mt-1">Average Deploy Time</div>
                <div className="text-xs text-muted-foreground mt-1">-2m from last month</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Change History Section */}
        <div>
          <h4 className="text-sm font-medium mb-3">Change History</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{new Date().toLocaleDateString()}</TableCell>
                  <TableCell>Updated IAM roles for enhanced security</TableCell>
                  <TableCell>DevOps Team</TableCell>
                  <TableCell>Security Team</TableCell>
                  <TableCell><Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Deployed</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{new Date(Date.now() - 86400000).toLocaleDateString()}</TableCell>
                  <TableCell>Added CloudWatch alerts for Lambda timeouts</TableCell>
                  <TableCell>Maria Garcia</TableCell>
                  <TableCell>John Doe</TableCell>
                  <TableCell><Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Deployed</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{new Date(Date.now() - 172800000).toLocaleDateString()}</TableCell>
                  <TableCell>Updated RDS instance class</TableCell>
                  <TableCell>Database Team</TableCell>
                  <TableCell>Operations Team</TableCell>
                  <TableCell><Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Deployed</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{new Date(Date.now() - 259200000).toLocaleDateString()}</TableCell>
                  <TableCell>Added auto-scaling policy for ECS cluster</TableCell>
                  <TableCell>Alex Williams</TableCell>
                  <TableCell>Ops Manager</TableCell>
                  <TableCell><Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Deployed</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 