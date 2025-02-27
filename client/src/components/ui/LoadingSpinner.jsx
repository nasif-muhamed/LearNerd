const LoadingSpinner = () => {
    return (
        // <div className="flex justify-center items-center h-screen w-screen">
        //     <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        // </div>
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );
};

export default LoadingSpinner;
