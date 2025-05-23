import networkx as nx
import random
from params import env_params, infection_range, doctors_range

def generate_random_network(
    total_population=env_params["total_population"],
    k_within=env_params["average_neighbours"],
    p_rewire=env_params["rewire_probability"]
):
    G = nx.watts_strogatz_graph(total_population, k_within, p_rewire)
    set_graph_node_attributes(G)
    set_graph_edge_attributes(G)
    return G

def set_graph_node_attributes(graph):
    
    node_ids = list(graph.nodes())
    total_nodes = len(node_ids)
    infected_percent = random.uniform(infection_range[min], infection_range[max])
    num_infected = max(1, int(infected_percent * total_nodes))
    infected_nodes = set(random.sample(node_ids, num_infected))

    doctors_percent = random.uniform(doctors_range[min], doctors_range[max])
    num_doctors= max(1, int(doctors_percent * total_nodes))
    doctors = set(random.sample(node_ids, num_doctors))

    for i in graph.nodes():
        graph.nodes[i]['id'] = str(i)
        graph.nodes[i]['age'] = random.randint(1, 100)
        if i in infected_nodes:
            graph.nodes[i]['status'] = 'I'
            graph.nodes[i]['daysInfected'] = 0
        else:
            graph.nodes[i]['status'] = 'S'
            graph.nodes[i]['daysInfected'] = None
        if i in doctors:
            graph.nodes[i]['isDoctor'] = 1
        else:
            graph.nodes[i]['isDoctor'] = 0

def set_graph_edge_attributes(graph):
    # The weight is a random float between 0.1 and 1.0.    
    for u, v in graph.edges():
        graph[u][v]['weight'] = round(random.uniform(0.1, 1.0), 2)


def convert_graph_to_json(graph):
    # Convert the graph to a JSON-like structure
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