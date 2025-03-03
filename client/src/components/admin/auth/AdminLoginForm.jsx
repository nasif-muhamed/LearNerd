import React from 'react'
import { useForm } from "react-hook-form";
import { toast } from 'sonner'
import api from '../../../services/api/axiosInterceptor';

const AdminLoginForm = ({ setLoading, setStep }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: "onBlur" });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const credentials = {
                username: data.username,
            }
            const response = await api.post("/admin/login/", credentials);
            if (response.status !== 200) {
                throw new Error(response.data);
            }
            console.log('response.data:', response.data)
            sessionStorage.setItem("adminUsername", data.username); // Store username
            sessionStorage.setItem("adminUsernameExpiry", (Date.now() + 60000).toString()); // Store expiration timestamp (1 minutes)
            toast.info(`OTP sent to registered mail id. Check your inbox You have 1 minutes left`);
            reset();
            setStep(2)
        } catch (error) {

            console.log(error);
            console.log('message:', error.message);
            console.log('data:', Object.values(error.response?.data)?.[0]);
            if (error.response?.data){
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error(error.message || 'Something went wrong');
            }

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

                <div className='w-full flex justify-center'>
                    <button onClick={handleSubmit(onSubmit)} className="px-28 bg-gray-200 text-gray-900 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors">
                        Send OTP
                    </button>
                </div>

            </form>
        </div>
    )
}

export default AdminLoginForm