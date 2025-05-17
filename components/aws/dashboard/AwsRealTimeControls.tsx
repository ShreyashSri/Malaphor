import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  CheckCircle2,
  Server,
  ShieldAlert,
  RefreshCw
} from "lucide-react";

interface AwsRealTimeControlsProps {
  isSimulating: boolean;
  simulationSpeed: string;
  onSimulationSpeedChange: (speed: string) => void;
  onTriggerIssue: () => Promise<void>;
  selectedService: string;
}

export default function AwsRealTimeControls({
  isSimulating,
  simulationSpeed,
  onSimulationSpeedChange,
  onTriggerIssue,
  selectedService
}: AwsRealTimeControlsProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  
  // Handle trigger issue
  const handleTriggerIssue = async () => {
    setIsTriggering(true);
    try {
      await onTriggerIssue();
    } finally {
      setIsTriggering(false);
    }
  };
  
  return (
    <div className="flex items-center justify-between border rounded-md p-3">
      <div className="flex items-center space-x-4">
        <div>
          <Label htmlFor="simulation-speed" className="text-xs text-gray-500 block mb-1">
            Simulation Speed
          </Label>
          <Select value={simulationSpeed} onValueChange={onSimulationSpeedChange} disabled={!isSimulating}>
            <SelectTrigger id="simulation-speed" className="w-40 h-8">
              <SelectValue placeholder="Simulation Speed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2000">Very Fast (2s)</SelectItem>
              <SelectItem value="5000">Fast (5s)</SelectItem>
              <SelectItem value="10000">Normal (10s)</SelectItem>
              <SelectItem value="20000">Slow (20s)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="simulation-status" className="text-xs text-gray-500 block mb-1">
            Status
          </Label>
          <div id="simulation-status" className="flex items-center">
            {isSimulating ? (
              <>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm">Active</span>
                <div className="ml-2 h-4 w-4 animate-spin">
                  <RefreshCw className="h-4 w-4 text-gray-400" />
                </div>
              </>
            ) : (
              <>
                <div className="h-2 w-2 bg-gray-300 rounded-full mr-2"></div>
                <span className="text-sm text-gray-500">Inactive</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTriggerIssue}
          disabled={isTriggering || !isSimulating}
          className="relative"
        >
          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
          Simulate Issue
          {isTriggering && (
            <div className="absolute inset-0 bg-background/80 rounded flex items-center justify-center">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {}}
        >
          <Server className="h-4 w-4 mr-2 text-blue-500" />
          Deploy Service
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {}}
        >
          <ShieldAlert className="h-4 w-4 mr-2 text-orange-500" />
          Security Scan
        </Button>
      </div>
    </div>
  );
} 