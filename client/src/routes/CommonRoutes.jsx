import React from 'react'
import { Route, Routes } from 'react-router-dom'
import UserUnAuthenticatedLayout from '../components/layout/UserUnAuthenticatedLayout'
import Register from '../pages/user/common/Register'
import Login from '../pages/user/common/Login'
import Test from '../pages/test'
import AntiProtectedRoute from './user_restrication/AntiProtectedRoute'
import Logout from '../pages/user/common/Logout'
import ProtectedRoute from './user_restrication/ProtectedRoute'
import Profile from '../pages/user/common/Profile'

const CommonRoutes = () => {

    return (
        <Routes>
            <Route path="/test" element={<Test/>} />
            <Route path="/" element={<ProtectedRoute/>} >
                <Route path="/logout" element={<Logout/>} />
                <Route path="/profile" element={<Profile/>} />
            </Route>
            
            <Route path="/" element={<AntiProtectedRoute/>}>
                <Route path="/register" element={<Register/>} />
                <Route path="/login" element={<Login/>} />
            </Route>

        </Routes>
    )
}

export default CommonRoutes