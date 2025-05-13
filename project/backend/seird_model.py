import random
from typing import List, Dict, Any
from tqdm import tqdm

# Constants for disease states
SUSCEPTIBLE = 'S'
EXPOSED = 'E'
INFECTED = 'I'
RECOVERED = 'R'
DEAD = 'D'

# For reproducibility!
random.seed(1234)


def throw_dice(*p):
    """Simulate probability-based decision making."""
    assert len(p) != 0
    assert sum(p) <= 1

    k = random.random()
    s = 0
    for i in range(len(p)):
        if s <= k <= s + p[i]:
            return i + 1
        s += p[i]
    return 0


def neighbour_infection_factor(graph, person_id, scenario_params):
    S2E = scenario_params["S2E"]
    total_weight = 0.0

    person_id_str = str(person_id)
    neighbors = graph.get(person_id_str, {}).get('neighbors', [])

    for neighbor in neighbors:
        neighbor_id = neighbor['id']
        status = graph.get(neighbor_id, {}).get('data', {}).get('status')

        if status == INFECTED:
            total_weight += neighbor.get('weight', 1.0)

    return 1 - (1 - S2E) ** total_weight

def mortility_factor(graph, person_id, I2D):
    age = graph[str(person_id)]['data']['age']

    # Normalize age effect (parabola centered at age 35)
    age_penalty = ((age - 35) / 35) ** 2  # Range: 0 (best) to ~1.8 (worst)

    adjusted_I2D = I2D * (1 + age_penalty)
    return min(adjusted_I2D, 1.0)  # Clamp to maximum probability of 1.0
    



def person_next_state(
    person_id,
    graph,
    scenario_params,
    S2E,
    S2E_TAU,
    E2I,
    I2R,
    R2S,
    I2D,
    E2R,
    random_infection_probability,
):
    person_state = graph[str(person_id)]['data']['status']

    if person_state == SUSCEPTIBLE:
        infection_prob = min(
            neighbour_infection_factor(graph, person_id, scenario_params) + random_infection_probability,
            1.0
        )
        dice = throw_dice(infection_prob)
        graph[str(person_id)]['data']['status'] = EXPOSED if dice == 1 else SUSCEPTIBLE

    elif person_state == EXPOSED:
        dice = throw_dice(E2I, E2R)
        graph[str(person_id)]['data']['status'] = INFECTED if dice == 1 else RECOVERED if dice == 2 else EXPOSED

    elif person_state == INFECTED:

        dice = throw_dice(I2R, mortility_factor(graph, person_id, I2D))
        if dice == 1:
            graph[str(person_id)]['data']['status'] = RECOVERED
        elif dice == 2:
            graph[str(person_id)]['data']['status'] = DEAD
        else:
            graph[str(person_id)]['data']['status'] = INFECTED

    elif person_state == RECOVERED:
        dice = throw_dice(R2S)
        if dice == 1:
            graph[str(person_id)]['data']['status'] = SUSCEPTIBLE
        else:
            graph[str(person_id)]['data']['status'] = RECOVERED

    elif person_state == DEAD:
        graph[str(person_id)]['data']['status'] = DEAD


def next_day(graph, scenario_params):
    """
    Simulates the progression of the disease for one day.
    Updates the states of individuals in the graph.
    """

    # Calculate living and infected populations
    living_population = sum(
        1 for person_data in graph.values()
        if person_data["data"]["status"] != DEAD
    )

    infected_population = sum(
        1 for person_data in graph.values()
        if person_data["data"]["status"] == INFECTED
    )

    # Calculate random infection probability
    S2E_TAU = scenario_params["S2E_TAU"]
    if living_population > 0:
        random_infection_probability = (infected_population / living_population) * S2E_TAU
    else:
        random_infection_probability = 0


    for person_id_str in graph:
        person_next_state(
            person_id_str,
            graph,
            scenario_params,
            scenario_params["S2E"],
            scenario_params["S2E_TAU"],
            scenario_params["E2I"],
            scenario_params["I2R"],
            scenario_params["R2S"],
            scenario_params["I2D"],
            scenario_params["E2R"],
            random_infection_probability
        )

