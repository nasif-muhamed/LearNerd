import React from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminLogin from '../pages/admin/auth/AdminLogin'
import Logout from '../pages/user/common/Logout'
import ProtectedRoute from './user_restrication/ProtectedRoute'
import Profile from '../pages/user/common/Profile'
import FourNotFour from '../pages/FourNotFour'

const CommonRoutes = () => {

    return (
        <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/" element={<ProtectedRoute/>} >
                <Route path="/logout" element={<Logout/>} />
                <Route path="/profile" element={<Profile/>} />
            </Route>

            <Route path="*" element={<FourNotFour/>} /> {/*  404 page  */}
        </Routes>
    )
}

export default CommonRoutes