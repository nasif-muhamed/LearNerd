import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Register from '../pages/user/common/Register'
import Login from '../pages/user/common/Login'
import Test from '../pages/test'
import AntiProtectedRoute from './user_restrication/AntiProtectedRoute'
import Logout from '../pages/user/common/Logout'
import ProtectedRoute from './user_restrication/ProtectedRoute'
import Profile from '../pages/user/common/Profile'
import FourNotFour from '../pages/FourNotFour'

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

            <Route path="*" element={<FourNotFour/>} /> {/*  404 page  */}
        </Routes>
    )
}

export default CommonRoutes