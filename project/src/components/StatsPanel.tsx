import React from 'react';
import { PieChart, BarChart, Activity } from 'lucide-react';
import { useSimulationContext } from '../context/SimulationContext';

const StatsPanel: React.FC = () => {
  const { simulationData, simulationState } = useSimulationContext();
  
  if (!simulationData?.nodes) {
    return null;
  }
  
  // Calculate statistics
  const totalNodes = simulationData.nodes.length;
  const healthyCounts = simulationData.nodes.filter(node => node.status === 'healthy').length;
  const infectedCounts = simulationData.nodes.filter(node => node.status === 'infected').length;
  const recoveredCounts = simulationData.nodes.filter(node => node.status === 'recovered').length;
  const deceasedCounts = simulationData.nodes.filter(node => node.status === 'deceased').length;
  
  // Calculate percentages
  const healthyPercentage = (healthyCounts / totalNodes) * 100;
  const infectedPercentage = (infectedCounts / totalNodes) * 100;
  const recoveredPercentage = (recoveredCounts / totalNodes) * 100;
  const deceasedPercentage = (deceasedCounts / totalNodes) * 100;
  
  // Stat item component
  const StatItem = ({ label, count, percentage, color }: { 
    label: string; 
    count: number; 
    percentage: number; 
    color: string; 
  }) => (
    <div className="flex flex-col">
      <div className="flex items-center mb-1">
        <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{count}</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
        <div 
          className={`h-1.5 rounded-full ${color}`} 
          style={{ width: `${percentage}%` }}>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 mt-4 rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold flex items-center">
          <Activity size={18} className="mr-2" /> Simulation Statistics
        </h3>
        <div className="text-sm text-gray-400">
          Day: {simulationState.currentDay}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatItem 
          label="Healthy" 
          count={healthyCounts} 
          percentage={healthyPercentage} 
          color="bg-green-500" 
        />
        <StatItem 
          label="Infected" 
          count={infectedCounts} 
          percentage={infectedPercentage} 
          color="bg-red-500" 
        />
        <StatItem 
          label="Recovered" 
          count={recoveredCounts} 
          percentage={recoveredPercentage} 
          color="bg-blue-500" 
        />
        <StatItem 
          label="Deceased" 
          count={deceasedCounts} 
          percentage={deceasedPercentage} 
          color="bg-gray-500" 
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center text-sm mb-2">
            <PieChart size={16} className="mr-2" />
            <span>Population</span>
          </div>
          <div className="text-2xl font-bold">
            {totalNodes - deceasedCounts}
            <span className="text-sm text-gray-400 ml-1">/{totalNodes}</span>
          </div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center text-sm mb-2">
            <BarChart size={16} className="mr-2" />
            <span>Infection Rate</span>
          </div>
          <div className="text-2xl font-bold">
            {((infectedCounts / (totalNodes - deceasedCounts)) * 100 || 0).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;