import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAwsContext } from '../context/AwsContext';

// Mock data types for CloudWatch
interface ServiceMetric {
  service: string;
  alarms: number;
  insufficient: number;
  ok: number;
  status: 'critical' | 'warning' | 'ok';
}

interface CloudWatchAlarm {
  name: string;
  status: 'ALARM' | 'INSUFFICIENT_DATA' | 'OK';
  metric: string;
  statistic: string;
  period: number;
  threshold: number;
  service: string;
  region: string;
  chartData: number[];
}

export default function CloudWatchTab() {
  const { awsRegion, filteredHealthChecks, isRefreshing: isContextRefreshing, handleRefresh } = useAwsContext();
  const [timeRange, setTimeRange] = useState<"1h" | "3h" | "12h" | "1d" | "3d" | "1w" | "custom">("1h");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetric[]>([]);
  const [alarms, setAlarms] = useState<CloudWatchAlarm[]>([]);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const chartUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Generate realistic service metrics based on health checks
  useEffect(() => {
    // Group health checks by service
    const serviceGroups = filteredHealthChecks.reduce((acc, check) => {
      if (!acc[check.service]) {
        acc[check.service] = {
          critical: 0,
          degraded: 0,
          healthy: 0
        };
      }
      
      if (check.status === 'unhealthy') {
        acc[check.service].critical++;
      } else if (check.status === 'degraded') {
        acc[check.service].degraded++;
      } else {
        acc[check.service].healthy++;
      }
      
      return acc;
    }, {} as Record<string, { critical: number, degraded: number, healthy: number }>);
    
    // Convert to service metrics
    const metrics: ServiceMetric[] = Object.entries(serviceGroups).map(([service, counts]) => {
      let status: 'critical' | 'warning' | 'ok' = 'ok';
      if (counts.critical > 0) {
        status = 'critical';
      } else if (counts.degraded > 0) {
        status = 'warning';
      }
      
      return {
        service,
        alarms: counts.critical,
        insufficient: counts.degraded,
        ok: counts.healthy,
        status
      };
    });
    
    setServiceMetrics(metrics);
    
    // Generate alarms based on health checks
    const newAlarms: CloudWatchAlarm[] = [];
    
    filteredHealthChecks.forEach(check => {
      if (check.status !== 'healthy') {
        const metricType = getRandomMetricType(check.resourceType);
        const threshold = getRandomThreshold(metricType);
        
        newAlarms.push({
          name: `${check.service} ${check.resource} ${metricType}`,
          status: check.status === 'unhealthy' ? 'ALARM' : 'INSUFFICIENT_DATA',
          metric: metricType,
          statistic: getRandomStatistic(),
          period: 60,
          threshold,
          service: check.service,
          region: check.region,
          chartData: generateChartData(15, threshold, check.status === 'unhealthy')
        });
      }
    });
    
    // Add some OK alarms to make it realistic
    const healthyChecks = filteredHealthChecks.filter(check => check.status === 'healthy');
    if (healthyChecks.length > 0) {
      for (let i = 0; i < Math.min(3, healthyChecks.length); i++) {
        const check = healthyChecks[i];
        const metricType = getRandomMetricType(check.resourceType);
        const threshold = getRandomThreshold(metricType);
        
        newAlarms.push({
          name: `${check.service} ${check.resource} ${metricType}`,
          status: 'OK',
          metric: metricType,
          statistic: getRandomStatistic(),
          period: 60,
          threshold,
          service: check.service,
          region: check.region,
          chartData: generateChartData(15, threshold, false, true)
        });
      }
    }
    
    setAlarms(newAlarms);
  }, [filteredHealthChecks]);
  
  // Auto-update chart data
  useEffect(() => {
    if (chartUpdateInterval.current) {
      clearInterval(chartUpdateInterval.current);
    }
    
    chartUpdateInterval.current = setInterval(() => {
      setAlarms(prevAlarms => 
        prevAlarms.map(alarm => ({
          ...alarm,
          chartData: updateChartData(alarm.chartData, alarm.threshold, alarm.status === 'ALARM')
        }))
      );
    }, 5000);
    
    return () => {
      if (chartUpdateInterval.current) {
        clearInterval(chartUpdateInterval.current);
      }
    };
  }, []);
  
  // Auto refresh setup
  useEffect(() => {
    if (isAutoRefresh) {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
      
      autoRefreshInterval.current = setInterval(() => {
        handleCloudWatchRefresh();
      }, 60000); // Refresh every minute
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
        autoRefreshInterval.current = null;
      }
    }
    
    return () => {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    };
  }, [isAutoRefresh]);
  
  // Helper functions for generating realistic CloudWatch data
  function getRandomMetricType(resourceType: string): string {
    const metricTypes: Record<string, string[]> = {
      'EC2': ['CPUUtilization', 'NetworkIn', 'NetworkOut', 'DiskReadOps', 'DiskWriteOps'],
      'Lambda': ['Invocations', 'Errors', 'Duration', 'Throttles', 'ConcurrentExecutions'],
      'RDS': ['CPUUtilization', 'DatabaseConnections', 'ReadIOPS', 'WriteIOPS', 'FreeStorageSpace'],
      'DynamoDB': ['ConsumedReadCapacityUnits', 'ConsumedWriteCapacityUnits', 'ThrottledRequests', 'SystemErrors'],
      'S3': ['BucketSizeBytes', 'NumberOfObjects', 'AllRequests', '4xxErrors', '5xxErrors'],
      'ECS': ['CPUUtilization', 'MemoryUtilization', 'RunningTaskCount'],
      'EKS': ['cluster_failed_node_count', 'node_cpu_utilization', 'node_memory_utilization'],
      'CloudFront': ['Requests', 'BytesDownloaded', 'BytesUploaded', 'TotalErrorRate'],
      'API Gateway': ['Count', 'Latency', '4XXError', '5XXError', 'IntegrationLatency'],
      'ElastiCache': ['CPUUtilization', 'EngineCPUUtilization', 'NetworkBytesIn', 'NetworkBytesOut', 'CurrConnections'],
      'SQS': ['NumberOfMessagesSent', 'NumberOfMessagesReceived', 'ApproximateNumberOfMessagesVisible', 'ApproximateAgeOfOldestMessage'],
      'SNS': ['NumberOfMessagesPublished', 'NumberOfNotificationsDelivered', 'NumberOfNotificationsFailed'],
    };
    
    // Default to generic metrics if resource type is unknown
    const metrics = metricTypes[resourceType] || ['Utilization', 'ErrorRate', 'Latency', 'Throughput', 'Availability'];
    return metrics[Math.floor(Math.random() * metrics.length)];
  }
  
  function getRandomStatistic(): string {
    const statistics = ['Average', 'Sum', 'Maximum', 'Minimum', 'SampleCount', 'p90', 'p95', 'p99'];
    return statistics[Math.floor(Math.random() * statistics.length)];
  }
  
  function getRandomThreshold(metricType: string): number {
    // Different metric types have different reasonable thresholds
    if (metricType.includes('CPU') || metricType.includes('Utilization')) {
      return 80 + Math.random() * 15; // 80-95%
    } else if (metricType.includes('Error') || metricType.includes('Throttle')) {
      return 5 + Math.random() * 10; // 5-15%
    } else if (metricType.includes('Latency') || metricType.includes('Duration')) {
      return 200 + Math.random() * 800; // 200-1000ms
    } else {
      return 1000 + Math.random() * 9000; // 1000-10000 (generic high number)
    }
  }
  
  function generateChartData(length: number, threshold: number, isAlarming: boolean, isHealthy: boolean = false): number[] {
    const data = [];
    const baseValue = isHealthy ? threshold * 0.7 : threshold * 0.9;
    const variation = threshold * 0.3;
    
    for (let i = 0; i < length; i++) {
      if (isAlarming && i > length - 5) {
        // Last few points exceed threshold for alarming metrics
        data.push(threshold + (Math.random() * variation));
      } else if (isHealthy) {
        // Healthy metrics stay below threshold
        data.push(baseValue - (Math.random() * variation));
      } else {
        // Other metrics randomly approach the threshold
        data.push(baseValue + (Math.random() * variation * 2) - variation);
      }
    }
    
    return data;
  }
  
  function updateChartData(existingData: number[], threshold: number, isAlarming: boolean): number[] {
    // Remove oldest point and add a new one
    const newData = [...existingData.slice(1)];
    
    if (isAlarming) {
      // For alarming metrics, new points tend to stay above threshold
      newData.push(threshold + (Math.random() * threshold * 0.3));
    } else {
      // For non-alarming metrics, new points fluctuate around 70-90% of threshold
      const baseValue = threshold * (0.7 + Math.random() * 0.2);
      newData.push(baseValue);
    }
    
    return newData;
  }
  
  function generateMultiMetricData(length: number, threshold: number, count = 2): number[][] {
    const datasets = [];
    
    for (let i = 0; i < count; i++) {
      const baseValue = threshold * (0.4 + (i * 0.2)); // Different base values for each metric
      const variation = threshold * (0.2 + (i * 0.05));
      const data = [];
      
      for (let j = 0; j < length; j++) {
        data.push(baseValue + (Math.random() * variation * 2) - variation);
      }
      
      datasets.push(data);
    }
    
    return datasets;
  }
  
  // Draw a simple line chart for CloudWatch metric
  function renderLineChart(data: number[], threshold: number, status: 'ALARM' | 'INSUFFICIENT_DATA' | 'OK'): JSX.Element {
    const max = Math.max(...data, threshold) * 1.1;
    const min = Math.min(...data) * 0.9;
    const range = max - min;
    
    // Convert data points to SVG path
    const pathPoints = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    // Create path for the area under the line (lighter fill)
    const areaPath = `
      M 0 ${100 - ((data[0] - min) / range) * 100}
      ${pathPoints.substring(2)}
      L 100 100
      L 0 100
      Z
    `;
    
    // Calculate threshold line position
    const thresholdY = 100 - ((threshold - min) / range) * 100;
    
    // Use AWS CloudWatch colors
    const chartColor = 
      status === 'ALARM' ? 'stroke-red-600' : 
      status === 'INSUFFICIENT_DATA' ? 'stroke-amber-500' : 
      'stroke-blue-500';
    
    const fillColor = 
      status === 'ALARM' ? 'fill-red-100/20' : 
      status === 'INSUFFICIENT_DATA' ? 'fill-amber-100/20' : 
      'fill-blue-100/20';
    
    const lastPoint = data[data.length - 1];
    const lastY = 100 - ((lastPoint - min) / range) * 100;
    
    // Generate time labels for x-axis (last 3 hours with 30min intervals)
    const now = new Date();
    const timeLabels = [];
    for (let i = 6; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 30 * 60 * 1000));
      const hours = time.getHours();
      const minutes = time.getMinutes();
      timeLabels.push({
        position: 100 - (i * (100/6)),
        label: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      });
    }
    
    return (
      <div className="w-full h-full relative">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="0" x2="100" y2="0" className="stroke-gray-200" strokeWidth="0.5" />
          <line x1="0" y1="25" x2="100" y2="25" className="stroke-gray-200" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" className="stroke-gray-200" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" className="stroke-gray-200" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="100" y2="100" className="stroke-gray-200" strokeWidth="0.5" />
          
          {/* Vertical grid lines */}
          {timeLabels.map((label, i) => (
            <line 
              key={`grid-${i}`}
              x1={label.position} 
              y1="0" 
              x2={label.position} 
              y2="100" 
              className="stroke-gray-200" 
              strokeWidth="0.5" 
            />
          ))}
          
          {/* Area fill under the line */}
          <path
            d={areaPath}
            className={`${fillColor}`}
          />
          
          {/* Threshold line */}
          <line
            x1="0"
            y1={thresholdY}
            x2="100"
            y2={thresholdY}
            className="stroke-gray-500"
            strokeWidth="0.5"
            strokeDasharray="2"
          />
          
          {/* Data line */}
          <path
            d={pathPoints}
            fill="none"
            className={`${chartColor} stroke-1.5`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Latest point */}
          <circle
            cx="100"
            cy={lastY}
            r="1.5"
            className={chartColor.replace('stroke-', 'fill-')}
          />
        </svg>
        
        {/* Y-axis label */}
        <div className="absolute right-0 text-[9px] text-gray-500" style={{ top: `${thresholdY}%`, transform: 'translateY(-50%)' }}>
          {threshold.toFixed(1)}
        </div>
        
        {/* Time labels on x-axis */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[8px] text-gray-500">
          {timeLabels.map((label, i) => (
            <div key={i} style={{ position: 'absolute', left: `${label.position}%`, transform: 'translateX(-50%)' }}>
              {label.label}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Draw a multi-metric chart with multiple lines
  function renderMultiMetricChart(datasets: number[][], threshold: number = 0): JSX.Element {
    // Find overall min/max across all datasets
    const allValues = datasets.flat();
    const max = Math.max(...allValues) * 1.1;
    const min = Math.min(...allValues) * 0.9;
    const range = max - min;
    
    // Define AWS-like colors for multiple metrics
    const colors = [
      { stroke: 'stroke-blue-500', fill: 'fill-blue-500' },
      { stroke: 'stroke-orange-500', fill: 'fill-orange-500' },
      { stroke: 'stroke-green-500', fill: 'fill-green-500' },
      { stroke: 'stroke-purple-500', fill: 'fill-purple-500' },
      { stroke: 'stroke-cyan-500', fill: 'fill-cyan-500' }
    ];
    
    // Generate paths for each dataset
    const paths = datasets.map((data, datasetIndex) => {
      const pathPoints = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');
      
      return {
        path: pathPoints,
        color: colors[datasetIndex % colors.length],
        lastPoint: {
          value: data[data.length - 1],
          y: 100 - ((data[data.length - 1] - min) / range) * 100
        }
      };
    });
    
    // Calculate threshold line position if provided
    const thresholdY = threshold ? 100 - ((threshold - min) / range) * 100 : null;
    
    // Generate time labels for x-axis (last 3 hours with 30min intervals)
    const now = new Date();
    const timeLabels = [];
    for (let i = 6; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 30 * 60 * 1000));
      const hours = time.getHours();
      const minutes = time.getMinutes();
      timeLabels.push({
        position: 100 - (i * (100/6)),
        label: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      });
    }
    
    return (
      <div className="w-full h-full relative">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="0" x2="100" y2="0" className="stroke-gray-200" strokeWidth="0.5" />
          <line x1="0" y1="25" x2="100" y2="25" className="stroke-gray-200" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" className="stroke-gray-200" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" className="stroke-gray-200" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="100" y2="100" className="stroke-gray-200" strokeWidth="0.5" />
          
          {/* Vertical grid lines */}
          {timeLabels.map((label, i) => (
            <line 
              key={`grid-${i}`}
              x1={label.position} 
              y1="0" 
              x2={label.position} 
              y2="100" 
              className="stroke-gray-200" 
              strokeWidth="0.5" 
            />
          ))}
          
          {/* Threshold line if provided */}
          {thresholdY && (
            <line
              x1="0"
              y1={thresholdY}
              x2="100"
              y2={thresholdY}
              className="stroke-gray-500"
              strokeWidth="0.5"
              strokeDasharray="2"
            />
          )}
          
          {/* Data lines */}
          {paths.map((pathData, index) => (
            <React.Fragment key={`dataset-${index}`}>
              <path
                d={pathData.path}
                fill="none"
                className={`${pathData.color.stroke} stroke-1.5`}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="100"
                cy={pathData.lastPoint.y}
                r="1.5"
                className={pathData.color.fill}
              />
            </React.Fragment>
          ))}
        </svg>
        
        {/* Y-axis threshold label if provided */}
        {thresholdY && (
          <div className="absolute right-0 text-[9px] text-gray-500" style={{ top: `${thresholdY}%`, transform: 'translateY(-50%)' }}>
            {threshold.toFixed(1)}
          </div>
        )}
        
        {/* Time labels on x-axis */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[8px] text-gray-500">
          {timeLabels.map((label, i) => (
            <div key={i} style={{ position: 'absolute', left: `${label.position}%`, transform: 'translateX(-50%)' }}>
              {label.label}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range as any);
    handleCloudWatchRefresh();
  };
  
  // Handle CloudWatch refresh
  const handleCloudWatchRefresh = () => {
    setIsRefreshing(true);
    handleRefresh().finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    });
  };
  
  // Toggle auto refresh
  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
  };
  
  // Handle CloudWatch action
  const handleCloudWatchAction = (action: string) => {
    alert(`Performing CloudWatch action: ${action}`);
  };
  
  // View AWS Console
  const handleViewAwsConsole = (service: string) => {
    alert(`Opening AWS Console: ${service}`);
  };
  
  // View alarm details
  const handleViewAlarmDetails = (alarmName: string) => {
    alert(`Viewing alarm details for: ${alarmName}`);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">CloudWatch: Overview</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Time range:</span>
              <Select defaultValue="1h" onValueChange={handleTimeRangeChange}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue placeholder="1h" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1h</SelectItem>
                  <SelectItem value="3h">3h</SelectItem>
                  <SelectItem value="12h">12h</SelectItem>
                  <SelectItem value="1d">1d</SelectItem>
                  <SelectItem value="3d">3d</SelectItem>
                  <SelectItem value="1w">1w</SelectItem>
                  <SelectItem value="custom">custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 px-2" 
                onClick={handleCloudWatchRefresh}
                disabled={isRefreshing || isContextRefreshing}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing || isContextRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing || isContextRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                size="sm"
                variant={isAutoRefresh ? "default" : "outline"}
                className="h-8 px-2"
                onClick={toggleAutoRefresh}
              >
                {isAutoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
              </Button>
              <Select defaultValue="actions" onValueChange={handleCloudWatchAction}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue placeholder="Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actions">Actions</SelectItem>
                  <SelectItem value="add">Add to dashboard</SelectItem>
                  <SelectItem value="create">Create alarm</SelectItem>
                  <SelectItem value="export">Export data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* AWS Services Summary Section */}
        <div className="mb-6 border rounded-md">
          <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <h4 className="font-medium text-sm">AWS services summary</h4>
            <button className="text-blue-600 hover:underline text-xs" onClick={() => handleViewAwsConsole("CloudWatch/Services")}>View details</button>
          </div>
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Services</TableHead>
                  <TableHead className="text-center">Alarm</TableHead>
                  <TableHead className="text-center">Insufficient Data</TableHead>
                  <TableHead className="text-center">OK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceMetrics.length > 0 ? (
                  serviceMetrics.map((metric, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium flex items-center">
                        <span 
                          className={`h-2 w-2 rounded-full mr-2 ${
                            metric.status === 'critical' ? 'bg-red-500' : 
                            metric.status === 'warning' ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                        ></span> 
                        <span className="cursor-pointer hover:text-blue-600">{metric.service}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {metric.alarms > 0 && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                            {metric.alarms}
                          </Badge>
                        )}
                        {metric.alarms === 0 && "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {metric.insufficient > 0 && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            {metric.insufficient}
                          </Badge>
                        )}
                        {metric.insufficient === 0 && "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {metric.ok > 0 && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                            {metric.ok}
                          </Badge>
                        )}
                        {metric.ok === 0 && "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No services found in the selected region
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Recent Alarms Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm">Recent alarms</h4>
            <button className="text-blue-600 hover:underline text-xs" onClick={() => handleViewAwsConsole("CloudWatch/Alarms")}>View all</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alarms.slice(0, 4).map((alarm, index) => (
              <div key={index} className="border rounded-md overflow-hidden">
                <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                  <div className="flex items-center">
                    <span 
                      className={`h-2 w-2 rounded-full mr-2 ${
                        alarm.status === 'ALARM' ? 'bg-red-500' : 
                        alarm.status === 'INSUFFICIENT_DATA' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                    ></span>
                    <h5 className="font-medium text-sm cursor-pointer hover:text-blue-600" onClick={() => handleViewAlarmDetails(alarm.name)}>
                      {alarm.name}
                    </h5>
                  </div>
                  {alarm.status === 'ALARM' && (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {alarm.status}
                    </Badge>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{alarm.metric} ({alarm.statistic}, {alarm.period}s)</span>
                      <span>Threshold: {alarm.threshold.toFixed(1)}</span>
                    </div>
                    <div className="relative h-36 mt-2 border-b border-gray-200 pb-1">
                      {renderLineChart(alarm.chartData, alarm.threshold, alarm.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Default dashboard section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm">Default dashboard</h4>
            <button className="text-blue-600 hover:underline text-xs" onClick={() => handleViewAwsConsole("CloudWatch/Dashboard")}>Edit dashboard</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Show first two charts as single-metric */}
            {alarms.slice(0, 2).map((alarm, index) => (
              <div key={`dashboard-${index}`} className="border rounded-md overflow-hidden">
                <div className="p-3">
                  <div className="text-xs font-medium">{alarm.service} - {alarm.metric}</div>
                  <div className="text-xs text-gray-500">{alarm.statistic}, {timeRange} period</div>
                  <div className="h-32 mt-2">
                    {renderLineChart(alarm.chartData, alarm.threshold, alarm.status)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Show multi-metric charts for the rest */}
            <div className="border rounded-md overflow-hidden">
              <div className="p-3">
                <div className="text-xs font-medium">CPU Utilization</div>
                <div className="text-xs text-gray-500">Average, {timeRange} period</div>
                <div className="text-xs text-gray-500 flex space-x-3 mt-1">
                  <div className="flex items-center">
                    <div className="w-3 h-1 bg-blue-500 mr-1"></div>
                    <span>API Service</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-1 bg-orange-500 mr-1"></div>
                    <span>Worker Service</span>
                  </div>
                </div>
                <div className="h-32 mt-2">
                  {renderMultiMetricChart(generateMultiMetricData(15, 80, 2), 75)}
                </div>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <div className="p-3">
                <div className="text-xs font-medium">Network Traffic</div>
                <div className="text-xs text-gray-500">Sum, {timeRange} period</div>
                <div className="text-xs text-gray-500 flex space-x-3 mt-1">
                  <div className="flex items-center">
                    <div className="w-3 h-1 bg-blue-500 mr-1"></div>
                    <span>Inbound</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-1 bg-orange-500 mr-1"></div>
                    <span>Outbound</span>
                  </div>
                </div>
                <div className="h-32 mt-2">
                  {renderMultiMetricChart(generateMultiMetricData(15, 5000, 2))}
                </div>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <div className="p-3">
                <div className="text-xs font-medium">Database Metrics</div>
                <div className="text-xs text-gray-500">Average, {timeRange} period</div>
                <div className="text-xs text-gray-500 flex space-x-3 mt-1">
                  <div className="flex items-center">
                    <div className="w-3 h-1 bg-blue-500 mr-1"></div>
                    <span>Connection Count</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-1 bg-orange-500 mr-1"></div>
                    <span>Query Time (ms)</span>
                  </div>
                </div>
                <div className="h-32 mt-2">
                  {renderMultiMetricChart(generateMultiMetricData(15, 200, 2))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 