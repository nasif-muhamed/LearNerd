import React from 'react'
import { Facebook, Github } from 'lucide-react';
import { Link } from 'react-router-dom'
import SocialButton from './SocialButton';
import InputField from './InputField';
const LoginForm = () => {
    
    return (
        <div className="w-full md:w-1/2 max-w-md">
            <h1 className="text-3xl font-bold text-white mb-8">Login to your account</h1>

            <form className="space-y-6">
                
                <InputField type="email" placeholder="Email" />
                <InputField type="password" placeholder="Password" />
                <a href="#" className="text-blue-500 hover:text-blue-400 text-sm mt-2 inline-block">
                    forgot password?
                </a>


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
    )
}

export default LoginForm