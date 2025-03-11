import { useCallback, useEffect } from "react";
import { MessageSquareText, UserRound, ShieldMinus, ShieldCheck } from "lucide-react";

const UserProfile = ( {id, user, setUser, api, toast, BASE_URL } ) => {
    const fetchUser = useCallback(async () => {
        try {
            console.log("userId:", id);
            const response = await api.get(`admin/user-action/${id}/`);
            setUser(response.data);
            console.log(response);
        } catch (err) {
            console.log("err:", err);
            toast.error("Failed to fetch user.");
        }
    }, []);

    const handleUserAction = async () => {
        try {
            const response = await api.patch(`admin/user-action/${id}/`, {});
            setUser(response.data);
            console.log(response);
            console.log(response.data.is_active, user.is_active)
            toast.success(`User ${response.data?.is_active ? 'Activated' : 'Blocked'} Successfully`)
        } catch (err) {
            console.log("err:", err);
            toast.error("Failed to update user.");
        }
    }

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

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
                <div className="flex flex-col gap-4 w-full px-4">
                    <button
                        onClick={handleUserAction}
                        className={` flex justify-center items-center text-white text-xs px-2 py-1 md:text-base md:px-5 md:py-1 rounded-lg ${
                            user?.is_active
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                        {user?.is_active ? <ShieldMinus className="mr-2"/> : <ShieldCheck className="mr-2"/>} 
                        <span className="lg:hidden">{user?.is_active ? "Block" : "Activate"}</span> <span className="hidden lg:block">{user?.is_active ? "Deactivate User" : "Activate User"}</span> 
                    </button>

                    <button className="flex justify-center items-center bg-blue-600 text-white text-xs px-2 py-1 md:text-base md:px-5 md:py-1 rounded-lg hover:bg-blue-600 ">
                        <MessageSquareText className="mr-2"/> <span className="lg:hidden">Chat</span> <span className="hidden lg:block">Chat with user</span> 
                    </button>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col items-center gap-4 w-full md:w-3/4 bg-gray-800 px-6 py-2 rounded-lg mb-2">
                {/* Biography */}
                {user?.is_profile_completed ? (
                    <>
                        <h2 className="text-2xl font-bold">
                            {user?.first_name} {user?.last_name}
                        </h2>

                        <p className="text-gray-300">
                            {user?.biography}
                        </p>
                        {/* Course Details */}
                        <div className="w-full flex justify-between flex-wrap">

                            <div className="py-2">
                                <p className="font-extralight">
                                    Joined at:{" "}
                                    <span>
                                        {new Date(
                                            user.created_at
                                        ).toLocaleDateString()}
                                    </span>
                                </p>
                                <p className="font-extralight">
                                    Courses Subscribed:{" "}
                                    <span>
                                        {2}
                                    </span>
                                </p>
                            </div>

                            <div className="py-2">
                                <p className="font-extralight">
                                    Courses Enrolled:{" "}
                                    <span>
                                        {10}
                                    </span>
                                </p>
                                <p className="font-extralight">
                                    Courses Subscribed:{" "}
                                    <span>
                                        {2}
                                    </span>
                                </p>
                            </div>

                            <div className="py-2">
                                <p className="font-extralight">
                                    Courses Freemium:{" "}
                                    <span>
                                        {8}
                                    </span>
                                </p>
                                <p className="font-extralight">
                                    Subscription Paid:{" "}
                                    <span>
                                        ₹3,000
                                    </span>
                                </p>
                            </div>

                        </div>
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
