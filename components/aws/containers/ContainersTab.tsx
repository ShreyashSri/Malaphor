import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, Boxes } from "lucide-react";

export default function ContainersTab() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Boxes className="h-5 w-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-semibold">Container Services</h3>
          </div>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center py-10 border rounded-md bg-gray-50 dark:bg-gray-800/30">
          <div className="text-muted-foreground text-center max-w-md">
            <p className="mb-2">Container Services panel is under development.</p>
            <p className="text-sm">
              This tab will soon provide management and monitoring for ECS, EKS, and Fargate services, including
              container health, deployment status, and resource usage metrics.
            </p>
          </div>
          
          <Button className="mt-4">Check Implementation Status</Button>
        </div>
      </CardContent>
    </Card>
  );
} 