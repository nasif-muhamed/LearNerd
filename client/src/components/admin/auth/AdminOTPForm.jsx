import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { login, setUser } from '../../../redux/features/authSlice'
import api from '../../../services/api/axiosInterceptor';
import adminUserApi from '../../../services/api/adminUserAxiosInterceptor';

const AdminOTPForm = ({setLoading, setStep}) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({ mode: "onBlur" });
    const [otp, setOtp] = useState(["", "", "", ""]);
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleChange = (index, value) => {
        if (isNaN(value) || value === " ") return;
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

    const handleVerifyOTP = async (data) => {
        setLoading(true);  // Show spinner
        try {
            const otpValue = otp.join("");
            const username = sessionStorage.getItem("adminUsername");
            const usernameExpiry = sessionStorage.getItem("adminUsernameExpiry");
            
            if (otpValue.length !== 4) {
                toast.error('OTP required')
            }
            else if (otpValue && username && Date.now() < parseInt(usernameExpiry)) {
                const credentials = {
                    username: username,
                    otp: otpValue,
                    password: data.pass,
                }
                const response = await api.post("admin/login/verify-otp/", credentials);
                console.log('resoponse admin login:', response)
                if (response.status !== 200) {
                    console.log(response.status, response.data);
                    throw new Error(response.data);
                }
                sessionStorage.removeItem("adminUsername");
                sessionStorage.removeItem("adminUsernameExpiry");
                // dispatch(adminLogin({'adminAccessToken':response.data.access, 'adminRefreshToken':response.data.refresh}));
                const user_response = await adminUserApi.get('/users/user/');
                console.log('user_response:', user_response)
                dispatch(login({'access':response.data.access, 'refresh':response.data.refresh, 'role':'admin', 'userAccess': response.data.user_access, 'userRefresh': response.data.user_refresh}));
                dispatch(setUser(user_response.data));
                toast.success('Login successfull')
                reset()
                navigate("/admin/dashboard");
            } else {
                sessionStorage.removeItem("adminUsername");
                sessionStorage.removeItem("adminUsernameExpiry");
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
        <div className="flex flex-col items-center p-6 w-80 md:w-full max-w-md">
            <div className="w-64 bg-gray-800 flex justify-between p-4 rounded-lg my-6">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        maxLength="1"
                        value={digit}
                        required
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-10 h-10 md:w-12 md:h-12 text-center text-white text-xl bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                ))}
            </div>
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
                className='w-64 p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none'
            />
            {errors.pass && <span className="text-sm text-red-500">{errors.pass.message}</span>}

            <button onClick={handleSubmit(handleVerifyOTP)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg mt-6">Verify</button>
        </div>
    )
}

export default AdminOTPForm