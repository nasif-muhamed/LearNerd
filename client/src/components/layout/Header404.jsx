import React from 'react'
import NerdOwl from '/nerdowl.png';

const Header404 = () => {
    
    return (
        <header className="p-4 flex justify-between items-center">
            <div className="flex items-center">
                <img src={NerdOwl} alt="LearNerds Logo" className="h-10" />
                <span className="text-white text-xl font-bold">LearNerds</span>
            </div>
            <div className="space-x-4">
                <button className="text-gray-300 hover:text-white">Login</button>
                <button className="text-gray-300 hover:text-white">Register</button>
            </div>
        </header>
    )
}

export default Header404