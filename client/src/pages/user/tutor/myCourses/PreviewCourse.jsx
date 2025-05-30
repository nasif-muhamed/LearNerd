import React, { useEffect, useState } from 'react'
import { ArrowLeft, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import LoadingSpinner from '../../../../components/ui/LoadingSpinner'
import CourseHeader from '../../../../components/user/student/courses/course_details/CourseHeader'
import CourseStats from '../../../../components/user/student/courses/course_details/CourseStats'
import formatTimeHMS from '../../../../utils/formatTimeHMS'
import api from '../../../../services/api/axiosInterceptor'
import handleError from '../../../../utils/handleError'

const PreviewCourse = () => {
    const {courseId} = useParams();
    const navigate = useNavigate()
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const [course, setCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    console.log('courseId:', courseId)
    console.log('course:', course) 
    console.log('students:', students)
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`courses/tutor/course-preview/${courseId}/`);
            console.log('preview course response:', response.data);
            const data = response.data;
            setCourse(data.course);
            setStudents(data.students);
        }catch (err) {
            console.log("err:", err);
            handleError(err, "Failed to fetch course data.");
        }finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData()
    }, []);

    return (
        <div className="min-h-screen bg-navy text-white pb-20">
            {loading && ( <LoadingSpinner /> )}
            <div className="container px-4 lg:px-8 mx-auto pt-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    <span>Back</span>
                </button>
                <div className='flex flex-col md:flex-row gap-4 lg:gap-8 mb-6'>
                    <div className='w-64 aspect-video mb-4 rounded-lg overflow-hidden'>
                        <img src={course?.thumbnail} alt="" className='w-full h-full object-cover' />
                    </div>
                    {course && (<div className="flex-1 lg:col-span-2">
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
                            rating={course?.average_rating}
                            totalRatings={course?.total_reviews}
                            students={course?.analytics?.total_admission}
                            hours={
                                course?.analytics?.total_video_duration &&
                                formatTimeHMS(
                                    course?.analytics?.total_video_duration,
                                    2
                                )
                            }
                        />    
                    </div>)}
                </div>

                <h2 className="text-2xl font-bold mb-6">Students</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">

                    {students.map((student) => (
                        <div
                            key={student.id}
                            className="flex items-center hover:bg-gray-800 rounded-lg p-4 cursor-pointer w-full gap-4"
                            onClick={() =>
                                navigate(`/student/tutors/${student.id}`)
                            }
                        >
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700">
                                {student?.image ? (
                                    <img
                                        src={BASE_URL + student?.image}
                                        alt={
                                            `${student?.first_name || ""} ${
                                                student?.last_name || ""
                                            }`.trim() || student?.email
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
                                    {student?.first_name
                                        ? `${student?.first_name || ""} ${
                                                student?.last_name || ""
                                            }`.trim()
                                        : student?.email}
                                </h3>
                                <p className="text-sm text-gray-400 truncate">
                                    <span>{student.email}</span> 
                                </p>
                                <p className="text-sm text-gray-400 truncate">
                                    <span>{student.course_count}</span> Completed
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                
            </div>
        </div>
    )
}

export default PreviewCourse