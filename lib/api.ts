// api.ts - Fixed version without top-level await

interface Node {
  id: string
  label: string
  group?: string
}

interface Edge {
  id: string
  from: string
  to: string
  label?: string
}

interface Anomaly {
  id: string
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  timestamp: string
  resourceIds: string[]
  resourceType: string
  affectedResources: {
    id: string
    name: string
    type: string
  }[]
  detectionMethod: string
  suggestedAction: string
  isNew?: boolean
}

interface Metrics {
  totalResources: number
  riskScore: number
  anomaliesDetected: number
  criticalAlerts: number
}

interface AnalysisResponse {
  analysis_id: string
  anomalies: Anomaly[]
  metrics: Metrics
  graph?: {
    nodes: Node[]
    edges: Edge[]
  }
}

interface ComparisonResponse {
  terraform_graph: {
    nodes: Node[]
    edges: Edge[]
  }
  actual_graph: {
    nodes: Node[]
    edges: Edge[]
  }
  differences: {
    type: string
    resource_id?: string
    from?: string
    to?: string
    description: string
    resource_type?: string
  }[]
  analysis_id: string
}

// Mock data for development
const MOCK_GRAPH = {
  nodes: [
    { id: "vpc-1", label: "Main VPC", group: "network" },
    { id: "vpc-2", label: "Development VPC", group: "network" },
    { id: "subnet-1", label: "Public Subnet", group: "network" },
    { id: "subnet-2", label: "Private Subnet", group: "network" },
    { id: "subnet-3", label: "Dev Subnet", group: "network" },
    { id: "vm-1", label: "Web Server", group: "compute" },
    { id: "vm-2", label: "API Server", group: "compute" },
    { id: "vm-3", label: "Database Server", group: "compute" },
    { id: "vm-4", label: "Dev Instance", group: "compute" },
    { id: "vm-5", label: "Admin Instance", group: "compute" },
    { id: "vm-6", label: "Worker Node", group: "compute" },
    { id: "storage-1", label: "User Data Bucket", group: "storage" },
    { id: "storage-2", label: "Logs Bucket", group: "storage" },
    { id: "storage-3", label: "Backup Bucket", group: "storage" },
    { id: "db-1", label: "Primary Database", group: "storage" },
    { id: "db-2", label: "Replica Database", group: "storage" },
    { id: "cache-1", label: "Redis Cache", group: "storage" },
    { id: "sa-1", label: "Admin Service Account", group: "identity" },
    { id: "sa-2", label: "App Service Account", group: "identity" },
    { id: "sa-3", label: "Backup Service Account", group: "identity" },
    { id: "role-1", label: "Admin Role", group: "identity" },
    { id: "role-2", label: "Developer Role", group: "identity" },
    { id: "role-3", label: "Viewer Role", group: "identity" },
    { id: "user-1", label: "Admin User", group: "identity" },
    { id: "user-2", label: "Developer User", group: "identity" }
  ],
  edges: [
    { id: "e1", from: "vpc-1", to: "subnet-1" },
    { id: "e2", from: "vpc-1", to: "subnet-2" },
    { id: "e3", from: "vpc-2", to: "subnet-3" },
    { id: "e4", from: "subnet-1", to: "vm-1" },
    { id: "e5", from: "subnet-1", to: "vm-2" },
    { id: "e6", from: "subnet-2", to: "vm-3" },
    { id: "e7", from: "subnet-2", to: "vm-6" },
    { id: "e8", from: "subnet-3", to: "vm-4" },
    { id: "e9", from: "subnet-3", to: "vm-5" },
    { id: "e10", from: "vm-1", to: "storage-1", label: "read/write" },
    { id: "e11", from: "vm-2", to: "storage-1", label: "read/write" },
    { id: "e12", from: "vm-2", to: "db-1", label: "read/write" },
    { id: "e13", from: "vm-3", to: "db-1", label: "admin" },
    { id: "e14", from: "vm-3", to: "db-2", label: "admin" },
    { id: "e15", from: "vm-3", to: "storage-2", label: "write" },
    { id: "e16", from: "vm-4", to: "storage-3", label: "read/write" },
    { id: "e17", from: "vm-5", to: "storage-1", label: "read/write" },
    { id: "e18", from: "vm-6", to: "cache-1", label: "read/write" },
    { id: "e19", from: "vm-1", to: "cache-1", label: "read" },
    { id: "e20", from: "vm-2", to: "cache-1", label: "read/write" },
    { id: "e21", from: "sa-1", to: "role-1", label: "has" },
    { id: "e22", from: "sa-2", to: "role-2", label: "has" },
    { id: "e23", from: "sa-3", to: "role-3", label: "has" },
    { id: "e24", from: "user-1", to: "role-1", label: "has" },
    { id: "e25", from: "user-2", to: "role-2", label: "has" },
    { id: "e26", from: "role-1", to: "vm-5", label: "admin" },
    { id: "e27", from: "role-1", to: "storage-1", label: "admin" },
    { id: "e28", from: "role-1", to: "storage-2", label: "admin" },
    { id: "e29", from: "role-1", to: "storage-3", label: "admin" },
    { id: "e30", from: "role-2", to: "vm-4", label: "admin" },
    { id: "e31", from: "role-2", to: "storage-3", label: "read/write" },
    { id: "e32", from: "role-3", to: "storage-1", label: "read" },
    { id: "e33", from: "role-3", to: "storage-2", label: "read" },
    { id: "e34", from: "vm-4", to: "db-1", label: "read" },
    { id: "e35", from: "sa-2", to: "storage-2", label: "read" },
    { id: "e36", from: "vm-5", to: "subnet-3", label: "connect" },
    { id: "e37", from: "sa-3", to: "role-1", label: "has" }
  ]
};

const MOCK_TERRAFORM_GRAPH = {
  nodes: [
    { id: "vpc-1", label: "Main VPC", group: "network" },
    { id: "subnet-1", label: "Public Subnet", group: "network" },
    { id: "vm-1", label: "Web Server", group: "compute" },
    { id: "storage-1", label: "User Data Bucket", group: "storage" }
  ],
  edges: [
    { id: "e1", from: "vpc-1", to: "subnet-1" },
    { id: "e2", from: "subnet-1", to: "vm-1" },
    { id: "e3", from: "vm-1", to: "storage-1", label: "read/write" }
  ]
};

const MOCK_ANOMALIES: Anomaly[] = [
  {
    id: "anomaly-1",
    title: "Excessive Cross-VPC Connectivity",
    description: "Multiple instances in production have connections to dev resources",
    severity: "high",
    timestamp: "2025-05-16T14:30:00Z",
    resourceIds: ["vm-5", "subnet-3"],
    resourceType: "Network Connectivity",
    affectedResources: [
      { id: "vm-5", name: "Admin Instance", type: "VM Instance" },
      { id: "subnet-3", name: "Dev Subnet", type: "Subnet" }
    ],
    detectionMethod: "GNN-based pattern analysis",
    suggestedAction: "Review and enforce network segmentation",
    isNew: true
  }
];

const MOCK_METRICS: Metrics = {
  totalResources: 25,
  riskScore: 68,
  anomaliesDetected: 5,
  criticalAlerts: 2
};

const MOCK_COMPARISON: ComparisonResponse = {
  terraform_graph: MOCK_TERRAFORM_GRAPH,
  actual_graph: MOCK_GRAPH,
  differences: [
    {
      type: "node_missing_in_terraform",
      resource_id: "vm-2",
      resource_type: "compute",
      description: "Resource found in actual environment but not defined in Terraform"
    },
    {
      type: "edge_missing_in_terraform",
      from: "vm-1",
      to: "cache-1",
      description: "Relationship found in actual environment but not defined in Terraform"
    }
  ],
  analysis_id: "compare-123"
};

// API functions
export async function fetchCloudGraph() {
  try {
    // In production, replace with actual API call
    // const response = await fetch('/api/graph');
    // return await response.json();
    
    return MOCK_GRAPH;
  } catch (error) {
    console.error("Failed to fetch cloud graph:", error);
    throw error;
  }
}

export async function fetchAnomalies() {
  try {
    // In production, replace with actual API call
    // const response = await fetch('/api/anomalies');
    // return await response.json();
    
    return MOCK_ANOMALIES;
  } catch (error) {
    console.error("Failed to fetch anomalies:", error);
    throw error;
  }
}

export async function fetchMetrics() {
  try {
    // In production, replace with actual API call
    // const response = await fetch('/api/metrics');
    // return await response.json();
    
    return MOCK_METRICS;
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    throw error;
  }
}

export async function analyzeTerraform(file: File): Promise<AnalysisResponse> {
  try {
    // In production, use actual API call
    if (process.env.NODE_ENV === 'production') {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/analyze/terraform', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze Terraform file');
      }
      
      return await response.json();
    }
    
    // Mock response for development
    return {
      analysis_id: "tf-123",
      anomalies: MOCK_ANOMALIES,
      metrics: MOCK_METRICS,
      graph: MOCK_TERRAFORM_GRAPH
    };
  } catch (error) {
    console.error("Failed to analyze Terraform:", error);
    throw error;
  }
}

export async function compareGraphs(
  terraformAnalysisId: string, 
  actualAnalysisId: string
): Promise<ComparisonResponse> {
  try {
    // In production, use actual API call
    if (process.env.NODE_ENV === 'production') {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          terraform_analysis_id: terraformAnalysisId,
          actual_analysis_id: actualAnalysisId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to compare graphs');
      }
      
      return await response.json();
    }
    
    // Mock response for development
    return MOCK_COMPARISON;
  } catch (error) {
    console.error("Failed to compare graphs:", error);
    throw error;
  }
}