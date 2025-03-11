import React from "react";
import { Routes, Route } from "react-router-dom";
import FourNotFour from "../pages/FourNotFour";
import DynamicRouter from "../routes/user_restrication/DynamicRouter";

const TutorRoutes = () => {
    console.log('tutor route')
    return (
        <Routes>
            <Route path="*" element={<DynamicRouter />}>
                <Route path="*" element={<FourNotFour />} />
            </Route>
        </Routes>
    );
};

export default TutorRoutes;
