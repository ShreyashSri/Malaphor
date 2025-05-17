import { NextResponse } from "next/server"

// This would be replaced with actual GNN logic and Neo4j/database connections
export async function GET() {
  const nodes = [
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
  ];

  const edges = [
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
  ];

  return NextResponse.json({ nodes, edges });
}
