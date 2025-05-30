import { useState } from "react";
import { useForm } from "react-hook-form";
import { fetchUserDetails, updateAcess, updateRefresh } from "../../../../redux/features/authSlice";
import { useDispatch } from "react-redux";
import { toast } from 'sonner'
import api from "../../../../services/api/axiosInterceptor";
import { UserRoundPen } from "lucide-react";

const ProfileForm = ({ user, refreshToken }) => {
    const dispatch = useDispatch();
    const [isEditing, setIsEditing] = useState(false);

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
        const credentials = {};
        if (user.first_name != data.firstName) credentials.first_name = data.firstName;
        if (user.last_name != data.lastName) credentials.last_name = data.lastName;
        if (user.biography != data.biography) credentials.biography = data.biography;
        console.log(credentials, credentials? 'yes' : 'no')
        try {
                if (Object.keys(credentials).length > 0){
                    const response = await api.patch("users/user/", credentials);
                    if (response.status !== 200) {
                        throw new Error(response.data);
                    }
                    console.log('user updated response:', response)
                    console.log('checking user is empty')
                    if (!user.first_name || !user.last_name || !user.biography){
                        console.log('new access:', response.data.access)
                        dispatch(updateAcess({ access: response.data.access }));
                        console.log('new refresh:', response.data.refresh)
                        dispatch(updateRefresh({ refresh: response.data.refresh }));
                    }

                    if (user) {
                        dispatch(fetchUserDetails());
                    }
                    toast.success(`user data updated`);
                }else{
                    toast.info('No changes detected.')
                }
            } catch (error) {
                console.log(error);
                console.log("message:", error.message);
                console.log("data:", error.response?.data);
                if (error.response?.data){
                    toast.error(Object.values(error.response?.data)?.[0]);
                } else {
                    toast.error(error.message || 'Something went wrong');
                }
                reset();
            } finally {
                setIsEditing(false);
            }
    };

    return (
        <div className="space-y-6 w-full md:w-3/4">
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col md:flex-row md:gap-10 mb-1">
                    {/* First name */}
                    <div className="w-full md:w-1/2">
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
                                            value: 4,
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
                            <div className="flex items-center w-full bg-slate-800 text-white rounded p-3 min-h-12">
                                <span>{user.first_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Last name */}
                    <div className="w-full md:w-1/2">
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
                                            value: 4,
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
                            <div className="flex items-center w-full bg-slate-800 text-white rounded p-3 min-h-12">
                                <span>{user.last_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div className="mb-1">
                    <label className="block text-slate-400 mb-1">email</label>
                    <div className="flex items-center w-full bg-slate-800 text-white rounded p-3">
                        <span>{user.email}</span>
                    </div>
                </div>

                {/* Biography */}
                <div className="mb-1">
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
                                        value: 75,
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
                        <div className="relative w-full bg-slate-800 text-white rounded p-3 min-h-32 break-words">
                            <p>{user.biography}</p>
                        </div>
                    )}
                </div>

                {/* Edit Button */}
                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="mt-4 flex justify-center items-center text-white px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
                    >
                        <UserRoundPen className="mr-2"/> Edit Profile
                    </button>
                )}

                {/* Submit Button */}
                {isEditing && (
                    <button
                        type="submit"
                        className="mt-4 text-white px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
                    >
                        Update Profile
                    </button>
                )}
            </form>
        </div>
    );
};

export default ProfileForm;
