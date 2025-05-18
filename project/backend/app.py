from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
from graphing import generate_random_network, convert_graph_to_json
from seird_model import next_day, count_people_state

app = Flask(__name__)
CORS(app)

simulation_state = {
    'graph': None,
    'params': None,
    'current_day': 0,
    'running': False,
    'step_interval': 1.0,
}

global people_state

@app.route('/api/graph/default', methods=['GET'])
def get_default_graph():
    global people_state
    global graph 
    graph = generate_random_network()
    people_state = count_people_state(graph)
    graph_json = convert_graph_to_json(graph)
    return jsonify({
        'data': graph_json,
        'peopleState': people_state
    })

@app.route('/api/simulation/start', methods=['POST'])
def start_simulation():
    global people_state
    if simulation_state['running']:
        return jsonify({'status': 'already_running'}), 409

    req = request.json
    simulation_state['graph'] = generate_random_network()
    simulation_state['params'] = req['params']
    simulation_state['current_day'] = 0
    simulation_state['step_interval'] = max(0.05, req.get('speed', 1000) / 1000.0)
    simulation_state['running'] = True

    thread = threading.Thread(target=run_simulation)
    thread.start()

    graph_json = convert_graph_to_json(simulation_state['graph'])
    return jsonify({
        'data': graph_json,
        'currentDay': simulation_state['current_day'],
        'running': simulation_state['running'],
        'isFinished': not any(n['status'] == 'I' for n in graph_json['nodes']),
        'peopleState': people_state
    })

@app.route('/api/simulation/step', methods=['POST'])
def step_simulation():
    global people_state
    if simulation_state['graph'] is None:
        return jsonify({'error': 'Simulation not initialized'}), 400
    if simulation_state['running']:
        return jsonify({'error': 'Simulation is running. Pause before stepping.'}), 409

    next_day(simulation_state['graph'], people_state, simulation_state['params'])
    simulation_state['current_day'] += 1

    graph_json = convert_graph_to_json(simulation_state['graph'])
    return jsonify({
        'data': graph_json,
        'currentDay': simulation_state['current_day'],
        'running': False,
        'isFinished': not any(n['status'] == 'I' for n in graph_json['nodes']),
        'peopleState': people_state
    })

@app.route('/api/simulation/state', methods=['GET'])
def get_simulation_state():
    global people_state
    graph = simulation_state['graph']
    if graph is not None:
        graph_json = convert_graph_to_json(graph)
        is_finished = not any(n['status'] == 'I' for n in graph_json['nodes'])
    else:
        graph_json = None
        is_finished = True
        people_state = [0, 0, 0, 0, 0]

    return jsonify({
        'data': graph_json,
        'currentDay': simulation_state['current_day'],
        'running': simulation_state['running'],
        'isFinished': is_finished,
        'peopleState': people_state
    })

@app.route('/api/simulation/pause', methods=['POST'])
def pause_simulation():
    simulation_state['running'] = False
    return jsonify({'status': 'paused'})

@app.route('/api/simulation/init', methods=['POST'])
def init_simulation():
    global people_state
    req = request.json
    simulation_state['graph'] = generate_random_network()
    simulation_state['params'] = req['params']
    simulation_state['current_day'] = 0
    simulation_state['running'] = False
    people_state = count_people_state(simulation_state['graph'])
    graph_json = convert_graph_to_json(simulation_state['graph'])
    return jsonify({
        'data': graph_json,
        'currentDay': simulation_state['current_day'],
        'running': False,
        'isFinished': not any(n['status'] == 'I' for n in graph_json['nodes']),
        'peopleState': people_state
    })

def run_simulation():
    global people_state
    while simulation_state['running']:
        if simulation_state['graph'] is None:
            break
        next_day(simulation_state['graph'], people_state, simulation_state['params'])
        simulation_state['current_day'] += 1
        graph_json = convert_graph_to_json(simulation_state['graph'])
        if not any(n['status'] == 'I' for n in graph_json['nodes']):
            simulation_state['running'] = False
            break

        time.sleep(simulation_state['step_interval'])

if __name__ == '__main__':
    app.run(debug=True)
