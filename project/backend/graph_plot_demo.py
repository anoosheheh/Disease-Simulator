#This file is to only get an of idea how to plot on the front end

import numpy as np
import matplotlib.pyplot as plt 
import networkx as nx
from graphing import generate_random_network


def visualize_modular_network(num_hubs):
    # Generate the network
    network_data = generate_random_network(
        total_population=200,
        num_hubs=num_hubs,
        k_within=8,        # Increased internal connections
        p_rewire=0.1,
        p_inter_hub=0.005  # Reduced inter-hub connections
    )
    
    # Create a new NetworkX graph from the generated data
    G = nx.Graph()
    
    # Add nodes
    for node in network_data['nodes']:
        G.add_node(node['id'], 
                  hub=node['hub'],
                  status=node['status'])
    
    # Add edges
    for link in network_data['links']:
        G.add_edge(link['source'], link['target'], 
                  weight=link['weight'])
    
    # Set up the plot
    plt.figure(figsize=(12, 12))
    
    # Create position dictionary for each hub separately
    pos = {}
    # Generate more natural (random) hub centers within a bounding box
    np.random.seed(42)  # For reproducibility; remove or change for more randomness
    hub_centers = {
        i: (
            np.random.uniform(-2, 1),  # x between -1 and 1
            np.random.uniform(-1, 1)   # y between -1 and 1
        )
        for i in range(num_hubs)
    }
    
    # Position nodes hub by hub
    for hub_id in range(len(network_data['hubSizes'])):
        # Get nodes in this hub
        hub_nodes = [node for node in G.nodes() 
                    if G.nodes[node]['hub'] == hub_id]
        
        # Create subgraph for this hub
        hub_subgraph = G.subgraph(hub_nodes)
        
        # Position nodes within the hub
        hub_pos = nx.spring_layout(hub_subgraph, 
                                 k=1.5,
                                 iterations=50,
                                 seed=42)
        
        # Adjust positions relative to hub center
        center_x, center_y = hub_centers[hub_id]
        for node in hub_pos:
            x, y = hub_pos[node]
            pos[node] = (x * 0.2 + center_x, y * 0.2 + center_y)
    
    # Draw nodes colored by hub
    for hub_id in range(len(network_data['hubSizes'])):
        hub_nodes = [node for node in G.nodes() 
                    if G.nodes[node]['hub'] == hub_id]
        nx.draw_networkx_nodes(G, pos, 
                             nodelist=hub_nodes,
                             node_color=f'C{hub_id}',
                             node_size=100,
                             alpha=0.6,
                             label=f'Hub {hub_id}')
    
    # Draw edges with transparency based on weight
    edge_colors = [G[u][v]['weight'] for u, v in G.edges()]
    nx.draw_networkx_edges(G, pos, 
                          alpha=0.2,
                          edge_color=edge_colors,
                          edge_cmap=plt.cm.Greys)
    
    # Highlight infected nodes with red borders
    infected_nodes = [node for node in G.nodes() 
                     if G.nodes[node]['status'] == 'infected']
    nx.draw_networkx_nodes(G, pos,
                          nodelist=infected_nodes,
                          node_color='none',
                          node_size=150,
                          node_shape='o',
                          edgecolors='red',
                          linewidths=2)
    
    plt.title(f'Modular Network Visualization with {num_hubs} Clusters')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.axis('off')
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    visualize_modular_network(10)
