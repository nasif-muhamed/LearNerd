import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../pages/user/student/Home";
import BadgeList from "../pages/user/student/study_room/badges/BadgeList";
import BadgeParticipation from "../pages/user/student/study_room/badges/BadgeParticipation";
import ProtectedRoute from "./user_restrication/ProtectedRoute";
import DynamicRouter from "../routes/user_restrication/DynamicRouter";
import FourNotFour from "../pages/FourNotFour";

const StudentRoutes = () => {
    return (
        <Routes>
            <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/study-room/badges" element={<BadgeList />} />
                <Route
                    path="/study-room/badges/:id"
                    element={<BadgeParticipation />}
                />
            </Route>
            <Route path="*" element={<DynamicRouter />}>
                {/*  404 page  */}
                <Route path="*" element={<FourNotFour />} />
            </Route>
        </Routes>
    );
};

export default StudentRoutes;
