import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WelcomeProps {
  onDismiss: () => void;
}

export default function Welcome({ onDismiss }: WelcomeProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Welcome to Malaphor!</CardTitle>
        <CardDescription>
          Your intelligent cloud resource analysis tool
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>
            Malaphor helps you analyze and optimize your cloud resources by:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Detecting potential security vulnerabilities</li>
            <li>Identifying resource optimization opportunities</li>
            <li>Analyzing resource dependencies and relationships</li>
            <li>Providing cost optimization recommendations</li>
          </ul>
          <div className="flex justify-end">
            <Button onClick={onDismiss} variant="default">
              Get Started
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 