import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from '../pages/user/student/Home'
import ProtectedRoute from './user_restrication/ProtectedRoute'
import FourNotFour from '../pages/FourNotFour'

const StudentRoutes = () => {
    
    return (
        <Routes>
            <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home/>} />
            </Route>

            <Route path="*" element={<FourNotFour/>} /> {/*  404 page  */}
        </Routes>
    )
}

export default StudentRoutes