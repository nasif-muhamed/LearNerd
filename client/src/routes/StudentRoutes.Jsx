import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from '../pages/user/student/Home'


const StudentRoutes = () => {
    console.log("StudentRoutes")
    return (
        <Routes>
            <Route path="/home" element={<Home/>} />
        </Routes>
    )
}

export default StudentRoutes