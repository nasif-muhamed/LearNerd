import React from 'react';
import { Users, MessageCircle, Star, Flag } from 'lucide-react';

const UserManagementPage = () => {
  const enrolledCourses = [
    {
      title: "Complete web development course",
      instructor: "John Chandler",
      price: 3999,
      image: "/api/placeholder/400/250?text=Web+Dev"
    },
    {
      title: "React - Complete Developer Course with Hands-On Projects",
      instructor: "Digital Media",
      price: 2999,
      image: "/api/placeholder/400/250?text=React"
    },
    {
      title: "React Redux Ultimate - State Management",
      instructor: "Types Info",
      price: 2999,
      image: "/api/placeholder/400/250?text=Redux"
    }
  ];

  const reviews = [
    {
      text: "Thanks! Rohan Chaudhary for C++II. It was partly hard for me to even touch it but your explanation made things clear. I understood everything. Thank you so much!!!"
    },
    {
      text: "Awesome, I loved his teaching style and the videos are very impactful."
    }
  ];

  const reports = [
    {
      text: "The tutor provided incorrect information about CSS grid projects. This led to confusion during my project implementation."
    },
    {
      text: "The tutor shared a personal story that seemed unrelated to the topic and wasted a significant amount of time."
    }
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-center mb-8">
          <div className="mr-6">
            <img 
              src="https://t4.ftcdn.net/jpg/03/64/21/11/360_F_364211147_1qgLVxv1Tcq0Ohz3FawUfrtONzz8nq3e.jpg" 
              alt="Profile" 
              className="rounded-full w-32 h-32 object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Rohit Das</h1>
            <p className="text-gray-400 mb-4">rohitdas@gmail.com</p>
            <div className="flex space-x-4">
              <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Block Student
              </button>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Chat Student
              </button>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Enrolled Courses(3)</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {enrolledCourses.map((course, index) => (
              <div 
                key={index} 
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <img 
                  src={'https://img.freepik.com/free-psd/e-learning-template-design_23-2151081798.jpg'} 
                  alt={course.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                  <p className="text-gray-400 mb-2">{course.instructor}</p>
                  <p className="text-green-500 font-semibold">₹{course.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews and Ratings */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Star className="mr-2 text-yellow-500" /> Reviews and Ratings Given By Rohit
          </h2>
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div 
                key={index} 
                className="bg-gray-800 p-4 rounded-lg flex items-start"
              >
                <img 
                  src="/api/placeholder/50/50?text=RD" 
                  alt="Reviewer" 
                  className="rounded-full w-12 h-12 mr-4"
                />
                <div>
                  <h3 className="font-bold">Rohit Das</h3>
                  <p className="text-gray-400">{review.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Flag className="mr-2 text-red-500" /> Reports From Rohit
          </h2>
          <div className="space-y-4">
            {reports.map((report, index) => (
              <div 
                key={index} 
                className="bg-gray-800 p-4 rounded-lg flex items-start"
              >
                <img 
                  src="/api/placeholder/50/50?text=RD" 
                  alt="Reporter" 
                  className="rounded-full w-12 h-12 mr-4"
                />
                <div>
                  <h3 className="font-bold">Rohit Das</h3>
                  <p className="text-gray-400">{report.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;