import React from 'react'
import { Outlet } from 'react-router-dom';
import HeaderUnAuth from '../user/common/auth/HeaderUnAuth';


const UserUnAuthenticatedLayout = () => {

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            
            <HeaderUnAuth/>

            {/* Main Content */}
            <main className="flex-1 flex flex-col md:flex-row items-center justify-center  gap-8">
                <Outlet/>
            </main>

        </div>

    )
}

export default UserUnAuthenticatedLayout