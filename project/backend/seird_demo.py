# This file is only for simulating the infection to test before deploying on frontend

from graphing import generate_random_network
from seird_model import next_day
import matplotlib.pyplot as plt
from graphing import build_adjacency_list

# Generate a random graph in D3.js JSON format
env_params = {
    "total_population": 5000,
    "simulate_days": 100,
    "average_neighbours": 6,
    "rewire_probability": 0.1,
}

graph = generate_random_network(env_params["total_population"],
    env_params["average_neighbours"],
    env_params["rewire_probability"]
)
graph = build_adjacency_list(graph)

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

# Lists to store counts for each state
days = env_params["simulate_days"]
s_counts, e_counts, i_counts, r_counts, d_counts = [], [], [], [], []

for day in range(days):
    # Count the states
    s_count = people_state.count('S')
    e_count = people_state.count('E')
    i_count = people_state.count('I')
    r_count = people_state.count('R')
    d_count = people_state.count('D')

    # Append counts to lists
    s_counts.append(s_count)
    e_counts.append(e_count)
    i_counts.append(i_count)
    r_counts.append(r_count)
    d_counts.append(d_count)

    print(
        f"Day {day}: S={s_count} E={e_count} I={i_count} R={r_count} D={d_count}"
    )

    # Update the graph for the next day
    next_day(graph, scenario_params)

    # Update people_state from the graph after state changes
    people_state = [graph[str(node_id)]['data']['status'] for node_id in graph]

# Plot the results
plt.figure(figsize=(10, 6))
plt.plot(range(days), s_counts, label='Susceptible (S)', color='blue')
plt.plot(range(days), e_counts, label='Exposed (E)', color='orange')
plt.plot(range(days), i_counts, label='Infected (I)', color='red')
plt.plot(range(days), r_counts, label='Recovered (R)', color='green')
plt.plot(range(days), d_counts, label='Dead (D)', color='black')

plt.title('Disease Progression Over Time')
plt.xlabel('Days')
plt.ylabel('Population Count')
plt.legend()
plt.grid()
plt.tight_layout()
plt.show()