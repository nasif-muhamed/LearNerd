import React from "react";
import { House, GraduationCap, Presentation, Users, Newspaper, MessageCircleMore, UserRound, ArrowBigLeftDash, ArrowBigRightDash } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const SideBar = ({ isSidebarOpen, toggleSidebar }) => {
    const location = useLocation(); // current URL path
    const sideContent = [
        { name: "Home", icon: House, route: '/student/home' },
        { name: "Courses", icon: GraduationCap, route: '/student/' },
        { name: "Study Room", icon: Presentation, route: '/student/' },
        { name: "Tutors", icon: Users, route: '/student/' },
        { name: "News", icon: Newspaper, route: '/student/' },
        { name: "Chats", icon: MessageCircleMore, route: '/student/' },
        { name: "Profile", icon: UserRound, route: '/profile' },
    ]

    return (
        <aside
            className={`fixed md:static h-full md:h-auto z-30 transition-all duration-300 ease-in-out bg-gray-800 text-white overflow-y-auto
                ${
                    isSidebarOpen ? "w-44 left-0" : "-left-64 md:left-0 md:w-16"
                } md:block`}
            style={{ top: "64px", height: "calc(100vh - 64px)" }}
        >
            {/* <div className="p-4 flex justify-end md:hidden">
                <button onClick={toggleSidebar} className="text-white">
                    ✕
                </button>
            </div> */}

            <div className="mt-4">
                <div
                    onClick={toggleSidebar}
                    className="hidden md:flex justify-center text-center w-full mb-8 text-gray-400"
                >
                    {isSidebarOpen ? <ArrowBigLeftDash className="cursor-pointer" /> : <ArrowBigRightDash className="cursor-pointer" />}
                </div>
                <nav>
                    {sideContent.map((item, index) => (
                        <Link
                            key={index}
                            to={item.route}
                            className={`block py-4 transition-colors font-semibold text-center ${
                                location.pathname === item.route
                                    ? "bg-gray-900 text-white"
                                    : "text-gray-400 hover:bg-gray-700"
                            } ${
                                isSidebarOpen
                                    ? "px-6"
                                    : "md:block"
                            }`}
                        >
                            {isSidebarOpen ? (
                                item.name
                            ) : item.icon ? (
                                <item.icon className="mx-auto h-6 w-6" />
                            ) : (
                                item.name[0]
                            )}
                        </Link>
                    ))}
                </nav>{" "}
            </div>
        </aside>
    );
};

export default SideBar;
