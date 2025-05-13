import React, { useState } from 'react';
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
    resetSimulation, // Added resetSimulation function
  } = useSimulationContext();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) : value;
    updateSimulationParams({ [name]: parsedValue });
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
          onClick={stepSimulation}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex-1 flex items-center justify-center"
          disabled={simulationState.running || simulationState.isFinished}
        >
          <SkipForward size={16} className="mr-1" /> Step
        </button>

        {/* Reset Button */}
        <button
          onClick={resetSimulation} // Added resetSimulation action
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex-1 flex items-center justify-center"
          disabled={simulationState.running}
        >
          <Activity size={16} className="mr-1" /> Reset
        </button>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded mb-4 flex items-center justify-center"
      >
        <Activity size={16} className="mr-1" />
        {showAdvanced ? 'Hide' : 'Show'} Disease Parameters
      </button>

      {showAdvanced && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label htmlFor="transmissionRate" className="block text-sm text-gray-300 mb-1">
              Transmission Rate: {simulationParams.S2E_TAU}
            </label>
            <input
              type="range"
              id="transmissionRate"
              name="transmissionRate"
              min="0"
              max="1"
              step="0.05"
              value={simulationParams.S2E_TAU}
              onChange={handleChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label htmlFor="recoveryRate" className="block text-sm text-gray-300 mb-1">
              Recovery Rate: {simulationParams.R2S}
            </label>
            <input
              type="range"
              id="recoveryRate"
              name="recoveryRate"
              min="0"
              max="1"
              step="0.05"
              value={simulationParams.R2S}
              onChange={handleChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label htmlFor="mortalityBase" className="block text-sm text-gray-300 mb-1">
              Base Mortality: {simulationParams.I2D}
            </label>
            <input
              type="range"
              id="mortalityBase"
              name="mortalityBase"
              min="0"
              max="0.5"
              step="0.01"
              value={simulationParams.I2D}
              onChange={handleChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          </div>
      )}
    </div>
  );
};

export default ControlPanel;
