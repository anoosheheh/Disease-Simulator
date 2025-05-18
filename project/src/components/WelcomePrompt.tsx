import React, { useState, useEffect } from 'react';

const WelcomePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(true);
  const [townName, setTownName] = useState('');
  const [diseaseName, setDiseaseName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (townName.trim() && diseaseName.trim()) {
      setShowPrompt(false);
    }
  };

  if (!showPrompt) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <h1 className="text-2xl font-bold text-white bg-gray-800 px-6 py-2 rounded-lg shadow-lg">
          {townName} - {diseaseName} Simulation
        </h1>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white">Welcome to Disease Simulation</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="townName">
              Town Name
            </label>
            <input
              id="townName"
              type="text"
              value={townName}
              onChange={(e) => setTownName(e.target.value)}
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:border-blue-500"
              required
              autoFocus
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="diseaseName">
              Disease Name
            </label>
            <input
              id="diseaseName"
              type="text"
              value={diseaseName}
              onChange={(e) => setDiseaseName(e.target.value)}
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
            disabled={!townName.trim() || !diseaseName.trim()}
          >
            Start Simulation
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomePrompt; 