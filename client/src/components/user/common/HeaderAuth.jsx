import { useState, useRef, useEffect, memo } from "react";
import {
    ListCollapse,
    Search,
    Bell,
    Heart,
    UserRound,
    CircleX,
    Users,
    Settings,
    LogOut,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import NerdOwl from "/nerdowl.png";
import { switchRole } from "../../../redux/features/authSlice";

const HeaderAuth = ({ toggleSidebar, role }) => {
    const user = useSelector((state) => state.auth.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef(null);
    const dispatch = useDispatch()
    const navigate = useNavigate()


    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleSearch = () => {
        setIsSearchExpanded(!isSearchExpanded);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileDropdownRef.current &&
                !profileDropdownRef.current.contains(event.target)
            ) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSwitchRole = () => {
        const newRole = role === 'student' ? 'tutor' : 'student';
        dispatch(switchRole({ role: newRole })); // Update role in Redux store
        // navigate(newRole === 'tutor' ? '/tutor/dashboard' : '/student/home'); // Navigate to the correct route
        console.log('navigated from header');
        return <Navigate to={newRole === 'tutor' ? '/tutor/dashboard' : '/student/home'} />;
    }

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
                    <Link to="/student/home">
                        <div className="flex items-center mr-6">
                            <img
                                src={NerdOwl}
                                alt="Logo"
                                className="h-10 w-10"
                            />
                            <span className="text-white text-xl font-bold hidden md:block">
                                LearNerds
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Center Section: Search Bar - Only visible on desktop or when expanded on mobile */}
                <div
                    className={`${
                        isSearchExpanded
                            ? "absolute inset-x-0 top-0 p-4 bg-gray-800 z-50 flex"
                            : "hidden md:flex"
                    } justify-center flex-1 max-w-xl mx-auto`}
                >
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
                        <button
                            onClick={handleSwitchRole}
                            to={role=='student'? '/tutor/dashboard' : '/student/home'}
                            className="bg-gray-700 px-4 py-2 rounded-lg text-white"
                        >
                            {role=='student'? 'Teach' : 'Learn'}
                        </button>
                        <button className="text-white text-2xl">
                            {" "}
                            <Bell />{" "}
                        </button>
                        <button className="text-white text-2xl">
                            {" "}
                            <Heart />{" "}
                        </button>

                        {/* Profile dropdown - desktop */}
                        <div className="relative" ref={profileDropdownRef}>
                            <button
                                onClick={toggleProfileDropdown}
                                className="text-white text-2xl focus:outline-none"
                            >
                                {user && user.image ? (
                                    <div className="h-10 w-10 rounded-full overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all">
                                        <img
                                            src={user.image}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-all">
                                        <UserRound />
                                    </div>
                                )}
                            </button>

                            {/* Profile dropdown menu */}
                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg  z-50 transform opacity-100 scale-100 transition-all duration-150 ease-in-out">
                                    <div className="flex items-center px-4 py-3 border-b border-gray-600">
                                        <div className="flex flex-col">
                                            <span className="text-white truncate max-w-full font-medium">
                                                {user?.first_name || "User"}
                                            </span>
                                            <span className="truncate max-w-full text-gray-400 text-xs">
                                                {user?.email ||
                                                    "user@example.com"}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="flex items-center px-4 py-2 text-white hover:bg-gray-600 transition-colors"
                                    >
                                        <UserRound className="mr-2 h-4 w-4" />
                                        My Profile
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="flex items-center px-4 py-2 text-white hover:bg-gray-600 transition-colors"
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                    <div className="border-t border-gray-600 my-1"></div>
                                    <Link
                                        to={"/logout"}
                                        className="flex items-center w-full text-left px-4 py-2 text-red-400 hover:bg-gray-600 transition-colors"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </Link>
                                </div>
                            )}
                        </div>
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
                            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-50 overflow-hidden">
                                <Link 
                                    to="/profile"
                                    className="flex px-4 py-2 text-white hover:bg-gray-600 border-b border-gray-600"
                                >
                                    <span className="mr-2">
                                        {user && user.image ? (
                                            <div className="h-8 w-8 rounded-full overflow-hidden">
                                                <img
                                                    src={user.image}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <UserRound className="text-white" />
                                        )}
                                    </span>{" "}
                                    <span className="text-white truncate max-w-full">
                                        {user?.email || "Profile"}
                                    </span>
                                </Link>

                                <Link
                                    href="#"
                                    className="flex px-4 py-2 text-white hover:bg-gray-600"
                                >
                                    <span className="mr-2">
                                        {" "}
                                        <Bell />{" "}
                                    </span>{" "}
                                    Notifications
                                </Link>
                                <Link
                                    href="#"
                                    className="flex px-4 py-2 text-white hover:bg-gray-600"
                                >
                                    <span className="mr-2">
                                        {" "}
                                        <Heart />{" "}
                                    </span>{" "}
                                    Wishlist
                                </Link>
                                <Link
                                    href="#"
                                    className="flex px-4 py-2 text-white hover:bg-gray-600"
                                >
                                    <span className="mr-2">
                                        {" "}
                                        <Users />{" "}
                                    </span>{" "}
                                    Tutor
                                </Link>
                                <Link
                                    to={"/logout"}
                                    className="flex w-full text-left px-4 py-2 text-red-400 hover:bg-gray-600 border-t border-gray-600"
                                >
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

export default memo(HeaderAuth);