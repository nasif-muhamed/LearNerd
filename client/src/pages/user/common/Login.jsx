import React from 'react'
import { Facebook, Github } from 'lucide-react';
import HeaderAuth from '../../../components/user/common/auth/HeaderAuth';
import Studs from '../../../assets/user-auth/studs-login.png'
import { Link } from 'react-router-dom'

const SocialButton = ({ icon: Icon, bgColor, label }) => (
    <button className={`${bgColor} p-3 rounded-full hover:opacity-90 transition-opacity`}>
        <Icon size={24} className="text-white" />
    </button>
);

const Login = () => {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            
            <HeaderAuth/>

            {/* Main Content */}
            <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-8">
                {/* Login Form Section */}
                <div className="w-full md:w-1/2 max-w-md">
                    <h1 className="text-3xl font-bold text-white mb-8">Login to your account</h1>

                    <form className="space-y-6">
                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full p-4 rounded-lg bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full p-4 rounded-lg bg-gray-800/50 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                            />
                            <a href="#" className="text-blue-500 hover:text-blue-400 text-sm mt-2 inline-block">
                                forgot password?
                            </a>
                        </div>

                        <button className="w-full bg-gray-200 text-gray-900 py-4 rounded-lg font-bold hover:bg-gray-300 transition-colors">
                            Login
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-gray-900 text-gray-400">OR</span>
                            </div>
                        </div>

                        <div className="flex justify-center space-x-6">
                            <SocialButton icon={Facebook} bgColor="bg-red-500" />
                            <SocialButton icon={Facebook} bgColor="bg-blue-600" />
                            <SocialButton icon={Github} bgColor="bg-gray-700" />
                        </div>

                        <p className="text-center text-gray-400">
                            Don't have an account yet?{' '}
                            <Link to="/register">
                                <span className="text-blue-500 hover:text-blue-400">
                                    Register
                                </span>
                            </Link>
                        </p>
                    </form>
                </div>

                {/* Illustration Section */}
                <div className="w-full md:w-1/2 max-w-xl">
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
            </main>
        </div>
    );
};

export default Login
