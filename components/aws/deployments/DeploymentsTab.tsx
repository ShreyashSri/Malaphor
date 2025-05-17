import { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AwsDeployment } from '@/lib/api';
import { RefreshCw, Eye, GitCommit, Server, Package, Check, XCircle, AlertTriangle, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Import common components
import ServiceSelector from '../common/ServiceSelector';
import EnvironmentSelector from '../common/EnvironmentSelector';
import { useAwsContext } from '../context/AwsContext';

interface DeploymentsTabProps {
  deployments: AwsDeployment[];
}

export default function DeploymentsTab({ deployments }: DeploymentsTabProps) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [envFilter, setEnvFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [selectedDeployment, setSelectedDeployment] = useState<AwsDeployment | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtered deployments based on search and filters
  const filteredDeployments = deployments.filter(deployment => {
    // Search query filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === "" || 
      deployment.service.toLowerCase().includes(searchLower) ||
      deployment.version.toLowerCase().includes(searchLower) ||
      deployment.commit.toLowerCase().includes(searchLower) ||
      deployment.triggeredBy.toLowerCase().includes(searchLower) ||
      (deployment.environment && deployment.environment.toLowerCase().includes(searchLower));
    
    // Status filter
    const matchesStatus = statusFilter === "all" || deployment.status === statusFilter;
    
    // Environment filter
    const matchesEnv = envFilter === "all" || 
      (deployment.environment && deployment.environment === envFilter);

    // Service filter
    const matchesService = serviceFilter === "all" || 
      deployment.service === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesEnv && matchesService;
  });
  
  // Helper function to format deployment duration
  const formatDuration = (duration: number | null): string => {
    if (duration === null) return "In progress";
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    
    return `${seconds}s`;
  };
  
  // View deployment details
  const handleViewDeployment = (deployment: AwsDeployment) => {
    setSelectedDeployment(deployment);
  };

  // Close deployment details
  const handleCloseDetails = () => {
    setSelectedDeployment(null);
  };



  // Get status icon based on deployment status
  const getStatusIcon = (status: 'success' | 'failure' | 'in-progress') => {
    switch (status) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'failure':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in-progress':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter("all");
    setEnvFilter("all");
    setServiceFilter("all");
    setSearchQuery("");
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Deployment History</h3>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search deployments..."
                className="max-w-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleFilters}
                className={showFilters ? "bg-blue-50 text-blue-600 border-blue-200" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mb-4 flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-md">
              <div>
                <p className="text-xs mb-1 text-muted-foreground">Status</p>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <EnvironmentSelector 
                  value={envFilter} 
                  onChange={setEnvFilter}
                  triggerClassName="w-40 h-8"
                />
              </div>

              <div>
                <ServiceSelector 
                  value={serviceFilter} 
                  onChange={setServiceFilter}
                  triggerClassName="w-48 h-8"
                />
              </div>

              <div className="ml-auto self-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Deployed</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Deployed By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeployments.length > 0 ? (
                  filteredDeployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell className="font-medium">{deployment.service}</TableCell>
                      <TableCell>{deployment.version}</TableCell>
                      <TableCell>
                        <Badge className={
                          deployment.status === "success" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                            : deployment.status === "failure"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        }>
                          {deployment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{deployment.environment || "-"}</TableCell>
                      <TableCell>{new Date(deployment.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{formatDuration(deployment.duration)}</TableCell>
                      <TableCell>{deployment.triggeredBy}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewDeployment(deployment)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          

                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                      No deployments found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Details Dialog */}
      <Dialog open={selectedDeployment !== null} onOpenChange={open => !open && handleCloseDetails()}>
        <DialogContent className="max-w-2xl">
          {selectedDeployment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5" />
                  {selectedDeployment.service} Deployment Details
                </DialogTitle>
                <DialogDescription>
                  Deployment of version {selectedDeployment.version} to {selectedDeployment.environment || "default environment"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Deployment Info</h4>
                    <div className="text-sm space-y-2 border rounded-md p-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="flex items-center">
                          {getStatusIcon(selectedDeployment.status)}
                          <span className="ml-1">{selectedDeployment.status}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version:</span>
                        <span>{selectedDeployment.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Environment:</span>
                        <span>{selectedDeployment.environment || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Region:</span>
                        <span>{selectedDeployment.region || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{formatDuration(selectedDeployment.duration)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Timeline</h4>
                    <div className="text-sm space-y-2 border rounded-md p-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started:</span>
                        <span>{new Date(selectedDeployment.timestamp).toLocaleString()}</span>
                      </div>
                      {selectedDeployment.duration && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Completed:</span>
                          <span>
                            {new Date(new Date(selectedDeployment.timestamp).getTime() + selectedDeployment.duration * 1000).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Triggered by:</span>
                        <span>{selectedDeployment.triggeredBy}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Commit Information</h4>
                    <div className="text-sm space-y-2 border rounded-md p-3">
                      <div className="flex items-start">
                        <GitCommit className="h-4 w-4 mr-1 mt-0.5 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-mono">{selectedDeployment.commit}</span>
                          {selectedDeployment.commitUrl && (
                            <a 
                              href={selectedDeployment.commitUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline text-xs mt-1"
                            >
                              View on GitHub
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Artifacts</h4>
                    <div className="text-sm space-y-2 border rounded-md p-3">
                      {selectedDeployment.artifacts && (
                        <>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span className="font-mono">{selectedDeployment.artifacts.imageTag}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Build ID:</span>
                            <span className="font-mono">{selectedDeployment.artifacts.buildId}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {selectedDeployment.status === 'failure' && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-red-600">Failure Information</h4>
                      <div className="text-sm space-y-2 border border-red-200 rounded-md p-3 bg-red-50">
                        <div className="text-red-800">
                          The deployment failed due to one or more issues. Check the logs for more details.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDetails}>
                  Close
                </Button>
                <Button>
                  View Full Logs
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
