import { useState, useRef } from "react";
import Studs from "../assets/user-auth/studs-otp.webp";

export default function OTPVerification() {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);

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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
            <h1 className="text-2xl font-semibold mb-4">Create a new account</h1>
            <div className="flex flex-col items-center bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                <div className="flex space-x-4 my-4">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 text-center text-xl bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                        />
                    ))}
                </div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg mt-4">Verify</button>
                <p className="mt-3 text-sm text-gray-400 cursor-pointer hover:underline">Resend OTP</p>
            </div>
            <img src={Studs} alt="Placeholder" className="mt-6 w-64" />
        </div>
    );
}
