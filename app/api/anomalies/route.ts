import { NextResponse } from "next/server"

// This would connect to your PyTorch Geometric model in production
export async function GET() {
  const mockAnomalies = [
    {
      id: "anomaly-1",
      title: "Excessive Cross-VPC Connectivity",
      description: "Multiple instances in production have established connections to development environment resources.",
      severity: "high",
      timestamp: "2025-05-16T14:30:00Z",
      resourceIds: ["vm-5", "subnet-3"],
      resourceType: "Network Connectivity",
      affectedResources: [
        { id: "vm-5", name: "Admin Instance", type: "VM Instance" },
        { id: "subnet-3", name: "Dev Subnet", type: "Subnet" }
      ],
      detectionMethod: "GNN-based pattern analysis detected unusual cross-environment connectivity that deviates from normal operational patterns.",
      suggestedAction: "Review and enforce network segmentation between production and development environments. Update firewall rules to restrict unnecessary cross-VPC traffic.",
      isNew: true
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
        { id: "role-1", name: "Admin Role", type: "IAM Role" }
      ],
      detectionMethod: "Graph path analysis identified a privilege escalation route through role inheritance that circumvents normal permission boundaries.",
      suggestedAction: "Immediately remove the unexpected role binding between the backup service account and admin role. Review all service account permissions for the principle of least privilege.",
      isNew: true
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
        { id: "db-1", name: "Primary Database", type: "Database" }
      ],
      detectionMethod: "GNN anomaly detection identified unusual access patterns between development resources and production data stores.",
      suggestedAction: "Immediately revoke database access from development instances. Investigate why and how this access was granted. Implement database access monitoring."
    }
  ]

  return NextResponse.json(mockAnomalies)
}
