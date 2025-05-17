import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, AlertTriangle, Info } from "lucide-react"

interface SecurityFinding {
  type: string
  severity: "high" | "medium" | "low"
  resource: string
  provider: string
  message: string
}

interface SecurityScore {
  overall: number
  high: number
  medium: number
  low: number
}

interface SecurityPanelProps {
  findings: SecurityFinding[]
  score: SecurityScore
}

export default function SecurityPanel({ findings, score }: SecurityPanelProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-blue-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Security Score Section */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center">
              <span className="text-2xl font-bold">{score.overall}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Overall Security Score</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col items-center">
            <div className="text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold mt-2">{score.high}</span>
            <p className="text-sm text-muted-foreground">High Severity</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col items-center">
            <div className="text-yellow-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold mt-2">{score.medium}</span>
            <p className="text-sm text-muted-foreground">Medium Severity</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex flex-col items-center">
            <div className="text-blue-500">
              <Info className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold mt-2">{score.low}</span>
            <p className="text-sm text-muted-foreground">Low Severity</p>
          </div>
        </Card>
      </div>

      {/* Findings Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {findings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No findings available
                </TableCell>
              </TableRow>
            ) : (
              findings.map((finding, index) => (
                <TableRow key={index}>
                  <TableCell>{finding.type}</TableCell>
                  <TableCell>
                    <span className={getSeverityColor(finding.severity)}>
                      {finding.severity}
                    </span>
                  </TableCell>
                  <TableCell>{finding.resource}</TableCell>
                  <TableCell>{finding.provider}</TableCell>
                  <TableCell>{finding.message}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
} 