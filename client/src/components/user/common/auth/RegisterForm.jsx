import { Facebook, Github } from 'lucide-react';
import InputField from './InputField';
import SocialButton from './SocialButton';
import { useForm } from "react-hook-form";
import api from '../../../../services/api/axiosInterceptor';

const RegisterForm = ({setStep}) => {
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ mode: "onBlur" });

    const password = watch("pass");
    
    const onSubmit = async (data) => {
        try {
            const credentials = {
                email: data.email,
                password: data.pass,
            }
            const response = await api.post("/users/register/", credentials);
            if (response.status !== 200) {
                throw new Error(response.data);
            }
            // alert('otp sent to the respected email')
            setStep(2);
            reset();
            sessionStorage.setItem("userEmail", data.email); // Store email
            sessionStorage.setItem("userEmailExpiry", (Date.now() + 300000).toString()); // Store expiration timestamp (5 minutes)

        } catch (error) {
            console.log(error);
            console.log('message:', error.message);
            console.log('data:', error.response?.data);
            alert(`Error: ${error.response?.data}`);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <InputField 
                label="Email" 
                type="email" 
                placeholder="Enter your email" 
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

            {/* Password Field */}
            <InputField 
                label="Password" 
                type="password" 
                placeholder="Enter your password" 
                register={{
                    ...register("pass", { 
                        required: "Password is required", 
                        minLength: { value: 8, message: "Password must be at least 8 characters" },
                        pattern: { 
                            value: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
                            message: "Password must include at least one uppercase letter, a number, and a special character"
                        }
                    })
                }}
            />
            {errors.pass && <span className="text-sm text-red-500">{errors.pass.message}</span>}

            {/* Confirm Password Field */}
            <InputField 
                label="Confirm Password" 
                type="password" 
                placeholder="Confirm your password" 
                register={{
                    ...register("confirmPass", { 
                        required: "Confirm password is required", 
                        validate: value => value === password || "Passwords do not match"
                    })
                }} 
            />
            {errors.confirmPass && <span className="text-sm text-red-500">{errors.confirmPass.message}</span>}

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
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
    );
}

export default RegisterForm