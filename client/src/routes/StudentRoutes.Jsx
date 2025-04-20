import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Home from "../pages/user/student/Home";
import BadgeList from "../pages/user/student/badges/BadgeList";
import BadgeParticipation from "../pages/user/student/badges/BadgeParticipation";
import ProtectedRoute from "./user_restrication/ProtectedRoute";
import DynamicRouter from "./user_restrication/DynamicRouter";
import FourNotFour from "../pages/FourNotFour";
import StudentCourses from "../pages/user/student/courses/StudentCourses";
import StudentCourseDetails from "../pages/user/student/courses/StudentCourseDetails";
import StudyRoomLanding from "../pages/user/student/study_room/StudyRoomLanding";
import StreamCourse from "../pages/user/student/study_room/StreamCourse";
import ListTutorsLandingPage from "../pages/user/student/tutors/ListTutorsLandingPage";
import TutorDetails from "../pages/user/student/tutors/TutorDetails";
import PaymentSuccess from "../pages/user/student/courses/subscription_result/paymentSuccess";
import CheckoutFormPage from "../pages/user/student/courses/subscription_result/CheckoutFormPage";
import StripeProvider from "../services/stripe/StripeProvider";

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

                <Route path="/courses">
                    <Route index element={<StudentCourses />} />
                    <Route path=":id" element={<StudentCourseDetails/>} />
                    <Route path=":id/payment" element={<CheckoutFormPage />} />
                    <Route path=":id/payment-success" element={
                        <StripeProvider>
                            <PaymentSuccess/>
                        </StripeProvider>
                    } />
                </Route>

                <Route path="/study-room">
                    <Route index element={<StudyRoomLanding />} />
                    <Route path="my-course/:purchaseId" element={<StreamCourse/>} />
                </Route>

                <Route path="/tutors">
                    <Route index element={<ListTutorsLandingPage />} />
                    <Route path=":id" element={<TutorDetails/>} />
                </Route>

                <Route path="/badges">
                    <Route index element={<BadgeList />} />
                    <Route path=":id" element={<BadgeParticipation />} />
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
