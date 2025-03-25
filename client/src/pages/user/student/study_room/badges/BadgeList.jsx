import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpenText, BadgeCheck } from "lucide-react";
import api from "../../../../../services/api/axiosInterceptor";
import LoadingSpinner from "../../../../../components/ui/LoadingSpinner";
import axios from "axios";

const BadgeList = () => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const navigate = useNavigate();
    const [badges, setBadges] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const pageSize = 3; // Matches your backend response (3 items per page)

    const fetchBadges = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${BASE_URL}api/v1/badges/`, {
                params: {
                    page: currentPage,
                    page_size: pageSize,
                    search: searchQuery,
                },
            });
            console.log(response);
            setBadges(response.data.results);
            setTotalCount(response.data.count);
            setNextPage(response.data.next);
            setPrevPage(response.data.previous);
        } catch (err) {
            console.log("err:", err);
            setError("Failed to fetch badges.");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery]);

    // Handle search input
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    useEffect(() => {
        fetchBadges();
    }, [fetchBadges]);

    return (
        <div className="bg-gray-900 text-white min-h-screen p-6">
            {loading && <LoadingSpinner/>}

            <div className="max-w-6xl mx-auto">
                {/* Search and Tabs */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
                        <input
                            type="text"
                            placeholder="Search badges..."
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-2 px-4 pl-10"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        <svg
                            className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            ></path>
                        </svg>
                    </div>

                </div>

                {/* Badges Grid */}
                {error ? (
                    <div className="text-red-500 text-center">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
                        {badges.map((badge) => (
                            <div
                                key={badge.id}
                                className="flex items-center hover:bg-gray-800 rounded-lg p-4 cursor-pointer overflow-hidden"
                                onClick={() =>
                                    navigate(`/student/study-room/badges/${badge.id}`)
                                }
                            >
                                <div className="w-16 h-16  overflow-hidden mr-4 bg-slate-800 border-2 border-slate-700">
                                    {badge.image ? (
                                        <img
                                            src={badge.image}
                                            alt={badge.title }
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpenText className="w-full h-full p-5" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg flex items-center justify-between w-full">
                                        {badge.title} <span className="ml-2">{badge.community && <BadgeCheck className="text-blue-700 w-4 h-4" />}</span>
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Questions:{badge.total_questions}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        To Pass:{badge.pass_mark}
                                    </p>

                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
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
                )}
            </div>
        </div>
    );
};

export default BadgeList;
