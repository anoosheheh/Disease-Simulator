import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { SimulationData, SimulationParams, SimulationState, NodeData } from '../types/simulationTypes';

interface SimulationContextType {
  simulationData: SimulationData | null;
  simulationState: SimulationState;
  simulationParams: SimulationParams;
  fetchDefaultGraph: () => Promise<void>;
  startSimulation: () => void;
  pauseSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  updateSimulationParams: (params: Partial<SimulationParams>) => void;
  initSimulation: () => Promise<void>;
}

const defaultSimulationParams: SimulationParams = {
  S2E: 0.4,
  S2E_TAU: 0.01,
  E2I: 0.3,
  E2R: 0.1,
  I2R: 0.2,
  I2D: 0.05,
  R2S: 0.01,
  simulationSpeed: 1.0,
};

const initialSimulationState: SimulationState = {
  running: false,
  isFinished: false,
  currentDay: 0,
  data: null,
};

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState>(initialSimulationState);
  const [simulationParams, setSimulationParams] = useState<SimulationParams>(defaultSimulationParams);
  const intervalRef = useRef<number | null>(null);

  const fetchDefaultGraph = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/graph/default');
      const graph: SimulationData = {
        ...response.data.data,
        nodes: response.data.data.nodes.map((node: NodeData) => ({
          ...node,
          initialStatus: node.status,
        })),
        peopleState: response.data.peopleState
      };
      setSimulationData(graph);
      resetSimulation(graph);
    } catch (error) {
      console.error('Error fetching default graph:', error);
    }
  }, []);

  const startSimulation = useCallback(async () => {
    if (simulationState.isFinished) return;

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/simulation/start', {
        params: simulationParams,
        speed: simulationParams.simulationSpeed * 1000, // convert to ms
      });

      const { data, currentDay, running, isFinished, peopleState } = response.data;

      setSimulationData({ ...data, peopleState });
      setSimulationState({
        data: { ...data, peopleState },
        running,
        currentDay,
        isFinished,
      });

      intervalRef.current = window.setInterval(async () => {
        try {
          const res = await axios.get('http://127.0.0.1:5000/api/simulation/state');
          const { data, currentDay, running, isFinished, peopleState } = res.data;

          setSimulationData({ ...data, peopleState });
          setSimulationState({
            data: { ...data, peopleState },
            currentDay,
            running,
            isFinished,
          });

          if (!running || isFinished) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
          }
        } catch (err) {
          console.error('Polling simulation state failed:', err);
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
        }
      }, 500);
    } catch (error) {
      console.error('Error starting simulation:', error);
    }
  }, [simulationParams, simulationState.isFinished]);

  const pauseSimulation = useCallback(async () => {
    await axios.post('http://127.0.0.1:5000/api/simulation/pause');
    setSimulationState(prev => ({ ...prev, running: false }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stepSimulation = useCallback(async () => {
    // Only allow stepping if simulation is not running
    if (simulationState.running) return;

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/simulation/step', {
        params: simulationParams,
      });

      const { data, currentDay, running, isFinished, peopleState } = response.data;

      setSimulationData({ ...data, peopleState });
      setSimulationState({
        data: { ...data, peopleState },
        currentDay,
        running: false, // Always pause after step
        isFinished,
      });
    } catch (error) {
      console.error('Error stepping simulation:', error);
      setSimulationState(prev => ({ ...prev, running: false }));
    }
  }, [simulationParams, simulationState.running]);

  const resetSimulation = useCallback((customData?: SimulationData) => {
    pauseSimulation();

    const dataToUse = customData || simulationData;
    if (dataToUse) {
      const resetData = {
        ...dataToUse,
        nodes: dataToUse.nodes.map(node => ({
          ...node,
          status: node.initialStatus as NonNullable<typeof node.initialStatus>,
          daysInfected: null,
        })),
      };
      setSimulationData(resetData);
      setSimulationState({
        running: false,
        isFinished: false,
        currentDay: 0,
        data: resetData,
      });
    } else {
      setSimulationState(initialSimulationState);
    }
  }, [simulationData, pauseSimulation]);

  const updateSimulationParams = useCallback((params: Partial<SimulationParams>) => {
    setSimulationParams(prev => ({ ...prev, ...params }));
  }, []);

  const initSimulation = useCallback(async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/simulation/init', {
        params: simulationParams,
      });
      const { data, currentDay, running, isFinished, peopleState } = response.data;
      setSimulationData({ ...data, peopleState });
      setSimulationState({
        data: { ...data, peopleState },
        running,
        currentDay,
        isFinished,
      });
    } catch (error) {
      console.error('Error initializing simulation:', error);
    }
  }, [simulationParams]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        simulationData,
        simulationState,
        simulationParams,
        fetchDefaultGraph,
        startSimulation,
        pauseSimulation,
        stepSimulation,
        resetSimulation,
        updateSimulationParams,
        initSimulation,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulationContext = () => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }
  return context;
};
