import { useState, useRef, useEffect, memo } from "react";
import {
    ListCollapse,
    Search,
    Bell,
    // Heart,
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
    const [searchQuery, setSearchQuery] = useState("");
    const profileDropdownRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();


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

    const handleSearch = (e) => {
        if(role == 'student'){
            console.log('search query:', searchQuery)
            navigate('/student/courses', {
                state: { searchQuery: searchQuery },
            });
        }
    };

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
                    <Link to="/">
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
                <div
                    className={`${
                        isSearchExpanded
                            ? "absolute inset-x-0 top-0 p-4 bg-gray-950 z-50 flex"
                            : "hidden md:flex"
                    } justify-center flex-1 max-w-xl mx-auto`}
                >
                    {/* <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search Courses"
                            className="w-full bg-gray-200 rounded-full py-2 px-10 text-gray-800"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button onClick={handleSearch} className="absolute right-0 top-0 h-full px-4 bg-gray-400 hover:bg-gray-500 rounded-r-full">
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
                    </div> */}

                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search Courses"
                            className="w-full bg-secondary rounded-md py-2 px-10 text-secondary-foreground border-input focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button 
                            onClick={handleSearch} 
                            className="absolute right-0 top-0 h-full px-4 bg-accent hover:bg-opacity-90 text-primary-foreground rounded-r-md transition-all duration-300"
                        >
                            <Search />
                        </button>
                        {isSearchExpanded && (
                            <button
                            onClick={toggleSearch}
                            className="absolute left-0 top-0 text-muted-foreground hover:text-foreground h-full ml-2 transition-colors duration-300"
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
                        className="text-foreground text-2xl md:hidden"
                        onClick={toggleSearch}
                    >
                        <Search />
                    </button>
                    
                    {/* Desktop view - show all buttons */}
                    <div className="hidden md:flex items-center space-x-6">
                        <button
                            onClick={handleSwitchRole}
                            to={role=='student'? '/tutor/dashboard' : '/student/home'}
                            className="btn-secondary hover:bg-gray-800 transition-all duration-300"
                        >
                            {role=='student'? 'Teach' : 'Learn'}
                        </button>
                        
                        <Link to={'/notifications'} className="relative inline-block text-foreground text-2xl ">
                            <Bell className="hover:text-accent transition-colors duration-300" />
                            {user?.unread_notifications > 0 && (
                                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                    {user?.unread_notifications}
                                </span>
                            )}
                        </Link>
                        
                        {/* <button className="text-foreground text-2xl hover:text-accent transition-colors duration-300">
                            <Heart />
                        </button> */}

                        {/* Profile dropdown - desktop */}
                        <div className="relative" ref={profileDropdownRef}>
                            <button
                                onClick={toggleProfileDropdown}
                                className="text-foreground text-2xl focus:outline-none focus:ring-2 focus:ring-accent rounded-full"
                            >
                                {user && user.image ? (
                                    <div className="h-10 w-10 rounded-full overflow-hidden hover:ring-2 hover:ring-accent transition-all duration-300">
                                        <img
                                            src={user.image}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center hover:bg-secondary transition-all duration-300">
                                        <UserRound />
                                    </div>
                                )}
                            </button>

                            {/* Profile dropdown menu */}
                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg z-50 transform opacity-100 scale-100 transition-all duration-300 ease-in-out border border-border">
                                    <div className="flex items-center px-4 py-3 border-b border-border">
                                        <div className="flex flex-col truncate">
                                            {user?.first_name && (
                                                <span className="text-foreground truncate max-w-full font-medium">
                                                    {user?.first_name + " " + user?.last_name}
                                                </span>
                                            )}
                                            <span className="truncate max-w-full text-muted-foreground text-xs">
                                                {user?.email}
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="flex items-center px-4 py-2 text-foreground hover:bg-secondary transition-colors duration-300"
                                    >
                                        <UserRound className="mr-2 h-4 w-4" />
                                        My Profile
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="flex items-center px-4 py-2 text-foreground hover:bg-secondary transition-colors duration-300"
                                    >
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                    <div className="border-t border-border my-1"></div>
                                    <Link
                                        to={"/logout"}
                                        className="flex items-center w-full text-left px-4 py-2 text-destructive hover:bg-secondary transition-colors duration-300"
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
                            className="text-foreground text-2xl"
                        >
                            <UserRound />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg z-50 overflow-hidden border border-border">
                                <Link 
                                    to="/profile"
                                    className="flex px-4 py-2 text-foreground hover:bg-secondary border-b border-border transition-colors duration-300"
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
                                            <UserRound className="text-foreground" />
                                        )}
                                    </span>
                                    <span className="text-foreground truncate max-w-full">
                                        {user?.email || "Profile"}
                                    </span>
                                </Link>

                                <Link
                                    href="#"
                                    className="flex px-4 py-2 text-foreground hover:bg-secondary transition-colors duration-300"
                                >
                                    <span className="mr-2 relative">
                                        <Bell />
                                        {user?.unread_notifications > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                                {user?.unread_notifications}
                                            </span>
                                        )}

                                    </span>
                                    Notifications
                                </Link>
                                {/* <Link
                                    href="#"
                                    className="flex px-4 py-2 text-foreground hover:bg-secondary transition-colors duration-300"
                                >
                                    <span className="mr-2">
                                        <Heart />
                                    </span>
                                    Wishlist
                                </Link> */}
                                <button
                                    onClick={handleSwitchRole}
                                    className="flex px-4 py-2 text-foreground hover:bg-secondary transition-colors duration-300 w-full"
                                >
                                    <span className="mr-2">
                                        <Users />
                                    </span>
                                    {role=='student'? 'Teach' : 'Learn'}
                                </button>
                                <Link
                                    to={"/logout"}
                                    className="flex w-full text-left px-4 py-2 text-destructive hover:bg-secondary border-t border-border transition-colors duration-300"
                                >
                                    <span className="mr-2">
                                        <LogOut />
                                    </span>
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