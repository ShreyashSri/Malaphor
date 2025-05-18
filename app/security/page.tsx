'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab } from '@mui/material';
import SecurityAnalysis from '../../components/security-analysis';
import LogUpload from '../../components/log-upload';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function SecurityPage() {
  const [tabValue, setTabValue] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAnalysisComplete = (results: any) => {
    setAnalysisResults(results);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Malaphor Security Analysis
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="AWS API Analysis" />
            <Tab label="Log Upload" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <SecurityAnalysis onAnalysisComplete={handleAnalysisComplete} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <LogUpload onAnalysisComplete={handleAnalysisComplete} />
        </TabPanel>

        {analysisResults && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Analysis Results
            </Typography>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(analysisResults, null, 2)}
            </pre>
          </Box>
        )}
      </Box>
    </Container>
  );
} 