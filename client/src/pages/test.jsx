import React, { useState } from 'react';
import NerdOwl from '/nerdowl.png';

const LearningPlatform = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };


  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-900">
      {/* Fixed Header - Full Width */}
      <header className="w-full bg-gray-800 z-40">
        <div className="flex items-center justify-between p-4">
          {/* Left Section: Logo and sidebar toggle */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="text-white mr-4 md:hidden"
            >
              ☰
            </button>

            {/* Logo and brand in navbar */}
            <div className="flex items-center mr-6">
              <img src={NerdOwl} alt="Logo" className="h-10 w-10" />
              <span className="text-white text-xl font-bold hidden md:block">LearNerds</span>
            </div>
          </div>

          {/* Center Section: Search Bar - Only visible on desktop or when expanded on mobile */}
          <div className={`${isSearchExpanded ? 'absolute inset-x-0 top-0 p-4 bg-gray-800 z-50 flex' : 'hidden md:flex'} justify-center flex-1 max-w-xl mx-auto`}>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search Courses"
                className="w-full bg-gray-200 rounded-full py-2 px-4 text-gray-800"
              />
              <button className="absolute right-0 top-0 h-full px-4 bg-gray-400 rounded-r-full">
                🔍
              </button>
              {isSearchExpanded && (
                <button 
                  onClick={toggleSearch}
                  className="absolute right-0 top-0 mt-16 text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center space-x-4">
            {/* Search icon on mobile */}
            <button 
              className="text-white text-xl md:hidden" 
              onClick={toggleSearch}
            >
              🔍
            </button>

            {/* Desktop view - show all buttons */}
            <div className="hidden md:flex items-center space-x-6">
              <button className="text-white text-2xl">🔔</button>
              <button className="text-white text-2xl">❤️</button>
              <a href="#" className="bg-gray-700 px-4 py-2 rounded-lg text-white">Tutor</a>
              <img src="/api/placeholder/40/40" alt="Profile" className="h-10 w-10 rounded-full" />
            </div>

            {/* Mobile view - dropdown menu button */}
            <div className="relative md:hidden">
              <button onClick={toggleMenu} className="text-white text-2xl">
                👤
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-600">
                    <div className="flex items-center space-x-2">
                      <img src="/api/placeholder/32/32" alt="Profile" className="h-8 w-8 rounded-full" />
                      <span className="text-white">Profile</span>
                    </div>
                  </div>
                  <a href="#" className="block px-4 py-2 text-white hover:bg-gray-600">
                    <span className="mr-2">🔔</span> Notifications
                  </a>
                  <a href="#" className="block px-4 py-2 text-white hover:bg-gray-600">
                    <span className="mr-2">❤️</span> Wishlist
                  </a>
                  <a href="#" className="block px-4 py-2 text-white hover:bg-gray-600">
                    <span className="mr-2">👨‍🏫</span> Tutor
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content Container with fixed sidebar and scrollable main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black  c  c  c  c\ c c\rc bg-opacity-50 z-30 md:hidden"
            onClick={toggleSidebar}
          ></div>
        )}
        
        {/* Fixed Sidebar */}
        <aside 
          className={`fixed md:static h-full md:h-auto z-30 transition-all duration-300 ease-in-out bg-gray-800 text-white overflow-y-auto
            ${isSidebarOpen ? 'w-64 left-0' : '-left-64 md:left-0 md:w-16'} md:block`}
          style={{ top: '64px', height: 'calc(100vh - 64px)' }}
        >
          <div className="p-4 flex justify-end md:hidden">
            <button onClick={toggleSidebar} className="text-white">
              ✕
            </button>
          </div>
          
          <div className="mt-4">
            <button onClick={toggleSidebar} className="hidden md:block text-center w-full mb-8 text-gray-400">
              {isSidebarOpen ? '<<<' : '>>>'}
            </button>
            
            <nav>
              {[
                { name: 'Home', active: true },
                { name: 'Courses', active: false },
                { name: 'Study Room', active: false },
                { name: 'Tutors', active: false },
                { name: 'News', active: false },
                { name: 'Chats', active: false },
              ].map((item, index) => (
                <a 
                  key={index}
                  href="#" 
                  className={`block py-4 px-6 transition-colors ${
                    item.active 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-400 hover:bg-gray-700'
                  } ${isSidebarOpen ? 'text-left' : 'text-center md:block'}`}
                >
                  {isSidebarOpen ? item.name : item.name.charAt(0)}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Scrollable Main Content - Adjust left margin based on sidebar state */}
        <main className={`flex-1 overflow-y-auto bg-gray-900 text-white transition-all duration-300 ease-in-out`} >
          {/* Hero Carousel */}
          <div className="relative w-full bg-gray-800 p-4">
            <div className="flex items-center justify-between">
              <button className="absolute left-4 z-10 bg-white bg-opacity-20 rounded-full p-2">
                &lt;
              </button>
              
              <div className="mx-auto max-w-5xl w-full flex bg-gray-200 rounded-lg overflow-hidden">
                <div className="w-2/5 p-8 text-gray-800">
                  <h2 className="text-3xl font-bold mb-4">Learning that gets you</h2>
                  <p className="mb-4">Skills for your present (and your future). Get started with us.</p>
                  <button className="bg-gray-600 text-white py-2 px-6 rounded-md">
                    Explore Courses
                  </button>
                </div>
                <div className="w-3/5">
                  <img 
                    src="/api/placeholder/600/350" 
                    alt="Learning illustration" 
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              
              <button className="absolute right-4 z-10 bg-white bg-opacity-20 rounded-full p-2">
                &gt;
              </button>
            </div>
          </div>

          {/* Course Section */}
          <section className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Let's Complete Learning</h2>
              <a href="#" className="text-purple-400 hover:underline">my study room -&gt;</a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Course Cards */}
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                  <img 
                    src="/api/placeholder/400/250" 
                    alt="Course thumbnail" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">Web Development Course</h3>
                    <p className="text-gray-400 mb-4">Learn modern web development techniques</p>
                    <div className="flex justify-between">
                      <span className="text-yellow-400">⭐ 4.8</span>
                      <button className="bg-blue-600 text-white py-1 px-4 rounded-md">
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LearningPlatform;