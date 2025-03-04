import React from 'react'
import { Outlet } from 'react-router-dom';
import AdminHeader from '../admin/auth/AdminHeader';
import AdminSidebar from '../admin/auth/AdminSidebar';
import { useSelector, useDispatch } from "react-redux";
import { toggleIsSidebarOpen } from '../../redux/features/uiSlice'

const AdminAuthenticatedLayout = () => {
    const isSidebarOpen = useSelector((state) => state.ui.isSidebarOpen)
    const dispatch = useDispatch()

    const toggleSidebar = () => {
        dispatch(toggleIsSidebarOpen())
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-900">
            {/* Full-width Navbar */}
            <AdminHeader toggleSidebar={toggleSidebar} />

            <div className="flex flex-1 overflow-hidden">
                {/* Mobile overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black  c  c  c  c\ c c\rc bg-opacity-50 z-30 md:hidden"
                        onClick={toggleSidebar}
                    ></div>
                )}

                {/* Fixed Sidebar */}
                <AdminSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}/>

                {/* Main Content */}
                <main className={`flex-1 overflow-y-auto text-white transition-all duration-300 ease-in-out`} >
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AdminAuthenticatedLayout