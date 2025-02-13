import React from 'react'
import { Facebook, Github } from 'lucide-react';

import InputField from './InputField';
import SocialButton from './SocialButton';

const RegisterForm = () => {
    return (
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
    )
}

export default RegisterForm