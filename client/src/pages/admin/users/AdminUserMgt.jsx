import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import api from "../../../services/api/axiosInterceptor";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

const AdminUserMgt = () => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const navigate = useNavigate();
    const [userType, setUserType] = useState("students");
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const pageSize = 9; // Matches your backend response (3 items per page)

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get("admin/users/", {
                params: {
                    page: currentPage,
                    page_size: pageSize,
                    search: searchQuery,
                    is_tutor: userType === "tutors" ? true : false,
                },
            });
            console.log(response);
            setUsers(response.data.results);
            setTotalCount(response.data.count);
            setNextPage(response.data.next);
            setPrevPage(response.data.previous);
        } catch (err) {
            console.log("err:", err);
            setError("Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    }, [userType, currentPage, searchQuery]);

    // Handle tab change
    const handleTabChange = (type) => {
        setUserType(type);
        setCurrentPage(1);
        setSearchQuery("");
    };

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
        fetchUsers();
    }, [fetchUsers]);

    return (
        <div className="bg-gray-900 text-white min-h-screen p-6">
            {loading && <LoadingSpinner/>}
            <div className="max-w-6xl mx-auto">
                {/* Search and Tabs */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
                        <input
                            type="text"
                            placeholder="Search users..."
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

                    <div className="flex bg-gray-800 rounded-lg overflow-hidden">
                        <button
                            className={`px-6 py-2 ${
                                userType === "students"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-800 text-gray-300"
                            }`}
                            onClick={() => handleTabChange("students")}
                        >
                            Students
                        </button>
                        <button
                            className={`px-6 py-2 ${
                                userType === "tutors"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-800 text-gray-300"
                            }`}
                            onClick={() => handleTabChange("tutors")}
                        >
                            Tutors
                        </button>
                    </div>
                </div>

                {/* User Grid */}
                {error ? (
                    <div className="text-red-500 text-center">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center hover:bg-gray-800 rounded-lg p-4 cursor-pointer w-full gap-4"
                                onClick={() =>
                                    navigate(`/admin/users/${user.id}`)
                                }
                            >
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700">
                                    {user.image ? (
                                        <img
                                            src={BASE_URL + user.image}
                                            alt={
                                                `${user.first_name || ""} ${
                                                    user.last_name || ""
                                                }`.trim() || user.email
                                            }
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <UserRound className="w-full h-full p-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 truncate">
                                    <h3 className="font-bold text-lg truncate">
                                        {user.first_name
                                            ? `${user.first_name || ""} ${
                                                  user.last_name || ""
                                              }`.trim()
                                            : user.email}
                                    </h3>
                                    <p className="text-sm text-gray-400 truncate">
                                        Created:{" "}
                                        {new Date(
                                            user.created_at
                                        ).toLocaleDateString()}
                                    </p>
                                    {/* <p className="text-sm text-gray-400">
                                        {user.is_tutor ? "Tutor" : "Student"}
                                    </p> */}
                                    {user.is_active ? (
                                        <button
                                            type="button"
                                            className="text-white border border-green-700 font-medium rounded-lg text-sm px-2.5 py-1 text-center mt-2"
                                        >
                                            Active
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="text-white border border-red-700 font-medium rounded-lg text-sm px-2.5 py-1 text-center mt-2"
                                        >
                                            Blocked
                                        </button>
                                    )}
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

export default AdminUserMgt;
