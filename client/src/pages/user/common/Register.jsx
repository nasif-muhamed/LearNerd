import React from 'react';
import { Facebook, Github } from 'lucide-react';
import Studs from '../../../assets/user-auth/studs-register.png';
import InputField from '../../../components/user/common/auth/InputField';
import SocialButton from '../../../components/user/common/auth/SocialButton';
import HeaderAuth from '../../../components/user/common/auth/HeaderAuth';
import { Link } from 'react-router-dom'

const Register = () => {

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <HeaderAuth/>

            {/* Main Content */}
            <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-8">
                
                {/* Left Side - Illustration */}
                <div className="w-full md:w-1/2 max-w-xl">
                    <div className="relative">
                        <img
                            src={Studs}
                            alt="Learning Illustration"
                            className="w-full h-auto rounded-lg"
                        />
                        {/* Decorative elements */}
                        <div className="absolute -top-4 -left-4 w-20 h-20 bg-blue-500/20 rounded-full"></div>
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-500/20 rounded-full"></div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 max-w-md">
                    <div className="bg-gray-800 p-8 rounded-xl shadow-lg">
                        <h2 className="text-2xl text-white font-bold mb-6">Create a new account</h2>

                        <form className="space-y-4">
                            <InputField label="Email" type="email" placeholder="Enter your email" />
                            <InputField label="Password" type="password" placeholder="Enter your password" />
                            <InputField label="Confirm Password" type="password" placeholder="Confirm your password" />

                            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                Send OTP
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-gray-800 text-gray-400">OR</span>
                                </div>
                            </div>

                            <div className="flex justify-center space-x-4">
                                <SocialButton icon={Facebook} bgColor="bg-red-500" />
                                <SocialButton icon={Facebook} bgColor="bg-blue-600" />
                                <SocialButton icon={Github} bgColor="bg-gray-700" />
                            </div>
                        </form>

                        <p className="mt-6 text-center text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login">
                                <span className="text-blue-500 hover:text-blue-400">
                                    Login
                                </span>
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Register
