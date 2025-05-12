import React from 'react';
import { Github } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 p-3 text-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div>© {new Date().getFullYear()} Disease Spread Simulation</div>
        <div className="flex items-center space-x-2">
          <a href="#" className="hover:text-white transition-colors flex items-center">
            <Github size={16} className="mr-1" />
            Source
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;