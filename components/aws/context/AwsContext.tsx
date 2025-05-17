import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  fetchAwsDeployments, 
  fetchAwsHealthChecks, 
  fetchAwsServices,
  startAwsSimulation,
  stopAwsSimulation,
  simulateAwsIssue,
  simulateAwsRecovery,
  simulateAwsDeployment,
  simulateAwsSecurityScan,
  AwsDeployment,
  AwsHealthCheck,
  AwsService
} from '@/lib/api';

// Define the context type
type AwsContextType = {
  // Data states
  deployments: AwsDeployment[];
  healthChecks: AwsHealthCheck[];
  services: AwsService[];
  
  // Filtered data
  filteredDeployments: AwsDeployment[];
  filteredHealthChecks: AwsHealthCheck[];
  filteredServices: AwsService[];
  
  // UI states
  awsRegion: string;
  isRefreshing: boolean;
  isSimulating: boolean;
  simulationSpeed: string;
  
  // Functions
  setAwsRegion: (region: string) => void;
  handleRefresh: () => Promise<void>;
  toggleSimulation: () => Promise<void>;
  handleSimulationSpeedChange: (speed: string) => void;
  triggerIssue: () => Promise<void>;
  triggerRecovery: (service: string, region: string) => Promise<void>;
  triggerDeployment: () => Promise<any>;
  triggerSecurityScan: () => Promise<any>;
};

// Create the context with a default value
const AwsContext = createContext<AwsContextType | undefined>(undefined);

// Provider props type
type AwsProviderProps = {
  children: ReactNode;
};

// Provider component
export function AwsProvider({ children }: AwsProviderProps) {
  // Data states
  const [deployments, setDeployments] = useState<AwsDeployment[]>([]);
  const [healthChecks, setHealthChecks] = useState<AwsHealthCheck[]>([]);
  const [services, setServices] = useState<AwsService[]>([]);
  
  // UI states
  const [awsRegion, setAwsRegion] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true); // Start simulation by default
  const [simulationSpeed, setSimulationSpeed] = useState<string>("10000");
  
  // Event intervals
  const [issueInterval, setIssueInterval] = useState<NodeJS.Timeout | null>(null);
  const [deploymentInterval, setDeploymentInterval] = useState<NodeJS.Timeout | null>(null);
  const [securityScanInterval, setSecurityScanInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Handle refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      const [deploymentData, healthData, servicesData] = await Promise.all([
        fetchAwsDeployments(),
        fetchAwsHealthChecks(),
        fetchAwsServices()
      ]);
      
      setDeployments(deploymentData);
      setHealthChecks(healthData);
      setServices(servicesData);
    } catch (error) {
      console.error("Error fetching AWS data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Trigger a deployment
  const triggerDeployment = async () => {
    console.log("Initiating deployment...");
    
    try {
      // Use the deployment simulation API
      const result = await simulateAwsDeployment();
      console.log("Simulated deployment:", result);
      // Refresh data after simulating a deployment
      await handleRefresh();
      return result;
    } catch (error) {
      console.error("Error triggering deployment:", error);
    }
    
    return Promise.resolve();
  };
  
  // Trigger a security scan
  const triggerSecurityScan = async () => {
    console.log("Initiating security scan...");
    
    try {
      // Use the security scan simulation API
      const result = await simulateAwsSecurityScan();
      console.log("Simulated security scan:", result);
      // Refresh data after simulating a security scan
      await handleRefresh();
      return result;
    } catch (error) {
      console.error("Error triggering security scan:", error);
    }
    
    return Promise.resolve();
  };
  
  // Setup event intervals
  const setupEventIntervals = () => {
    // Clear any existing intervals
    if (issueInterval) clearInterval(issueInterval);
    if (deploymentInterval) clearInterval(deploymentInterval);
    if (securityScanInterval) clearInterval(securityScanInterval);
    
    // Set up interval for simulating issues (every 10-60 seconds)
    const newIssueInterval = setInterval(() => {
      if (isSimulating) {
        triggerIssue();
      }
    }, getRandomInt(10000, 60000)); // 10 to 60 seconds
    
    // Set up interval for simulating deployments (every 30-120 seconds)
    const newDeploymentInterval = setInterval(() => {
      if (isSimulating) {
        triggerDeployment();
      }
    }, getRandomInt(30000, 120000)); // 30 to 120 seconds
    
    // Set up interval for simulating security scans (every 60-180 seconds)
    const newSecurityScanInterval = setInterval(() => {
      if (isSimulating) {
        triggerSecurityScan();
      }
    }, getRandomInt(60000, 180000)); // 60 to 180 seconds
    
    setIssueInterval(newIssueInterval);
    setDeploymentInterval(newDeploymentInterval);
    setSecurityScanInterval(newSecurityScanInterval);
  };
  
  // Helper function for random integer
  const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  // Toggle simulation - modified to always keep simulation on
  const toggleSimulation = async () => {
    // If someone tries to stop the simulation, restart it immediately
    if (!isSimulating) {
      const result = await startAwsSimulation(parseInt(simulationSpeed, 10));
      if (result) {
        setIsSimulating(true);
        setupEventIntervals();
      }
    }
    
    // Return void to satisfy the type
    return Promise.resolve();
  };
  
  // Handle simulation speed change
  const handleSimulationSpeedChange = (speed: string) => {
    setSimulationSpeed(speed);
    
    if (isSimulating) {
      // Restart simulation with new speed
      stopAwsSimulation().then(() => {
        startAwsSimulation(parseInt(speed, 10)).then(() => {
          setIsSimulating(true);
          setupEventIntervals();
        });
      });
    }
  };
  
  // Trigger a simulated issue
  const triggerIssue = async () => {
    try {
      const result = await simulateAwsIssue();
      console.log("Simulated issue:", result);
      // Refresh data after simulating an issue
      handleRefresh();
    } catch (error) {
      console.error("Error simulating issue:", error);
    }
    
    return Promise.resolve();
  };
  
  // Trigger a simulated recovery
  const triggerRecovery = async (service: string, region: string) => {
    try {
      const result = await simulateAwsRecovery(service, region);
      console.log("Simulated recovery:", result);
      // Refresh data after simulating a recovery
      handleRefresh();
    } catch (error) {
      console.error("Error simulating recovery:", error);
    }
  };
  
  // Filter data by region
  const filteredDeployments = deployments.filter(d => awsRegion === 'all' || d.region === awsRegion);
  const filteredHealthChecks = healthChecks.filter(h => awsRegion === 'all' || h.region === awsRegion);
  const filteredServices = services.filter(s => awsRegion === 'all' || s.region === awsRegion);
  
  // Load initial data and start simulation
  useEffect(() => {
    handleRefresh();
    
    // Set up polling interval for data refresh
    const refreshInterval = setInterval(() => {
      if (!isRefreshing) {
        handleRefresh();
      }
    }, 30000); // Refresh every 30 seconds
    
    // Start simulation by default
    startAwsSimulation(parseInt(simulationSpeed, 10)).then(() => {
      setupEventIntervals();
    });
    
    return () => {
      clearInterval(refreshInterval);
      // Clear event intervals
      if (issueInterval) clearInterval(issueInterval);
      if (deploymentInterval) clearInterval(deploymentInterval);
      if (securityScanInterval) clearInterval(securityScanInterval);
      
      // Make sure to stop simulation when component unmounts
      if (isSimulating) {
        stopAwsSimulation();
      }
    };
  }, []);
  
  // Context value
  const value: AwsContextType = {
    deployments,
    healthChecks,
    services,
    filteredDeployments,
    filteredHealthChecks,
    filteredServices,
    awsRegion,
    isRefreshing,
    isSimulating,
    simulationSpeed,
    setAwsRegion,
    handleRefresh,
    toggleSimulation,
    handleSimulationSpeedChange,
    triggerIssue,
    triggerRecovery,
    triggerDeployment,
    triggerSecurityScan
  };
  
  return <AwsContext.Provider value={value}>{children}</AwsContext.Provider>;
}

// Custom hook to use the AWS context
export function useAwsContext() {
  const context = useContext(AwsContext);
  
  if (context === undefined) {
    throw new Error('useAwsContext must be used within an AwsProvider');
  }
  
  return context;
} 