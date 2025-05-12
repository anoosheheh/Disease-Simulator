import React, { useState, useEffect } from 'react';
import NetworkGraph from './NetworkGraph';
import ControlPanel from './ControlPanel';
import StatsPanel from './StatsPanel';
import GraphUploader from './GraphUploader';
import { useSimulationContext } from '../context/SimulationContext';
import { AlertTriangle } from 'lucide-react';

const SimulationContainer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { simulationData, fetchDefaultGraph } = useSimulationContext();

  useEffect(() => {
    const loadDefaultData = async () => {
      try {
        setIsLoading(true);
        await fetchDefaultGraph();
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load default simulation data. Please try uploading your own graph.');
        setIsLoading(false);
      }
    };

    loadDefaultData();
  }, [fetchDefaultGraph]);

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 h-[70vh] md:h-[80vh] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center text-red-400">
                <div className="flex flex-col items-center">
                  <AlertTriangle size={48} className="mb-2" />
                  <p>{error}</p>
                </div>
              </div>
            ) : simulationData ? (
              <NetworkGraph />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p>No simulation data available. Please upload a graph or generate one.</p>
              </div>
            )}
          </div>
          <StatsPanel />
        </div>
        <div>
          <div className="space-y-4">
            <GraphUploader />
            <ControlPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationContainer;