import React from 'react';
import {
  PieChart as LucidePieChart,
  Activity,
  HeartPulse,
  Biohazard,
  Syringe,
  Skull,
} from 'lucide-react';
import { useSimulationContext } from '../context/SimulationContext';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatsPanel: React.FC = () => {
  const { simulationData, simulationState } = useSimulationContext();

  if (!simulationData?.nodes) return null;

  // Counts
  const totalNodes = simulationData.nodes.length;
  const healthy = simulationData.nodes.filter(n => n.status === 'healthy').length;
  const infected = simulationData.nodes.filter(n => n.status === 'infected').length;
  const recovered = simulationData.nodes.filter(n => n.status === 'recovered').length;
  const deceased = simulationData.nodes.filter(n => n.status === 'deceased').length;

  const population = totalNodes - deceased;
  const infectionRate = ((infected / population) * 100) || 0;

  const pieData = {
    datasets: [{
      data: [healthy, infected, recovered, deceased],
      backgroundColor: ['#22c55e', '#ef4444', '#3b82f6', '#6b7280'],
      borderWidth: 0,
    }],
  };

  const LabelRow = ({
    Icon,
    label,
    count,
    color,
  }: {
    Icon: React.ElementType;
    label: string;
    count: number;
    color: string;
  }) => (
    <div className="flex items-center space-x-3 text-base font-medium">
      <Icon size={28} className={color} />
      <span>{label}</span>
      <span className="ml-auto text-gray-400 text-sm">{count}</span>
    </div>
  );

  return (
    <div className="bg-gray-800 mt-4 rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold flex items-center text-lg">
          <Activity size={28} className="mr-2" />
          Simulation Statistics
        </h3>
        <span className="text-base">Day: {simulationState.currentDay}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Unified Left Panel */}
        <div className="col-span-2 bg-gray-700 p-4 rounded-lg grid grid-cols-2 gap-4 items-center">
          {/* Pie Chart */}
          <div className="text-center">
            <div className="flex items-center justify-center text-sm mb-2">
              <LucidePieChart size={28} className="mr-2" />
              <span className="text-base">Population</span>
            </div>
            <div className="h-40 w-40 mx-auto">
              <Pie data={pieData} />
            </div>
            <div className="mt-2 text-lg font-bold">
              {population}
              <span className="text-sm text-gray-400"> / {totalNodes}</span>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-4 pl-2">
            <LabelRow Icon={HeartPulse} label="Healthy" count={healthy} color="text-green-500" />
            <LabelRow Icon={Biohazard} label="Infected" count={infected} color="text-red-500" />
            <LabelRow Icon={Syringe} label="Recovered" count={recovered} color="text-blue-500" />
            <LabelRow Icon={Skull} label="Deceased" count={deceased} color="text-gray-500" />
          </div>
        </div>

        {/* Right Side: Infection Rate */}
        <div className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center">
          <div className="text-base mb-4">Infection Rate</div>
          <div className="relative w-6 h-36 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="absolute bottom-0 w-full bg-white"
              style={{ height: `${infectionRate}%` }}
            ></div>
          </div>
          <div className="mt-2 text-lg font-bold text-white">
            {infectionRate.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
