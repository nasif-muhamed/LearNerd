import React from 'react';

const CourseFeature = ({ icon, text, premium = false }) => {
  return (
    <div className="flex items-center mb-4 animate-fade-in">
      <div className="flex-shrink-0 mr-3">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm">{text}</p>
      </div>
      {premium && (
        <div className="bg-red-500 text-xs px-2 py-0.5 rounded text-white">PREMIUM</div>
      )}
    </div>
  );
};

export default CourseFeature;
