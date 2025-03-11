import React from "react";
import { Route, Routes } from "react-router-dom";
import AdminProtectedRoute from "./user_restrication/AdminProtectedRoute";
import AdminLogin from "../pages/admin/auth/AdminLogin";
import Logout from "../pages/user/common/Logout";
import AntiProtectedRoute from "./user_restrication/AntiProtectedRoute";
import AdminDashboard from "../pages/admin/AdminDashboard";
import FourNotFour from "../pages/FourNotFour";
import AdminUserMgt from "../pages/admin/users/AdminUserMgt";
import AdminUserDetails from "../pages/admin/users/AdminUserDetails";
import AdminBadge from "../pages/admin/badges/AdminBadge";
import AdminBadgeCreate from "../pages/admin/badges/AdminBadgeCreate";
import AdminBadgeUpdate from "../pages/admin/badges/AdminBadgeUpdate";
import DynamicRouter from "../routes/user_restrication/DynamicRouter";

const CommonRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AntiProtectedRoute />}>
                <Route path="/login" element={<AdminLogin />} />
            </Route>

            <Route path="/" element={<AdminProtectedRoute />}>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/users" element={<AdminUserMgt />} />
                <Route path="/users/:id" element={<AdminUserDetails />} />
                <Route path="/badges" element={<AdminBadge />} />
                <Route
                    path="/badges/create-badge"
                    element={<AdminBadgeCreate />}
                />
                <Route
                    path="/badges/update-badge/:badgeId"
                    element={<AdminBadgeUpdate />}
                />
                <Route path="/logout" element={<Logout />} />
            </Route>

            <Route path="*" element={<DynamicRouter />}>
                {/*  404 page  */}
                <Route path="*" element={<FourNotFour />} />
            </Route>
        </Routes>
    );
};

export default CommonRoutes;
