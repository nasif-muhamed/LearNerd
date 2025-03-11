import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../../services/api/axiosInterceptor";
import StudConfusion from "../../../assets/user-auth/stud-confusion.png";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import InputField from "../../../components/user/common/auth/InputField";
import { formatTimeMinSec } from "../../../utils/formatTime";

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    return (
        <div className="flex items-center h-full">
            {/* Show spinner if loading */}
            {loading && <LoadingSpinner />}

            {step === 1 ? (
                <>
                    {/* Left Side - Illustration */}
                    <div className="w-full md:w-1/2 max-w-md md:block hidden p-10">
                        <div className="relative">
                            <img
                                src={StudConfusion}
                                alt="Reset Password Illustration"
                                className="w-full h-auto rounded-lg"
                            />
                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/20 rounded-full"></div>
                            <div className="absolute top-1/4 -left-8 w-20 h-20 bg-green-500/20 rounded-full"></div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="w-full md:w-1/2 max-w-md">
                        <h1 className="text-3xl font-bold text-white mb-8">
                            Reset your password
                        </h1>
                        <ForgotPasswordEmail
                            setStep={setStep}
                            setLoading={setLoading}
                        />
                    </div>
                </>
            ) : step === 2 ? (
                <div className="flex flex-col items-center justify-center bg-gray-900 text-white px-4">
                    <h1 className="text-2xl font-semibold mb-4">
                        Verify your identity
                    </h1>
                    <ForgotPasswordOTP
                        setStep={setStep}
                        setLoading={setLoading}
                    />
                </div>
            ) : (
                <>
                    {/* Left Side - Illustration */}
                    <div className="w-full md:w-1/2 max-w-md md:block hidden p-10">
                        <div className="relative">
                            <img
                                src={StudConfusion}
                                alt="New Password Illustration"
                                className="w-full h-auto rounded-lg"
                            />
                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/20 rounded-full"></div>
                            <div className="absolute top-1/4 -left-8 w-20 h-20 bg-green-500/20 rounded-full"></div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="w-full md:w-1/2 max-w-md">
                        <h1 className="text-3xl font-bold text-white mb-8">
                            Set new password
                        </h1>
                        <SetNewPassword setLoading={setLoading} setStep={setStep} />
                    </div>

                </>
            )}
        </div>
    );
};

const ForgotPasswordEmail = ({ setStep, setLoading }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({ mode: "onBlur" });

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const credentials = {
                email: data.email.trim(),
            };
            const response = await api.post(
                "/users/forgot-password/",
                credentials
            );
            if (response.status !== 200) {
                throw new Error(response.data);
            }
            toast.info(
                `OTP sent to ${data.email}. Check your inbox.\nYou have 1 minute to verify.`
            );
            sessionStorage.setItem("userEmail", data.email);
            sessionStorage.setItem(
                "userEmailExpiry",
                (Date.now() + 180000).toString()
            ); // 3 minutes
            setStep(2);
            reset();
        } catch (error) {
            console.log(error);
            if (error.response?.data) {
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error(error.message || "Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <p className="text-gray-400 mb-6">
                Enter your email address and we'll send you an OTP to reset your
                password
            </p>
            <form className="space-y-6">
                <InputField
                    type="email"
                    placeholder="Email"
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

                <div className="w-full flex justify-center">
                    <button
                        onClick={handleSubmit(onSubmit)}
                        className="px-16 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                        Send OTP
                    </button>
                </div>

                <p className="text-center text-gray-400">
                    Remembered your password?{" "}
                    <Link to="/login">
                        <span className="text-blue-500 hover:text-blue-400">
                            Login
                        </span>
                    </Link>
                </p>
            </form>
        </div>
    );
};

const ForgotPasswordOTP = ({ setStep, setLoading }) => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(60); // 60 seconds = 1 minute
    const inputRefs = useRef([]);

    // Start or reset the timer
    useEffect(() => {
        if (timer > 0) {
            const countdown = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(countdown); // Cleanup on unmount or timer reset
        } else {
            // Timer expired
            toast.error("OTP Expired. Try resend OTP");
        }
    }, [timer]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        let newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < otp.length - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, event) => {
        if (event.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        try {
            const otpValue = otp.join("");
            const email = sessionStorage.getItem("userEmail");
            const emailExpiry = sessionStorage.getItem("userEmailExpiry");

            if (!otpValue || otpValue.length < 6) {
                toast.error(`OTP is required and must be 6 digits`);
                setLoading(false);
                return;
            }

            if (email && Date.now() < parseInt(emailExpiry)) {
                const credentials = {
                    email: email,
                    otp: otpValue,
                };
                const response = await api.post(
                    "/users/forgot-password/verify-otp/",
                    credentials
                );
                if (response.status !== 200) {
                    throw new Error(response.data);
                }

                toast.success(`OTP verified successfully`);
                setStep(3);
            } else {
                sessionStorage.removeItem("userEmail");
                sessionStorage.removeItem("userEmailExpiry");
                toast.error(`OTP session expired. Please try again`);
                setStep(1);
            }
        } catch (error) {
            console.log(error);
            if (error.response?.data) {
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error(error.message || "Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        const email = sessionStorage.getItem("userEmail");
        const emailExpiry = sessionStorage.getItem("userEmailExpiry");

        try {
            if (email && Date.now() < parseInt(emailExpiry)) {
                const credentials = {
                    email: email,
                    flow: 'forgot_password'
                };
                const response = await api.post(
                    "/users/resend-otp/",
                    credentials
                );
                if (response.status !== 200) {
                    throw new Error(response.data);
                }

                sessionStorage.setItem(
                    "userEmailExpiry",
                    (Date.now() + 180000).toString()
                ); // 3 minutes
                toast.success(`New OTP sent successfully`);
                setTimer(60); // Reset timer to 1 minute on resend
                setOtp(["", "", "", "", "", ""]); // Clear OTP fields
            } else {
                sessionStorage.removeItem("userEmail");
                sessionStorage.removeItem("userEmailExpiry");
                toast.error(`OTP session expired. Please try again`);
                setStep(1);
            }
        } catch (error) {
            console.log(error);
            if (error.response?.data) {
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error(error.message || "Something went wrong");
            }
            // if (error.response?.data?.code === "otp_session_expired")
            //     setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center bg-gray-800 p-6 rounded-lg shadow-lg w-80 md:w-full max-w-md">
            <p className="text-gray-300 mb-4 text-center">
                Enter the 6-digit code sent to your email
            </p>
            <div className="flex space-x-1.5 md:space-x-4 my-4">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-10 h-10 md:w-12 md:h-12 text-center text-xl bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                ))}
            </div>
            <p className="text-gray-400 mb-4">
                Time remaining: {formatTimeMinSec(timer)}
            </p>
            <button
                onClick={handleVerifyOTP}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg mt-4 w-full"
            >
                Verify
            </button>
            <p
                onClick={handleResendOTP}
                className="mt-3 text-sm text-gray-400 cursor-pointer hover:underline"
            >
                Resend OTP
            </p>
        </div>
    );
};

const SetNewPassword = ({ setLoading, setStep }) => {
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm({ mode: "onBlur" });
    const password = watch("password");
    const navigate = useNavigate();
    const [timer, setTimer] = useState(180); // 180 seconds = 3 minute

    useEffect(() => {
        if (timer > 0) {
            const countdown = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(countdown); // Cleanup on unmount or timer reset
        } else {
            // Timer expired
            toast.error("Forgot password session Expired. Please try again");
            setStep(1)
        }
    }, [timer]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const email = sessionStorage.getItem("userEmail");
            const emailExpiry = sessionStorage.getItem("userEmailExpiry");
        
            if (email && Date.now() > parseInt(emailExpiry)) {
                toast.error(
                    "Session expired. Please restart the password reset process."
                );
                sessionStorage.removeItem("userEmail");
                sessionStorage.removeItem("userEmailExpiry");
                toast.error(`Reset password session expired. Please try again`);
                setStep(1);
            }

            const credentials = {
                email: email,
                password: data.password,
            };

            const response = await api.post(
                "/users/forgot-password/reset/",
                credentials
            );
            
            if (response.status !== 200) {
                throw new Error(response.data);
            }

            // Clear session storage
            sessionStorage.removeItem("userEmail");
            sessionStorage.removeItem("userEmailExpiry");

            toast.success("Password reset successfully!");
            navigate("/login");
            reset();
        } catch (error) {
            console.log(error);
            if (error.response?.data) {
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error(error.message || "Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="space-y-6">
            <p className="text-gray-400 mb-6">
                Create a new password for your account
            </p>
            <form className="space-y-6">
                <div>
                    <InputField
                        type="password"
                        placeholder="New password"
                        register={{
                            ...register("password", {
                                required: "Password is required",
                                minLength: {
                                    value: 8,
                                    message:
                                        "Password must be at least 8 characters",
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
                    {errors.password && (
                        <span className="text-sm text-red-500">
                            {errors.password.message}
                        </span>
                    )}
                </div>

                <div>
                    <InputField
                        type="password"
                        placeholder="Confirm new password"
                        register={{
                            ...register("confirmPassword", {
                                required: "Confirm password is required",
                                validate: (value) =>
                                    value === password ||
                                    "Passwords do not match",
                            }),
                        }}
                    />
                    {errors.confirmPassword && (
                        <span className="text-sm text-red-500">
                            {errors.confirmPassword.message}
                        </span>
                    )}
                </div>

                <p className="text-gray-400 mb-4">
                    Time remaining: {formatTimeMinSec(timer)}
                </p>

                <div className="w-full flex justify-center">
                    <button
                        onClick={handleSubmit(onSubmit)}
                        className="px-16 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                        Reset Password
                    </button>
                </div>

                <p className="text-center text-gray-400">
                    Back to{" "}
                    <Link to="/login">
                        <span className="text-blue-500 hover:text-blue-400">
                            Login
                        </span>
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default ForgotPassword;
