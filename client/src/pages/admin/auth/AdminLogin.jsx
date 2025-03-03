import { useState } from 'react'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import AdminLoginForm from '../../../components/admin/auth/AdminLoginForm';
import AdminOTPForm from '../../../components/admin/auth/AdminOTPForm';

const Login = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    return (
        <div className="min-h-screen bg-gray-900 flex justify-center items-center">

            {/* Show spinner if loading */}
            {loading && <LoadingSpinner />}

            {step == 1 ? (
                <>
                    {/* Login Form Section */}
                    <AdminLoginForm setLoading={setLoading} setStep={setStep} />
                </>
            ):(
                <>
                    {/* Login OTP Section */}
                    <AdminOTPForm setLoading={setLoading} setStep={setStep} />
                </>
            )}
        </div>
    );
};

export default Login
