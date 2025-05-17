import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { SimulationData, SimulationParams, SimulationState, NodeData } from '../types/simulationTypes';

interface SimulationContextType {
  simulationData: SimulationData | null;
  simulationState: SimulationState;
  simulationParams: SimulationParams;
  fetchDefaultGraph: () => Promise<void>;
  uploadGraph: (data: SimulationData) => Promise<void>;
  startSimulation: () => void;
  pauseSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  updateSimulationParams: (params: Partial<SimulationParams>) => void;
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
        ...response.data,
        nodes: response.data.nodes.map((node: NodeData) => ({
          ...node,
          initialStatus: node.status,
        })),
      };
      setSimulationData(graph);
      resetSimulation(graph);
    } catch (error) {
      console.error('Error fetching default graph:', error);
    }
  }, []);

  const uploadGraph = useCallback(async (data: SimulationData) => {
    try {
      if (!data.nodes || !data.links) throw new Error('Invalid graph format');
      const response = await axios.post('http://127.0.0.1:5000/api/graph/upload', data);
      const graph: SimulationData = {
        ...response.data,
        nodes: response.data.nodes.map((node: NodeData) => ({
          ...node,
          initialStatus: node.status,
        })),
      };
      setSimulationData(graph);
      resetSimulation(graph);
    } catch (error) {
      console.error('Error uploading graph:', error);
    }
  }, []);

  const startSimulation = useCallback(async () => {
    if (!simulationData || simulationState.isFinished) return;

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/simulation/start', {
        data: simulationData,
        params: simulationParams,
      });

      if (response.data.status === 'started') {
        setSimulationState(prev => ({ ...prev, running: true }));

        intervalRef.current = window.setInterval(async () => {
          try {
            const res = await axios.get('http://127.0.0.1:5000/api/simulation/state');
            const { data, currentDay, running, isFinished } = res.data;

            setSimulationData(data);
            setSimulationState(prev => ({
              ...prev,
              data,
              running,
              currentDay,
              isFinished,
            }));

            if (isFinished || !running) {
              clearInterval(intervalRef.current!);
              intervalRef.current = null;
            }
          } catch (err) {
            console.error('Polling simulation state failed:', err);
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
    }
  }, [simulationData, simulationParams, simulationState.isFinished]);

  const pauseSimulation = useCallback(() => {
    setSimulationState(prev => ({ ...prev, running: false }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stepSimulation = useCallback(async () => {
    if (!simulationData || simulationState.isFinished) return;

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/simulation/step', {
        data: simulationData,
        params: simulationParams,
        currentDay: simulationState.currentDay
      });

      const { data: newData, currentDay, isFinished, running } = response.data;

      setSimulationData(newData);
      setSimulationState(prev => ({
        ...prev,
        currentDay,
        isFinished,
        running,
        data: newData,
      }));

      if (isFinished) pauseSimulation();
    } catch (error) {
      console.error('Error stepping simulation:', error);
      pauseSimulation();
    }
  }, [simulationData, simulationState.currentDay, simulationParams, simulationState.isFinished, pauseSimulation]);

  const resetSimulation = useCallback((customData?: SimulationData) => {
    pauseSimulation();

    const dataToUse = customData || simulationData;
    if (dataToUse) {
      const resetData = {
        ...dataToUse,
        nodes: dataToUse.nodes.map(node => ({
          ...node,
          initialStatus: node.status,
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
        uploadGraph,
        startSimulation,
        pauseSimulation,
        stepSimulation,
        resetSimulation,
        updateSimulationParams,
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
