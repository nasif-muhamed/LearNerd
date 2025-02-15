import React from 'react'
import { Outlet } from 'react-router-dom';
import HeaderAuth from '../user/common/unauth/HeaderAuth';


const UserUnAuthenticatedLayout = () => {

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            
            <HeaderAuth/>

            {/* Main Content */}
            <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-8">
                <Outlet/>
            </main>

        </div>

    )
}

export default UserUnAuthenticatedLayout