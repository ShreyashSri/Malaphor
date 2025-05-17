#!/usr/bin/env python
"""
Script to run the Malaphor API server.
"""

import os
import argparse
import uvicorn

def main():
    parser = argparse.ArgumentParser(description='Run Malaphor API server')
    
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind to')
    parser.add_argument('--model-path', type=str, default='./output/best_model.pt', help='Path to trained model')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload')
    
    args = parser.parse_args()
    
    # Set environment variables
    os.environ['MODEL_PATH'] = args.model_path
    
    # Run server
    uvicorn.run(
        'backend.api.main:app',
        host=args.host,
        port=args.port,
        reload=args.reload
    )

if __name__ == '__main__':
    main()
