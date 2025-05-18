
env_params = {
    "total_population": 1000,
    "simulate_days": 10,
    "average_neighbours": 6,
    "rewire_probability": 0.1,
}

scenario_params = {
    "S2E": 0.05,
    "S2E_TAU": 0.5,
    "E2I": 0.1,
    "I2R": 0.1,
    "R2S": 0.5,
    "I2D": 0.001,
    "E2R": 0.1,
}

infection_range = { min: 0.01, max: 0.05 }
doctors_range = { min: 0.01, max: 0.1 }