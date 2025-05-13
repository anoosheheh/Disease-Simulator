import networkx as nx
import random
import numpy as np
import matplotlib.pyplot as plt

def generate_random_network(
    total_population=1000,
    num_hubs=5,
    k_within=6,              # number of nearest neighbors in each hub
    p_rewire=0.1,           # probability of rewiring within hub
    p_inter_hub=0.01,       # probability of connections between hubs
    hub_size_variation=0.2   # allows 20% variation in hub sizes
):
    """
    Generate a modular network with variable-sized hubs using Watts-Strogatz model.
    
    Args:
        total_population: Total number of nodes in the network
        num_hubs: Number of hubs/towns
        k_within: Number of nearest neighbors in Watts-Strogatz model
        p_rewire: Probability of rewiring edges within each hub
        p_inter_hub: Probability of connections between hubs
        hub_size_variation: Allowed variation in hub sizes (0.0 to 1.0)
    """
    G = nx.Graph()
    node_offset = 0
    hub_nodes = []
    
    # Generate variable hub sizes that sum to total_population
    base_size = total_population // num_hubs
    hub_sizes = []
    remaining_population = total_population
    
    for i in range(num_hubs - 1):
        # Generate size with variation
        variation = int(base_size * hub_size_variation)
        size = random.randint(base_size - variation, base_size + variation)
        size = min(size, remaining_population - (num_hubs - i - 1))  # Ensure we can fill remaining hubs
        hub_sizes.append(size)
        remaining_population -= size
    
    hub_sizes.append(remaining_population)  # Last hub gets remaining nodes
    
    # Generate each hub using Watts-Strogatz
    for hub_id, hub_size in enumerate(hub_sizes):
        # Ensure k_within is even and less than hub_size
        k = min(k_within, hub_size - 1)
        k = k if k % 2 == 0 else k - 1
        
        # Create Watts-Strogatz graph for this hub
        ws = nx.watts_strogatz_graph(hub_size, k, p_rewire)
        
        # Relabel nodes to ensure unique IDs across all hubs
        mapping = {i: i + node_offset for i in range(hub_size)}
        ws = nx.relabel_nodes(ws, mapping)
        
        # Add nodes and edges to main graph
        G.add_nodes_from(ws.nodes())
        for n in ws.nodes():
            G.nodes[n]['hub'] = hub_id
        
        # Add edges with weights
        for u, v in ws.edges():
            G.add_edge(u, v, weight=round(random.uniform(0.6, 1.0), 2))
        
        hub_nodes.append(list(ws.nodes()))
        node_offset += hub_size
    
    # Add inter-hub connections (sparse)
    for i in range(num_hubs):
        for j in range(i + 1, num_hubs):
            for u in hub_nodes[i]:
                for v in hub_nodes[j]:
                    if random.random() < p_inter_hub:
                        # Lower weights for inter-hub connections
                        G.add_edge(u, v, weight=round(random.uniform(0.1, 0.3), 2))
    
    # Convert to D3.js format
    nodes = []
    for i in G.nodes():
        age = random.randint(1, 100)
        status = 'infected' if random.random() < 0.05 else 'healthy'
        nodes.append({
            'id': str(i),
            'age': age,
            'status': status,
            'initialStatus': status,
            'daysInfected': 0 if status == 'infected' else None,
            'hub': G.nodes[i]['hub']
        })
    
    links = []
    for u, v, data in G.edges(data=True):
        links.append({
            'source': str(u),
            'target': str(v),
            'weight': data['weight']
        })
    
    return {
        'nodes': nodes, 
        'links': links,
        'hubSizes': hub_sizes,
        'totalNodes': len(nodes)
    }
