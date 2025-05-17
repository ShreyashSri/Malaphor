import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

interface AwsRegionSelectorProps {
  awsRegion: string;
  setAwsRegion: (region: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function AwsRegionSelector({
  awsRegion,
  setAwsRegion,
  isRefreshing,
  onRefresh
}: AwsRegionSelectorProps) {
  const regions = [
    { name: 'us-east-1', label: 'US East (N. Virginia)' },
    { name: 'us-east-2', label: 'US East (Ohio)' },
    { name: 'us-west-1', label: 'US West (N. California)' },
    { name: 'us-west-2', label: 'US West (Oregon)' },
    { name: 'eu-west-1', label: 'EU (Ireland)' },
    { name: 'eu-central-1', label: 'EU (Frankfurt)' },
    { name: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    { name: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { name: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  ];
  
  return (
    <div className="flex items-center justify-between border rounded-md p-3">
      <div className="flex items-center space-x-2">
        <Label htmlFor="aws-region">AWS Region</Label>
        <Select value={awsRegion} onValueChange={setAwsRegion}>
          <SelectTrigger id="aws-region" className="w-60">
            <SelectValue placeholder="Select AWS Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map(region => (
              <SelectItem key={region.name} value={region.name}>
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  );
} 