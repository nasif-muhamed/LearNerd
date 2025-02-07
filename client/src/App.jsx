import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/user/common/Register';
import Login from './pages/user/common/Login';
import Home from './pages/user/student/Home';

function App() {

    return (
        <Router>
            <Routes>
                <Route path="/register" element={<Register/>} />
                <Route path="/login" element={<Login/>} />
                <Route path="/" element={<Home/>} />
            </Routes>
        </Router>
    )
}

export default App
