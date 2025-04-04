import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../../../services/api/axiosInterceptor";
import handleError from "../../../../utils/handleError";
import formatTimeHMS from "../../../../utils/formatTimeHMS";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import CourseHeader from "../../../../components/user/student/courses/course_details/CourseHeader";
import CourseStats from "../../../../components/user/student/courses/course_details/CourseStats";
import CourseContent from "../../../../components/user/student/courses/course_details/CourseContent";
import CoursePanel from "../../../../components/user/student/courses/course_details/CoursePanel";
import CheckItem from "../../../../components/user/student/courses/course_details/CheckItem";
import CourseFeature from "../../../../components/user/student/courses/course_details/CourseFeature";
import InstructorCard from "../../../../components/user/student/courses/course_details/InstructorCard";
import CourseReview from "../../../../components/user/student/courses/course_details/CourseReview";
import CourseCard from "../../../../components/user/student/courses/course_details/CourseCard";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const StudentCourseDetails = () => {
    const navigate = useNavigate();
    
    const courseData = {
        rating: 4.7,
        students: 256032,
        reviews: [
            {
                name: "Yousef",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
                rating: 5,
                time: "3 months ago",
                comment:
                    "Thanks Harsh Chaudhary for this - it was pretty cool for me to learn frontend development which I was looking into since long. You have beautifully covered everything. Thank you for your helpful Boot Course for full-stack.",
            },
            {
                name: "Harsh K.",
                avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
                rating: 5,
                time: "3 months ago",
                comment:
                    "Awesome, I loved his teaching style and the videos are very impactful.",
            },
        ],
        similarCourses: [
            {
                title: "React Redux Ultimate - State Management / Typescript / Redux",
                instructor: "Harsh Chaudhary",
                rating: 4.7,
                reviews: "712",
                price: "29.99",
                image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            },
            {
                title: "Complete web development course",
                instructor: "Harsh Chaudhary",
                rating: 4.7,
                reviews: "32,156",
                price: "19.99",
                image: "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            },
            {
                title: "React - Complete Developer Course with React UI & Projects",
                instructor: "Arvind Kushwaha",
                rating: 4.5,
                reviews: "9,419",
                price: "24.99",
                image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            },
        ],
    };

    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(null);
    console.log("course:", course);
    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response = await api.get(`courses/${id}/`);
            console.log("My Course response:", response);
            const result = response.data;
            setCourse(result);
        } catch (error) {
            console.log("Couses Error:", error);
            handleError(error, "Error fetching Couses");
            setError("Failed to fetch courses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!course) fetchCourse();
    }, []);

    const handlePurchase = async (purchaseType) => {
        try {
            setLoading(true);
            const body = {
                course: id,
                purchase_type: purchaseType,
                // subscription_amount: course?.subscription_amount,
                // video_session: course?.video_session,
                // chat_upto: course?.chat_upto,
                // safe_period: course?.safe_period,
            };
            const response = await api.post(`courses/${id}/purchase/`, body);
            console.log("Purchase response:", response);
            toast.success("Course purchased successfully!");
            const isEnrolled = purchaseType === "freemium" ? "freemium" : "subscription";
            setCourse((prevCourse) => ({
                ...prevCourse,
                is_enrolled: isEnrolled,
            }));
        } catch (error) {
            console.log("Purchase Error:", error);
            handleError(error, "Error purchasing course");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-navy text-white pb-20">
            <div className="container px-4 lg:px-8 mx-auto pt-6">
                {loading && <LoadingSpinner />}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar - Course Info */}
                    <div className="lg:col-span-1">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
                        >
                            <ArrowLeft size={18} className="mr-1" />
                            <span>Back</span>
                        </button>

                        <div className="sticky top-6">
                            <div className="bg-navy-light rounded-lg overflow-hidden mb-6">
                                <div className="relative aspect-video">
                                    <img
                                        src={course?.thumbnail}
                                        alt="Course preview"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                        <button className="bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-300 rounded-full w-16 h-16 flex items-center justify-center text-navy">
                                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                                        </svg>
                                        </button>
                                    </div> */}
                                </div>

                                <div className="p-4">
                                    <div
                                        className={`flex ${
                                            course?.subscription
                                                ? "flex-col"
                                                : "flex-row gap-10"
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <button
                                                className="text-red-600 hover:text-red-500 transition-colors duration-300"
                                                title="wishlist"
                                            >
                                                <svg
                                                    className="w-6 h-6"
                                                    fill="currentColor"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                    />
                                                </svg>
                                            </button>
                                            {course?.subscription && (
                                                <div className="text-2xl font-bold">
                                                    ₹
                                                    {Number(
                                                        course?.subscription_amount
                                                    ).toLocaleString("en-US")}
                                                </div>
                                            )}
                                        </div>

                                        {course?.subscription && course?.is_enrolled !== 'subscription' &&  (
                                            <button className="btn-primary w-full mb-2">
                                                Subscribe
                                            </button>
                                        )}

                                        {course?.freemium && course?.is_enrolled === 'No' && (
                                            <button onClick={()=>{handlePurchase('freemium')}} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 flex items-center justify-center mb-4">
                                                <span>Go With Fremium</span>
                                            </button>
                                        )}

                                        {course?.is_enrolled && course?.is_enrolled !== 'No' && (
                                            <Link to={`/student/study-room/my-course/${course?.purchase_id}`} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 flex items-center justify-center mb-4">
                                                <span>Go to course</span>
                                            </Link>
                                        )}

                                    </div>

                                    {/* <div className="text-xs text-center text-gray-400 mb-4">
                                        {course?.safe_period}-Day Money-Back Guarantee
                                    </div> */}

                                    <div className="text-sm">
                                        <div className="font-medium mb-1">
                                            This course includes:
                                        </div>
                                        <ul className="space-y-2">
                                            <li className="flex items-center">
                                                <svg
                                                    className="w-4 h-4 mr-2 text-gray-400"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                        clipRule="evenodd"
                                                    ></path>
                                                </svg>
                                                <span>
                                                    {
                                                        course?.analytics
                                                            ?.video_count
                                                    }{" "}
                                                    on-demand videos
                                                </span>
                                            </li>
                                            <li className="flex items-center">
                                                <svg
                                                    className="w-4 h-4 mr-2 text-gray-400"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                                        clipRule="evenodd"
                                                    ></path>
                                                </svg>
                                                <span>
                                                    {
                                                        course?.analytics
                                                            ?.assessment_count
                                                    }{" "}
                                                    assessments
                                                </span>
                                            </li>
                                            <li className="flex items-center">
                                                <svg
                                                    className="w-4 h-4 mr-2 text-gray-400"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                                                </svg>
                                                <span>
                                                    Full lifetime access
                                                </span>
                                            </li>
                                            {/* <li className="flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd"></path>
                                                <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z"></path>
                                                </svg>
                                                <span>Certificate of completion</span>
                                            </li> */}
                                        </ul>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <CourseHeader
                            title={course?.title}
                            subtitle={course?.description}
                            // skills={courseData.skills}
                            creator={
                                course?.instructor_details?.first_name +
                                " " +
                                course?.instructor_details?.last_name
                            }
                            uploadDate={new Date(
                                course?.created_at
                            ).toLocaleDateString("en-GB")}
                        />

                        <CourseStats
                            rating={courseData.rating}
                            students={courseData.students}
                            hours={
                                course?.analytics?.total_video_duration &&
                                formatTimeHMS(
                                    course?.analytics?.total_video_duration,
                                    2
                                )
                            }
                        />

                        <CourseContent
                            sections={course?.analytics?.section_count}
                            lectures={course?.analytics?.video_count}
                            duration={
                                course?.analytics?.total_video_duration &&
                                formatTimeHMS(
                                    course?.analytics?.total_video_duration,
                                    2
                                )
                            }
                            assessmentCount={
                                course?.analytics?.assessment_count
                            }
                            documentCount={course?.analytics?.document_count}
                        />

                        <CoursePanel title="What you'll learn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                {course?.objectives.map((item, index) => (
                                    <CheckItem
                                        key={index}
                                        text={item.objective}
                                    />
                                ))}
                            </div>
                        </CoursePanel>

                        <CoursePanel title="Requirements">
                            <ul className="list-disc pl-5 space-y-2">
                                {course?.requirements.map((item, index) => (
                                    <li key={index} className="text-gray-300">
                                        {item.requirement}
                                    </li>
                                ))}
                            </ul>
                        </CoursePanel>

                        {course?.subscription && (
                            <CoursePanel title="This course includes:">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CourseFeature
                                        text={`${course?.video_session} end-to-end video sessions`}
                                        premium={true}
                                        icon={
                                            <svg
                                                className="w-5 h-5 text-blue-400"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                    clipRule="evenodd"
                                                ></path>
                                            </svg>
                                        }
                                    />

                                    <CourseFeature
                                        text={`${course?.chat_upto} days chat assistence`}
                                        premium={true}
                                        icon={
                                            <svg
                                                className="w-5 h-5 text-blue-400"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                    clipRule="evenodd"
                                                ></path>
                                            </svg>
                                        }
                                    />

                                    <CourseFeature
                                        text={`${course?.safe_period} days safe period`}
                                        premium={true}
                                        icon={
                                            <svg
                                                className="w-5 h-5 text-blue-400"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                    clipRule="evenodd"
                                                ></path>
                                            </svg>
                                        }
                                    />
                                </div>

                                <div className="mt-6 border-t border-navy-light pt-4 text-sm">
                                    <p className="text-red-400 font-medium">
                                        Note: Course Duration is{" "}
                                        {course.safe_period} days
                                    </p>
                                    <p className="text-gray-400 mt-1">
                                        If you have any complaints and need
                                        refund, you have to report it before the
                                        course duration ends which will happen
                                        only if you complete at least 80% of the
                                        lessons.
                                    </p>
                                </div>
                            </CoursePanel>
                        )}

                        <CoursePanel>
                            <InstructorCard
                                instructor={course?.instructor_details}
                            />
                        </CoursePanel>

                        <CoursePanel>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <svg
                                        className="w-5 h-5 text-yellow-400 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                    </svg>
                                    <span className="font-bold mr-1">
                                        {courseData.rating}
                                    </span>
                                    <span className="text-gray-400">
                                        course rating
                                    </span>
                                    <span className="mx-2 text-gray-500">
                                        •
                                    </span>
                                    <span className="text-gray-400">
                                        7K ratings
                                    </span>
                                </div>

                                <button className="text-sm text-white bg-navy-light hover:bg-opacity-80 px-3 py-1 rounded-md transition-colors duration-300">
                                    <svg
                                        className="w-4 h-4 inline-block mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                                        />
                                    </svg>
                                    Sort
                                </button>
                            </div>

                            {courseData.reviews.map((review, index) => (
                                <CourseReview key={index} review={review} />
                            ))}

                            <div className="flex justify-center mt-4">
                                <button className="text-sm bg-navy-light hover:bg-opacity-80 text-white px-4 py-2 rounded-md transition-colors duration-300 flex items-center">
                                    <span>See all reviews</span>
                                    <svg
                                        className="w-4 h-4 ml-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </CoursePanel>

                        <div className="mt-8">
                            <h2 className="text-xl font-semibold mb-4">
                                Similar Courses
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {courseData.similarCourses.map(
                                    (course, index) => (
                                        <CourseCard
                                            key={index}
                                            course={course}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentCourseDetails;
