import { memo } from "react";
import { House, GraduationCap, Presentation, Users, Newspaper,
    MessageCircleMore, UserRound, ArrowBigLeftDash, ArrowBigRightDash, 
    LayoutDashboard, WalletMinimal, Medal } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const SideBar = ({ isSidebarOpen, toggleSidebar, role }) => {
    const location = useLocation(); // current URL path

    const sideContentStudent = [
        { name: "Home", icon: House, route: '/student/home' },
        { name: "Courses", icon: GraduationCap, route: '/student/courses' },
        { name: "Study Room", icon: Presentation, route: '/student/study-room' },
        { name: "Tutors", icon: Users, route: '/student/tutors' },
        { name: "News", icon: Newspaper, route: '/student/news' },
        { name: "Chats", icon: MessageCircleMore, route: '/chats' },
        { name: "Badges", icon: Medal, route: '/student/badges' },
        { name: "Profile", icon: UserRound, route: '/profile' },
    ]

    const sideContentTutor = [
        { name: "Dashboard", icon: LayoutDashboard, route: '/tutor/dashboard' },
        { name: "My Courses", icon: GraduationCap, route: '/tutor/my-courses' },
        { name: "Class Room", icon: Presentation, route: '/tutor/class-room/' },
        { name: "Wallet", icon: WalletMinimal, route: '/tutor/wallet' },
        { name: "Chats", icon: MessageCircleMore, route: '/chats' },
        { name: "Profile", icon: UserRound, route: '/profile' },
    ]

    const sideContent = role == 'student' ? sideContentStudent : sideContentTutor

    return (
        <aside
            className={`fixed md:static h-full md:h-auto z-30 transition-all duration-300 ease-in-out bg-gray-950 text-white overflow-y-auto
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
                    className="hidden md:flex justify-center text-center w-full mb-4 text-gray-400"
                >
                    {isSidebarOpen ? <ArrowBigLeftDash className="cursor-pointer" /> : <ArrowBigRightDash className="cursor-pointer" />}
                </div>
                <nav>
                    {sideContent.map((item, index) => (
                        <Link
                            key={index}
                            to={item.route}
                            className={`flex justify-center py-4 transition-colors font-semibold text-center ${
                                location.pathname.startsWith(item.route)
                                    ? "bg-background text-white"
                                    : "text-gray-400 hover:bg-gray-700"
                            }`}
                        >
                            {/* {isSidebarOpen ? (
                                item.name
                            ) : item.icon ? (
                                <item.icon className="mx-auto h-6 w-6" />
                            ) : (
                                item.name[0]
                            )} */}
                            <div className={`w-[70%] flex items-center ${!isSidebarOpen && 'justify-center'}`}>
                                <item.icon className={`${isSidebarOpen && 'mr-2'} h-6 w-6`} /> {isSidebarOpen && <span>{item.name}</span>}
                            </div>
                        </Link>
                    ))}
                </nav>{" "}
            </div>
        </aside>
    );
};

export default memo(SideBar);