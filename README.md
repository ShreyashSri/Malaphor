# Malaphor: AI-Enhanced Threat Hunting for Cloud Environments

Malaphor is a tool designed to give security teams a clear picture of the complex relationships in their cloud setup. By understanding these connections better, we can spot potential attack routes and misconfigurations that are currently invisible to traditional CSPM or log analysis tools.

## Features

- **Graph-based Cloud Modeling**: Represents cloud resources, identities, and their relationships as a graph
- **GNN-powered Anomaly Detection**: Uses Graph Neural Networks to detect anomalous patterns in cloud environments
- **Interactive Visualization**: Provides an intuitive interface to explore and understand cloud resource relationships
- **API-first Design**: Offers a RESTful API for integration with existing security tools

## Architecture

Malaphor consists of the following components:

1. **Data Ingestion**: Collects data from cloud providers (GCP, AWS, Azure)
2. **Graph Construction**: Builds a graph representation of cloud resources and their relationships
3. **GNN Model**: Analyzes the graph to detect anomalies and security risks
4. **API Server**: Provides access to the analysis results
5. **Web Dashboard**: Visualizes the cloud graph and detected anomalies

## Getting Started

### Prerequisites

- Python 3.8+
- PyTorch 1.9+
- PyTorch Geometric
- FastAPI
- Neo4j (optional)

### Installation

1. Clone the repository:

\`\`\`bash
git clone https://github.com/your-org/malaphor.git
cd malaphor
\`\`\`

2. Create a virtual environment:

\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
\`\`\`

3. Install dependencies:

\`\`\`bash
pip install -r requirements.txt
\`\`\`

### Training the GNN Model

To train the GNN model on synthetic data:

\`\`\`bash
python run_training.py --generate-data --num-graphs 1000 --output-dir ./output
\`\`\`

This will:
1. Generate a synthetic dataset of cloud resource graphs
2. Train a GNN model to detect anomalies
3. Save the trained model to `./output/best_model.pt`

### Running the API Server

To run the API server:

\`\`\`bash
python run_api.py --model-path ./output/best_model.pt
\`\`\`

The API will be available at http://localhost:8000

### Running the Web Dashboard

The web dashboard is a Next.js application that connects to the API server:

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

The dashboard will be available at http://localhost:3000

## API Documentation

The API documentation is available at http://localhost:8000/docs when the API server is running.

Key endpoints:

- `GET /api/graph`: Get the current cloud resource graph
- `GET /api/anomalies`: Get detected anomalies
- `GET /api/metrics`: Get system metrics
- `POST /api/analyze`: Analyze a cloud graph

## Development

### Project Structure

\`\`\`
malaphor/
├── backend/
│   ├── api/              # FastAPI server
│   ├── data/             # Data processing and dataset classes
│   ├── integration/      # Cloud provider integrations
│   ├── models/           # GNN model definitions
│   └── training/         # Training pipeline
├── frontend/             # Next.js web dashboard
├── output/               # Trained models and outputs
└── scripts/              # Utility scripts
\`\`\`

### Running Tests

\`\`\`bash
pytest
\`\`\`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
