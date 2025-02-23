import React from 'react'

const SideBar = ({ isSidebarOpen, toggleSidebar }) => {

    return (

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
                                className={`block py-4 px-6 transition-colors ${item.active
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
    )
}

export default SideBar