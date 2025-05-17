import { useEffect, useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAwsContext } from '../context/AwsContext';

interface ServiceSelectorProps {
  value?: string;
  onChange: (serviceName: string) => void;
  label?: string;
  includeAllOption?: boolean;
  triggerClassName?: string;
  disabled?: boolean;
}

export default function ServiceSelector({
  value,
  onChange,
  label = "Service",
  includeAllOption = true,
  triggerClassName = "w-48",
  disabled = false
}: ServiceSelectorProps) {
  const { services } = useAwsContext();
  const [selectedValue, setSelectedValue] = useState(value || (includeAllOption ? "all" : ""));
  
  // Create an array of unique service names
  const serviceNames = Array.from(new Set(services.map(s => s.name))).sort();
  
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
          <SelectValue placeholder="Select service..." />
        </SelectTrigger>
        <SelectContent>
          {includeAllOption && (
            <SelectItem value="all">All Services</SelectItem>
          )}
          {serviceNames.map(name => (
            <SelectItem key={name} value={name}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 