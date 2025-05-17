# This file is only for simulating the infection to test before deploying on frontend

from graphing import generate_random_network
from seird_model import next_day
from app import frontend_to_backend_graph
import matplotlib.pyplot as plt

# Generate a random graph in adjacency list form
env_params = {
    "total_population": 100,
    "simulate_days": 100,
    "average_neighbours": 6,
    "rewire_probability": 0.1,
}

# Get JSON graph
json_graph = generate_random_network(
    env_params["total_population"],
    env_params["average_neighbours"],
    env_params["rewire_probability"]
)

# Convert to backend format for simulation
graph = frontend_to_backend_graph(json_graph)

scenario_params = {
    "S2E": 0.05,
    "S2E_TAU": 0.5,
    "E2I": 0.1,
    "I2R": 0.1,
    "R2S": 0.01,
    "I2D": 0.01,
    "E2R": 0.01,
}

# Initialize people_state from the graph
people_state = [graph[node_id]['data']['status'] for node_id in graph]

# Run the simulation for the given number of days
days = env_params["simulate_days"]

# --- Add this before your simulation loop ---
history = {
    'healthy': [],
    'exposed': [],
    'infected': [],
    'recovered': [],
    'dead': []
}

# --- Replace your simulation loop with this ---
for day in range(days):
    # Count the states using full-word statuses
    s_count = people_state.count('healthy')
    e_count = people_state.count('exposed')
    i_count = people_state.count('infected')
    r_count = people_state.count('recovered')
    d_count = people_state.count('dead')

    # Save to history
    history['healthy'].append(s_count)
    history['exposed'].append(e_count)
    history['infected'].append(i_count)
    history['recovered'].append(r_count)
    history['dead'].append(d_count)

    # Print current day's stats
    print(f"Day {day}: healthy={s_count} exposed={e_count} infected={i_count} recovered={r_count} dead={d_count}")

    # Update the graph for the next day
    next_day(graph, scenario_params)
    people_state = [graph[node_id]['data']['status'] for node_id in graph]

# --- After the loop, plot the results ---
plt.figure(figsize=(12, 6))
plt.plot(history['healthy'], label='Healthy')
plt.plot(history['exposed'], label='Exposed')
plt.plot(history['infected'], label='Infected')
plt.plot(history['recovered'], label='Recovered')
plt.plot(history['dead'], label='Dead')
plt.xlabel('Day')
plt.ylabel('Number of People')
plt.title('SEIRD Simulation Over Time')
plt.legend()
plt.tight_layout()
plt.show()
