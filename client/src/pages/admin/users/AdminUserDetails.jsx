import React, { useEffect, useState } from "react";
import { Star, Flag } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import api from "../../../services/api/axiosInterceptor";
import { toast } from "sonner";
import UserProfile from "../../../components/admin/users/UserProfile";
import handleError from "../../../utils/handleError";
import formatPrice from "../../../utils/formatPrice";

const AdminUserDetails = () => {
    const { id } = useParams();
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userCourses, setUserCourses] = useState(null);
    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get(`courses/admin/user/${id}/courses/`);
            console.log("User response:", response.data);
            const data = response.data;
            setUserCourses(data);
        } catch (err) {
            console.log("err:", err);
            toast.error("Failed to fetch user data.");
            handleError(err, "Failed to fetch user data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userCourses) {
            fetchCourses();
        }
    }, []);

    const enrolledCourses = [
        {
            title: "Complete web development course",
            instructor: "John Chandler",
            price: 3999,
            image: "/api/placeholder/400/250?text=Web+Dev",
        },
        {
            title: "React - Complete Developer Course with Hands-On Projects",
            instructor: "Digital Media",
            price: 2999,
            image: "/api/placeholder/400/250?text=React",
        },
        {
            title: "React Redux Ultimate - State Management",
            instructor: "Types Info",
            price: 2999,
            image: "/api/placeholder/400/250?text=Redux",
        },
    ];

    const reviews = [
        {
            text: "Thanks! Rohan Chaudhary for C++II. It was partly hard for me to even touch it but your explanation made things clear. I understood everything. Thank you so much!!!",
        },
        {
            text: "Awesome, I loved his teaching style and the videos are very impactful.",
        },
    ];

    const reports = [
        {
            text: "The tutor provided incorrect information about CSS grid projects. This led to confusion during my project implementation.",
        },
        {
            text: "The tutor shared a personal story that seemed unrelated to the topic and wasted a significant amount of time.",
        },
    ];

    return (
        <div className="bg-gray-900 text-white min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                {/* Profile Header
                <div className="flex items-center mb-8">
                    <div className="rounded-full w-20 h-20 md:w-32 md:h-32 overflow-hidden">
                        <img
                            src={BASE_URL + user?.image}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="ml-6">
                        <h1 className="md:text-2xl font-bold md:mb-2">{user?.first_name + " " + user?.last_name}</h1>
                        <p className="text-gray-400 mb-1.5 md:mb-4">{user?.email}</p>
                        <div className="flex space-x-4">
                            <button className="bg-red-500 text-white text-xs px-2 py-1 md:text-base md:px-4 md:py-2 rounded hover:bg-red-600">
                                Block Student
                            </button>
                            <button className="bg-blue-500 text-white text-xs px-2 py-1 md:text-base md:px-4 md:py-2 rounded hover:bg-blue-600">
                                Chat Student
                            </button>
                        </div>
                    </div>
                </div> */}
                <UserProfile id={id} user={user} setUser={setUser} api={api} toast={toast} BASE_URL={BASE_URL} />

                {/* uploaded Courses */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        Uploaded Courses({userCourses?.uploaded_courses?.length})
                    </h2>
                    {userCourses?.uploaded_courses?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {userCourses?.uploaded_courses.map((course) => (
                                <div
                                    key={course.id}
                                    className={`rounded-lg overflow-hidden shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-xl ${!course.is_available ? "opacity-60 bg-gray-700" : "bg-gray-800"}`}
                                >
                                    <div className="relative group">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        {/* Hover overlay with buttons */}
                                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-opacity duration-300">
                                            <Link 
                                                to={'/tutor/my-courses/' + course.id}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                            >
                                                Update
                                            </Link>
                                            <Link 
                                                to={'/tutor/my-courses/preview/' + course.id}
                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                            >
                                                Preview
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-md font-bold mb-2 line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="h-12 truncate text-wrap mb-2 font-extralight">
                                            {course.description}
                                        </p>
                                        <div className="flex justify-between mb-2">
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

                                            <div>
                                                {!course.is_available && (
                                                    <span className="border border-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                        Deactivated
                                                    </span>
                                                )}
                                            </div>
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
                                </div>
                            ))}
                        </div>
                        ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-200">No Courses Uploaded Yet</h3>
                            <p className="text-gray-400 mb-4">Looks like there are no courses available. Start sharing knowledge now!</p>
                        </div>
                    )}
                </div>

                {/* Enrolled Courses */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        Enrolled Courses({userCourses?.enrolled_courses?.length})
                    </h2>
                    {userCourses?.enrolled_courses?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {userCourses?.enrolled_courses.map((course) => (
                                <div
                                    key={course.id}
                                    className={`rounded-lg overflow-hidden shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-xl ${!course.is_available ? "opacity-60 bg-gray-700" : "bg-gray-800"}`}
                                >
                                    <div className="relative group">
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        {/* Hover overlay with buttons */}
                                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-opacity duration-300">
                                            <Link 
                                                to={'/tutor/my-courses/' + course.id}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                            >
                                                Update
                                            </Link>
                                            <Link 
                                                to={'/tutor/my-courses/preview/' + course.id}
                                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                            >
                                                Preview
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-md font-bold mb-2 line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="h-12 truncate text-wrap mb-2 font-extralight">
                                            {course.description}
                                        </p>
                                        <div className="flex justify-between mb-2">
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

                                            <div>
                                                {!course.is_available && (
                                                    <span className="border border-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                        Deactivated
                                                    </span>
                                                )}
                                            </div>
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
                                </div>
                            ))}
                        </div>
                        ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-200">No Courses Enrolled Yet</h3>
                            <p className="text-gray-400 mb-4">Looks like there are no courses available. Start sharing knowledge now!</p>
                        </div>
                    )}
                </div>

                {/* Reviews and Ratings */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                        <Star className="mr-2 text-yellow-500" />
                        Reviews and Ratings Given
                    </h2>
                    <div className="space-y-4">
                        {reviews.map((review, index) => (
                            <div
                                key={index}
                                className="bg-gray-800 p-4 rounded-lg flex items-start"
                            >
                                <img
                                    src={BASE_URL + user?.image}
                                    alt="Reviewer"
                                    className="rounded-full w-12 h-12 mr-4 hidden md:block"
                                />
                                <div>
                                    <h3 className="font-bold">Rohit Das</h3>
                                    <p className="text-gray-400">
                                        {review.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reports */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center">
                        <Flag className="mr-2 text-red-500" /> Reports From
                        Rohit
                    </h2>
                    <div className="space-y-4">
                        {reports.map((report, index) => (
                            <div
                                key={index}
                                className="bg-gray-800 p-4 rounded-lg flex items-start"
                            >
                                <img
                                    src={BASE_URL + user?.image}
                                    alt="Reporter"
                                    className="rounded-full w-12 h-12 mr-4 hidden md:block"
                                />
                                <div>
                                    <h3 className="font-bold">Rohit Das</h3>
                                    <p className="text-gray-400">
                                        {report.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserDetails;
