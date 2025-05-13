# This file is only for simulating the infection to test before deploying on frontend

from graphing import generate_random_network
from seird_model import next_day

# Generate a random graph in adjacency list form
env_params = {
    "total_population": 5000,
    "simulate_days": 100,
    "average_neighbours": 6,
    "rewire_probability": 0.1,
}

graph = generate_random_network(
    env_params["total_population"],
    env_params["average_neighbours"],
    env_params["rewire_probability"]
)

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
people_state = [graph[str(node_id)]['data']['status'] for node_id in graph]

# Run the simulation for the given number of days
days = env_params["simulate_days"]

for day in range(days):
    # Count the states
    s_count = people_state.count('S')
    e_count = people_state.count('E')
    i_count = people_state.count('I')
    r_count = people_state.count('R')
    d_count = people_state.count('D')

    # Print current day's stats
    print(f"Day {day}: S={s_count} E={e_count} I={i_count} R={r_count} D={d_count}")

    # Update the graph for the next day
    next_day(graph, scenario_params)

    # Update people_state from the graph after state changes
    people_state = [graph[str(node_id)]['data']['status'] for node_id in graph]
