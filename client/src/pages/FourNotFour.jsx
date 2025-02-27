import { useNavigate } from "react-router-dom";

const FourNotFour = () => {
    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate(-1); // Goes back to the previous page in history
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl flex flex-col items-center gap-8">
                {/* Text Section */}
                <div className="w-full text-center flex flex-col justify-center items-center ">
                    {/* Creative "404" Illustration */}
                    <div className="relative mb-4">
                        <svg
                            width="200"
                            height="200"
                            viewBox="0 0 200 200"
                            className="text-blue-500"
                        >
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="10"
                                className="opacity-20"
                            />
                            <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dy=".3em"
                                className="text-6xl font-bold fill-current"
                            >
                                404
                            </text>
                        </svg>

                        {/* Decorative Elements */}
                        <div className="absolute -top-2 -right-2 w-16 h-16 bg-blue-500/20 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-0 -left-6 w-20 h-20 bg-green-500/20 rounded-full animate-pulse delay-200"></div>
                    </div>

                    <p className="text-xl text-gray-400 mb-6">
                        Oops! Looks like you’ve wandered into the void. This
                        page doesn’t exist... yet.
                    </p>

                    <button
                        onClick={handleBackClick}
                        className="px-8 py-2 bg-gray-200 text-gray-900 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FourNotFour;
