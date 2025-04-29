import React, { useState } from "react";
import {
    ListCollapse,
    Search,
    Bell,
    Heart,
    UserRound,
    CircleX,
    Users,
    LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import NerdOwl from "/nerdowl.png";

const AdminHeader = ({ toggleSidebar }) => {
    const user = useSelector((state) => state.auth.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // const toggleSearch = () => {
    //     setIsSearchExpanded(!isSearchExpanded);
    // };

    return (
        <header className="w-full bg-gray-950 z-40">
            <div className="flex items-center justify-between p-4">
                {/* Left Section: Logo and sidebar toggle */}
                <div className="flex items-center">
                    {/* Toggle Button: Sidebar toggle for medium devices */}
                    <button
                        onClick={toggleSidebar}
                        className="text-white mr-4 md:hidden"
                    >
                        <ListCollapse />
                    </button>

                    {/* Logo and brand in navbar */}
                    <Link to="/admin/dashboard">
                        <div className="flex items-center mr-6">
                            <img
                                src={NerdOwl}
                                alt="Logo"
                                className="h-10 w-10"
                            />
                            <span className="text-white text-xl font-bold hidden md:block">
                                Lear<span className="text-accent">nerds</span>
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Center Section: Search Bar - Only visible on desktop or when expanded on mobile */}
                {/* <div className={`${isSearchExpanded ? 'absolute inset-x-0 top-0 p-4 bg-gray-800 z-50 flex' : 'hidden md:flex'} justify-center flex-1 max-w-xl mx-auto`}>
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search Courses"
                            className="w-full bg-gray-200 rounded-full py-2 px-10 text-gray-800"
                        />
                        <button className="absolute right-0 top-0 h-full px-4 bg-gray-400 rounded-r-full">
                            <Search />
                        </button>
                        {isSearchExpanded && (
                            <button
                                onClick={toggleSearch}
                                className="absolute left-0 top-0 text-black h-full ml-2"
                            >
                                <CircleX />
                            </button>
                        )}
                    </div>
                </div> */}

                {/* Right Section: Actions */}
                <div className="flex items-center space-x-4 md:px-4">
                    {/* Search icon on mobile */}
                    {/* <button
                        className="text-white text-2xl md:hidden"
                        onClick={toggleSearch}
                    >
                        <Search />
                    </button> */}

                    {/* Desktop view - show all buttons */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to={'/admin/notifications'} className="text-white text-2xl">
                            {" "}
                            <Bell />{" "}
                        </Link>
                        <Link
                            to="admin/profile"
                            className="text-white text-2xl"
                        >
                            {user && user.image ? (
                                <div className="h-10 w-10 rounded-full overflow-hidden">
                                    <img
                                        src={user.image}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <UserRound />
                            )}
                        </Link>
                        <Link
                            to={'/admin/logout'}
                            title="logout"
                            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800"
                        >
                            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent hidden md:block">
                                Logout
                            </span>
                            <LogOut className="w-6 h-6 m-2 " />
                        </Link>
                    </div>

                    {/* Mobile view - dropdown menu button */}
                    <div className="relative md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="text-white text-2xl"
                        >
                            <UserRound />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-600">
                                    <div className="flex items-center space-x-2">
                                        {/* <img src="/api/placeholder/32/32" alt="Profile" className="h-8 w-8 rounded-full" /> */}
                                        <UserRound className="text-white" />
                                        <span className="text-white">
                                            Profile
                                        </span>
                                    </div>
                                </div>
                                <Link to={'/admin/notifications'} className="flex px-4 py-2 text-white hover:bg-gray-600">
                                    <span className="mr-2">
                                        {" "}
                                        <Bell />{" "}
                                    </span>{" "}
                                    Notifications
                                </Link>
                                <Link to={'/admin/logout'} className="flex px-4 py-2 text-white hover:bg-gray-600">
                                    <span className="mr-2">
                                        {" "}
                                        <LogOut />{" "}
                                    </span>{" "}
                                    Logout
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
