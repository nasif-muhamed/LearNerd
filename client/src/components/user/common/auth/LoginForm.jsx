import React from 'react'
import { FaGoogle, FaFacebookF, FaGithub } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast } from 'sonner'
import { signInWithPopup } from "firebase/auth";
import { login, fetchUserDetails } from "../../../../redux/features/authSlice";
import { auth, googleProvider } from "../../../../services/firebase/firebase";
import SocialButton from './SocialButton';
import InputField from './InputField';
import api from '../../../../services/api/axiosInterceptor';


const LoginForm = ({ setLoading }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: "onBlur" });
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const credentials = {
                email: data.email.trim(),
                password: data.pass,
            }
            const response = await api.post("/users/token/", credentials);
            // console.log('user_response_token_login:', response.data)
            if (response.status !== 200) {
                throw new Error(response.data);
            }
            
            dispatch(login({'access':response.data.access, 'refresh':response.data.refresh, 'role':'student'}));
            dispatch(fetchUserDetails());
            toast.success('Login success. Welcome back!')
            reset();
            navigate("/student/home");

        } catch (error) {

            console.log(error);
            console.log('message:', error.message);
            console.log('data:', error.response?.data);
            if (error.response?.data){
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error(error.message || 'Something went wrong');
            }

        } finally {

            setLoading(false);
            
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            console.log('token:', idToken)
            // Send the ID token to your Django backend
            const response = await api.post("/users/google-login/", {
                token: idToken,
            });
            if (response.status !== 200) {
                throw new Error("Google login failed");
            }
            console.log("response:", response)
            dispatch(
                login({
                    access: response.data.access,
                    refresh: response.data.refresh,
                    role: "student", // Adjust role as needed
                })
            );

            const msg = response.data.registered ? "registration" : "login"
            toast.success(`${msg} successful!, ${msg === 'login' ? 'welcome back' : 'welcome to LearNerds' }`);
            navigate("/student/home");
        } catch (error) {
            console.error(error);
            
            if (error.response?.data) {
                toast.error(Object.values(error.response?.data)?.[0]);
            } else if (error.code === "auth/popup-closed-by-user") {
                toast.info("Google login was canceled. Please try again if you wish to proceed.");
            } else {
                toast.error(error.message || "Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };

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
                            },
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
                                validate: value => (!/\s/.test(value) || "No spaces allowed"),
                            })
                        }}
                        
                    />
                    {errors.pass && <span className="text-sm text-red-500">{errors.pass.message}</span>}
                    
                    <Link to="/forgot-password" className="text-blue-500 hover:text-blue-400 text-sm  inline-block w-full text-right">
                        forgot password?
                    </Link>
                </div>
                    
                <div className='w-full flex justify-center'>
                    <button onClick={handleSubmit(onSubmit)} className="px-28 bg-gray-200 text-gray-900 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">
                        Login
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gray-900 text-gray-400">OR</span>
                    </div>
                </div>
            </form>
                <div className="flex justify-center space-x-6 mt-4">
                    <div
                        onClick={handleGoogleLogin}
                    >
                        <SocialButton icon={FaGoogle} bgColor="bg-red-600" />
                    </div>
                    <SocialButton icon={FaFacebookF } bgColor="bg-blue-600" />
                    <SocialButton icon={FaGithub} bgColor="bg-gray-700" />
                </div>

                <p className="text-center text-gray-400 mt-4">
                    Don't have an account yet?{' '}
                    <Link to="/register">
                        <span className="text-blue-500 hover:text-blue-400">
                            Register
                        </span>
                    </Link>
                </p>
        </div>
    )
}

export default LoginForm