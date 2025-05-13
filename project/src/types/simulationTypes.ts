export type HealthStatus = 'S' | 'E' | 'I' | 'R' | 'D'; // Susceptible, Exposed, Infected, Recovered, Dead

export interface NodeData {
  id: string;
  age: number;
  status: HealthStatus;         // 'S', 'E', 'I', 'R', 'D'
  daysInfected?: number | null; // nullable, present only for E/I
  initialStatus?: HealthStatus; // for visualization reset
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
  weight: number; // Interaction intensity (default: 1.0)
}

export interface SimulationData {
  nodes: NodeData[];
  links: LinkData[];
}

export interface SimulationParams {
  S2E: number;                 // Base infection probability from neighbors
  S2E_TAU: number;            // Background infection pressure
  E2I: number;                // Exposed to Infected
  I2R: number;                // Infected to Recovered
  R2S: number;                // Recovered to Susceptible (loss of immunity)
  I2D: number;                // Infected to Dead
  E2R: number;                // Exposed to Recovered (asymptomatic recovery)
  simulationSpeed: number; // Speed of simulation (1.0 = normal speed)
}

export interface SimulationState {
  running: boolean;
  isFinished: boolean;
  currentDay: number;
  data: SimulationData | null;
}
