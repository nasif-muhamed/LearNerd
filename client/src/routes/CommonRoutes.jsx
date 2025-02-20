import React from 'react'
import { Route, Routes } from 'react-router-dom'
import UserUnAuthenticatedLayout from '../components/layout/UserUnAuthenticatedLayout'
import Register from '../pages/user/common/Register'
import Login from '../pages/user/common/Login'
import Test from '../pages/test'
import AntiProtectedRoute from '../utils/user/AntiProtectedRoute'

const CommonRoutes = () => {

    return (
        <Routes>
            <Route path="/test" element={<Test/>} />

            <Route path="/" element={<AntiProtectedRoute> <UserUnAuthenticatedLayout /> </AntiProtectedRoute>}>
                <Route path="/register" element={<Register/>} />
                <Route path="/login" element={<Login/>} />
            </Route>

        </Routes>
    )
}

export default CommonRoutes