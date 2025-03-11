import React from 'react'
import NerdOwl from '/nerdowl.png';
import { Link } from 'react-router-dom';

// Header for non-authorized user
const HeaderUnAuth = () => {

    return (
        <header className="p-4 flex justify-between items-center">
            <Link to={'/login'} className="flex items-center">
                <img src={NerdOwl} alt="LearNerds Logo" className="h-10" />
                <span className="text-white text-xl font-bold">LearNerds</span>
            </Link>
            <div className="space-x-4">
                <Link to={'/login'} className="text-gray-300 hover:text-white">Login</Link>
                <Link to={'/register'} className="text-gray-300 hover:text-white">Register</Link>
            </div>
        </header>
    )
}

export default HeaderUnAuth
