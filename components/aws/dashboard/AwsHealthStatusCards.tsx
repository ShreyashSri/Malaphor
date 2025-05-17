import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AwsHealthCheck } from '@/lib/api';
import { useState } from 'react';

interface AwsHealthStatusCardsProps {
  healthChecks: AwsHealthCheck[];
}

export default function AwsHealthStatusCards({ healthChecks }: AwsHealthStatusCardsProps) {
  const [healthStatusFilter, setHealthStatusFilter] = useState<"all" | "healthy" | "degraded" | "unhealthy">("all");
  
  // Get health status counts
  const healthCounts = {
    healthy: healthChecks.filter(h => h.status === 'healthy').length,
    degraded: healthChecks.filter(h => h.status === 'degraded').length,
    unhealthy: healthChecks.filter(h => h.status === 'unhealthy').length,
  };
  
  // Filter health checks based on selected filter
  const filteredHealthChecks = healthStatusFilter === "all" 
    ? healthChecks 
    : healthChecks.filter(h => h.status === healthStatusFilter);
  
  // Group health checks by service
  const healthChecksByService = filteredHealthChecks.reduce((acc, check) => {
    if (!acc[check.service]) {
      acc[check.service] = [];
    }
    acc[check.service].push(check);
    return acc;
  }, {} as Record<string, AwsHealthCheck[]>);
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Card 
          className={`p-4 flex items-center space-x-4 border ${healthStatusFilter === "healthy" ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50' : ''}`}
          onClick={() => setHealthStatusFilter(healthStatusFilter === "healthy" ? "all" : "healthy")}
          role="button"
          tabIndex={0}
        >
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-semibold">{healthCounts.healthy}</div>
            <div className="text-sm text-muted-foreground">Healthy Resources</div>
          </div>
        </Card>
        
        <Card 
          className={`p-4 flex items-center space-x-4 border ${healthStatusFilter === "degraded" ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50' : ''}`}
          onClick={() => setHealthStatusFilter(healthStatusFilter === "degraded" ? "all" : "degraded")}
          role="button"
          tabIndex={0}
        >
          <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-semibold">{healthCounts.degraded}</div>
            <div className="text-sm text-muted-foreground">Degraded Resources</div>
          </div>
        </Card>
        
        <Card 
          className={`p-4 flex items-center space-x-4 border ${healthStatusFilter === "unhealthy" ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50' : ''}`}
          onClick={() => setHealthStatusFilter(healthStatusFilter === "unhealthy" ? "all" : "unhealthy")}
          role="button"
          tabIndex={0}
        >
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-semibold">{healthCounts.unhealthy}</div>
            <div className="text-sm text-muted-foreground">Unhealthy Resources</div>
          </div>
        </Card>
      </div>
      
      {/* Show health check details if any are filtered */}
      {healthStatusFilter !== "all" && filteredHealthChecks.length > 0 && (
        <div className="mb-4 border rounded-md p-3">
          <h4 className="text-sm font-medium mb-2">
            {healthStatusFilter === "healthy" ? "Healthy" : healthStatusFilter === "degraded" ? "Degraded" : "Unhealthy"} Resources
          </h4>
          
          <div className="space-y-3">
            {Object.entries(healthChecksByService).map(([service, checks]) => (
              <div key={service} className="border-b pb-2 last:border-0">
                <div className="font-medium text-sm mb-1">{service}</div>
                <div className="space-y-1">
                  {checks.map(check => (
                    <div key={check.id} className="flex justify-between text-sm">
                      <div className="flex items-center">
                        {check.status === 'healthy' && <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>}
                        {check.status === 'degraded' && <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>}
                        {check.status === 'unhealthy' && <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>}
                        <span>{check.resource}</span>
                      </div>
                      <div className="text-muted-foreground">{check.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
} 