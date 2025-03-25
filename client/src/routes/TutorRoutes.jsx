import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import FourNotFour from "../pages/FourNotFour";
import DynamicRouter from "../routes/user_restrication/DynamicRouter";
import ProtectedRoute from "./user_restrication/ProtectedRoute";
import TutorDashboard from "../pages/user/tutor/TutorDashboard";
import MyCoursesLanding from "../pages/user/tutor/myCourses/MyCoursesLanding";
import CreateCourse from "../pages/user/tutor/myCourses/CreateCourse";

const TutorRoutes = () => {
    const role = useSelector((state) => state.auth.role);
    console.log('role-tutor-router:', role)
    
    if (role !== 'tutor') {
        // Redirect to the appropriate route based on the role
        if (role === 'student') {
            return <Navigate to="/student/home" />;
        } else if (role === 'admin') {
            return <Navigate to="/admin/dashboard" />;
        }
        // Fallback if role is unknown
        return <Navigate to="/" />;
    }

    return (
        <Routes>
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<TutorDashboard />} />
                <Route path="/my-courses">
                    <Route index element={<MyCoursesLanding />} />
                    <Route path="create-course" element={<CreateCourse />} />
                    <Route path="create-course/:draftId" element={<CreateCourse />} />
                </Route>
            </Route>

            <Route path="*" element={<DynamicRouter />}>
                <Route path="*" element={<FourNotFour />} />
            </Route>
        </Routes>
    );
};

export default TutorRoutes;
