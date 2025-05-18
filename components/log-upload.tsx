'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnalysisGraph } from "./analysis-graph";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Recommendation {
  type: string;
  priority: "High" | "Medium" | "Low";
  description: string;
  category: string;
  impact: string;
  action_items: string[];
}

interface Finding {
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  description: string;
}

interface Analysis {
  findings: Finding[];
  recommendations: Recommendation[];
  summary: {
    total_findings: number;
    critical_severity: number;
    high_severity: number;
    medium_severity: number;
    low_severity: number;
  };
}

export function LogUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/json") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a valid JSON file");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setLoadingStartTime(Date.now());

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:3001/api/analyze-logs", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to analyze logs");
      }

      const data = await response.json();
      
      // Calculate remaining time to ensure minimum 10 second loading
      const elapsedTime = Date.now() - (loadingStartTime || Date.now());
      const remainingTime = Math.max(0, 10000 - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze logs");
    } finally {
      setLoading(false);
      setLoadingStartTime(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload CloudTrail Logs</CardTitle>
          <CardDescription>
            Upload your AWS CloudTrail logs in JSON format for security analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="log-file">Log File</Label>
            <Input
              id="log-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
          <Button
            className="mt-4"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Logs"
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.summary.total_findings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{analysis.summary.critical_severity}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{analysis.summary.high_severity}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Medium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{analysis.summary.medium_severity}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Section */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Based on the analysis of your CloudTrail logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.recommendations.map((recommendation: Recommendation, index: number) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">
                            {recommendation.type}
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                              recommendation.priority === "High" ? "bg-red-100 text-red-700" :
                              recommendation.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {recommendation.priority}
                            </span>
                          </h4>
                          <p className="text-sm text-gray-500">{recommendation.description}</p>
                        </div>
                        <Badge variant="outline">{recommendation.category}</Badge>
                      </div>
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700">Impact</h5>
                        <p className="text-sm text-gray-600">{recommendation.impact}</p>
                      </div>
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700">Action Items</h5>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                          {recommendation.action_items.map((item: string, itemIndex: number) => (
                            <li key={itemIndex}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Findings Section */}
          <Card>
            <CardHeader>
              <CardTitle>Security Findings</CardTitle>
              <CardDescription>
                Detailed analysis of potential security issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.findings.map((finding: Finding, index: number) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">
                          {finding.type}
                          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                            finding.severity === "Critical" ? "bg-red-100 text-red-700" :
                            finding.severity === "High" ? "bg-orange-100 text-orange-700" :
                            finding.severity === "Medium" ? "bg-yellow-100 text-yellow-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {finding.severity}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-500">{finding.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Graph Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Graph</CardTitle>
              <CardDescription>
                Visual representation of user actions and resource interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] w-full border rounded-lg">
                <AnalysisGraph analysis={analysis} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 