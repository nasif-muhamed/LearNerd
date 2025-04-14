import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    toast.error('Payment cancelled.');
    setTimeout(() => {
      navigate(`/student/courses/${location.pathname.split('/')[3]}`);
    }, 3000);
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
        <p>Redirecting back to course...</p>
      </div>
    </div>
  );
};

export default PaymentCancel;