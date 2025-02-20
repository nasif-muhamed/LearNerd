import { useState, useRef } from 'react'
import { Facebook, Github } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form";
import SocialButton from './SocialButton';
import InputField from './InputField';
import api from '../../../../services/api/axiosInterceptor';
import tokenManager from '../../../../services/api/tokenManager';

const LoginForm = () => {
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ mode: "onBlur" });
    const token = new tokenManager();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            const credentials = {
                email: data.email,
                password: data.pass,
            }
            const response = await api.post("/users/token/", credentials);
            if (response.status !== 200) {
                throw new Error(response.data);
            }

            token.setAccessToken(response.data.access); // Store accesstoken
            token.setRefreshToken(response.data.refresh); // Store refreshtoken
            console.log(token.getAccessToken(), token.getRefreshToken());
            reset();
            navigate("/");

        } catch (error) {
            console.log(error);
            console.log('message:', error.message);
            console.log('data:', error.response?.data);
            alert(`Error: ${error.response?.data}`);
        }
    };

    const emailtyped = watch("email");
    console.log(emailtyped);
    return (
        <div className="w-full md:w-1/2 max-w-md">
            <h1 className="text-3xl font-bold text-white mb-8">Login to your account</h1>

            <form className="space-y-6">
                
                <InputField 
                    type="email" 
                    placeholder="Email" 
                    register={{
                        ...register("email", { 
                            required: "Email is required", 
                            pattern: { 
                                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
                                message: "Invalid email format" 
                            } 
                        })
                    }}
                />
                {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}

                <div>
                    <InputField 
                        type="password"
                        placeholder="Enter your password" 
                        register={{
                            ...register("pass", { 
                                required: "Password is required", 
                                minLength: { value: 8, message: "Not enough characters on password" },
                            })
                        }}
                        
                    />
                    {errors.pass && <span className="text-sm text-red-500">{errors.pass.message}</span>}
                    
                    <a href="#" className="text-blue-500 hover:text-blue-400 text-sm  inline-block w-full text-right">
                        forgot password?
                    </a>
                </div>

                <button onClick={handleSubmit(onSubmit)} className="w-full bg-gray-200 text-gray-900 py-4 rounded-lg font-bold hover:bg-gray-300 transition-colors">
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