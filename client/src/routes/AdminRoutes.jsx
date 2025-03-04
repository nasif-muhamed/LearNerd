import React from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminProtectedRoute from './user_restrication/AdminProtectedRoute'
import AdminLogin from '../pages/admin/auth/AdminLogin'
import Logout from '../pages/user/common/Logout'
import AntiProtectedRoute from './user_restrication/AntiProtectedRoute'
import AdminDashboard from '../pages/admin/AdminDashboard'
import FourNotFour from '../pages/FourNotFour'
import AdminUserMgt from '../pages/admin/AdminUserMgt'
import AdminUserDetails from '../pages/admin/AdminUserDetails'

const CommonRoutes = () => {

    return (
        <Routes>
            <Route path="/" element={<AntiProtectedRoute/>} >
                <Route path="/login" element={<AdminLogin />} />
            </Route>

            <Route path='/' element={<AdminProtectedRoute />}>
                <Route path='/dashboard' element={<AdminDashboard />} />
                <Route path='/users' element={<AdminUserMgt />} />
                <Route path='/users/:id' element={<AdminUserDetails />} />
                <Route path="/logout" element={<Logout/>} />
            </Route>
            
            <Route path="*" element={ <FourNotFour/>} /> {/*  404 page  */}
        </Routes>
    )
}

export default CommonRoutes