"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CloudResourceGraph from "@/components/cloud-resource-graph"
import { Diff } from "lucide-react"

interface ComparisonViewProps {
  terraformGraph: { nodes: any[]; edges: any[] }
  actualGraph: { nodes: any[]; edges: any[] }
  differences: any[]
}

export function ComparisonView({ terraformGraph, actualGraph, differences }: ComparisonViewProps) {
  return (
    <Tabs defaultValue="side-by-side" className="w-full">
      <TabsList className="grid grid-cols-3 w-full max-w-xl mb-4">
        <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
        <TabsTrigger value="differences">Differences</TabsTrigger>
        <TabsTrigger value="overlay">Overlay</TabsTrigger>
      </TabsList>
      
      <TabsContent value="side-by-side">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Terraform Definition</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <CloudResourceGraph data={terraformGraph} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Actual Environment</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              <CloudResourceGraph data={actualGraph} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="differences">
        <Card>
          <CardHeader>
            <CardTitle>Differences Found</CardTitle>
          </CardHeader>
          <CardContent>
            {differences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No differences found between Terraform and actual environment
              </div>
            ) : (
              <div className="space-y-4">
                {differences.map((diff, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Diff className="h-4 w-4 text-yellow-600" />
                      <h3 className="font-medium">
                        {diff.type === 'node_missing_in_actual' && 'Resource missing in actual environment'}
                        {diff.type === 'node_missing_in_terraform' && 'Resource missing in Terraform'}
                        {diff.type === 'edge_missing_in_actual' && 'Relationship missing in actual environment'}
                        {diff.type === 'edge_missing_in_terraform' && 'Relationship missing in Terraform'}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {diff.description}
                    </p>
                    {diff.resource_id && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Resource ID:</span> {diff.resource_id}
                      </div>
                    )}
                    {diff.from && diff.to && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Relationship:</span> {diff.from} → {diff.to}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="overlay">
        <Card>
          <CardHeader>
            <CardTitle>Combined View</CardTitle>
          </CardHeader>
          <CardContent className="h-[500px]">
            <CloudResourceGraph 
              data={{
                nodes: [
                  ...terraformGraph.nodes.map(n => ({ ...n, color: { background: '#dbeafe' } })),
                  ...actualGraph.nodes.map(n => ({ ...n, color: { background: '#f0fdf4' } }))
                ],
                edges: [
                  ...terraformGraph.edges.map(e => ({ ...e, color: '#93c5fd', dashes: true })),
                  ...actualGraph.edges.map(e => ({ ...e, color: '#86efac' }))
                ]
              }} 
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}