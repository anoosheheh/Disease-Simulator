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

def base_probability_factor(people_state, S2E_TAU):
    living_population = people_state[0] + people_state[1] + people_state[2] + people_state[3]
    infected_population = people_state[2]
    if living_population > 0:
        base_probability = (infected_population / living_population) * S2E_TAU
    else:
        base_probability = 0
    return base_probability


def recovery_factor(no_doctors, people_state, base_probability):    
    total_population = people_state[0] + people_state[1] + people_state[2] + people_state[3]
    if no_doctors <= 0 or total_population <= 0:
        return base_probability  # Edge case: no doctors/population
    
    doctor_ratio = no_doctors / total_population
    bonus = 0.01 * math.sqrt(doctor_ratio)  # Diminishing returns
    
    # Cap bonus to avoid overfitting if doctors somehow increase
    max_bonus = 0.35  # Even with infinite doctors, bonus never exceeds 35%
    bonus = min(bonus, max_bonus)
    
    return min(0.95, base_probability + bonus)  # Cap total recovery