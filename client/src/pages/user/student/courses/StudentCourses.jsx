import React, {useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import handleError from "../../../../utils/handleError";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import api from "../../../../services/api/axiosInterceptor";
import formatPrice from "../../../../utils/formatPrice"

const StudentCourses = () => {
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || "");
    const pageSize = 3; // Matches your backend response (9 items per page)

    console.log('search query course list:', searchQuery)
    useEffect(() => {
        const stateSearchQuery = location.state?.searchQuery;
        if (stateSearchQuery !== searchQuery) {
            setSearchQuery(stateSearchQuery);
            setCurrentPage(1)
            console.log('search query course list location state:', searchQuery)
        }
    }, [location.state, setSearchQuery]);

    const fetchCourses = async () => {
        try{
            setLoading(true)
            setError(null);
            console.log("CURRENT PAge:", currentPage, pageSize)
            const response = await api.get('courses/', {
                params: {
                    page: currentPage,
                    page_size: pageSize,
                    search: searchQuery,
                },
            })
            console.log('My Course response:', response)
            const result = response.data?.results
            setCourses(result)
            setTotalCount(response.data?.count);
            setNextPage(response.data?.next);
            setPrevPage(response.data?.previous);
        }catch (error) {
            console.log('Couses Error:', error)
            handleError(error, "Error fetching Couses")
            setError("Failed to fetch courses.");
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCourses()
    }, [currentPage, searchQuery])


    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);


    return (
        <div className="min-h-screen text-white px-6 py-6">
            {loading && <LoadingSpinner/>}
            <div className="md:container mx-auto max-w-7xl">
                <h2 className="text-2xl font-bold mb-6">Courses</h2>

                {/* Courses Grid */}
                {error ? (
                    <div className="text-red-500 text-center">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                to={`/student/courses/${course.id}`}
                                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-xl "
                            >
                                <div className="relative">
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                                <div className="p-4 flex flex-col justify-between h-40">
                                    <h3 className="text-md font-bold mb-2 truncate">
                                        {course.title}
                                    </h3>
                                    <p className="truncate mb-2 font-extralight">
                                        {course.description}
                                    </p>
                                    <div className="flex items-center mb-2">
                                        <span className="text-amber-400 font-semibold">
                                            {course.rating}
                                        </span>
                                        <div className="flex text-amber-400 ">
                                            {"★★★★★"
                                                .split("")
                                                .map((star, i) => (
                                                    <span
                                                        key={i}
                                                        className={
                                                            i <
                                                            Math.floor(
                                                                course.average_rating
                                                            )
                                                                ? "text-amber-400"
                                                                : "text-gray-400"
                                                        }
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                        </div>
                                        <span className="text-gray-400 text-xs ml-1">
                                            ({course.total_reviews} reviews)
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold">

                                            {course.subscription_amount && formatPrice(course.subscription_amount)}
                                        </p>
                                        {course.freemium && (
                                            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                                                Fremium
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
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

export default StudentCourses;
