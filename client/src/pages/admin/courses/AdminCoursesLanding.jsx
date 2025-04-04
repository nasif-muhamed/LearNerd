import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpenText, ShieldCheck, ShieldBan, ChevronRight } from "lucide-react";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import api from "../../../services/api/axiosInterceptor";

const AdminCoursesLanding = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const pageSize = 3; // Matches your backend response (3 items per page)

    // Sample course data
    const sampleCourses = [
        {
            id: 1,
            title: "Complete web development course",
            instructor: "Robert Chambers",
            rating: 4.7,
            reviewCount: 10560,
            price: "$19.99",
            image: "https://via.placeholder.com/150/FF8C00/FFFFFF"
        },
        {
            id: 2,
            title: "React - Complete Developer Course with Hands-On Projects",
            instructor: "Technical Writing, React Digital Media",
            rating: 4.3,
            reviewCount: 265,
            price: "$59.99",
            image: "https://via.placeholder.com/150/00CED1/FFFFFF"
        },
        {
            id: 3,
            title: "React Redux Ultimate - State Management | w/ TypeScript, MERN",
            instructor: "Jon Harman",
            rating: 4.8,
            reviewCount: 537,
            price: "$79.99",
            image: "https://via.placeholder.com/150/8A2BE2/FFFFFF"
        }
    ];

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`courses/categories`, {
                params: {
                    page_size: pageSize,
                },
            });
            console.log(response);
            setCategories(response.data.results);
        } catch (err) {
            console.log("err:", err);
            setError("Failed to fetch categories.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Function to handle "Show More" navigation
    const handleShowMoreCategories = () => {
        navigate("/admin/courses/categories");
    };

    const handleShowMoreCourses = () => {
        navigate("/admin/courses/list");
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen p-6">
            {loading && <LoadingSpinner />}

            <div className="max-w-6xl mx-auto space-y-12">
                {/* Categories Section */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Categories</h2>
                        <button 
                            onClick={handleShowMoreCategories}
                            className="flex items-center text-blue-500 hover:text-blue-400 transition-colors"
                        >
                            Show more
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>

                    {error ? (
                        <div className="text-red-500 text-center">{error}</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="flex items-center hover:bg-gray-800 rounded-lg p-4 cursor-pointer overflow-hidden transition-all duration-300 border border-gray-700"
                                    onClick={() =>
                                        navigate(`/student/study-room/categories/${cat.id}`)
                                    }
                                >
                                    <div className="w-16 h-16 overflow-hidden mr-4 bg-slate-800 border-2 border-slate-700 rounded-md">
                                        {cat.image ? (
                                            <img
                                                src={cat.image}
                                                alt={cat.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BookOpenText className="w-full h-full p-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex h-full flex-col items-start">
                                        <h3 className="font-bold text-lg flex items-center mt-0">
                                            {cat.title} 
                                             
                                            <span className="ml-2">
                                            {cat.is_active ?
                                                <ShieldCheck className="text-green-700 w-4 h-4" />
                                                :
                                                <ShieldBan className="text-red-700 w-4 h-4" />
                                            }
                                            </span>
                                            
                                        </h3>
                                        <p className="text-sm text-gray-400 truncate">
                                            {cat.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Courses Section */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Popular Courses</h2>
                        <button 
                            onClick={handleShowMoreCourses}
                            className="flex items-center text-blue-500 hover:text-blue-400 transition-colors"
                        >
                            Show more
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sampleCourses.map((course) => (
                            <div
                                key={course.id}
                                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-300"
                            >
                                <div className="h-40 overflow-hidden relative">
                                    <img
                                        src={'https://img.freepik.com/free-psd/e-learning-template-design_23-2151081798.jpg'}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg line-clamp-2 h-14">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">{course.instructor}</p>
                                    <div className="flex items-center mt-2">
                                        <span className="text-yellow-500">{course.rating}</span>
                                        <div className="flex items-center ml-2">
                                            {[...Array(5)].map((_, i) => (
                                                <svg 
                                                    key={i}
                                                    className={`w-4 h-4 ${i < Math.floor(course.rating) ? 'text-yellow-500' : 'text-gray-600'}`} 
                                                    fill="currentColor" 
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <span className="text-gray-400 text-sm ml-2">({course.reviewCount.toLocaleString()})</span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="font-bold text-lg">{course.price}</span>
                                        <button 
                                            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm transition-colors"
                                            onClick={() => navigate(`/student/study-room/courses/${course.id}`)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminCoursesLanding;