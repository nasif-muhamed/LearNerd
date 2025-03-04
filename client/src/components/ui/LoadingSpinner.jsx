const LoadingSpinner = () => {
    return (
        // <div className="flex justify-center items-center h-screen w-screen">
        //     <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        // </div>
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="w-12 h-12 border-t-2 border-b-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        // <div className="flex justify-center items-center h-64">
        //     <div className="animate-spin rounded-full h-12 w-12  border-blue-500"></div>
        // </div>

    );
};

export default LoadingSpinner;
