from flask import Flask, request, jsonify
import os
import json
import random
import threading
import time
import networkx as nx
import numpy as np
from flask_cors import CORS
from graphing import generate_random_network  # make sure this function is defined correctly

app = Flask(__name__)
CORS(app)

# Constants for simulation
MIN_NODES = 50
MAX_NODES = 200
MIN_AGE = 1
MAX_AGE = 100
INITIAL_INFECTED_PERCENTAGE = 0.05

# Global state for background simulation
simulation_state = {
    'data': None,
    'params': None,
    'current_day': 0,
    'running': False,
    'result': None,
    'step_interval': 1  # seconds
}

# Function to simulate a single step
def simulate_step(data, params, current_day):
    nodes = data['nodes']
    links = data['links']
    
    node_map = {node['id']: node for node in nodes}
    
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
    
    medicine_factor = 0
    if params['medicineEnabled'] and current_day >= params['medicineDayIntroduced']:
        medicine_factor = params['medicineEffectiveness']
    
    new_infections = []
    recoveries = []
    deaths = []
    
    for node in nodes:
        if node['status'] == 'infected':
            node['daysInfected'] = (node.get('daysInfected') or 0) + 1
            
            mortality_rate = params['mortalityBase'] * (node['age'] / 100) * (1 - medicine_factor)
            if random.random() < mortality_rate:
                deaths.append(node['id'])
            elif random.random() < params['recoveryRate'] * (1 + medicine_factor):
                recoveries.append(node['id'])
            
            if node['id'] in connections:
                for connected_id, weight in connections[node['id']]:
                    connected_node = node_map[connected_id]
                    if connected_node['status'] == 'healthy':
                        transmission_prob = params['transmissionRate'] * weight
                        if random.random() < transmission_prob:
                            new_infections.append(connected_id)
    
    for node_id in new_infections:
        node_map[node_id]['status'] = 'infected'
        node_map[node_id]['daysInfected'] = 0
    
    for node_id in recoveries:
        node_map[node_id]['status'] = 'recovered'
    
    for node_id in deaths:
        node_map[node_id]['status'] = 'deceased'
    
    is_finished = not any(node['status'] == 'infected' for node in nodes)
    
    return {'simulationData': data, 'isFinished': is_finished}

# Background simulation runner
def run_simulation():
    while simulation_state['running']:
        result = simulate_step(simulation_state['data'], simulation_state['params'], simulation_state['current_day'])
        simulation_state['data'] = result['simulationData']
        simulation_state['current_day'] += 1
        simulation_state['result'] = result

        if result['isFinished']:
            simulation_state['running'] = False
            break

        time.sleep(simulation_state['step_interval'])

# Routes
@app.route('/api/graph/default', methods=['GET'])
def get_default_graph():
    return jsonify(generate_random_network())

@app.route('/api/graph/random', methods=['GET'])
def get_random_graph():
    n_nodes = random.randint(MIN_NODES, MAX_NODES)
    m_edges = random.randint(2, min(5, n_nodes // 10))
    return jsonify(generate_random_network(n_nodes, m_edges))

@app.route('/api/simulation/step', methods=['POST'])
def step_simulation():
    request_data = request.json
    simulation_data = request_data.get('data')
    simulation_params = request_data.get('params')
    current_day = request_data.get('currentDay', 0)
    
    result = simulate_step(simulation_data, simulation_params, current_day)
    return jsonify(result)

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    if simulation_state['running']:
        return jsonify({'status': 'already_running'}), 409

    request_data = request.json
    simulation_state['data'] = request_data.get('data')
    simulation_state['params'] = request_data.get('params')
    simulation_state['current_day'] = 0
    simulation_state['running'] = True
    simulation_state['result'] = None

    # Speed in milliseconds; default 1000 ms
    speed_ms = request_data.get('speed', 1000)
    simulation_state['step_interval'] = max(0.05, speed_ms / 1000.0)

    thread = threading.Thread(target=run_simulation)
    thread.start()

    return jsonify({'status': 'started'})

@app.route('/api/simulation/state', methods=['GET'])
def get_simulation_state():
    return jsonify({
        'data': simulation_state['data'],
        'currentDay': simulation_state['current_day'],
        'running': simulation_state['running'],
        'isFinished': not simulation_state['running'] and simulation_state['result'] is not None and simulation_state['result']['isFinished']
    })

if __name__ == '__main__':
    app.run(debug=True)
