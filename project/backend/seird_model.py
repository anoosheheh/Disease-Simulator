import random
from typing import List, Dict, Any
from tqdm import tqdm
import numpy as np

# Constants for disease states
SUSCEPTIBLE = 'S'
EXPOSED = 'E'
INFECTED = 'I'
RECOVERED = 'R'
DEAD = 'D'

# For reproducibility!
random.seed(1234)


def bob_roll(*p):
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

    for neighbor_id in graph.neighbors(person_id):
        status = graph.nodes[neighbor_id]['status']
        weight = graph[person_id][neighbor_id].get("weight", 1.0)

        if status == INFECTED:
            total_weight += weight

    return 1 - (1 - S2E) ** total_weight


def mortality_factor(age, base_probability):
    alpha=0.09
    beta=0.005
    A0=35
    young_risk = np.exp(-alpha * age)
    old_risk = np.exp(beta * (age - A0))
    return min(1.0, base_probability * (young_risk + old_risk)) # cap to 1.0

def base_probability_factor(graph, S2E_TAU):
    living_population = sum(
    1 for person_data in graph.nodes.values()
    if person_data['status'] != DEAD
    )

    infected_population = sum(
        1 for person_data in graph.nodes.values()
        if person_data['status'] == INFECTED
    )

    if living_population > 0:
        base_probability = (infected_population / living_population) * S2E_TAU
    else:
        base_probability = 0
    return base_probability


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
    node = graph.nodes[person_id]
    person_state = node['status']
    person_age = node['age']

    if person_state == SUSCEPTIBLE:
        infection_prob = min(
            neighbour_infection_factor(graph, person_id, scenario_params) + random_infection_probability,
            1.0
        )
        dice = bob_roll(infection_prob)
        if dice == 1:
            node['status'] = EXPOSED
            node['daysInfected'] = 0
        else:
            node['status'] = SUSCEPTIBLE
            node['daysInfected'] = None

    elif person_state == EXPOSED:
        dice = bob_roll(E2I, E2R)
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
        # Increment days infected
        
        dice = bob_roll(I2R, mortality_factor(person_age, I2D))
        if dice == 1:
            node['status'] = RECOVERED
            node['daysInfected'] = None
        elif dice == 2:
            node['status'] = DEAD
            node['daysInfected'] = None
        else:
            node['status'] = INFECTED
            node['daysInfected'] = (node.get('daysInfected') or 0) + 1
            
    elif person_state == RECOVERED:
        dice = bob_roll(R2S)
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
    base_probability = base_probability_factor(graph, scenario_params["S2E_TAU"])
    

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
            base_probability
        )
    