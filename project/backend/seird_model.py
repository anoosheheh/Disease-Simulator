import random
import numpy as np
import math

# Constants for disease states
SUSCEPTIBLE = 'S'
EXPOSED = 'E'
INFECTED = 'I'
RECOVERED = 'R'
DEAD = 'D'

# For reproducibility!
random.seed(1234)

from probability_factors import (
    neighbour_infection_factor,
    mortality_factor,
    base_probability_factor,
    recovery_factor
)


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

def count_people_state(graph):
    # Initialize people_state
    people_state = [
        sum(1 for i in graph.nodes if graph.nodes[i]['status'] == 'S'),
        sum(1 for i in graph.nodes if graph.nodes[i]['status'] == 'E'),
        sum(1 for i in graph.nodes if graph.nodes[i]['status'] == 'I'),
        sum(1 for i in graph.nodes if graph.nodes[i]['status'] == 'R'),
        sum(1 for i in graph.nodes if graph.nodes[i]['status'] == 'D'),
    ]
    return people_state

def count_doctors(graph):
    no_doctors = 0
    for i in graph.nodes:
        node = graph.nodes[i]
        if node.get('isDoctor') == 1 and node['status'] not in ['I', 'D']:
            no_doctors += 1
    return no_doctors

def person_next_state(
    person_id,
    graph,
    people_state,
    scenario_params,
    S2E,
    S2E_TAU,
    E2I,
    I2R,
    R2S,
    I2D,
    E2R,
    random_infection_probability,
    recovery_probability
):
    node = graph.nodes[person_id]
    person_state = node['status']
    person_age = node['age']

    if person_state == SUSCEPTIBLE:
        infection_prob = min(
            neighbour_infection_factor(graph, person_id, scenario_params) + random_infection_probability,
            1.0
        )
        bob = bob_roll(infection_prob)
        if bob == 1:
            node['status'] = EXPOSED
            people_state[0] -= 1
            people_state[1] += 1
            node['daysInfected'] = 0
        else:
            node['status'] = SUSCEPTIBLE
            node['daysInfected'] = None

    elif person_state == EXPOSED:
        bob = bob_roll(E2I, E2R)
        if bob == 1:
            node['status'] = INFECTED
            people_state[1] -= 1
            people_state[2] += 1
            node['daysInfected'] = 0
        elif bob == 2:
            node['status'] = RECOVERED
            people_state[1] -= 1
            people_state[3] += 1
            node['daysInfected'] = None
        else:
            node['status'] = EXPOSED
            node['daysInfected'] = 0

    elif person_state == INFECTED:   

        dying_probability = mortality_factor(person_age, I2D)
        if recovery_probability == 0.95:
            dying_probability = 0.05        
        bob = bob_roll(recovery_probability, dying_probability)
        if bob == 1:
            node['status'] = RECOVERED
            people_state[2] -= 1
            people_state[3] += 1
            node['daysInfected'] = None
        elif bob == 2:
            node['status'] = DEAD
            people_state[2] -= 1
            people_state[4] += 1
            node['daysInfected'] = None
        else:
            node['status'] = INFECTED
            node['daysInfected'] = (node.get('daysInfected') or 0) + 1
            
    elif person_state == RECOVERED:
        bob = bob_roll(R2S)
        if bob == 1:
            node['status'] = SUSCEPTIBLE
            people_state[3] -= 1
            people_state[0] += 1
            node['daysInfected'] = None
        else:
            node['status'] = RECOVERED
            node['daysInfected'] = None

    elif person_state == DEAD:
        node['status'] = DEAD
        node['daysInfected'] = None


def next_day(graph, people_state, scenario_params):
    """
    Simulates the progression of the disease for one day.
    Updates the states of individuals in the graph.
    """
    base_probability = base_probability_factor(people_state, scenario_params["S2E_TAU"])
    no_doctors = count_doctors(graph)
    recovery_probability = recovery_factor(no_doctors, people_state, scenario_params["I2R"])

    for person_id in graph:
        person_next_state(
            person_id,
            graph,
            people_state,
            scenario_params,
            scenario_params["S2E"],
            scenario_params["S2E_TAU"],
            scenario_params["E2I"],
            scenario_params["I2R"],
            scenario_params["R2S"],
            scenario_params["I2D"],
            scenario_params["E2R"],
            base_probability,
            recovery_probability
        )
    