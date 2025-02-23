import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from '../pages/user/student/Home'
import ProtectedRoute from './user_restrication/ProtectedRoute'


const StudentRoutes = () => {
    
    return (
        <Routes>
            <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home/>} />
            </Route>
        </Routes>
    )
}

export default StudentRoutes