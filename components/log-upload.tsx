import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Alert, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Code as CodeIcon } from '@mui/icons-material';

interface LogUploadProps {
  onAnalysisComplete: (findings: any) => void;
}

const API_BASE_URL = 'http://127.0.0.1:3001';

const LogUpload: React.FC<LogUploadProps> = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawLogs, setRawLogs] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'raw'>('file');

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

  const handleInputModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'file' | 'raw') => {
    if (newMode !== null) {
      setInputMode(newMode);
      setError(null);
      if (newMode === 'raw') {
        setFile(null);
      } else {
        setRawLogs('');
      }
    }
  };

  const handleRawLogsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawLogs(event.target.value);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (inputMode === 'file' && !file) {
      setError('Please select a file first');
      return;
    }

    if (inputMode === 'raw' && !rawLogs.trim()) {
      setError('Please enter logs to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      if (inputMode === 'file') {
        const formData = new FormData();
        formData.append('file', file!);
        response = await fetch(`${API_BASE_URL}/api/analyze/logs/file`, {
          method: 'POST',
          body: formData,
        });
      } else {
        try {
          // Validate JSON format
          JSON.parse(rawLogs);
          response = await fetch(`${API_BASE_URL}/api/analyze/logs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ logs: JSON.parse(rawLogs) }),
          });
        } catch (e) {
          throw new Error('Invalid JSON format');
        }
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to analyze logs');
      }

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

      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={inputMode}
          exclusive
          onChange={handleInputModeChange}
          aria-label="log input mode"
        >
          <ToggleButton value="file" aria-label="file upload">
            <CloudUploadIcon sx={{ mr: 1 }} />
            File Upload
          </ToggleButton>
          <ToggleButton value="raw" aria-label="raw logs">
            <CodeIcon sx={{ mr: 1 }} />
            Raw Logs
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {inputMode === 'file' ? (
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
      ) : (
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            label="Paste your logs here"
            value={rawLogs}
            onChange={handleRawLogsChange}
            disabled={loading}
            sx={{ fontFamily: 'monospace' }}
          />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleAnalyze}
        disabled={loading || (inputMode === 'file' ? !file : !rawLogs.trim())}
      >
        {loading ? 'Analyzing...' : 'Analyze Logs'}
      </Button>

      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
        {inputMode === 'file' 
          ? 'Upload your security logs in JSON format to analyze them for potential security issues.'
          : 'Paste your security logs in JSON format to analyze them for potential security issues.'}
        The logs should contain information about S3 buckets, security groups, EC2 instances, and IAM roles.
      </Typography>
    </Paper>
  );
};

export default LogUpload; 