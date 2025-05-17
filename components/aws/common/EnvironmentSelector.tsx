import { useEffect, useState, useMemo } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAwsContext } from '../context/AwsContext';

interface EnvironmentSelectorProps {
  value?: string;
  onChange: (environment: string) => void;
  label?: string;
  includeAllOption?: boolean;
  triggerClassName?: string;
  disabled?: boolean;
}

export default function EnvironmentSelector({
  value,
  onChange,
  label = "Environment",
  includeAllOption = true,
  triggerClassName = "w-40",
  disabled = false
}: EnvironmentSelectorProps) {
  const { deployments, services } = useAwsContext();
  const [selectedValue, setSelectedValue] = useState(value || (includeAllOption ? "all" : ""));
  
  // Get all available environments from services and deployments
  const environments = useMemo(() => {
    const envSet = new Set<string>();
    
    // Add environments from services
    services.forEach(s => {
      if (s.tags?.Environment) {
        envSet.add(s.tags.Environment);
      }
    });
    
    // Add environments from deployments
    deployments.forEach(d => {
      if (d.environment) {
        envSet.add(d.environment);
      }
    });
    
    // Add standard environments if they don't exist
    ['production', 'staging', 'development'].forEach(env => envSet.add(env));
    
    // Convert to array and sort
    return Array.from(envSet).sort();
  }, [deployments, services]);
  
  // Update internal state when the external value changes
  useEffect(() => {
    if (value !== undefined && value !== selectedValue) {
      setSelectedValue(value);
    }
  }, [value]);
  
  // Handle selection change
  const handleChange = (newValue: string) => {
    setSelectedValue(newValue);
    onChange(newValue);
  };
  
  return (
    <div className="flex flex-col space-y-1">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <Select
        value={selectedValue}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder="Select environment..." />
        </SelectTrigger>
        <SelectContent>
          {includeAllOption && (
            <SelectItem value="all">All Environments</SelectItem>
          )}
          {environments.map(env => (
            <SelectItem key={env} value={env}>{env}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 