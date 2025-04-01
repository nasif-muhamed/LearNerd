import React from 'react';

const CourseReview = ({ review }) => {
  // Helper function to render stars
  const renderStars = (rating) => {
    return (
      <div className="rating-stars">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i} 
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-500'}`}
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="border-b border-navy-light py-4 last:border-b-0 animate-fade-in">
      <div className="flex justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-navy-light">
            <img 
              src={review.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3"} 
              alt={review.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="font-medium text-sm">{review.name}</div>
            <div className="flex items-center text-xs text-gray-400">
              {renderStars(review.rating)}
              <span className="ml-2">{review.time}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-300">{review.comment}</p>
    </div>
  );
};

export default CourseReview;
