import { LayoutDashboard, GraduationCap, Megaphone, Users, Medal, MessageCircleMore, WalletMinimal, ArrowBigLeftDash, ArrowBigRightDash } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const AdminSideBar = ({ isSidebarOpen, toggleSidebar }) => {
    const location = useLocation(); // current URL path
    const sideContent = [
        { name: "Dashboard", icon: LayoutDashboard, route: '/admin/dashboard' },
        { name: "Users", icon: Users, route: '/admin/users' },
        { name: "Courses", icon: GraduationCap, route: '/admin/courses' },
        { name: "Billboard", icon: Megaphone, route: '/admin/billboard' },
        { name: "Wallet", icon: WalletMinimal, route: '/admin/wallet' },
        { name: "Chats", icon: MessageCircleMore, route: '/admin/chats' },
        { name: "Badges", icon: Medal, route: '/admin/badges' },
        // { name: "Profile", icon: UserRound, route: '/admin/profile' },
    ]

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
                                location.pathname.startsWith(item.route)
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

export default AdminSideBar;
