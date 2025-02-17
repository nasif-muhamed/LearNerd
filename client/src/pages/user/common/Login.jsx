import React from 'react'
import Studs from '../../../assets/user-auth/studs-login.png'
import LoginForm from '../../../components/user/common/unauth/LoginForm';


const Login = () => {
    return (
        <>
            {/* Login Form Section */}
            <LoginForm/>

            {/* Illustration Section */}
            <div className="w-full md:w-1/2 max-w-xl md:block hidden">
                <div className="relative">
                    <img
                        src={Studs}
                        alt="Learning Illustration"
                        className="w-full h-auto rounded-lg"
                    />
                    {/* Decorative elements */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/20 rounded-full"></div>
                    <div className="absolute top-1/4 -left-8 w-20 h-20 bg-green-500/20 rounded-full"></div>
                </div>
            </div>
        </>
    );
};

export default Login
