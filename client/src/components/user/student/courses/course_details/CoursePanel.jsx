import React from 'react';

const CoursePanel = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-navy-light rounded-lg px-6 py-3 mb-2 animate-fade-in ${className}`}>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
};

export default CoursePanel;
