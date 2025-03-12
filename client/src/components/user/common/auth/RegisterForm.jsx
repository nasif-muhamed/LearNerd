import { Facebook, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { signInWithPopup } from "firebase/auth";
import { useDispatch } from "react-redux";
import { login } from "../../../../redux/features/authSlice";
import { auth, googleProvider } from "../../../../services/firebase/firebase";
import InputField from "./InputField";
import SocialButton from "./SocialButton";
import api from "../../../../services/api/axiosInterceptor";

const RegisterForm = ({ setStep, setLoading }) => {
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm({ mode: "onBlur" });

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const password = watch("pass");

    const onSubmit = async (data) => {
        try {
            setLoading(true); // Show spinner
            const credentials = {
                email: data.email.trim(),
                password: data.pass,
            };
            const response = await api.post("/users/register/", credentials);
            if (response.status !== 200) {
                throw new Error(response.data);
            }
            toast.info(
                `OTP sent to ${data.email}. Check your inbox \nYou have 3 minutes left `
            );
            sessionStorage.setItem("userEmail", data.email); // Store email
            sessionStorage.setItem(
                "userEmailExpiry",
                (Date.now() + 180000).toString()
            ); // Store expiration timestamp (3 minutes)
            setStep(2);
            reset();
        } catch (error) {
            console.log(error);
            console.log("message:", error.message);
            console.log("data:", error.response?.data?.email);
            if (error.response?.data) {
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error(error.message || "Something went wrong");
            }
        } finally {
            setLoading(false); // Hide spinner
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
        <>
            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
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
                                message: "Invalid email format",
                            },
                        }),
                    }}
                />
                {errors.email && (
                    <span className="text-sm text-red-500">
                        {errors.email.message}
                    </span>
                )}

                {/* Password Field */}
                <InputField
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    register={{
                        ...register("pass", {
                            required: "Password is required",
                            minLength: {
                                value: 8,
                                message: "Password must be at least 8 characters",
                            },
                            validate: (value) =>
                                !/\s/.test(value) || "No spaces allowed",
                            pattern: {
                                value: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                message:
                                    "Password must include at least a uppercase, a number, a special character and space is not allowed",
                            },
                        }),
                    }}
                />
                {errors.pass && (
                    <span className="text-sm text-red-500">
                        {errors.pass.message}
                    </span>
                )}

                {/* Confirm Password Field */}
                <InputField
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    register={{
                        ...register("confirmPass", {
                            required: "Confirm password is required",
                            validate: (value) =>
                                value === password || "Passwords do not match",
                        }),
                    }}
                />
                {errors.confirmPass && (
                    <span className="text-sm text-red-500">
                        {errors.confirmPass.message}
                    </span>
                )}

                <div className="text-center">
                    <button
                        type="submit"
                        className="px-10 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors my-3"
                    >
                        Send OTP
                    </button>
                </div>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-400">OR</span>
                    </div>
                </div>

            </form>
            <div className="flex justify-center space-x-4 mt-4">
                <button
                    onClick={handleGoogleLogin}
                >
                    <SocialButton icon={Facebook} bgColor="bg-red-600" />
                </button>
                <SocialButton icon={Facebook} bgColor="bg-blue-600" />
                <SocialButton icon={Github} bgColor="bg-gray-700" />
            </div>
        </>
    );
};

export default RegisterForm;
