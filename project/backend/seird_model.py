import random
from typing import List, Dict, Any
from tqdm import tqdm
import numpy as np

# Constants for disease states
SUSCEPTIBLE = 'healthy'
EXPOSED = 'exposed'
INFECTED = 'infected'
RECOVERED = 'recovered'
DEAD = 'dead'

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

def mortality_factor(age, base_probability):
    alpha=0.09
    beta=0.05
    A0=35
    young_risk = np.exp(-alpha * age)
    old_risk = np.exp(beta * (age - A0))
    return min(1.0, base_probability * (young_risk + old_risk)) # cap to 1.0



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
    node = graph[str(person_id)]['data']
    person_state = node['status']

    if person_state == SUSCEPTIBLE:
        infection_prob = min(
            neighbour_infection_factor(graph, person_id, scenario_params) + random_infection_probability,
            1.0
        )
        dice = throw_dice(infection_prob)
        if dice == 1:
            node['status'] = EXPOSED
            node['daysInfected'] = 0
        else:
            node['status'] = SUSCEPTIBLE
            node['daysInfected'] = None

    elif person_state == EXPOSED:
        dice = throw_dice(E2I, E2R)
        if dice == 1:
            node['status'] = INFECTED
            node['daysInfected'] = 0
        elif dice == 2:
            node['status'] = RECOVERED
            node['daysInfected'] = None
        else:
            node['status'] = EXPOSED
            node['daysInfected'] = 0

    elif person_state == INFECTED:
        age = node['age']
        recovery_prob = I2R
        death_prob = mortality_factor(age, I2D)
        total = recovery_prob + death_prob

        if total > 1.0:
            recovery_prob /= total
            death_prob /= total

        dice = throw_dice(recovery_prob, death_prob)
        if dice == 1:
            node['status'] = RECOVERED
            node['daysInfected'] = None
        elif dice == 2:
            node['status'] = DEAD
            node['daysInfected'] = None
        else:
            node['status'] = INFECTED
            node['daysInfected'] = node['daysInfected'] + 1 if node['daysInfected'] is not None else 1


    elif person_state == RECOVERED:
        dice = throw_dice(R2S)
        if dice == 1:
            node['status'] = SUSCEPTIBLE
            node['daysInfected'] = None
        else:
            node['status'] = RECOVERED
            node['daysInfected'] = None

    elif person_state == DEAD:
        node['status'] = DEAD
        node['daysInfected'] = None


def next_day(graph, scenario_params):
    """
    Simulates the progression of the disease for one day.
    Updates the states of individuals in the graph.
    """
    # Snapshot of current statuses to avoid in-place mutation effects
    current_graph_snapshot = {
        person_id: {
            'status': person_data['data']['status'],
            'age': person_data['data']['age'],
            'daysInfected': person_data['data'].get('daysInfected', None)
        }
        for person_id, person_data in graph.items()
    }

    # Calculate living and infected populations
    living_population = sum(
        1 for data in current_graph_snapshot.values()
        if data["status"] != DEAD
    )

    infected_population = sum(
        1 for data in current_graph_snapshot.values()
        if data["status"] == INFECTED
    )

    # Calculate random infection probability
    S2E_TAU = scenario_params["S2E_TAU"]
    if living_population > 0:
        random_infection_probability = (infected_population / living_population) * S2E_TAU
    else:
        random_infection_probability = 0

    # Use snapshot for stable transition logic
    for person_id in graph:
        # Temporarily replace graph lookups with snapshot data for consistent reads
        graph[person_id]['data']['status'] = current_graph_snapshot[person_id]['status']
        graph[person_id]['data']['age'] = current_graph_snapshot[person_id]['age']
        graph[person_id]['data']['daysInfected'] = current_graph_snapshot[person_id]['daysInfected']

    # Now process transitions using the consistent snapshot state
    for person_id in graph:
        person_next_state(
            person_id,
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


