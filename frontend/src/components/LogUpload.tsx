import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

interface LogUploadProps {
  onAnalysisComplete: (findings: any) => void;
}

const LogUpload: React.FC<LogUploadProps> = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json') {
        setError('Please upload a JSON file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze/logs/file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze logs');
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
        Upload Security Logs
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <input
          accept=".json"
          style={{ display: 'none' }}
          id="log-file-upload"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="log-file-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            disabled={loading}
          >
            Select JSON File
          </Button>
        </label>
        {file && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Selected file: {file.name}
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Logs'}
      </Button>

      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
        Upload your security logs in JSON format to analyze them for potential security issues.
        The logs should contain information about S3 buckets, security groups, EC2 instances, and IAM roles.
      </Typography>
    </Paper>
  );
};

export default LogUpload; 