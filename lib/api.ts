// This file would be replaced with actual API calls to your FastAPI backend
// Mock data for the prototype

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

export async function fetchCloudGraph() {
  // In a real implementation, this would fetch from your backend API
  // Mock data for the prototype
  const nodes: Node[] = [
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
    { id: "user-2", label: "Developer User", group: "identity" },
  ]

  const edges: Edge[] = [
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

    // Suspicious edges for demo - these would be detected as anomalies
    { id: "e34", from: "vm-4", to: "db-1", label: "read" },
    { id: "e35", from: "sa-2", to: "storage-2", label: "read" },
    { id: "e36", from: "vm-5", to: "subnet-3", label: "connect" },
    { id: "e37", from: "sa-3", to: "role-1", label: "has" },
  ]

  return { nodes, edges }
}

export async function fetchAnomalies() {
  // In a real implementation, this would fetch from your backend API
  // Mock data for the prototype
  const anomalies: Anomaly[] = [
    {
      id: "anomaly-1",
      title: "Excessive Cross-VPC Connectivity",
      description:
        "Multiple instances in production have established connections to development environment resources.",
      severity: "high",
      timestamp: "2025-05-16T14:30:00Z",
      resourceIds: ["vm-5", "subnet-3"],
      resourceType: "Network Connectivity",
      affectedResources: [
        { id: "vm-5", name: "Admin Instance", type: "VM Instance" },
        { id: "subnet-3", name: "Dev Subnet", type: "Subnet" },
      ],
      detectionMethod:
        "GNN-based pattern analysis detected unusual cross-environment connectivity that deviates from normal operational patterns.",
      suggestedAction:
        "Review and enforce network segmentation between production and development environments. Update firewall rules to restrict unnecessary cross-VPC traffic.",
      isNew: true,
    },
    {
      id: "anomaly-2",
      title: "Privilege Escalation Path Detected",
      description: "A service account with minimal permissions has an indirect path to obtain administrative access.",
      severity: "critical",
      timestamp: "2025-05-16T13:45:00Z",
      resourceIds: ["sa-3", "role-1"],
      resourceType: "Identity & Access Management",
      affectedResources: [
        { id: "sa-3", name: "Backup Service Account", type: "Service Account" },
        { id: "role-1", name: "Admin Role", type: "IAM Role" },
      ],
      detectionMethod:
        "Graph path analysis identified a privilege escalation route through role inheritance that circumvents normal permission boundaries.",
      suggestedAction:
        "Immediately remove the unexpected role binding between the backup service account and admin role. Review all service account permissions for the principle of least privilege.",
      isNew: true,
    },
    {
      id: "anomaly-3",
      title: "Unauthorized Database Access",
      description: "Development instance accessed production database which is outside its normal operational pattern.",
      severity: "critical",
      timestamp: "2025-05-16T12:15:00Z",
      resourceIds: ["vm-4", "db-1"],
      resourceType: "Database Access",
      affectedResources: [
        { id: "vm-4", name: "Dev Instance", type: "VM Instance" },
        { id: "db-1", name: "Primary Database", type: "Database" },
      ],
      detectionMethod:
        "GNN anomaly detection identified unusual access patterns between development resources and production data stores.",
      suggestedAction:
        "Immediately revoke database access from development instances. Investigate why and how this access was granted. Implement database access monitoring.",
    },
    {
      id: "anomaly-4",
      title: "Storage Access Policy Deviation",
      description: "Application service account is accessing log storage which is outside its normal behavior pattern.",
      severity: "medium",
      timestamp: "2025-05-16T10:20:00Z",
      resourceIds: ["sa-2", "storage-2"],
      resourceType: "Storage Access",
      affectedResources: [
        { id: "sa-2", name: "App Service Account", type: "Service Account" },
        { id: "storage-2", name: "Logs Bucket", type: "Storage Bucket" },
      ],
      detectionMethod:
        "Resource access pattern analysis detected an unusual relationship between an application service account and logs storage.",
      suggestedAction:
        "Review the application service account permissions. If this access is required, document it; otherwise, remove the permission to follow least privilege principles.",
    },
    {
      id: "anomaly-5",
      title: "Public Access to Storage Bucket",
      description: "User data storage bucket has public read access enabled.",
      severity: "high",
      timestamp: "2025-05-15T22:10:00Z",
      resourceIds: ["storage-1"],
      resourceType: "Storage Configuration",
      affectedResources: [{ id: "storage-1", name: "User Data Bucket", type: "Storage Bucket" }],
      detectionMethod:
        "Configuration analysis identified public access settings that violate security best practices for data storage.",
      suggestedAction:
        "Immediately disable public access to the user data bucket. Implement proper authentication for all data access. Review all storage buckets for similar misconfigurations.",
    },
  ]

  return anomalies
}

export async function fetchMetrics() {
  // In a real implementation, this would fetch from your backend API
  // Mock data for the prototype
  const metrics: Metrics = {
    totalResources: 25,
    riskScore: 68,
    anomaliesDetected: 5,
    criticalAlerts: 2,
  }

  return metrics
}
