import React, { useState } from "react";
import { Star, Flag } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../../../../services/api/axiosInterceptor";
import TutorProfile from "../../../../components/user/student/tutors/TutorProfile";
import { FaLongArrowAltRight } from "react-icons/fa";

const TutorDetails = () => {
    const { id } = useParams();
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [count, setCount] = useState(0);

    console.log('tutor courses:', courses)
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
                <TutorProfile id={id} user={user} setUser={setUser} courses={courses} setCourses={setCourses} setCount={setCount} api={api} toast={toast} BASE_URL={BASE_URL} />

                {/* Enrolled Courses */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-semibold mb-4">
                            Total Courses({count})
                        </h2>
                        <Link 
                            to={`/student/courses`} 
                            state={{ tutorId: id }}
                            className="text-primary flex gap-2 items-center"
                            >
                                tutor's courses <span><FaLongArrowAltRight/></span>
                        </Link>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                        {courses?.map((course, index) => (
                            <Link
                                to={`/student/courses/${course.id}`}
                                key={index}
                                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                            >
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-2 line-clamp-1">
                                        {course.title}
                                    </h3>
                                    {/* <p className="text-gray-400 mb-2">
                                        {course.instructor}
                                    </p> */}
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
                                            {/* ({course.reviews.toLocaleString()}) */}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        {course.subscription_amount && (
                                            <p className="text-green-500 font-semibold">
                                                ₹{course?.subscription_amount?.toLocaleString()}
                                            </p>
                                        )}
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
                </div>

                {/* Reviews and Ratings */}
                {/* <div className="mb-8">
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
                </div> */}

                {/* Reports */}
                {/* <div>
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
                </div> */}
            </div>
        </div>
    );
};

export default TutorDetails;
