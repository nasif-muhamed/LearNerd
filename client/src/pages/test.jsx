import React from "react";
import "../index.css"; // Ensure Tailwind is imported properly

const AuthPage = () => {
  return (
    <div className="flex h-screen w-full bg-dark text-white">
      {/* Left Side Illustration */}
      <div className="w-1/2 flex items-center justify-center bg-gray-800">
        <img src="https://via.placeholder.com/500" alt="Placeholder" className="w-3/4" />
      </div>

      {/* Right Side Form */}
      <div className="w-1/2 flex flex-col justify-center p-10 bg-gray-900">
        <h2 className="text-3xl font-bold mb-6">Create a new account</h2>
        <RegisterForm />
        <div className="text-center my-4">OR</div>
        <SocialLogin />
        <p className="text-center mt-4">
          Already have an account? <a href="#" className="text-blue-400">Login</a>
        </p>
      </div>
    </div>
  );
};

const RegisterForm = () => {
  return (
    <form className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Email"
        className="p-3 rounded bg-gray-700 text-white"
      />
      <input
        type="password"
        placeholder="Password"
        className="p-3 rounded bg-gray-700 text-white"
      />
      <input
        type="password"
        placeholder="Confirm Password"
        className="p-3 rounded bg-gray-700 text-white"
      />
      <button className="bg-blue-500 p-3 rounded font-bold text-white">Send OTP</button>
    </form>
  );
};

const SocialLogin = () => {
  return (
    <div className="flex justify-center gap-6">
      <button className="bg-white p-3 rounded-full">
        <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/IOS_Google_icon.png" alt="Google" className="w-6 h-6" />
      </button>
      <button className="bg-white p-3 rounded-full">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="w-6 h-6" />
      </button>
      <button className="bg-white p-3 rounded-full">
        <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" className="w-6 h-6" />
      </button>
    </div>
  );
};

export default AuthPage;
