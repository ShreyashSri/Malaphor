import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { FileDown, Calendar, Clock } from "lucide-react"

interface ScheduledReport {
  id: string
  frequency: "daily" | "weekly" | "monthly"
  recipients: string[]
  lastRun?: string
  nextRun?: string
}

interface ReportPanelProps {
  scheduledReports: ScheduledReport[]
  onGenerateReport: (format: string) => void
  onScheduleReport: (frequency: string, recipients: string[]) => void
}

export default function ReportPanel({
  scheduledReports,
  onGenerateReport,
  onScheduleReport,
}: ReportPanelProps) {
  return (
    <div className="space-y-6">
      {/* Report Generation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Generate Report</h3>
        <div className="flex items-center space-x-4">
          <Select defaultValue="html">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="html">HTML Report</SelectItem>
              <SelectItem value="csv">CSV Findings</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => onGenerateReport("html")}>
            <FileDown className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </Card>

      {/* Schedule Reports */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Schedule Reports</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Frequency</label>
              <Select defaultValue="weekly">
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email Recipients</label>
              <Input placeholder="email@example.com, other@example.com" />
            </div>
          </div>
          <Button className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Report
          </Button>
        </div>
      </Card>

      {/* Scheduled Reports List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Scheduled Reports</h3>
        {scheduledReports.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No scheduled reports</p>
        ) : (
          <div className="space-y-4">
            {scheduledReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium capitalize">{report.frequency} Report</h4>
                    <p className="text-sm text-muted-foreground">
                      Recipients: {report.recipients.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    {report.lastRun && (
                      <p className="text-sm text-muted-foreground">
                        Last run: {report.lastRun}
                      </p>
                    )}
                    {report.nextRun && (
                      <p className="text-sm text-muted-foreground">
                        Next run: {report.nextRun}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
} 