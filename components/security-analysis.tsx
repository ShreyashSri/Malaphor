import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

interface SecurityAnalysisProps {
  onAnalysisComplete: (findings: any) => void;
}

const SecurityAnalysis: React.FC<SecurityAnalysisProps> = ({ onAnalysisComplete }) => {
  const [awsConfig, setAwsConfig] = useState({
    aws_access_key_id: '',
    aws_secret_access_key: '',
    region_name: 'us-east-1'
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setAwsConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAnalyze = async () => {
    if (!awsConfig.aws_access_key_id || !awsConfig.aws_secret_access_key) {
      setError('Please provide AWS credentials');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(awsConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze AWS resources');
      }

      const data = await response.json();
      onAnalysisComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        AWS Security Analysis
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="AWS Access Key ID"
          name="aws_access_key_id"
          value={awsConfig.aws_access_key_id}
          onChange={handleInputChange}
          margin="normal"
          type="password"
        />
        <TextField
          fullWidth
          label="AWS Secret Access Key"
          name="aws_secret_access_key"
          value={awsConfig.aws_secret_access_key}
          onChange={handleInputChange}
          margin="normal"
          type="password"
        />
        <TextField
          fullWidth
          label="AWS Region"
          name="region_name"
          value={awsConfig.region_name}
          onChange={handleInputChange}
          margin="normal"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleAnalyze}
        disabled={loading}
        startIcon={<SecurityIcon />}
      >
        {loading ? 'Analyzing...' : 'Analyze AWS Resources'}
      </Button>

      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
        Enter your AWS credentials to analyze your cloud resources for security issues.
        The analysis will check for misconfigurations in S3 buckets, security groups, EC2 instances, and IAM roles.
      </Typography>
    </Paper>
  );
};

export default SecurityAnalysis; 