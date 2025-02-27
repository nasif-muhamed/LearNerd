import React, { useState } from 'react'
import { Outlet } from 'react-router-dom';
import HeaderAuth from '../user/common/HeaderAuth';
import SideBar from '../user/common/SideBar';
import { useSelector, useDispatch } from "react-redux";
import { toggleIsSidebarOpen } from '../../redux/features/uiSlice'

const UserAuthenticatedLayout = () => {
    const isSidebarOpen = useSelector((state) => state.ui.isSidebarOpen)
    const dispatch = useDispatch()

    const toggleSidebar = () => {
        dispatch(toggleIsSidebarOpen())
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-900">
            {/* Full-width Navbar */}
            <HeaderAuth toggleSidebar={toggleSidebar} />

            <div className="flex flex-1 overflow-hidden">
                {/* Mobile overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black  c  c  c  c\ c c\rc bg-opacity-50 z-30 md:hidden"
                        onClick={toggleSidebar}
                    ></div>
                )}

                {/* Fixed Sidebar */}
                <SideBar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}/>

                {/* Main Content */}
                <main className={`flex-1 overflow-y-auto text-white transition-all duration-300 ease-in-out`} >
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default UserAuthenticatedLayout