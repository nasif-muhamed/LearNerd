import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Home from "../pages/user/student/Home";
import BadgeList from "../pages/user/student/study_room/badges/BadgeList";
import BadgeParticipation from "../pages/user/student/study_room/badges/BadgeParticipation";
import ProtectedRoute from "./user_restrication/ProtectedRoute";
import DynamicRouter from "../routes/user_restrication/DynamicRouter";
import FourNotFour from "../pages/FourNotFour";
import StudentCourses from "../pages/user/student/courses/StudentCourses";
import StudentCourseDetails from "../pages/user/student/courses/StudentCourseDetails";

const StudentRoutes = () => {
    const role = useSelector((state) => state.auth.role);
    console.log('role-student-router:', role)

    if (role !== 'student') {
        // Redirect to the appropriate route based on the role
        if (role === 'tutor') {
            return <Navigate to="/tutor/dashboard" />;
        } else if (role === 'admin') {
            return <Navigate to="/admin/dashboard" />;
        }
        // Fallback if role is unknown
        return <Navigate to="/" />;
    }

    return (
        <Routes>
            <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />

                <Route path="/study-room">
                    {/* <Route index element={<MyCoursesLanding />} /> */}
                    <Route path="badges" element={<BadgeList />} />
                    <Route path="badges/:id" element={<BadgeParticipation />} />
                </Route>

                <Route path="/courses">
                    <Route index element={<StudentCourses />} />
                    <Route path=":id" element={<StudentCourseDetails/>} />
                </Route>
            </Route>
            
            <Route path="*" element={<DynamicRouter />}>
                {/*  404 page  */}
                <Route path="*" element={<FourNotFour />} />
            </Route>
        </Routes>
    );
};

export default StudentRoutes;
