import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux';
import studs2 from '../../../assets/user-auth/studs-otp.webp'
import { UserRound } from 'lucide-react';
import { FaLongArrowAltRight } from "react-icons/fa";
import handleError from '../../../utils/handleError';
import api from '../../../services/api/axiosInterceptor';
import formatPrice from '../../../utils/formatPrice';
// import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const Home = () => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const user = useSelector((state) => state.auth.user);    
    const navigate = useNavigate();
    const [myCourses, setMyCourses] = useState([])
    const [allCourses, setAllCourses] = useState([])
    const [tutors, setTutors] = useState([])
    const [myCoursesLoading, setMyCoursesLoading] = useState(false);
    const [allCoursesLoading, setAllCoursesLoading] = useState(false);
    const [tutorsLoading, setTutorsLoading] = useState(false);
    const pageSize = 3;

    // const fetchMyCourses = async () => {
    //     if (!user) return
    //     try{
    //         setMyCoursesLoading(true)
    //         const response1 = await api.get(`courses/home/`)
    //         console.log('response 1:', response1)
    //         const response = await api.get(`courses/student/${user.id}/my-courses/`)
    //         console.log('My Course response:', response)
    //         const result = response.data
    //         setMyCourses(result.slice(0, 4))
    //     }catch (error) {
    //         console.log('Mycourse Error:', error)
    //         handleError(error, "Error fetching uploaded courses")
    //     }finally{
    //         setMyCoursesLoading(false)
    //     }
    // }
    
    // const fetchAllCourses = async () => {
    //     try{
    //         setAllCoursesLoading(true)
    //         const response = await api.get('courses/', {
    //             params: {
    //                 page_size: pageSize,
    //             },
    //         })
    //         console.log('All Courses response:', response)
    //         const result = response.data?.results
    //         setAllCourses(result)
    //     }catch (error) {
    //         console.log('Couses Error:', error)
    //         handleError(error, "Error fetching Couses")
    //     }finally{
    //         setAllCoursesLoading(false)
    //     }
    // }

    const fetchCourses = async () => {
        if (!user) return
        try{
            setMyCoursesLoading(true)
            setAllCoursesLoading(true)
            const response = await api.get(`courses/home/`)
            console.log('response courses:', response)
            const result = response.data
            setMyCourses(result.my_courses)
            setAllCourses(result.courses)
        }catch (error) {
            console.log('Mycourse Error:', error)
            handleError(error, "Error fetching courses")
        }finally{
            setMyCoursesLoading(false)
            setAllCoursesLoading(false)
        }
    }


    const fetchTutors = useCallback(async () => {        
        try {
            setTutorsLoading(true);
            const response = await api.get("courses/tutors/", {
                params: {
                    page_size: pageSize,
                },
            });
            console.log("tutors response:", response.data);
            setTutors(response.data.results);
        } catch (err) {
            console.log("err:", err);
        } finally {
            setTutorsLoading(false);
        }
    }, []);


    console.log('mycourses =', myCourses)
    useEffect(() => {  
        // fetchMyCourses()
        // fetchAllCourses()
        fetchCourses()
        fetchTutors()
    }, [])

    return (
        <>

            {/* Hero Carousel */}
            <div className="relative w-full p-4 mt-6">
                <div className="flex items-center justify-between">
                    <div className="mx-auto max-w-5xl w-full flex bg-gray-200 rounded-lg overflow-hidden">
                        <div className="w-2/5 p-8 text-gray-800">
                            <h2 className="text-3xl font-bold mb-4">Learning that gets you</h2>
                            <p className="mb-4">Skills for your present (and your future). Get started with us.</p>
                            <Link to={'/student/courses'} className="bg-gray-600 text-white py-2 px-6 rounded-md">
                                Explore Courses
                            </Link>
                        </div>
                        <div className="w-3/5">
                            <img
                                src={studs2}
                                alt="Learning illustration"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* All Courses Section */}
            <section className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold">Explore Courses</h2>
                    <Link to={'/student/courses'} className="text-primary flex gap-2 items-center">all courses <span><FaLongArrowAltRight/></span></Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allCoursesLoading && <LoadingSpinner/>}

                    {allCourses.map((course) => (
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
            </section>

            {/* My Courses Section */}
            {myCourses.length > 0 && (<section className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold">Let's Complete Learning</h2>
                    <Link to={'/student/study-room'} className="text-primary flex gap-2 items-center">my study room <span><FaLongArrowAltRight/></span></Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myCoursesLoading && <LoadingSpinner/>}

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
            </section>)}

            {/* Tutors Section */}
            <section className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold">Top Tutors</h2>
                    <Link to={'/student/tutors'} className="text-primary flex gap-2 items-center">all tutors <span><FaLongArrowAltRight/></span></Link>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
                    {tutorsLoading && <LoadingSpinner/>}

                    {tutors.map((tutor) => (
                        <div
                            key={tutor.tutor_id}
                            className="flex items-center hover:bg-gray-800 rounded-lg p-4 cursor-pointer w-full gap-4"
                            onClick={() =>
                                navigate(`/student/tutors/${tutor.tutor_id}`)
                            }
                        >
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700">
                                {tutor.tutor_details?.image ? (
                                    <img
                                        src={BASE_URL + tutor.tutor_details?.image}
                                        alt={
                                            `${tutor.tutor_details?.first_name || ""} ${
                                                tutor.tutor_details?.last_name || ""
                                            }`.trim() || tutor.tutor_details?.email
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
                                    {tutor.tutor_details?.first_name
                                        ? `${tutor.tutor_details?.first_name || ""} ${
                                                tutor.tutor_details?.last_name || ""
                                            }`.trim()
                                        : tutor.tutor_details?.email}
                                </h3>
                                <p className="text-sm text-gray-400 truncate">
                                    <span>{tutor.course_count}</span> Courses
                                </p>
                                <p className="text-sm text-gray-400 truncate">
                                    <span>{tutor.enrollment_count}</span> Enrollments
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </section>

        </>
    );
};

export default Home;

const LoadingSpinner = () => {
    return (
        // <div className="flex justify-center items-center h-screen w-screen">
        //     <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        // </div>
        <div className="min-h-full w-full flex justify-center items-center bg-opacity-50 z-50">
            <div className="w-12 h-12 border-t-2 border-b-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        // <div className="flex justify-center items-center h-64">
        //     <div className="animate-spin rounded-full h-12 w-12  border-blue-500"></div>
        // </div>

    );
};

