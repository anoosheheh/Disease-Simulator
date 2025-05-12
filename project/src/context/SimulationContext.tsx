import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { SimulationData, SimulationParams, SimulationState } from '../types/simulationTypes';

interface SimulationContextType {
  simulationData: SimulationData | null;
  simulationState: SimulationState;
  simulationParams: SimulationParams;
  fetchDefaultGraph: () => Promise<void>;
  uploadGraph: (data: SimulationData) => Promise<void>;
  generateRandomGraph: () => Promise<void>;
  startSimulation: () => void;
  pauseSimulation: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  updateSimulationParams: (params: Partial<SimulationParams>) => void;
}

const defaultSimulationParams: SimulationParams = {
  transmissionRate: 0.5,
  recoveryRate: 0.2,
  mortalityBase: 0.05,
  simulationSpeed: 1,
  medicineEnabled: false,
  medicineEffectiveness: 0.5,
  medicineDayIntroduced: 10,
};

const initialSimulationState: SimulationState = {
  isRunning: false,
  isFinished: false,
  currentDay: 0,
};

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState>(initialSimulationState);
  const [simulationParams, setSimulationParams] = useState<SimulationParams>(defaultSimulationParams);
  const [simulationInterval, setSimulationInterval] = useState<number | null>(null);

  // Fetch default graph from backend
  const fetchDefaultGraph = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/graph/default');
      setSimulationData(response.data);
      resetSimulation();
    } catch (error) {
      console.error('Error fetching default graph:', error);
      throw error;
    }
  }, []);

  // Upload custom graph
  const uploadGraph = useCallback(async (data: SimulationData) => {
    try {
      // Validate the graph format
      if (!data.nodes || !data.links || !Array.isArray(data.nodes) || !Array.isArray(data.links)) {
        throw new Error('Invalid graph format');
      }
      
      // Send to backend for processing
      const response = await axios.post('http://127.0.0.1:5000/api/graph/upload', data);
      setSimulationData(response.data);
      resetSimulation();
      return response.data;
    } catch (error) {
      console.error('Error uploading graph:', error);
      throw error;
    }
  }, []);

  // Generate random graph
  const generateRandomGraph = useCallback(async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/graph/random');
      setSimulationData(response.data);
      resetSimulation();
      return response.data;
    } catch (error) {
      console.error('Error generating random graph:', error);
      throw error;
    }
  }, []);

  // Start the simulation
  const startSimulation = useCallback(() => {
    if (simulationState.isFinished || !simulationData) return;
    
    setSimulationState(prev => ({ ...prev, isRunning: true }));
    
    // Clear any existing interval
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }
    
    // Set new interval based on simulation speed
    const intervalId = window.setInterval(() => {
      stepSimulation();
    }, 1000 / simulationParams.simulationSpeed);
    
    setSimulationInterval(intervalId);
  }, [simulationState.isFinished, simulationData, simulationInterval, simulationParams.simulationSpeed]);

  // Pause the simulation
  const pauseSimulation = useCallback(() => {
    setSimulationState(prev => ({ ...prev, isRunning: false }));
    
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
  }, [simulationInterval]);

  // Perform one step of the simulation
  const stepSimulation = useCallback(async () => {
    if (!simulationData || simulationState.isFinished) return;
    
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/simulation/step', {
        data: simulationData,
        params: simulationParams,
        currentDay: simulationState.currentDay,
      });
      
      setSimulationData(response.data.simulationData);
      
      setSimulationState(prev => ({
        ...prev,
        currentDay: prev.currentDay + 1,
        isFinished: response.data.isFinished,
      }));
      
      // Check if simulation is finished
      if (response.data.isFinished) {
        pauseSimulation();
      }
    } catch (error) {
      console.error('Error stepping simulation:', error);
      pauseSimulation();
    }
  }, [simulationData, simulationState.isFinished, simulationState.currentDay, simulationParams, pauseSimulation]);

  // Reset the simulation
  const resetSimulation = useCallback(() => {
    pauseSimulation();
    setSimulationState(initialSimulationState);
    
    // Reset infected nodes in the current graph
    if (simulationData) {
      const resetData = {
        ...simulationData,
        nodes: simulationData.nodes.map(node => ({
          ...node,
          status: node.initialStatus || 'healthy',
          daysInfected: 0,
        })),
      };
      setSimulationData(resetData);
    }
  }, [simulationData, pauseSimulation]);

  // Update simulation parameters
  const updateSimulationParams = useCallback((params: Partial<SimulationParams>) => {
    setSimulationParams(prev => ({ ...prev, ...params }));
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);

  const value = {
    simulationData,
    simulationState,
    simulationParams,
    fetchDefaultGraph,
    uploadGraph,
    generateRandomGraph,
    startSimulation,
    pauseSimulation,
    stepSimulation,
    resetSimulation,
    updateSimulationParams,
  };

  return (
    <SimulationContext.Provider value={value}>
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