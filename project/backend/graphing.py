import networkx as nx
import random


env_params = {
    "total_population": 2000,
    "simulate_days": 600,
    "average_neighbours": 6,
    "rewire_probability": 0.1,
}

def generate_random_network(
    total_population=env_params["total_population"],
    k_within=env_params["average_neighbours"],
    p_rewire=env_params["rewire_probability"]
):
    """
    Generate a random Watts-Strogatz small-world network.
    Args:
        total_population: Total number of nodes in the network
        k_within: Number of nearest neighbors in Watts-Strogatz model
        p_rewire: Probability of rewiring edges
    """
    G = nx.watts_strogatz_graph(total_population, k_within, p_rewire)
    set_graph_node_attributes(G)
    set_graph_edge_attributes(G)
    # Use the improved conversion function
    return convert_graph_to_json(G)


def set_graph_node_attributes(graph):
    """
    Assigns attributes to nodes in the graph.
    Randomly selects between 1% and 5% of nodes to be 'infected', rest are 'healthy'.
    """
    node_ids = list(graph.nodes())
    total_nodes = len(node_ids)
    percent = random.uniform(0.01, 0.05)
    num_infected = max(1, int(percent * total_nodes))
    infected_nodes = set(random.sample(node_ids, num_infected))

    for i in graph.nodes():
        graph.nodes[i]['id'] = str(i)
        graph.nodes[i]['age'] = random.randint(1, 100)
        if i in infected_nodes:
            graph.nodes[i]['status'] = 'infected'
            graph.nodes[i]['daysInfected'] = 0
        else:
            graph.nodes[i]['status'] = 'healthy'
            graph.nodes[i]['daysInfected'] = None

def set_graph_edge_attributes(graph):
    """
    Assigns weights to edges in the graph.
    The weight is a random float between 0.1 and 1.0.
    """
    for u, v in graph.edges():
        graph[u][v]['weight'] = round(random.uniform(0.1, 1.0), 2)

def convert_graph_to_json(graph):
    """
    Convert a NetworkX graph to a D3.js-compatible JSON format.
    Args:
        graph: A NetworkX graph object.
    Returns:
        A dictionary containing nodes and links in D3.js format.
    """
    nodes = []
    for i in graph.nodes():
        node_data = graph.nodes[i]
        nodes.append({
            'id': node_data.get('id', str(i)),
            'age': node_data.get('age'),
            'status': node_data.get('status'),
            'initialStatus': node_data.get('status'),
            'daysInfected': node_data.get('daysInfected')
        })

    links = []
    for u, v, data in graph.edges(data=True):
        links.append({
            'source': str(u),
            'target': str(v),
            'weight': data.get('weight', 1.0)
        })

    return {
        'nodes': nodes,
        'links': links,
        'totalNodes': len(nodes)
    }
