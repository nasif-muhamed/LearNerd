import React from 'react'

const Pagination = ({setCurrentPage, totalPages, currentPage, prevPage, nextPage}) => {
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };


    return (
        <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2 transition-all duration-300 ease-in-out">
                {totalPages > 3 && (
                    <button
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
                        onClick={() =>
                            handlePageChange(currentPage - 1)
                        }
                        disabled={!prevPage}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 19l-7-7 7-7"
                            ></path>
                        </svg>
                    </button>
                )}

                <div className="flex gap-2">
                    {(() => {
                        const getPageNumbers = () => {
                            if (totalPages <= 3) {
                                return Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                );
                            }
                            let startPage = Math.max(
                                1,
                                currentPage - 1
                            );
                            let endPage = Math.min(
                                totalPages,
                                currentPage + 1
                            );
                            if (currentPage === 1) {
                                endPage = 3;
                            } else if (currentPage === totalPages) {
                                startPage = totalPages - 2;
                            }
                            return Array.from(
                                { length: endPage - startPage + 1 },
                                (_, i) => startPage + i
                            );
                        };
                        return getPageNumbers().map((page) => (
                            <button
                                key={page}
                                onClick={() =>
                                    handlePageChange(page)
                                }
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${
                                    currentPage === page
                                        ? "bg-blue-600 text-white scale-110"
                                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:scale-105"
                                }`}
                            >
                                {page}
                            </button>
                        ));
                    })()}
                </div>

                {totalPages > 3 && (
                    <button
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
                        onClick={() =>
                            handlePageChange(currentPage + 1)
                        }
                        disabled={!nextPage}
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5l7 7-7 7"
                            ></path>
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}

export default Pagination