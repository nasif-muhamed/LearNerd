import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    toast.success('Payment successful! You are now enrolled.');
    setTimeout(() => {
      navigate(`/student/courses/${location.pathname.split('/')[3]}`);
    }, 3000);
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
        <p>Redirecting to your course...</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;