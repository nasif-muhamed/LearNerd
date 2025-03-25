import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";
import handleError from "../../../../utils/handleError";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import api from "../../../../services/api/axiosInterceptor";
import tutorNoCourse from "../../../../assets/tutor/tutor-no-course-bg.png"
import { toast } from "sonner";

const MyCoursesLanding = () => {
    const [drafts, setDraft] = useState([])
    const [myCourses, setMyCourses] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchDrafts = async () => {
        try{
            setLoading(true)
            const response = await api.get('courses/drafts/')
            console.log('Drafts response:', response)
            const result = response.data
            if (result.length){
                setDraft(result)
            }
        }catch (error) {
            console.log('Drafts Error:', error)
            handleError(error, "Error fetching Drafts")
        }finally{
            setLoading(false)
        }
    }
    
    const fetchMyCourses = async () => {
        try{
            setLoading(true)
            const response = await api.get('courses/tutor/uploaded-courses/')
            console.log('My Course response:', response)
            const result = response.data
            if (result.length){
                setMyCourses(result)
            }
        }catch (error) {
            console.log('Drafts Error:', error)
            handleError(error, "Error fetching Drafts")
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!drafts.length){
            fetchDrafts()
        }
        if (!myCourses.length){
            fetchMyCourses()
        }
    }, [drafts, myCourses])

    // Function to format price
    const formatPrice = (price) => {
        return `₹${price.toLocaleString()}`;
    };

    const deleteDraft = async (id, index) => {
        try{
            setLoading(true)
            const response = await api.delete(`courses/draft/${id}`)
            if (response.status === 204){
                toast.success('Deleted successfully')
            }
            toast.error('something went wrong')
        }catch (error){
            handleError(error, "Failed deleting draft")
        }finally{
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            {loading && <LoadingSpinner/>}
            <div className="md:container mx-auto max-w-7xl">
                {/* Draft Section */}
                {drafts.length > 0 && (<div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Drafts</h2>

                    {drafts && drafts.map((draft, index) => 
                        (<div key={index} className="bg-gray-800 rounded-lg overflow-hidden mb-4">
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-1/4 h-36">
                                    <img
                                        src={draft.thumbnail}
                                        alt="Draft course thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4 md:p-6 flex-1 flex-col">
                                    <div className="flex flex-col md:flex-row justify-between mb-4 items-center">
                                        <h3 className="text-lg font-medium mb-2">
                                            {draft.title}
                                        </h3>
                                        <div className="flex gap-4">
                                            <button onClick={()=>deleteDraft(draft.id, index)} className="flex items-center text-sm bg-red-500 hover:bg-red-400 text-white py-1 px-4 rounded-md transition-colors">
                                                <span>Delete</span>
                                            </button>
                                            <Link to={`/tutor/my-courses/create-course/${draft.id}`} className="flex items-center text-sm bg-blue-600 hover:bg-blue-500 text-white py-1 px-4 rounded-md transition-colors">
                                                <span>Complete</span>
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <div className="relative h-2 bg-gray-700 rounded-full">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                                                style={{
                                                    width: `${(draft.step - 1) * 30}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-400">
                                            Finish your course
                                        </p>
                                        <p className="text-sm">
                                            {(draft.step - 1) * 30}% complete
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>)
                    )}
                </div>)}

                {/* Completed Courses Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Uploaded Courses</h2>
                    
                    {myCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myCourses.map((course) => (
                            <div
                                key={course.id}
                                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
                            >
                                <div className="relative">
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="text-md font-bold mb-2 line-clamp-2">
                                        {course.title}
                                    </h3>
                                    <p className="h-12 truncate text-wrap mb-2 font-extralight">
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
                                                                course.rating
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
                            <img src={tutorNoCourse} alt="No courses" className="w-64 h-48 mb-4" />
                        </div>
                    )}
                </div>

                {/* Add New Course Section */}
                <div className="my-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <h2 className="text-2xl font-semibold mb-4 md:mb-0">
                            Add a new Course
                        </h2>
                        <Link to={"create-course"} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors">
                            <span>Add New Course</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 ml-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyCoursesLanding;
