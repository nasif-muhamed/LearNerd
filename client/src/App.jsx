import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CommonRoutes from './routes/CommonRoutes';
import StudentRoutes from './routes/StudentRoutes';

function App() {

    return (
        <Router>
            <Routes>
                <Route path="/student/*" element={<StudentRoutes />} />
                <Route path="/tutor/*" element={<></>} />
                <Route path="/admin/*" element={<></>} />
                <Route path="/*" element={<CommonRoutes />} />
                <Route path="*" element={<></>} /> {/*  404 page  */}
            </Routes>
        </Router>
    )
}

export default App
