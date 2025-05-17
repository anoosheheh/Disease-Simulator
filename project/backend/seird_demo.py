from graphing import generate_random_network
from seird_model import next_day
import matplotlib.pyplot as plt
from params import env_params, scenario_params


graph = generate_random_network(
    env_params["total_population"],
    env_params["average_neighbours"],
    env_params["rewire_probability"]
)

# Initialize people_state
people_state = [graph.nodes[i]['status'] for i in graph.nodes()]

history = {
    'healthy': [],
    'exposed': [],
    'infected': [],
    'recovered': [],
    'dead': []
}

for day in range(env_params["simulate_days"]):
    s_count = people_state.count('S')
    e_count = people_state.count('E')
    i_count = people_state.count('I')
    r_count = people_state.count('R')
    d_count = people_state.count('D')

    history['healthy'].append(s_count)
    history['exposed'].append(e_count)
    history['infected'].append(i_count)
    history['recovered'].append(r_count)
    history['dead'].append(d_count)

    print(f"Day {day}: healthy={s_count} exposed={e_count} infected={i_count} recovered={r_count} dead={d_count}")

    next_day(graph, scenario_params)

    # Update people_state for next day
    people_state = [graph.nodes[i]['status'] for i in graph.nodes()]

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
