import React from 'react';

const CourseStats = ({ rating, students, totalRatings, hours }) => {
  return (
    <div className="grid grid-cols-3 gap-4 py-6 animate-fade-in">
      <div className="text-center">
        <div className="text-xl font-bold text-yellow-400">{rating} <span className='text-sm font-light text-gray-400'>({totalRatings})</span>  </div>
        <div className="text-sm text-gray-400">Course Rating</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold">{students}</div>
        <div className="text-sm text-gray-400">Students</div>
      </div>
      <div className="text-center">
        <div className="text-xl font-bold">{hours}</div>
        <div className="text-sm text-gray-400">Total Length</div>
      </div>
    </div>
  );
};

export default CourseStats;
