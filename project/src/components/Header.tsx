import React from 'react';
import { Brush as Virus } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Virus size={28} className="text-red-500" />
          <h1 className="text-xl font-bold">Disease Spread Simulation</h1>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Visualizing infectious diseases in social networks</span>
        </div>
      </div>
    </header>
  );
};

export default Header;