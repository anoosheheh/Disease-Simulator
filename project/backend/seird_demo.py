from graphing import generate_random_network
from seird_model import next_day, count_people_state
import matplotlib.pyplot as plt
from params import env_params, scenario_params


graph = generate_random_network(
    env_params["total_population"],
    env_params["average_neighbours"],
    env_params["rewire_probability"]
)

history = {
    'healthy': [],
    'exposed': [],
    'infected': [],
    'recovered': [],
    'dead': []
}

people_state = count_people_state(graph)

for day in range(env_params["simulate_days"]):
    s_count = people_state[0]
    e_count = people_state[1]
    i_count = people_state[2]
    r_count = people_state[3]
    d_count = people_state[4]

    history['healthy'].append(s_count)
    history['exposed'].append(e_count)
    history['infected'].append(i_count)
    history['recovered'].append(r_count)
    history['dead'].append(d_count)

    #print(f"Day {day}: healthy={s_count} exposed={e_count} infected={i_count} recovered={r_count} dead={d_count}")

    next_day(graph, people_state, scenario_params)

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
