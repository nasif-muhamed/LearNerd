import React from "react";
import { Route, Routes } from "react-router-dom";
import Register from "../pages/user/common/Register";
import Login from "../pages/user/common/Login";
import Test from "../pages/test";
import AntiProtectedRoute from "./user_restrication/AntiProtectedRoute";
import Logout from "../pages/user/common/Logout";
import ProtectedRoute from "./user_restrication/ProtectedRoute";
import Profile from "../pages/user/common/Profile";
import FourNotFour from "../pages/FourNotFour";
import DynamicRouter from "../routes/user_restrication/DynamicRouter";
import ForgotPassword from "../pages/user/common/ForgotPassword";
import StripeProvider from "../services/stripe/StripeProvider";

const CommonRoutes = () => {
    return (
        <Routes>
            <Route path="/test/:id" element={
                <Test />
            } />
            <Route path="/" element={<ProtectedRoute />}>
                <Route path="/logout" element={<Logout />} />
                <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="/" element={<AntiProtectedRoute />}>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            <Route path="*" element={<DynamicRouter />}>
                {/*  404 page  */}
                <Route path="*" element={<FourNotFour />} />
            </Route>
        </Routes>
    );
};

export default CommonRoutes;
