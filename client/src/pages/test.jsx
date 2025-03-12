import React from 'react';

const TutorDashboard = () => {
  // Sample data for demonstration
  const dashboardData = {
    totalCourses: 5,
    totalStudents: 345,
    groupsCreated: 10,
    feesCollected: "₹1,45,880",
    courseProgress: {
      subscribed: 150,
      freemium: 250,
      waitlisted: 295
    },
    recentStudents: [
      { id: 1, name: "Samantha Mann", code: "#1234", status: "Subscribed" },
      { id: 2, name: "Jasper Chongs", code: "#1234", status: "Freemium" },
      { id: 3, name: "Gabe Lustman", code: "#1234", status: "Waitlisted" },
      { id: 4, name: "Manuel Labor", code: "#1234", status: "Subscribed" },
      { id: 5, name: "Sharon Needles", code: "#1234", status: "Waitlisted" }
    ]
  };

  return (
      <div className="flex-1 p-4 md:p-6 overflow-y-auto text-white">
        {/* Period Selection */}
        <div className="mb-6">
          <button className="px-4 py-2 bg-gray-700 rounded-md text-sm flex items-center">
            This Month
            <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="white">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-600 p-4 rounded-md">
            <div className="text-sm opacity-80">TOTAL COURSES</div>
            <div className="text-3xl font-bold">05</div>
          </div>
          <div className="bg-red-500 p-4 rounded-md">
            <div className="text-sm opacity-80">TOTAL STUDENTS</div>
            <div className="text-3xl font-bold">345</div>
          </div>
          <div className="bg-gray-300 p-4 rounded-md text-gray-800">
            <div className="text-sm opacity-80">GROUPS CREATED</div>
            <div className="text-3xl font-bold">10</div>
          </div>
          <div className="bg-green-500 p-4 rounded-md">
            <div className="text-sm opacity-80">FEES COLLECTED</div>
            <div className="text-3xl font-bold">₹1,45,880</div>
          </div>
        </div>

        {/* Course Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Current Course */}
          <div className="bg-gray-700 p-4 rounded-md flex items-center">
            <div className="flex-1">
              <div className="font-semibold mb-2">Content Delivery Network Basic explanation</div>
              <div className="text-sm opacity-80 mb-2">Finish your course</div>
              <div className="w-full bg-gray-600 h-2 rounded-full">
                <div className="bg-blue-500 h-2 rounded-full w-4/5"></div>
              </div>
              <div className="text-xs mt-2 opacity-70">DRAFT State</div>
            </div>
            <div className="ml-4">
              <img src="/api/placeholder/150/100" alt="CDN Diagram" className="rounded-md" />
            </div>
          </div>

          {/* Create Course */}
          <div className="bg-gray-700 p-4 rounded-md flex items-center">
            <div className="flex-1">
              <div className="font-semibold mb-2">Create an Engaging Course</div>
              <div className="text-sm opacity-80 mb-3">
                Whether you've been teaching for years or are teaching for the first time, 
                you can make an engaging course. We've compiled resources and best practices to help you
                get to the next level, no matter where you're starting.
              </div>
              <button className="px-3 py-1 bg-blue-500 rounded text-sm hover:bg-blue-600">
                Get Started
              </button>
            </div>
            <div className="ml-4 hidden md:block">
              <img src="/api/placeholder/150/100" alt="Course Creation" className="rounded-md" />
            </div>
          </div>
        </div>

        {/* Charts and Recent Students */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Course Progress Chart */}
          <div className="bg-gray-800 p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold">COURSE PROGRESS</div>
              <button className="text-sm opacity-70">...</button>
            </div>
            <div className="flex justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 mr-1 rounded-full"></div>
                <span className="text-xs">150 Subscribed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 mr-1 rounded-full"></div>
                <span className="text-xs">250 Freemium</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 mr-1 rounded-full"></div>
                <span className="text-xs">295 Waitlisted</span>
              </div>
            </div>
            <div className="h-64 mt-4">
              {/* Placeholder for the chart */}
              <div className="w-full h-full bg-gray-700 rounded-md flex items-center justify-center">
                <div className="flex h-full w-full">
                  {Array(12).fill(0).map((_, i) => (
                    <div key={i} className="flex-1 flex items-end justify-center pb-8">
                      <div className="w-2 bg-blue-500 mx-1" style={{ height: `${Math.random() * 50 + 20}%` }}></div>
                      <div className="w-2 bg-red-500 mx-1" style={{ height: `${Math.random() * 50 + 20}%` }}></div>
                      <div className="w-2 bg-yellow-500 mx-1" style={{ height: `${Math.random() * 50 + 20}%` }}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Students */}
          <div className="bg-gray-800 p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold">RECENT STUDENTS</div>
              <button className="text-sm opacity-70">...</button>
            </div>
            <div className="space-y-4">
              {dashboardData.recentStudents.map(student => (
                <div key={student.id} className="flex items-center">
                  <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden mr-3">
                    <img src="/api/placeholder/40/40" alt={student.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-xs opacity-70">{student.code}</div>
                  </div>
                  <div className={`text-xs ${
                    student.status === "Subscribed" ? "text-green-400" : 
                    student.status === "Freemium" ? "text-red-400" : "text-purple-400"
                  }`}>
                    {student.status}
                  </div>
                  <div className="ml-3 w-16 h-8">
                    {/* Placeholder for the mini chart */}
                    <div className="w-full h-full bg-gray-700 rounded-md flex items-center">
                      <svg viewBox="0 0 100 30" className="w-full h-full">
                        <path 
                          d={`M0,15 ${Array(10).fill(0).map((_, i) => 
                            `L${i*10},${Math.random() * 20 + 5}`).join(' ')} L100,15`} 
                          fill="none" 
                          stroke={
                            student.status === "Subscribed" ? "#4ade80" : 
                            student.status === "Freemium" ? "#f87171" : "#c084fc"
                          } 
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};

export default TutorDashboard;