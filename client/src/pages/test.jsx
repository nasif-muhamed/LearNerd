// QuizForm.jsx
import React, { useState } from 'react';

const QuizForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    passPercentage: '',
    hours: '',
    minutes: '',
    seconds: ''
  });

  // Convert time components to seconds
  const convertToSeconds = (hours, minutes, seconds) => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    return (h * 3600) + (m * 60) + s;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers and empty string
    if (value === '' || /^\d*$/.test(value)) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const backendData = {
      title: formData.title,
      passPercentage: Number(formData.passPercentage),
      durationInSeconds: convertToSeconds(formData.hours, formData.minutes, formData.seconds)
    };

    console.log('Data to send to backend:', backendData);
    // Your API call here
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Quiz Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter quiz title"
          />
        </div>

        {/* Pass Percentage Input */}
        <div>
          <label htmlFor="passPercentage" className="block text-sm font-medium text-gray-700 mb-1">
            Pass Percentage
          </label>
          <input
            type="number"
            id="passPercentage"
            name="passPercentage"
            value={formData.passPercentage}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter pass percentage"
            min="0"
            max="100"
          />
        </div>

        {/* Duration Inputs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration
          </label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                name="hours"
                value={formData.hours}
                onChange={handleChange}
                className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="HH"
                maxLength={2}
              />
              <p className="mt-1 text-xs text-gray-500 text-center">Hours</p>
            </div>
            <div className="flex-1">
              <input
                type="text"
                name="minutes"
                value={formData.minutes}
                onChange={handleChange}
                className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="MM"
                maxLength={2}
              />
              <p className="mt-1 text-xs text-gray-500 text-center">Minutes</p>
            </div>
            <div className="flex-1">
              <input
                type="text"
                name="seconds"
                value={formData.seconds}
                onChange={handleChange}
                className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SS"
                maxLength={2}
              />
              <p className="mt-1 text-xs text-gray-500 text-center">Seconds</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Create Quiz
        </button>
      <a className='text-black' href="https://res.cloudinary.com/ddlw92hp6/raw/upload/fl_attachment/v1743415348/course/documents/doc_kuniyil_ashref-model.pdf" download="doc_kuniyil_ashref-model.pdf">
        Download PDF
      </a>

      </form>

    </div>
  );
};

export default QuizForm;