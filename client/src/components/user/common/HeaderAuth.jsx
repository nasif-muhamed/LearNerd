import React, { useState } from 'react'
import { ListCollapse, Search, Bell, Heart, UserRound, CircleX, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from "react-redux";
import NerdOwl from '/nerdowl.png';

const HeaderAuth = ({ toggleSidebar }) => {
    const user = useSelector((state) => state.auth.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleSearch = () => {
        setIsSearchExpanded(!isSearchExpanded);
    };

    return (
        <header className="w-full bg-gray-800 z-40">
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
                    <Link to='/student/home'>
                        <div className="flex items-center mr-6">
                            <img src={NerdOwl} alt="Logo" className="h-10 w-10" />
                            <span className="text-white text-xl font-bold hidden md:block">LearNerds</span>
                        </div>
                    </Link>
                </div>

                {/* Center Section: Search Bar - Only visible on desktop or when expanded on mobile */}
                <div className={`${isSearchExpanded ? 'absolute inset-x-0 top-0 p-4 bg-gray-800 z-50 flex' : 'hidden md:flex'} justify-center flex-1 max-w-xl mx-auto`}>
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
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center space-x-4 md:px-4">
                    {/* Search icon on mobile */}
                    <button
                        className="text-white text-2xl md:hidden"
                        onClick={toggleSearch}
                    >
                        <Search />
                    </button>

                    {/* Desktop view - show all buttons */}
                    <div className="hidden md:flex items-center space-x-6">
                        <a href="#" className="bg-gray-700 px-4 py-2 rounded-lg text-white">Tutor</a>
                        <button className="text-white text-2xl"> <Bell /> </button>
                        <button className="text-white text-2xl"> <Heart /> </button>
                        <Link to='/profile' className="text-white text-2xl">
                            {user && user.image ? (
                                <img src={user.image} alt="Profile" className="h-10 w-10 rounded-full" />
                            ) : (
                                <UserRound />
                            )}
                        </Link>
                    </div>

                    {/* Mobile view - dropdown menu button */}
                    <div className="relative md:hidden">
                        <button onClick={toggleMenu} className="text-white text-2xl">
                            <UserRound />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-600">
                                    <div className="flex items-center space-x-2">
                                        {/* <img src="/api/placeholder/32/32" alt="Profile" className="h-8 w-8 rounded-full" /> */}
                                        <UserRound className='text-white' />
                                        <span className="text-white">Profile</span>
                                    </div>
                                </div>
                                <a href="#" className="flex px-4 py-2 text-white hover:bg-gray-600">
                                    <span className="mr-2"> <Bell /> </span> Notifications
                                </a>
                                <a href="#" className="flex px-4 py-2 text-white hover:bg-gray-600">
                                    <span className="mr-2"> <Heart /> </span> Wishlist
                                </a>
                                <a href="#" className="flex px-4 py-2 text-white hover:bg-gray-600">
                                    <span className="mr-2"> <Users /> </span> Tutor
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>

    )
}

export default HeaderAuth