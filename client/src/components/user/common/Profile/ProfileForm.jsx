import { useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../../../services/api/axiosInterceptor";
import { fetchUserDetails } from "../../../../redux/features/authSlice";
import { useDispatch } from "react-redux";

const ProfileForm = ({ user }) => {
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        biography: user.biography,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            firstName: user.first_name,
            lastName: user.last_name,
            biography: user.biography,
        },
    });

    const onSubmit = async (data) => {
        const credentials = {
            first_name: data.firstName,
            last_name: data.lastName,
            biography: data.biography,
        };

        try {
            const response = await api.patch("users/user/", credentials);
            if (response.status !== 200) {
                throw new Error(response.data);
            }
            alert(`user data updated: ${response.data.message}`);
            console.log(
                "user data response",
                response,
                "response.data.message",
                response.data.message
            );
            if (user) {
                dispatch(fetchUserDetails());
            }
        } catch (error) {
            console.log(error);
            console.log("message:", error.message);
            console.log("data:", error.response?.data);
            alert(`Error: ${error.response?.data}`);
            reset();
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)}>
                {/* First name */}
                <div>
                    <label className="block text-slate-400 mb-1">
                        first name
                    </label>
                    {isEditing ? (
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full border border-slate-700 rounded p-3 bg-slate-100 text-slate-900"
                                {...register("firstName", {
                                    required: "First name is required",
                                    minLength: {
                                        value: 5,
                                        message:
                                            "First name must be at least 5 characters",
                                    },
                                })}
                            />
                            {errors.firstName && (
                                <span className="text-red-500 text-sm">
                                    {errors.firstName.message}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center w-full bg-slate-800 text-white rounded p-3">
                            <span>{profileData.firstName}</span>
                        </div>
                    )}
                </div>

                {/* Last name */}
                <div>
                    <label className="block text-slate-400 mb-1">
                        last name
                    </label>
                    {isEditing ? (
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full bg-slate-100 text-slate-900 border border-slate-700 rounded p-3"
                                {...register("lastName", {
                                    required: "Last name is required",
                                    minLength: {
                                        value: 5,
                                        message:
                                            "Last name must be at least 5 characters",
                                    },
                                })}
                            />
                            {errors.lastName && (
                                <span className="text-red-500 text-sm">
                                    {errors.lastName.message}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center w-full bg-slate-800 text-white rounded p-3">
                            <span>{profileData.lastName}</span>
                        </div>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-slate-400 mb-1">email</label>
                    <div className="flex items-center w-full bg-slate-800 text-white rounded p-3">
                        <span>{profileData.email}</span>
                    </div>
                </div>

                {/* Biography */}
                <div>
                    <label className="block text-slate-400 mb-1">
                        biography
                    </label>
                    {isEditing ? (
                        <div className="relative">
                            <textarea
                                className="w-full bg-slate-100 text-slate-900 border border-slate-700 rounded p-3 min-h-32"
                                {...register("biography", {
                                    required: "Biography is required",
                                    minLength: {
                                        value: 20,
                                        message:
                                            "Biography must be at least 20 characters",
                                    },
                                })}
                            />
                            {errors.biography && (
                                <span className="text-red-500 text-sm">
                                    {errors.biography.message}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="relative w-full bg-slate-800 text-white rounded p-3 min-h-32">
                            <p>{profileData.biography}</p>
                        </div>
                    )}
                </div>

                {/* Edit Button */}
                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="mt-4 bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600"
                    >
                        Edit Profile
                    </button>
                )}

                {/* Submit Button */}
                {isEditing && (
                    <button
                        type="submit"
                        className="mt-4 bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600"
                    >
                        Update Profile
                    </button>
                )}
            </form>
        </div>
    );
};

export default ProfileForm;
