from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
from graphing import generate_random_network
from seird_model import next_day

app = Flask(__name__)
CORS(app)

# Global simulation state
simulation_state = {
    'graph': None,
    'params': None,
    'current_day': 0,
    'running': False,
    'step_interval': 1,  # in seconds
}

# Default parameters
scenario_params = {
    "S2E": 0.05,
    "S2E_TAU": 0.5,
    "E2I": 0.1,
    "I2R": 0.1,
    "R2S": 0.01,
    "I2D": 0.01,
    "E2R": 0.01,
}

env_params = {
    "total_population": 500,
    "average_neighbours": 6,
    "rewire_probability": 0.1,
}

# Simulation runner thread
def run_simulation():
    while simulation_state['running']:
        graph = simulation_state['graph']
        next_day(graph, simulation_state['params'])
        simulation_state['current_day'] += 1

        # Stop if infection is over
        statuses = [graph[n]['data']['status'] for n in graph]
        if statuses.count('I') == 0 and statuses.count('E') == 0:
            simulation_state['running'] = False
            break

        time.sleep(simulation_state['step_interval'])

# === ROUTES ===

@app.route('/api/graph', methods=['GET'])
def get_graph():
    # Generate a new random network (adjacency list format)
    graph = generate_random_network(
        env_params["total_population"],
        env_params["average_neighbours"],
        env_params["rewire_probability"]
    )
    return jsonify(graph)

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    if simulation_state['running']:
        return jsonify({'status': 'already_running'}), 409

    data = request.get_json()
    simulation_state['graph'] = data['graph']
    simulation_state['params'] = data.get('params', scenario_params)
    simulation_state['current_day'] = 0
    simulation_state['running'] = True
    simulation_state['step_interval'] = max(0.05, data.get('speed', 1000) / 1000.0)

    thread = threading.Thread(target=run_simulation)
    thread.start()

    return jsonify({'status': 'started'})

@app.route('/api/simulation/state', methods=['GET'])
def get_simulation_state():
    graph = simulation_state['graph']
    if graph:
        statuses = [graph[n]['data']['status'] for n in graph]
        status_counts = {
            'S': statuses.count('S'),
            'E': statuses.count('E'),
            'I': statuses.count('I'),
            'R': statuses.count('R'),
            'D': statuses.count('D')
        }
    else:
        status_counts = {}

    response = {
        'currentDay': simulation_state['current_day'],
        'running': simulation_state['running'],
        'statusCounts': status_counts,
        'isFinished': not simulation_state['running']
    }

    # If frontend requests full graph on every poll
    if request.args.get('includeGraph') == 'true':
        response['graph'] = graph

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
