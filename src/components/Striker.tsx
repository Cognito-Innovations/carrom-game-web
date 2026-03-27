import React from 'react';
import './Striker.css';

export const Striker: React.FC = () => {
  return (
    <div className="striker-body">
      {/* Outer decorative ring */}
      <div className="striker-ring-outer"></div>
      
      {/* Inner decorative pattern */}
      <div className="striker-pattern">
        <div className="striker-star"></div>
      </div>
      
      {/* Center dot */}
      <div className="striker-center"></div>
      
      {/* Gloss/Reflection overlay for 3D effect */}
      <div className="striker-shine"></div>
    </div>
  );
};