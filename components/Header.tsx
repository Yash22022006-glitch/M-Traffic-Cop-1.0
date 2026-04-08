
import React from 'react';
// import Button from './Button'; // Assuming you want to use your Button component

interface HeaderProps {
  onLogout: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ onLogout, title = "M-Traffic Cop" }) => {
  return (
    <header className="bg-indigo-900/90 backdrop-blur-md shadow-sm px-4 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
      <h1 className="text-lg font-black tracking-tighter uppercase text-white">{title}</h1>
      <div className="flex items-center space-x-2">
        <button 
          onClick={onLogout} 
          className="text-indigo-300 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
          aria-label="Log out"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default Header;
