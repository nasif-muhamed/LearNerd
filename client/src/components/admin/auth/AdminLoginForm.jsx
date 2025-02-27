import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { adminLogin } from "../../../redux/features/adminAuthSlice";
import { toast } from 'sonner'
import api from '../../../services/api/axiosInterceptor';

const LoginForm = ({ setLoading, setStep }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: "onBlur" });
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const credentials = {
                username: data.username,
                password: data.pass,
            }
            const response = await api.post("/admin/token/", credentials);
            if (response.status !== 200) {
                throw new Error(response.data);
            }
            console.log('response.data:', response.data)
            dispatch(adminLogin({'adminAccessToken':response.data.access, 'adminRefreshToken':response.data.refresh}));
            // dispatch(fetchUserDetails());
            toast.success('Login success. Welcome back!')
            reset();
            // navigate("/student/home");
            setStep(2)
        } catch (error) {

            console.log(error);
            console.log('message:', error.message);
            console.log('data:', Object.values(error.response?.data)?.[0]);
            toast.error(Object.values(error.response?.data)?.[0] || error.message || 'Something went wrong');

        } finally {

            setLoading(false);
            
        }
    };


    return (
        <div className="max-w-md flex flex-col justify-center items-center p-10">
            <h1 className="text-3xl font-bold text-white mb-8">Admin Login</h1>

            <form className="space-y-6">
                
                <input 
                    type="text" 
                    placeholder="username" 
                    {
                        ...register("username", { 
                            required: "Username is required", 
                            minLength: { value: 5, message: "Not enough characters on username" },
                            validate: value => (!/\s/.test(value) || "No spaces allowed")
                        })
                    }
                    className='w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none'
                />
                {errors.username && <span className="text-sm text-red-500">{errors.username.message}</span>}

                <input 
                    type="password"
                    placeholder="Enter your password" 
                    {
                        ...register("pass", { 
                            required: "Password is required", 
                            minLength: { value: 5, message: "Not enough characters on password" },
                            validate: value => (!/\s/.test(value) || "No spaces allowed")
                        })
                    }
                    className='w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none'
                />
                {errors.pass && <span className="text-sm text-red-500">{errors.pass.message}</span>}               

                <div className='w-full flex justify-center'>
                    <button onClick={handleSubmit(onSubmit)} className="px-28 bg-gray-200 text-gray-900 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">
                        Login
                    </button>
                </div>

            </form>
        </div>
    )
}

export default LoginForm