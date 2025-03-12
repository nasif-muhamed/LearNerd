import { useState } from 'react';
import { Link } from 'react-router-dom'
import Studs from '../../../assets/user-auth/studs-register.png';
import StudsOtp from "../../../assets/user-auth/studs-otp.webp";
import RegisterForm from '../../../components/user/common/auth/RegisterForm';
import OTPForm from '../../../components/user/common/auth/OTPForm';
import LoadingSpinner from '../../../components/ui/LoadingSpinner'


const Register = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    return (
        <>
            {/* Show spinner if loading */}
            {loading && <LoadingSpinner />}  

            {step === 1 ? (

                <>
                    {/* Left Side - Illustration */}
                    <div className="w-full md:w-1/2 max-w-xl md:block hidden">
                        <div className="relative">
                            <img
                                src={Studs}
                                alt="Learning Illustration"
                                className="w-full h-auto rounded-lg"
                            />
                            {/* Decorative elements */}
                            <div className="absolute -top-4 -left-4 w-20 h-20 bg-blue-500/20 rounded-full"></div>
                            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-500/20 rounded-full"></div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="w-full md:w-1/2 max-w-md">
                        <div className="px-8 rounded-xl">
                            <h2 className="text-2xl text-white font-bold mb-4">Create a new account</h2>
                            
                            {/* Register Form */}
                            <RegisterForm setStep={setStep} setLoading={setLoading} />

                            {/* Login Link */}
                            <p className="mt-4 text-center text-gray-400">
                                Already have an account?{' '}
                                <Link to="/login">
                                    <span className="text-blue-500 hover:text-blue-400">
                                        Login
                                    </span>
                                </Link>
                            </p>
                        </div>
                    </div>
                </>

            ) : (

                <div className="flex flex-col items-center justify-center  bg-gray-900 text-white px-4">
                    <h1 className="text-2xl font-semibold mb-4">Create a new account</h1>
                    <OTPForm setStep={setStep} setLoading={setLoading} />
                    <img src={StudsOtp} alt="Placeholder" className="mt-6 w-64 md:block hidden" />
                </div>

            )}
    </>
    )
}

export default Register
