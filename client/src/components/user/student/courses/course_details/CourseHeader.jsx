import React from 'react';

const CourseHeader = ({ title, subtitle, skills, creator, uploadDate }) => {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-bold mb-1">{title}</h1>
      <p className="text-gray-300 mb-3">{subtitle}</p>
      
      {/* <div className="flex flex-wrap items-center gap-2 mb-4">
        {skills.map((skill, index) => (
          <span key={index} className="tag">{skill}</span>
        ))}
      </div> */}
      
      <div className="flex items-center text-sm text-gray-400">
        <span className="inline-flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd"></path>
          </svg>
          Created by <span className="text-blue-400 ml-1">{creator}</span>
        </span>
        <span className="mx-4">•</span>
        <span className="inline-flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
          </svg>
          Uploaded {uploadDate}
        </span>
      </div>
    </div>
  );
};

export default CourseHeader;
