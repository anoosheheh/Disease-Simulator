// Health status of a node — exactly matches backend status codes
export type HealthStatus = 'S' | 'E' | 'I' | 'R' | 'D';

export interface NodeData {
  id: string;
  age: number;
  status: HealthStatus;         // Current health status
  daysInfected?: number | null; // For 'E' or 'I' individuals
  initialStatus?: HealthStatus; // Used to reset simulation to original state
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  index?: number;
}

export interface LinkData {
  source: string | NodeData;
  target: string | NodeData;
  weight: number; // Interaction strength (default: 1.0)
}

export interface SimulationData {
  nodes: NodeData[];
  links: LinkData[];
  peopleState?: number[]; // Array of [S, E, I, R, D] counts
}

export interface SimulationParams {
  S2E: number;               // Probability of exposure from neighbors
  S2E_TAU: number;           // Background infection rate
  E2I: number;               // Transition rate from exposed to infected
  E2R: number;               // Asymptomatic recovery from exposed state
  I2R: number;               // Recovery from infected state
  I2D: number;               // Death rate from infected state
  R2S: number;               // Loss of immunity (recovered to susceptible)
  simulationSpeed: number;   // Speed multiplier for simulation timing
}

export interface SimulationState {
  running: boolean;
  isFinished: boolean;
  currentDay: number;
  data: SimulationData | null;
}
