"use client"

import { useState, useEffect } from 'react';

export default function useApiStatus() {
  const [isApiOnline, setIsApiOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);

  // Initialize state from localStorage after mount
  useEffect(() => {
    const savedOfflineMode = typeof window !== 'undefined' 
      ? localStorage.getItem('offlineMode') === 'true'
      : false;
    setOfflineMode(savedOfflineMode);
  }, []);

  const checkApiStatus = async () => {
    if (offlineMode) return;
    
    setIsChecking(true);
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setIsApiOnline(true);
        setErrorMessage(null);
      } else {
        throw new Error('API returned error status');
      }
    } catch (error) {
      setIsApiOnline(false);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to API');
    } finally {
      setIsChecking(false);
    }
  };

  const toggleOfflineMode = () => {
    const newOfflineMode = !offlineMode;
    setOfflineMode(newOfflineMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('offlineMode', String(newOfflineMode));
    }
    if (!newOfflineMode) {
      checkApiStatus();
    }
  };

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [offlineMode]);

  return {
    isApiOnline,
    isChecking,
    errorMessage,
    checkApiStatus,
    offlineMode,
    toggleOfflineMode
  };
} 