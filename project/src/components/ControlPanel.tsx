import React from 'react';
import { Play, Pause, SkipForward, Settings, Activity } from 'lucide-react';
import { useSimulationContext } from '../context/SimulationContext';

const ControlPanel: React.FC = () => {
  const {
    simulationState,
    simulationParams,
    startSimulation,
    pauseSimulation,
    stepSimulation,
    updateSimulationParams,
    hardResetSimulation,
    initSimulation, // <-- Import initSimulation
  } = useSimulationContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) : value;
    updateSimulationParams({ [name]: parsedValue });
  };

  // Wrapper for step that ensures initialization
  const handleStep = async () => {
    // If simulation is not initialized (e.g. currentDay === 0 and not running), init first
    if (!simulationState.data || simulationState.currentDay === 0) {
      await initSimulation();
    }
    await stepSimulation();
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Settings size={20} className="mr-2" /> Simulation Controls
      </h2>

      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <label htmlFor="simulationSpeed" className="text-sm text-gray-300">
            Speed: {simulationParams.simulationSpeed}x
          </label>
        </div>
        <input
          type="range"
          id="simulationSpeed"
          name="simulationSpeed"
          min="0.5"
          max="5"
          step="0.5"
          value={simulationParams.simulationSpeed}
          onChange={handleChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="flex space-x-2 mb-2">
        {simulationState.running ? (
          <button
            onClick={pauseSimulation}
            className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded flex-1 flex items-center justify-center"
          >
            <Pause size={16} className="mr-1" /> Pause
          </button>
        ) : (
          <button
            onClick={startSimulation}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex-1 flex items-center justify-center"
            disabled={simulationState.isFinished}
          >
            <Play size={16} className="mr-1" />
            {simulationState.currentDay > 0 ? 'Resume' : 'Play'}
          </button>
        )}

        <button
          onClick={handleStep}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex-1 flex items-center justify-center"
          disabled={simulationState.running || simulationState.isFinished}
        >
          <SkipForward size={16} className="mr-1" /> Step
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
