import { useState, useEffect, useCallback, use } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import api from "../../../../services/api/axiosInterceptor";
import handleError from "../../../../utils/handleError";

const StudyRoomLanding = () => {
    const navigate = useNavigate();
    const id = useSelector((state) => state.auth?.user?.id);
    console.log('id', id)
    const [categories, setCategories] = useState([]);
    const [myCourses, setMyCourses] = useState([])
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

    // const fetchCategories = useCallback(async () => {
    //     setLoading(true);
    //     setError(null);

    //     try {
    //         const response = await api.get(`courses/categories`, {
    //             params: {
    //                 page_size: pageSize,
    //             },
    //         });
    //         console.log(response);
    //         setCategories(response.data.results);
    //     } catch (err) {
    //         console.log("err:", err);
    //         setError("Failed to fetch categories.");
    //     } finally {
    //         setLoading(false);
    //     }
    // }, []);

    // useEffect(() => {
    //     fetchCategories();
    // }, [fetchCategories]);

    // // Function to handle "Show More" navigation
    // const handleShowMoreCategories = () => {
    //     navigate("/admin/courses/categories");
    // };

    // const handleShowMoreCourses = () => {
    //     navigate("/admin/courses/list");
    // };

    const fetchMyCourses = async () => {
        try{
            setLoading(true)
            const response = await api.get(`courses/student/${id}/my-courses`)
            console.log('My Course response:', response)
            const result = response.data
            setMyCourses(result)
        }catch (error) {
            console.log('Mycourse Error:', error)
            handleError(error, "Error fetching uploaded courses")
        }finally{
            setLoading(false)
        }
    }
    
    useEffect(() => {  
        fetchMyCourses()
    }, [])

    return (
        <div className="bg-gray-900 text-white min-h-screen p-6">
            {loading && <LoadingSpinner />}

            <div className="max-w-6xl mx-auto space-y-12">
                {/* Categories Section */}
                {/* <section>
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
                </section> */}

                {/* Courses Section */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">My Courses</h2>
                        <Link
                            to={'/student/courses'}
                            className="flex items-center text-blue-500 hover:text-blue-400 transition-colors"
                        >
                            <span>Explore Courses</span>
                            <ChevronRight className="w-4 h-4 ml-1 font-extrabold" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {myCourses?.length > 0 ?
                            myCourses.map((purchase, idx) => (
                                <Link
                                    key={idx}
                                    to={'/student/study-room/my-course/' + purchase?.course_id}
                                    className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-300"
                                >
                                    <div className="h-40 overflow-hidden relative">
                                        <img
                                            src={purchase?.course_thumbnail}
                                            alt={purchase?.course_title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg line-clamp-2 h-14">
                                            {purchase?.course_title}
                                        </h3>
                                        <div className=" mt-2">
                                            <div className="mb-2">
                                                <div className="relative h-2 bg-gray-700 rounded-full">
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                                                        style={{
                                                            width: `${(purchase?.completed_section_items/purchase?.course_total_section_items)*100}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <p className="text-sm font-extralight text-gray-400 text-end">
                                                {purchase?.completed_section_items/purchase?.course_total_section_items ? `${((purchase?.completed_section_items/purchase?.course_total_section_items)*100).toFixed(0)}% completed` : 'Not started yet'}
                                            </p>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            {purchase?.purchase_type === 'freemium' ?
                                                (<span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                                                    Fremium
                                                </span>)
                                                :
                                                (<span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                                    Subscription
                                                </span>)    
                                            }
                                            <button 
                                                className={`text-white py-1 px-3 rounded text-sm transition-colors ${purchase?.completed_section_items === 0 ? 'bg-green-500 hover:bg-green-700' : purchase?.completed_section_items === purchase?.course_total_section_items ? 'bg-black' : 'bg-blue-500 hover:bg-blue-700'}`}
                                                onClick={() => navigate(`/student/study-room/my-course/${purchase?.course_id}`)}
                                                disabled={purchase?.completed_section_items === purchase?.course_total_section_items}
                                            >
                                                {purchase?.completed_section_items === 0 ? 'Start' : purchase?.completed_section_items === purchase?.course_total_section_items ? 'Finished' : 'Complete'} Course
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))

                            : (
                                <div className="flex justify-center items-center h-64 text-gray-500">
                                    Not enrolled to any course .
                                </div>
                            )
                        }
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StudyRoomLanding;