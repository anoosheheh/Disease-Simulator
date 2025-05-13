export interface NodeData {
  id: string;
  age: number;
  status: 'healthy' | 'infected' | 'recovered' | 'deceased';
  initialStatus?: 'healthy' | 'infected';
  daysInfected?: number;
  hub?: number;  // The hub ID this node belongs to
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
  weight: number; // Interaction intensity (0-1)
}

export interface SimulationData {
  nodes: NodeData[];
  links: LinkData[];
}

export interface SimulationParams {
  transmissionRate: number;
  recoveryRate: number;
  mortalityBase: number;
  simulationSpeed: number;
  medicineEnabled: boolean;
  medicineEffectiveness: number;
  medicineDayIntroduced: number;
}

export interface SimulationState {
  isRunning: boolean;
  isFinished: boolean;
  currentDay: number;
}