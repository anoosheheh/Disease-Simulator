from flask import Flask, request, jsonify
import random
import threading
import time
from flask_cors import CORS

from graphing import generate_random_network
from seird_model import next_day  # Use your SEIRD simulation function

app = Flask(__name__)
CORS(app)

# Global simulation state
simulation_state = {
    'graph': None,
    'params': None,
    'current_day': 0,
    'running': False,
    'step_interval': 1.0,  # seconds
}

# --- Helper Conversions ---

status_lookup = {
    'healthy': 'S',
    'exposed': 'E',
    'infected': 'I',
    'recovered': 'R',
    'deceased': 'D'
}

status_map = {v: k for k, v in status_lookup.items()}


def frontend_to_backend_graph(data):
    """ Converts frontend format (nodes and links) to SEIRD-style graph. """
    backend_graph = {}

    for node in data['nodes']:
        backend_graph[str(node['id'])] = {
            'data': {
                'status': status_lookup.get(node['status'], 'S'),
                'age': node['age'],
                'daysInfected': node.get('daysInfected', 0)
            },
            'neighbors': []
        }

    for link in data['links']:
        source = str(link['source']) if isinstance(link['source'], str) else link['source']['id']
        target = str(link['target']) if isinstance(link['target'], str) else link['target']['id']
        weight = link.get('weight', 1.0)

        backend_graph[source]['neighbors'].append({'id': target, 'weight': weight})
        backend_graph[target]['neighbors'].append({'id': source, 'weight': weight})

    return backend_graph


def backend_to_frontend_graph(graph):
    """ Converts SEIRD-style graph back to frontend format with nodes and links. """
    nodes = []
    links = []
    seen_links = set()

    for node_id, node_data in graph.items():
        frontend_status = node_data['data']['status']  # Already in 'S', 'E', 'I', 'R', 'D'

        nodes.append({
            'id': node_id,
            'status': frontend_status,
            'age': node_data['data']['age'],
            'daysInfected': node_data['data'].get('daysInfected', 0),
            'initialStatus': frontend_status  # optional
        })
        for neighbor in node_data['neighbors']:
            pair = tuple(sorted((node_id, neighbor['id'])))
            if pair not in seen_links:
                links.append({
                    'source': node_id,
                    'target': neighbor['id'],
                    'weight': neighbor.get('weight', 1.0)
                })
                seen_links.add(pair)

    return {'nodes': nodes, 'links': links}

# --- API Routes ---

@app.route('/api/graph/default', methods=['GET'])
def get_default_graph():
    return jsonify(generate_random_network())


@app.route('/api/simulation/step', methods=['POST'])
def step_simulation():
    content = request.json
    params = content['params']

    # Only rebuild from frontend if graph not initialized
    if simulation_state['graph'] is None:
        frontend_data = content['data']
        simulation_state['graph'] = frontend_to_backend_graph(frontend_data)
        simulation_state['params'] = params
        simulation_state['current_day'] = 0

    # Simulate next day
    next_day(simulation_state['graph'], simulation_state['params'])
    simulation_state['current_day'] += 1

    updated_data = backend_to_frontend_graph(simulation_state['graph'])

    is_finished = not any(n['status'] == 'I' for n in updated_data['nodes'])

    return jsonify({
        'simulationData': updated_data,
        'isFinished': is_finished
    })



@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    if simulation_state['running']:
        return jsonify({'status': 'already_running'}), 409

    request_data = request.json
    frontend_data = request_data.get('data')
    params = request_data.get('params')
    speed_ms = request_data.get('speed', 1000)

    simulation_state['graph'] = frontend_to_backend_graph(frontend_data)
    simulation_state['params'] = params
    simulation_state['current_day'] = 0
    simulation_state['step_interval'] = max(0.05, speed_ms / 1000.0)
    simulation_state['running'] = True

    thread = threading.Thread(target=run_simulation)
    thread.start()

    return jsonify({'status': 'started'})


@app.route('/api/simulation/state', methods=['GET'])
def get_simulation_state():
    frontend_data = backend_to_frontend_graph(simulation_state['graph']) if simulation_state['graph'] else None
    is_finished = frontend_data and not any(n['status'] == 'infected' for n in frontend_data['nodes'])

    return jsonify({
        'data': frontend_data,
        'currentDay': simulation_state['current_day'],
        'running': simulation_state['running'],
        'isFinished': is_finished
    })

# --- Background Simulation Runner ---

def run_simulation():
    while simulation_state['running']:
        next_day(simulation_state['graph'], simulation_state['params'])
        simulation_state['current_day'] += 1

        if not any(node['data']['status'] == 'I' for node in simulation_state['graph'].values()):
            simulation_state['running'] = False
            break

        time.sleep(simulation_state['step_interval'])

# --- Run Server ---

if __name__ == '__main__':
    app.run(debug=True)
