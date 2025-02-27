import React from "react";
import FourNotFour from "../pages/FourNotFour";
import { Routes, Route } from "react-router-dom";

const TutorRoutes = () => {
    return (
        <Routes>
            <Route path="*" element={<FourNotFour />} /> {/*  404 page  */}
        </Routes>
    );
};

export default TutorRoutes;
