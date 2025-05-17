import os
import logging
from typing import Dict, List, Any, Optional
from neo4j import GraphDatabase
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Neo4jConnector:
    """
    Connector for Neo4j graph database.
    """
    
    def __init__(self, uri=None, user=None, password=None):
        """
        Initialize the Neo4j connector.
        
        Args:
            uri: Neo4j URI
            user: Neo4j username
            password: Neo4j password
        """
        self.uri = uri or os.environ.get('NEO4J_URI', 'bolt://localhost:7687')
        self.user = user or os.environ.get('NEO4J_USER', 'neo4j')
        self.password = password or os.environ.get('NEO4J_PASSWORD', 'password')
        self.driver = None
    
    def connect(self):
        """
        Connect to Neo4j.
        """
        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            logger.info(f"Connected to Neo4j at {self.uri}")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            raise
    
    def close(self):
        """
        Close the Neo4j connection.
        """
        if self.driver:
            self.driver.close()
            logger.info("Closed Neo4j connection")
    
    def store_graph(self, graph):
        """
        Store a graph in Neo4j.
        
        Args:
            graph: Dictionary with 'nodes' and 'edges'
            
        Returns:
            True if successful, False otherwise
        """
        if not self.driver:
            self.connect()
        
        try:
            with self.driver.session() as session:
                # Clear existing data
                session.run("MATCH (n) DETACH DELETE n")
                
                # Create nodes
                for node in graph['nodes']:
                    cypher = """
                    CREATE (n:Resource {
                        id: $id,
                        label: $label,
                        group: $group
                    })
                    """
                    session.run(cypher, id=node['id'], label=node['label'], group=node.get('group', 'unknown'))
                
                # Create edges
                for edge in graph['edges']:
                    cypher = """
                    MATCH (a:Resource {id: $from}), (b:Resource {id: $to})
                    CREATE (a)-[r:RELATES_TO {id: $id, label: $label}]->(b)
                    """
                    session.run(
                        cypher,
                        id=edge['id'],
                        from_=edge['from'],
                        to=edge['to'],
                        label=edge.get('label', '')
                    )
                
                logger.info(f"Stored graph with {len(graph['nodes'])} nodes and {len(graph['edges'])} edges in Neo4j")
                return True
        except Exception as e:
            logger.error(f"Failed to store graph in Neo4j: {e}")
            return False
    
    def retrieve_graph(self):
        """
        Retrieve a graph from Neo4j.
        
        Returns:
            Dictionary with 'nodes' and 'edges'
        """
        if not self.driver:
            self.connect()
        
        try:
            with self.driver.session() as session:
                # Get nodes
                nodes_result = session.run("MATCH (n:Resource) RETURN n")
                nodes = []
                for record in nodes_result:
                    node = record['n']
                    nodes.append({
                        'id': node['id'],
                        'label': node['label'],
                        'group': node.get('group', 'unknown')
                    })
                
                # Get edges
                edges_result = session.run(
                    "MATCH (a:Resource)-[r:RELATES_TO]->(b:Resource) RETURN r, a.id as from, b.id as to"
                )
                edges = []
                for record in edges_result:
                    rel = record['r']
                    edges.append({
                        'id': rel['id'],
                        'from': record['from'],
                        'to': record['to'],
                        'label': rel.get('label', '')
                    })
                
                graph = {
                    'nodes': nodes,
                    'edges': edges
                }
                
                logger.info(f"Retrieved graph with {len(nodes)} nodes and {len(edges)} edges from Neo4j")
                return graph
        except Exception as e:
            logger.error(f"Failed to retrieve graph from Neo4j: {e}")
            return {'nodes': [], 'edges': []}
    
    def run_query(self, query, params=None):
        """
        Run a Cypher query.
        
        Args:
            query: Cypher query
            params: Query parameters
            
        Returns:
            Query results
        """
        if not self.driver:
            self.connect()
        
        try:
            with self.driver.session() as session:
                result = session.run(query, params or {})
                return [record.data() for record in result]
        except Exception as e:
            logger.error(f"Failed to run query: {e}")
            return []
    
    def find_paths(self, start_node_id, end_node_id, max_depth=5):
        """
        Find paths between two nodes.
        
        Args:
            start_node_id: Starting node ID
            end_node_id: Ending node ID
            max_depth: Maximum path depth
            
        Returns:
            List of paths
        """
        if not self.driver:
            self.connect()
        
        try:
            with self.driver.session() as session:
                query = """
                MATCH path = (start:Resource {id: $start_id})-[*1..
                $max_depth]->(end:Resource {id: $end_id})
                RETURN path
                LIMIT 10
                """
                result = session.run(query, start_id=start_node_id, end_id=end_node_id, max_depth=max_depth)
                
                paths = []
                for record in result:
                    path = record['path']
                    path_nodes = []
                    path_edges = []
                    
                    for node in path.nodes:
                        path_nodes.append({
                            'id': node['id'],
                            'label': node['label'],
                            'group': node.get('group', 'unknown')
                        })
                    
                    for rel in path.relationships:
                        path_edges.append({
                            'id': rel['id'],
                            'from': rel.start_node['id'],
                            'to': rel.end_node['id'],
                            'label': rel.get('label', '')
                        })
                    
                    paths.append({
                        'nodes': path_nodes,
                        'edges': path_edges
                    })
                
                return paths
        except Exception as e:
            logger.error(f"Failed to find paths: {e}")
            return []
    
    def find_anomalies(self):
        """
        Find potential anomalies using graph algorithms.
        
        Returns:
            List of potential anomalies
        """
        if not self.driver:
            self.connect()
        
        try:
            with self.driver.session() as session:
                # Find nodes with unusual number of connections
                degree_query = """
                MATCH (n:Resource)
                WITH n.group AS group, AVG(size((n)--())) AS avg_degree
                MATCH (m:Resource {group: group})
                WITH m, size((m)--()) AS degree, avg_degree
                WHERE degree > avg_degree * 2
                RETURN m.id AS node_id, m.label AS node_label, m.group AS node_type, 
                       degree, avg_degree
                """
                degree_result = session.run(degree_query)
                
                # Find unusual access patterns
                access_query = """
                MATCH (a:Resource {group: 'identity'})-[r:RELATES_TO]->(b:Resource {group: 'storage'})
                WHERE r.label IN ['writes', 'admin']
                RETURN a.id AS node_id, a.label AS node_label, a.group AS node_type,
                       b.id AS target_id, b.label AS target_label, r.label AS access_type
                """
                access_result = session.run(access_query)
                
                # Process results
                anomalies = []
                
                # Process degree anomalies
                for record in degree_result:
                    anomalies.append({
                        'type': 'unusual_connectivity',
                        'node_id': record['node_id'],
                        'node_label': record['node_label'],
                        'node_type': record['node_type'],
                        'details': {
                            'degree': record['degree'],
                            'avg_degree': record['avg_degree']
                        },
                        'severity': 'medium'
                    })
                
                # Process access anomalies
                for record in access_result:
                    anomalies.append({
                        'type': 'sensitive_access',
                        'node_id': record['node_id'],
                        'node_label': record['node_label'],
                        'node_type': record['node_type'],
                        'details': {
                            'target_id': record['target_id'],
                            'target_label': record['target_label'],
                            'access_type': record['access_type']
                        },
                        'severity': 'high'
                    })
                
                return anomalies
        except Exception as e:
            logger.error(f"Failed to find anomalies: {e}")
            return []
