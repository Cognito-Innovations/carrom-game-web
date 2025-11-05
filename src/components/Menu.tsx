import React from 'react';
import './Menu.css';

interface MenuProps {
  onStartGame: () => void;
}

export const Menu: React.FC<MenuProps> = ({ onStartGame }) => {
  return (
    <div className="menu-box">
      <div className="btn" onClick={onStartGame}>
        Start Game
      </div>
    </div>
  );
};

