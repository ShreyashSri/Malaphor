import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to connect to your Python backend
    const response = await fetch('http://localhost:8000/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Backend service is not responding');
    }

    const data = await response.json();
    
    // If the status is degraded, still return 200 but with degraded status
    if (data.status === 'degraded') {
      return NextResponse.json(data, { status: 200 });
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        message: error instanceof Error ? error.message : 'Failed to connect to backend service',
        timestamp: new Date().toISOString(),
        model_status: {
          required: false,
          loaded: false,
          path: null
        },
        features: {
          graph_generation: false,
          anomaly_detection: false
        }
      },
      { status: 503 }
    );
  }
} 