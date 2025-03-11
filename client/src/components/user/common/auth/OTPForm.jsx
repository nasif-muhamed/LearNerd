import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../../../services/api/axiosInterceptor';
import { formatTimeMinSec } from '../../../../utils/formatTime'

const OTPForm = ({ setStep, setLoading }) => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(60); // 60 seconds = 1 minute
    const inputRefs = useRef([]);
    const navigate = useNavigate();

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
    }, [timer, setStep]);

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
        setLoading(true); // Show spinner
        try {
            const otpValue = otp.join("");
            const email = sessionStorage.getItem("userEmail");
            const emailExpiry = sessionStorage.getItem("userEmailExpiry");
            if (!otpValue && otpValue.length < 6){
                toast.error(`OTP is required`);
                return
            }

            if (email && Date.now() < parseInt(emailExpiry)) {
                const credentials = {
                    email: email,
                    otp: otpValue,
                };
                const response = await api.post("/users/register/verify-otp/", credentials);
                if (response.status !== 201) {
                    console.log(response.status, response.data);
                    throw new Error(response.data);
                }
                sessionStorage.removeItem("userEmail");
                sessionStorage.removeItem("userEmailExpiry");
                toast.success(`OTP verified and User registered successfully`);
                navigate("/login");
            } else {
                sessionStorage.removeItem("userEmail");
                sessionStorage.removeItem("userEmailExpiry");
                toast.error(`OTP session Expired. Please start registration again`);
                setStep(1);
            }
        } catch (error) {
            console.log(error);
            console.log('message:', error.message);
            console.log('data:', error.response?.data);
            if (error.response?.data) {
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error(error.message || 'Something went wrong');
            }
        } finally {
            setLoading(false); // Hide spinner
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
                    flow: 'register'
                };
                const response = await api.post("/users/resend-otp/", credentials);
                console.log('resend response', response);
                if (response.status !== 200) {
                    console.log(response.status, response.data);
                    throw new Error(response.data);
                }
                sessionStorage.setItem("userEmailExpiry", (Date.now() + 180000).toString()); // Store expiration timestamp (3 minutes)
                toast.success(`New OTP sent successfully`);
                setTimer(60); // Reset timer to 1 minute on resend
                setOtp(["", "", "", "", "", ""]); // Clear OTP fields
            } else {
                sessionStorage.removeItem("userEmail");
                sessionStorage.removeItem("userEmailExpiry");
                toast.error(`OTP session Expired. Please start registration again`);
                setStep(1);
            }
        } catch (error) {
            console.log(error);
            console.log('message:', error.message);
            console.log('data:', error.response?.data);
            if (error.response?.data) {
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error(error.message || 'Something went wrong');
            }
            // if (error.response.data.code == 'otp_session_expired'){
            //     setStep(1)
            //     toast.error(`OTP session Expired. Please start registration again`);
            // }
        } finally {
            setLoading(false); // Hide spinner
        }
    };

    return (
        <div className="flex flex-col items-center bg-gray-800 p-6 rounded-lg shadow-lg w-80 md:w-full max-w-md">
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
            <p className="text-gray-400 mb-4">Time remaining: {formatTimeMinSec(timer)}</p>
            <button onClick={handleVerifyOTP} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg mt-4">
                Verify
            </button>
            <p onClick={handleResendOTP} className="mt-3 text-sm text-gray-400 cursor-pointer hover:underline">
                Resend OTP
            </p>
        </div>
    );
};

export default OTPForm