from flask import Flask, request, jsonify
import os
import json
import random
import networkx as nx
import numpy as np
from flask_cors import CORS
from graphing import generate_random_network

app = Flask(__name__)
CORS(app)

# Constants for simulation
MIN_NODES = 50
MAX_NODES = 200
MIN_AGE = 1
MAX_AGE = 100
INITIAL_INFECTED_PERCENTAGE = 0.05



# Function to perform one step of the disease simulation
def simulate_step(data, params, current_day):
    nodes = data['nodes']
    links = data['links']
    
    # Create a mapping of node id to node object for easier lookup
    node_map = {node['id']: node for node in nodes}
    
    # Convert links to a format where we can easily find connections
    connections = {}
    for link in links:
        source_id = link['source'] if isinstance(link['source'], str) else link['source']['id']
        target_id = link['target'] if isinstance(link['target'], str) else link['target']['id']
        weight = link['weight']
        
        if source_id not in connections:
            connections[source_id] = []
        if target_id not in connections:
            connections[target_id] = []
        
        connections[source_id].append((target_id, weight))
        connections[target_id].append((source_id, weight))
    
    # Medicine effect based on day introduced
    medicine_factor = 0
    if params['medicineEnabled'] and current_day >= params['medicineDayIntroduced']:
        medicine_factor = params['medicineEffectiveness']
    
    # Process each node
    new_infections = []
    recoveries = []
    deaths = []
    
    for node in nodes:
        if node['status'] == 'infected':
            # Increment days infected
            node['daysInfected'] = (node['daysInfected'] or 0) + 1
            
            # Check for recovery or death
            mortality_rate = params['mortalityBase'] * (node['age'] / 100) * (1 - medicine_factor)
            if random.random() < mortality_rate:
                deaths.append(node['id'])
            elif random.random() < params['recoveryRate'] * (1 + medicine_factor):
                recoveries.append(node['id'])
            
            # Spread infection to connected nodes
            if node['id'] in connections:
                for connected_id, weight in connections[node['id']]:
                    connected_node = node_map[connected_id]
                    if connected_node['status'] == 'healthy':
                        # Transmission probability influenced by weight of connection
                        transmission_prob = params['transmissionRate'] * weight
                        if random.random() < transmission_prob:
                            new_infections.append(connected_id)
    
    # Apply changes
    for node_id in new_infections:
        node_map[node_id]['status'] = 'infected'
        node_map[node_id]['daysInfected'] = 0
    
    for node_id in recoveries:
        node_map[node_id]['status'] = 'recovered'
    
    for node_id in deaths:
        node_map[node_id]['status'] = 'deceased'
    
    # Check if simulation is finished (no more infected)
    is_finished = not any(node['status'] == 'infected' for node in nodes)
    
    return {'simulationData': data, 'isFinished': is_finished}

# Routes
@app.route('/api/graph/default', methods=['GET'])
def get_default_graph():
    # Generate a default graph
    return jsonify(generate_random_network())

@app.route('/api/graph/random', methods=['GET'])
def get_random_graph():
    n_nodes = random.randint(MIN_NODES, MAX_NODES)
    m_edges = random.randint(2, min(5, n_nodes // 10))
    return jsonify(generate_random_network(n_nodes, m_edges))

@app.route('/api/graph/upload', methods=['POST'])
def upload_graph():
    data = request.json
    
    # Basic validation
    if 'nodes' not in data or 'links' not in data:
        return jsonify({'error': 'Invalid graph format'}), 400
    
    # Process the graph to ensure it has all required fields
    for node in data['nodes']:
        if 'id' not in node:
            node['id'] = str(random.randint(10000, 99999))
        if 'age' not in node:
            node['age'] = random.randint(MIN_AGE, MAX_AGE)
        if 'status' not in node:
            node['status'] = 'infected' if random.random() < INITIAL_INFECTED_PERCENTAGE else 'healthy'
        node['initialStatus'] = node['status']
        if node['status'] == 'infected':
            node['daysInfected'] = 0
    
    for link in data['links']:
        if 'weight' not in link:
            link['weight'] = round(random.uniform(0.1, 1.0), 2)
    
    return jsonify(data)

@app.route('/api/simulation/step', methods=['POST'])
def step_simulation():
    request_data = request.json
    simulation_data = request_data.get('data')
    simulation_params = request_data.get('params')
    current_day = request_data.get('currentDay', 0)
    
    result = simulate_step(simulation_data, simulation_params, current_day)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)