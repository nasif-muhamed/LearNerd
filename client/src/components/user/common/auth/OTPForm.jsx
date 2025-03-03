import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'
import api from '../../../../services/api/axiosInterceptor';

const OTPForm = ({setStep, setLoading}) => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const navigate = useNavigate();

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
        setLoading(true);  // Show spinner
        try {
            const otpValue = otp.join("");
            const email = sessionStorage.getItem("userEmail");
            const emailExpiry = sessionStorage.getItem("userEmailExpiry");
            if (otpValue && email && Date.now() < parseInt(emailExpiry)) {
                const credentials = {
                    email: email,
                    otp: otpValue,
                }
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
                toast.error(`OTP Expired`);
                setStep(1)
            }

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
            setLoading(false);  // Hide spinner
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
            <button onClick={handleVerifyOTP} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg mt-4">Verify</button>
            <p className="mt-3 text-sm text-gray-400 cursor-pointer hover:underline">Resend OTP</p>
        </div>
    )
}

export default OTPForm