import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import api from '../services/api/axiosInterceptor';
// import stripePromise from '../services/stripe/StripeProvider';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(stripePublishableKey);

const CheckoutForm = ({ course, id }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setPaymentError(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/student/courses/${id}/payment-success`,
        },
      });

      if (error) {
        setPaymentError(error.message);
        toast.error(error.message || "Payment failed");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentError("An unexpected error occurred. Please try again.");
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Payment Details</h4>
        <PaymentElement options={{ layout: 'tabs' }} />
        {paymentError && (
          <div className="text-red-500 text-sm mt-2">{paymentError}</div>
        )}
      </div>
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors
          ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {processing ? 'Processing...' : `Pay $${course?.subscription_amount}`}
      </button>
    </form>
  );
};

const PaymentPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseAndIntent = async () => {
      try {
        const courseRes = await api.get(`courses/${id}/`);
        setCourse(courseRes.data);

        const intentRes = await api.post(`courses/${id}/create-payment-intent/`, {
          amount: courseRes.data.subscription_amount * 100,
          course_id: id
        });
        setClientSecret(intentRes.data.clientSecret);
      } catch (err) {
        console.error("Error:", err);
        toast.error("Failed to load payment details");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndIntent();
  }, [id]);

  if (loading || !clientSecret) return <LoadingSpinner />;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px',
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-800 p-4 text-white">
          <h2 className="text-2xl font-bold">Complete Your Purchase</h2>
        </div>

        <div className="p-6">
          {/* Course Info */}
          <div className="mb-8 border-b pb-6">
            <div className="flex items-start gap-6">
              {course?.thumbnail && (
                <img src={course.thumbnail} alt={course.title} className="w-48 h-32 object-cover rounded-lg" />
              )}
              <div>
                <h3 className="text-xl font-semibold mb-2">{course?.title}</h3>
                <p className="text-gray-600 mb-4">{course?.short_description}</p>
                <div className="flex items-center gap-4">
                  <div className="text-gray-700">
                    <span className="font-bold text-xl">${course?.subscription_amount}</span>
                    <span className="text-sm text-gray-500"> / month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-3">Subscription Benefits:</h4>
            <ul className="space-y-2">
              {course?.video_session && (
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span><span>{course.video_session} video sessions</span></li>
              )}
              {course?.chat_upto && (
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span><span>Chat support for {course.chat_upto} days</span></li>
              )}
              {course?.safe_period && (
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span><span>{course.safe_period}-day money-back guarantee</span></li>
              )}
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span><span>Full access to all course materials</span></li>
            </ul>
          </div>

          {/* Stripe Elements Form */}
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm course={course} id={id} />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
