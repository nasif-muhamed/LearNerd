import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStripe } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';

const PaymentResultPage = () => {
  const stripe = useStripe();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [status, setStatus] = useState('processing');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!stripe) {
      return;
    }
    
    // Extract the payment intent client secret from the URL query parameters
    const clientSecret = new URLSearchParams(location.search).get('payment_intent_client_secret');
    
    if (!clientSecret) {
      setStatus('failed');
      setLoading(false);
      return;
    }
    
    // Check the payment status
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case 'succeeded':
          setStatus('succeeded');
          toast.success('Payment succeeded!');
          break;
        case 'processing':
          setStatus('processing');
          toast.info('Your payment is processing.');
          break;
        case 'requires_payment_method':
          setStatus('failed');
          toast.error('Your payment was not successful, please try again.');
          break;
        default:
          setStatus('failed');
          toast.error('Something went wrong.');
          break;
      }
      setLoading(false);
    });
  }, [stripe, location.search]);
  
  const handleContinueToCourse = () => {
    navigate(`/student/study-room/my-course/${id}`);
  };
  
  const handleTryAgain = () => {
    navigate(`/student/courses/${id}/payment`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const StatusCard = () => {
    switch (status) {
      case 'succeeded':
        return (
          <div className="glass-effect rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-accent bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground text-sm">
                Thank you for your purchase. You now have full access to the course content.
              </p>
            </div>
            <button
              onClick={handleContinueToCourse}
              className="btn-primary w-full py-3"
            >
              Continue to Course
            </button>
          </div>
        );
      case 'processing':
        return (
          <div className="glass-effect rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-secondary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Payment Processing</h2>
              <p className="text-muted-foreground text-sm">
                Your payment is being processed. This may take a moment. Please don't close this page.
              </p>
            </div>
            <div className="mt-4 bg-secondary p-3 rounded-md text-sm text-secondary-foreground">
              We'll automatically redirect you once the payment is complete.
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className="glass-effect rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-destructive bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Payment Failed</h2>
              <p className="text-muted-foreground text-sm">
                Your payment was not successful. Please check your payment details and try again.
              </p>
            </div>
            <button
              onClick={handleTryAgain}
              className="btn-primary w-full py-3"
            >
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <StatusCard />
    </div>
  );
};

export default PaymentResultPage;