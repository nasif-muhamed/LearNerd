// import { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import { toast } from 'sonner';
// import { loadStripe } from '@stripe/stripe-js';
// import api from '../../../../../services/api/axiosInterceptor';
// import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
// import handleError from '../../../../../utils/handleError'

// const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
// const stripePromise = loadStripe(stripePublishableKey);

// // Checkout form component that handles Stripe payment submission
// const CheckoutForm = ({ course, id }) => {
//   const stripe = useStripe();
//   const elements = useElements();

//   const [processing, setProcessing] = useState(false);
//   const [paymentError, setPaymentError] = useState(null);

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     if (!stripe || !elements) return;

//     setProcessing(true);
//     setPaymentError(null);

//     try {
//       const { error } = await stripe.confirmPayment({
//         elements,
//         confirmParams: {
//           return_url: `${window.location.origin}/student/courses/${id}/payment-success`,
//         },
//       });

//       if (error) {
//         setPaymentError(error.message);
//         toast.error(error.message || "Payment failed");
//       }
//     } catch (err) {
//       console.error("Payment error:", err);
//       setPaymentError("An unexpected error occurred. Please try again.");
//       toast.error("Payment failed. Please try again.");
//     } finally {
//       setProcessing(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6">
//       <div className="bg-white rounded-lg shadow-sm p-6">
//         <h4 className="text-lg font-semibold mb-4 text-gray-800">Payment Details</h4>
//         <PaymentElement options={{ layout: 'tabs' }} />
//         {paymentError && (
//           <div className="text-red-500 text-sm mt-3 p-2 bg-red-50 rounded-md">{paymentError}</div>
//         )}
//       </div>
      
//       <button
//         type="submit"
//         disabled={!stripe || processing}
//         className={`w-full py-4 px-6 rounded-lg text-white font-medium text-base transition-all shadow-sm
//           ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}
//       >
//         {processing ? (
//           <span className="flex items-center justify-center">
//             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//             </svg>
//             Processing...
//           </span>
//         ) : (
//           `Complete Payment - $${course?.subscription_amount}`
//         )}
//       </button>
//     </form>
//   );
// };

// // Course info component showing details about the course
// const CourseInfo = ({ course }) => {
//   return (
//     <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
//       {/* Course header */}
//       <div className="flex flex-col md:flex-row gap-6">
//         {course?.thumbnail && (
//           <div className="w-full md:w-1/3 flex-shrink-0">
//             <img src={course.thumbnail} alt={course.title} className="w-full h-48 md:h-40 object-cover rounded-lg shadow-sm" />
//           </div>
//         )}
//         <div className="flex-grow">
//           <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{course?.title}</h3>
//           <p className="text-gray-600 mb-4">{course?.short_description}</p>
//           <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-md font-medium">
//             ${course?.subscription_amount}
//           </div>
//         </div>
//       </div>
      
//       {/* Benefits section */}
//       <div className="pt-4 border-t border-gray-100">
//         <h4 className="text-lg font-semibold mb-4 text-gray-800">What You'll Get:</h4>
//         <ul className="space-y-3">
//           {course?.video_session && (
//             <li className="flex items-center gap-3">
//               <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">✓</span>
//               <span className="text-gray-700">{course.video_session} video sessions</span>
//             </li>
//           )}
//           {course?.chat_upto && (
//             <li className="flex items-center gap-3">
//               <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">✓</span>
//               <span className="text-gray-700">Chat support for {course.chat_upto} days</span>
//             </li>
//           )}
//           {course?.safe_period && (
//             <li className="flex items-center gap-3">
//               <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">✓</span>
//               <span className="text-gray-700">{course.safe_period}-day money-back guarantee</span>
//             </li>
//           )}
//           <li className="flex items-center gap-3">
//             <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">✓</span>
//             <span className="text-gray-700">Full access to all course materials</span>
//           </li>
//           <li className="flex items-center gap-3">
//             <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">✓</span>
//             <span className="text-gray-700">Certificate of completion</span>
//           </li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// // Main payment page component
// const PaymentPage = () => {
//   const { id } = useParams();
//   const [course, setCourse] = useState(null);
//   const [clientSecret, setClientSecret] = useState('');
//   const [loading, setLoading] = useState(false);
  
//   const fetchCourseAndIntent = async () => {
//     try {
//       setLoading(true)
//       const courseRes = await api.get(`courses/${id}/`);
//       setCourse(courseRes.data);

//       const intentRes = await api.post(`courses/${id}/create-payment-intent/`, {
//         amount: courseRes.data.subscription_amount,
//         course_id: id
//       });
//       setClientSecret(intentRes.data.clientSecret);
//     } catch (err) {
//       console.error("Error:", err);
//       handleError(err, 'error fetching course or payment details')
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCourseAndIntent();
//   }, []);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <LoadingSpinner />
//       </div>
//     );
//   }

//   const options = {
//     clientSecret,
//     appearance: {
//       theme: 'stripe',
//       variables: {
//         colorPrimary: '#2563eb',
//         colorBackground: '#ffffff',
//         colorText: '#1f2937',
//         colorDanger: '#dc2626',
//         fontFamily: 'Inter var, system-ui, -apple-system, sans-serif',
//         spacingUnit: '4px',
//         borderRadius: '8px',
//       },
//     },
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
//       {loading && LoadingSpinner}
//       <div className="max-w-6xl mx-auto">
//         <div className="text-center mb-8">
//           <h2 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h2>
//           <p className="mt-2 text-gray-600">You're just one step away from accessing this course</p>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Left column - Course information */}
//           <div>
//             <CourseInfo course={course} />
//           </div>
          
//           {/* Right column - Payment form */}
//           {!loading && clientSecret && <div>
//             <Elements stripe={stripePromise} options={options}>
//               <CheckoutForm course={course} id={id} />
//             </Elements>
//           </div>}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentPage;

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import api from '../../../../../services/api/axiosInterceptor';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(stripePublishableKey);

// Checkout form component that handles Stripe payment submission
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-card rounded-lg shadow-md p-4">
        <h4 className="text-lg font-semibold mb-4 text-foreground">Payment Details</h4>
        <PaymentElement options={{ 
          layout: 'tabs',
          variables: {
            colorPrimary: '#5e9eff', // Match primary color of our app design pattern
            colorBackground: '#18202e', // Dark background color of our app design pattern
            colorText: '#e6edf8',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
        }} />
        {paymentError && (
          <div className="text-[#f27474] text-sm mt-3 p-2 bg-[#18202e] border border-[#f27474] rounded-md">{paymentError}</div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`btn-primary w-full py-3 ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {processing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          `Complete Payment - ₹${course?.subscription_amount}`
        )}
      </button>
    </form>
  );
};

// Course info component showing details about the course
const CourseInfo = ({ course }) => {
  return (
    <div className="bg-card rounded-lg shadow-md p-4 space-y-4">
      {/* Course header */}
      <div className="flex flex-col md:flex-row gap-4">
        {course?.thumbnail && (
          <div className="w-full md:w-1/3 flex-shrink-0">
            <img src={course.thumbnail} alt={course.title} className="w-full h-36 object-cover rounded-lg shadow-sm" />
          </div>
        )}
        <div className="flex-grow">
          <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">{course?.title}</h3>
          <p className="text-muted-foreground mb-3 text-sm">{course?.short_description}</p>
          <div className="inline-block px-3 py-1 text-secondary bg-primary bg-opacity-20 rounded-md font-medium">
          ₹{course?.subscription_amount}
          </div>
        </div>
      </div>
      
      {/* Benefits section */}
      <div className="pt-3 border-t border-border">
        <h4 className="text-md font-semibold mb-3 text-foreground">What You'll Get:</h4>
        <ul className="space-y-2">
          {course?.video_session && (
            <li className="checklist-item">
              <span className="flex-shrink-0 w-5 h-5 bg-accent bg-opacity-20 text-gray-50 rounded-full flex items-center justify-center text-xs">✓</span>
              <span className="text-muted-foreground text-sm">{course.video_session} video sessions</span>
            </li>
          )}
          {course?.chat_upto && (
            <li className="checklist-item">
              <span className="flex-shrink-0 w-5 h-5 bg-accent bg-opacity-20 text-gray-50 rounded-full flex items-center justify-center text-xs">✓</span>
              <span className="text-muted-foreground text-sm">Chat support for {course.chat_upto} days</span>
            </li>
          )}
          {course?.safe_period && (
            <li className="checklist-item">
              <span className="flex-shrink-0 w-5 h-5 bg-accent bg-opacity-20 text-gray-50 rounded-full flex items-center justify-center text-xs">✓</span>
              <span className="text-muted-foreground text-sm">{course.safe_period}-day money-back guarantee</span>
            </li>
          )}
          <li className="checklist-item">
            <span className="flex-shrink-0 w-5 h-5 bg-accent bg-opacity-20 text-gray-50 rounded-full flex items-center justify-center text-xs">✓</span>
            <span className="text-muted-foreground text-sm">Full access to all course materials</span>
          </li>
          {/* <li className="checklist-item">
            <span className="flex-shrink-0 w-5 h-5 bg-accent bg-opacity-20 text-gray-50 rounded-full flex items-center justify-center text-xs">✓</span>
            <span className="text-muted-foreground text-sm">Certificate of completion</span>
          </li> */}
        </ul>
      </div>
    </div>
  );
};

// Main payment page component
import handleError from '../../../../../utils/handleError';
const PaymentPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const intentCreatedRef = useRef(false);

  console.log('clientSecret:', clientSecret)
  const fetchCourseAndIntent = async () => {
    console.log('fetchCourseAndIntent')
    try {
      setLoading(true)
      const courseRes = await api.get(`courses/${id}/`);
      setCourse(courseRes.data);

      const intentRes = await api.post(`courses/${id}/create-payment-intent/`, {
        amount: courseRes.data.subscription_amount,
        course_id: id
      });
      setClientSecret(intentRes.data.clientSecret);
    } catch (err) {
      console.error("Error:", err);
      handleError(err, "Failed to load payment details")
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect ---------------------------')
    if (!intentCreatedRef.current) fetchCourseAndIntent();
    intentCreatedRef.current = true

  }, []);

  const options = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#5e9eff',
        colorBackground: '#18202e',
        colorText: '#e6edf8',
        colorDanger: '#f27474',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="py-6 px-4 sm:px-6 max-h-screen overflow-auto">
      {loading && <LoadingSpinner/>}
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Complete Your Purchase</h2>
          <p className="mt-1 text-muted-foreground text-sm">You're just one step away from accessing this course</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Course information */}
          {course && (
            <div>
              <CourseInfo course={course} />
            </div>
          )}
          
          {/* Right column - Payment form */}
          {clientSecret && (
            <div>
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm course={course} id={id} />
              </Elements>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;