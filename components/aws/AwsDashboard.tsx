import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

// Import context provider
import { AwsProvider, useAwsContext } from './context/AwsContext';

// Import all tab components
import DeploymentsTab from './deployments/DeploymentsTab';
import DeploymentManagementTab from './deployment-mgmt/DeploymentManagementTab';
import CodeCicdTab from './codecicd/CodeCicdTab';
import CloudWatchTab from './cloudwatch/CloudWatchTab';
import ContainersTab from './containers/ContainersTab';
import SystemsManagerTab from './systems-mgr/SystemsManagerTab';
import AwsRegionSelector from './dashboard/AwsRegionSelector';
import AwsHealthStatusCards from './dashboard/AwsHealthStatusCards';

// Dashboard content component (uses context)
function AwsDashboardContent() {
  // Get data and functions from context
  const { 
    awsRegion, 
    setAwsRegion, 
    isRefreshing, 
    filteredHealthChecks,
    filteredDeployments,
    filteredServices,
    handleRefresh
  } = useAwsContext();
  
  // Local state for active tab
  const [activeTab, setActiveTab] = useState("deployment-mgmt");
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">

          
          {/* Region selector and controls */}
          <div className="mb-6">
            <AwsRegionSelector
              awsRegion={awsRegion}
              setAwsRegion={setAwsRegion}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          </div>
          
          {/* Health status cards */}
          <AwsHealthStatusCards healthChecks={filteredHealthChecks} />
        </CardContent>
      </Card>
      
      {/* AWS Integration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="deployment-mgmt">Deploy Mgmt</TabsTrigger>
          <TabsTrigger value="codecicd">CI/CD</TabsTrigger>
          <TabsTrigger value="cloudwatch">CloudWatch</TabsTrigger>
          <TabsTrigger value="containers">Containers</TabsTrigger>
          <TabsTrigger value="systemsmgr">Systems</TabsTrigger>
        </TabsList>
        
        {/* Deployments Tab */}
        <TabsContent value="deployments">
          <DeploymentsTab deployments={filteredDeployments} />
        </TabsContent>
        
        {/* Deployment Management Tab */}
        <TabsContent value="deployment-mgmt">
          <DeploymentManagementTab services={filteredServices} />
        </TabsContent>
        
        {/* CodeDeploy/Pipeline Tab */}
        <TabsContent value="codecicd">
          <CodeCicdTab />
        </TabsContent>
        
        {/* CloudWatch Tab */}
        <TabsContent value="cloudwatch">
          <CloudWatchTab />
        </TabsContent>
        
        {/* Container Services Tab */}
        <TabsContent value="containers">
          <ContainersTab />
        </TabsContent>
        
        {/* Systems Manager Tab */}
        <TabsContent value="systemsmgr">
          <SystemsManagerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main dashboard component with provider
export default function AwsDashboard() {
  return (
    <AwsProvider>
      <AwsDashboardContent />
    </AwsProvider>
  );
} 