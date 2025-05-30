import { useCallback, useEffect } from "react";
import { UserRound } from "lucide-react";

const UserProfile = ( {id, user, setUser, courses, setCourses, setCount, api, toast, BASE_URL } ) => {
    console.log('courses:', courses)
    const pageSize = 3;
    const fetchTutor = useCallback(async () => {
        try {
            console.log("userId:", id);
            const response = await api.get(`users/tutor-details/${id}/`);
            setUser(response.data);
            console.log('tutor response:', response.data);
        } catch (err) {
            console.log("err:", err);
            toast.error("Failed to fetch user.");
        }
    }, []);

    const fetchTutorCourses = useCallback(async () => {
        try {
            console.log("userId:", id);

            const response = await api.get(`courses/`, {
                params: {
                    page_size: pageSize,
                    tutor: id
                }
            });
            console.log('course response:', response.data);
            setCourses(response.data?.results);
            setCount(response.data?.count);
        } catch (err) {
            console.log("err:", err);
            toast.error("Failed to fetch user.");
        }
    }, []);


    useEffect(() => {
        fetchTutor();
        fetchTutorCourses();
    }, []);

    return (
        <div className="bg-gray-900 text-white flex flex-col md:flex-row md:gap-4 items-stretch md:items-start mb-4 md:mb-0 md:p-6 lg:p-12">
            {/* Left Section */}
            <div className="flex flex-col gap-4 items-center  w-full md:w-1/4 text-center md:text-left mb-6 md:mb-0">
                {/* Profile Image */}
                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {user?.image ? (
                        <img
                            src={BASE_URL + user?.image}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <>
                            {/* Placeholder for Image */}
                            <UserRound className="w-full h-full p-5" />
                        </>
                    )}
                </div>
                <p className="text-gray-400">{user?.email}</p>

                {/* Name & Email */}

                {/* Action Buttons */}
                    <div className="w-full flex flex-col items-center flex-wrap">
                        <p className="font-extralight">
                            Courses Uploaded:{" "}
                            <span>
                                {user?.courses?.total_courses}
                            </span>
                        </p>
                        <p className="font-extralight">
                            Students Enrolled:{" "}
                            <span>
                                {user?.courses?.total_enrollments}
                            </span>
                        </p>
                    </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col items-center gap-4 w-full md:w-3/4 bg-gray-800 px-6 py-2 rounded-lg mb-2">
                {/* Biography */}
                {user?.first_name ? (
                    <>
                        <h2 className="text-2xl font-bold">
                            {user?.first_name} {user?.last_name}
                        </h2>

                        <p className="text-gray-300">
                            {user?.biography}
                        </p>
                    </>
                ) : (
                    <p className="text-red-400 italic">
                        Profile not completed by the user.
                    </p>
                )}
            </div>
        </div>
    )
};

export default UserProfile;
