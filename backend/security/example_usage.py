from .storage_analyzer import StorageAnalyzer
from .network_analyzer import NetworkAnalyzer
from .iam_analyzer import IAMAnalyzer
from .aws_client import AWSClient
import os
from typing import Dict, Any

def get_aws_credentials() -> Dict[str, str]:
    """Get AWS credentials from environment variables."""
    aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    
    if not aws_access_key_id or not aws_secret_access_key:
        raise ValueError(
            "AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY "
            "environment variables."
        )
    
    return {
        'aws_access_key_id': aws_access_key_id,
        'aws_secret_access_key': aws_secret_access_key,
        'region_name': aws_region
    }

def main():
    try:
        # Get AWS credentials
        credentials = get_aws_credentials()
        
        # Initialize AWS client
        aws_client = AWSClient(**credentials)
        
        # Get cloud graph data from AWS
        print("Fetching cloud resources data from AWS...")
        graph_data = aws_client.get_cloud_graph_data()
        
        # Create analyzer instances
        storage_analyzer = StorageAnalyzer()
        network_analyzer = NetworkAnalyzer()
        iam_analyzer = IAMAnalyzer()
        
        # Run security analysis
        print("\n=== Storage Security Analysis ===")
        storage_findings = storage_analyzer.analyze(graph_data)
        for finding in storage_findings:
            print(f"\n[{finding['severity'].upper()}] {finding['title']}")
            print(f"Description: {finding['description']}")
            print(f"Recommendation: {finding['recommendation']}")
        
        print("\n=== Network Security Analysis ===")
        network_findings = network_analyzer.analyze(graph_data)
        for finding in network_findings:
            print(f"\n[{finding['severity'].upper()}] {finding['title']}")
            print(f"Description: {finding['description']}")
            print(f"Recommendation: {finding['recommendation']}")
        
        print("\n=== IAM Security Analysis ===")
        iam_findings = iam_analyzer.analyze(graph_data)
        for finding in iam_findings:
            print(f"\n[{finding['severity'].upper()}] {finding['title']}")
            print(f"Description: {finding['description']}")
            print(f"Recommendation: {finding['recommendation']}")
        
        # Print summary
        total_findings = len(storage_findings) + len(network_findings) + len(iam_findings)
        print(f"\nTotal security findings: {total_findings}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise

if __name__ == '__main__':
    main() 