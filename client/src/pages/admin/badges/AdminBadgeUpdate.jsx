import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FolderPen, Calendar, Clock, Check, X } from 'lucide-react';
import api from "../../../services/api/axiosInterceptor";
import adminUserApi from "../../../services/api/adminUserAxiosInterceptor"
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import handleError from "../../../utils/handleError";

const AdminBadgeUpdate = () => {
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const { badgeId } = useParams();
    const navigate = useNavigate();
    const [originalData, setOriginalData] = useState(null); // Store original data for comparison
    // const [scheduledMeeting, setScheduledMeeting] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [scheduleTitle, setScheduleTitle] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues,
        reset,
    } = useForm();

    const fetchBadgeData = async () => {
        try {
            const response = await api.get(`badges/${badgeId}/`);
            const badgeData = response.data;
            console.log('badgeData:', badgeData)
            // Store original data for comparison
            setOriginalData(badgeData);
            
            // Set form values
            setValue("title", badgeData.title);
            setValue("description", badgeData.description);
            setValue("totalQuestions", badgeData.total_questions);
            setValue("passMark", badgeData.pass_mark);
            setValue("community", badgeData.community);
            setValue("is_active", badgeData.is_active)
            setTotalQuestions(badgeData.total_questions);

            if (badgeData.image_url) {
                setImagePreview(badgeData.image_url);
            }
            // if (badgeData.scheduled_meeting) {
            //     setScheduledMeeting(badgeData.scheduled_meeting);
            // }

            badgeData.questions.forEach((q, index) => {
                setValue(`question_${index + 1}`, q.question);
                q.answers.forEach((answer) => {
                    setValue(
                        `answer_${index + 1}_${answer.options}`,
                        answer.answer
                    );
                    if (answer.is_correct) {
                        setValue(`correct_${index + 1}`, answer.options);
                    }
                });
            });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching badge:", error);
            toast.error("Failed to load badge data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBadgeData();
    }, [badgeId, setValue]);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setValue("badgeImage", file);
            };
            reader.readAsDataURL(file);
        }
    };

    // Helper function to check if questions have changed
    const haveQuestionsChanged = (currentData) => {
        if (!originalData || !originalData.questions) return true;

        return originalData.questions.some((originalQ, index) => {
            const currentQ = currentData[`question_${index + 1}`];
            if (originalQ.question !== currentQ) return true;

            return originalQ.answers.some((originalA) => {
                const currentA = currentData[`answer_${index + 1}_${originalA.options}`];
                const currentCorrect = currentData[`correct_${index + 1}`] === originalA.options;
                return (
                    originalA.answer !== currentA ||
                    originalA.is_correct !== currentCorrect
                );
            });
        });
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const formData = new FormData();
            const original = originalData || {};

            // Only append changed fields
            if (data.title !== original.title) {
                formData.append("title", data.title);
            }
            if (data.description !== original.description) {
                formData.append("description", data.description);
            }
            if (data.badgeImage) {
                formData.append("image", data.badgeImage);
            }
            if (data.community !== original.community) {
                formData.append("community", data.community);
            }
            if (data.is_active !== original.is_active) {
                formData.append("is_active", data.is_active);
            }
            if (parseInt(data.totalQuestions) !== original.total_questions) {
                formData.append("total_questions", parseInt(data.totalQuestions));
            }
            if (parseInt(data.passMark) !== original.pass_mark) {
                formData.append("pass_mark", parseInt(data.passMark));
            }

            if (parseInt(data.totalQuestions) < parseInt(data.passMark)) {
                toast.error("Passmark should not be greater than total questions");
                setLoading(false);
                return;
            }

            // Handle questions if any have changed
            if (haveQuestionsChanged(data)) {
                const questions = Array.from(
                    { length: totalQuestions },
                    (_, index) => ({
                        question: data[`question_${index + 1}`],
                        order: index + 1,
                        answers: [
                            { options: "A", answer: data[`answer_${index + 1}_A`], is_correct: data[`correct_${index + 1}`] === "A" },
                            { options: "B", answer: data[`answer_${index + 1}_B`], is_correct: data[`correct_${index + 1}`] === "B" },
                            { options: "C", answer: data[`answer_${index + 1}_C`], is_correct: data[`correct_${index + 1}`] === "C" },
                            { options: "D", answer: data[`answer_${index + 1}_D`], is_correct: data[`correct_${index + 1}`] === "D" },
                        ],
                    })
                );
                formData.append("questions_raw", JSON.stringify(questions));
            }

            // Only make API call if there are changes
            if (formData.entries().next().done) {
                toast.info("No changes detected");
                setLoading(false);
                navigate("/admin/badges");
                return;
            }

            const response = await api.patch(`badges/${badgeId}/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("Badge updated:", response.data);
            fetchBadgeData();
            toast.success("Badge updated successfully!");
        } catch (error) {
            console.error("Error updating badge:", error);
            handleError(error, "Failed to update badge")
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleClick = () => {
        setIsModalOpen(true);
        setScheduledDate('');
        setScheduledTime('');
        setScheduleTitle('');
    };

    const handleSubmitSchedule = async (e) => {
        e.preventDefault();
        
        if (!scheduledDate || !scheduledTime) {
            return; // Form validation
        }
        
        try {
            // setLoadingScheduleButton(true)
            const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
            console.log('scheduledDateTime:', scheduledDateTime);
            
            const now = new Date();

            // Add 1 hour (in milliseconds) to the current time
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

            // if (scheduledDateTime < oneHourFromNow) {
            //     handleError(null, 'You must schedule a meeting at least one hour in advance');
            //     return;
            // }

            const response = await adminUserApi.post(`meetings/community-meetings/`, {
                title: scheduleTitle, 
                badge: badgeId,
                badge_name: originalData.title,
                scheduled_time: scheduledDateTime.toISOString(),
            });

            console.log('response from video-sessions:', response)
            setOriginalData((prev) => ({
                ...prev,
                meeting: response.data,
            }));
            toast.success('Meeting scheduled successfully!');

            // Close modal
            setIsModalOpen(false);
        } catch (err) {
            console.log('schedule meeting error', err)
            handleError(err, 'Failed to schedule meeting');
        } finally {
            // setLoadingScheduleButton(false)
        }
    };

    // const deactivateMeeting = async (e) => {
    //     e.preventDefault();
                
    //     try {
    //         const response = await adminUserApi.patch(`meetings/community-meetings/`, {
    //             'id': originalData.meeting?.id,
    //             'is_active': false
    //         });

    //         console.log('response from video-sessions:', response)
    //         setOriginalData((prev) => ({
    //             ...prev,
    //             meeting: null,
    //         }));
    //         toast.info('Meeting deactivated!');
    //     } catch (err) {
    //         console.log('schedule meeting error', err)
    //         handleError(err, 'Failed to schedule meeting');
    //     } finally {
    //         // setLoadingScheduleButton(false)
    //     }
    // };
    
    const updateMeeting = async (is_active, status) => {
                
        try {
            const data = {
                'id': originalData.meeting?.id,
            } 

            if (is_active !== undefined) data.is_active = is_active;
            if (status) data.status = status;
            const response = await adminUserApi.patch(`meetings/community-meetings/`, data);

            setOriginalData((prev) => ({
                ...prev,
                meeting: response.data,
            }));
            console.log('response from video-sessions:', response)
            toast.info('Meeting updated!');
        } catch (err) {
            console.log('schedule meeting error', err)
            handleError(err, 'Failed to schedule meeting');
        } finally {
            // setLoadingScheduleButton(false)
        }
    };

    const isRoomOpenToJoin = (schedule) => {
        let scheduledTime = new Date(schedule);
        scheduledTime.setMinutes(scheduledTime.getMinutes() - 5)
        const currentTime = new Date();
        return scheduledTime <= currentTime
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {loading && <LoadingSpinner />}

            <div className="p-6 w-full max-w-4xl">
                <div className="flex flex-col gap-2 md:flex-row justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Update Badge</h2>

                    {!originalData?.meeting || !originalData?.meeting?.is_active  ? 
                        (<button 
                            className="btn-secondary text-sm py-1.5 px-3"
                            onClick={() => handleScheduleClick()}
                        >
                            Schedule Meeting
                        </button>) 
                        : 
                        (<div className="btn-secondary text-sm py-1.5 px-3 flex flex-col gap-2">
                            <h1 className="font-semibold truncate max-w-[30ch] overflow-hidden whitespace-nowrap">
                                Meeting: <span className="font-extralight ">{originalData.meeting.title}</span>
                            </h1>
                            <h1 className="font-semibold">
                                At: <span className="font-extralight">{new Date(originalData.meeting?.scheduled_time).toLocaleString()}</span>
                            </h1>
                            <div className="flex gap-2 justify-between items-center ">
                                {/* <button onClick={() => {updateMeeting(false, isRoomOpenToJoin(originalData.meeting?.scheduled_time) ? 'completed' : 'cancelled')}} className="bg-white rounded-lg text-black px-3 py-1 hover:bg-gray-200 w-full">
                                    {isRoomOpenToJoin(originalData.meeting?.scheduled_time) ? 'Complete' : 'Cancel'}
                                </button> */}
                                {originalData.meeting?.status == 'scheduled' && (<button onClick={() => {updateMeeting(false, 'cancelled')}} className="bg-destructive rounded-lg text-black px-3 py-1 hover:opacity-80 w-full">
                                    Cancel
                                </button>)}
                                {isRoomOpenToJoin(originalData.meeting?.scheduled_time) && originalData.meeting?.status == 'scheduled' && (<button onClick={() => {updateMeeting(undefined, 'in_progress')}} className="bg-success rounded-lg text-black px-3 py-1 hover:opacity-80 w-full">
                                    Start
                                </button>)}
                                {isRoomOpenToJoin(originalData.meeting?.scheduled_time) && originalData.meeting?.status == 'in_progress' && (<button onClick={() => {updateMeeting(false, 'completed')}} className="bg-white rounded-lg text-black px-3 py-1 hover:opacity-80 w-full">
                                    Complete
                                </button>)}
                                {/* <button onClick={() => {}} className="bg-success rounded-lg text-black px-3 py-1 hover:opacity-80 w-full">
                                    Join
                                </button> */}
                                {isRoomOpenToJoin(originalData.meeting?.scheduled_time) && originalData.meeting?.status == 'in_progress' && (<a 
                                    href={isRoomOpenToJoin(originalData.meeting?.scheduled_time) ? `/community-call?meeting_id=${originalData.meeting?.id}` : '#'}
                                    target={isRoomOpenToJoin(originalData.meeting?.scheduled_time) ?  `_blank` : ''}
                                    rel="noopener noreferrer"
                                    className={`bg-success rounded-lg text-black px-3 py-1 hover:opacity-80 w-full`}
                                >
                                    Join
                                </a>)}

                            </div>
                        </div>)
                    }
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Badge Details Section */}
                    <div>
                        <label className="block mb-2">Title</label>
                        <input
                            type="text"
                            className="border border-slate-700 rounded p-3 bg-slate-100 text-slate-900 placeholder-slate-900 w-full"
                            {...register("title", {
                                required: "Title is required",
                            })}
                        />
                        {errors.title && (
                            <p className="text-red-500">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-2">Description</label>
                        <textarea
                            className="border border-slate-700 rounded p-3 bg-slate-100 text-slate-900 placeholder-slate-900 w-full"
                            {...register("description", {
                                required: "Description is required",
                            })}
                        />
                        {errors.description && (
                            <p className="text-red-500">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-2">Badge Image</label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {imagePreview && (
                                <div className="w-40 h-40 overflow-hidden flex-shrink-0">
                                    <img
                                        src={imagePreview}
                                        alt="Badge Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="border border-slate-700 rounded p-3 bg-slate-100 text-slate-900 placeholder-slate-900 w-full"
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block mb-2">
                                Total Questions
                            </label>
                            <input
                                type="number"
                                className="border border-slate-700 rounded p-3 bg-slate-100 text-slate-900 placeholder-slate-900 w-full"
                                {...register("totalQuestions", {
                                    required: "Total questions is required",
                                    min: {
                                        value: 1,
                                        message: "Must be at least 1 question",
                                    },
                                })}
                                onChange={(e) => {
                                    const newTotal = parseInt(e.target.value);
                                    if (newTotal > 0) {
                                        setTotalQuestions(newTotal);
                                        setValue("totalQuestions", newTotal);
                                    }
                                }}
                            />
                            {errors.totalQuestions && (
                                <p className="text-red-500">
                                    {errors.totalQuestions.message}
                                </p>
                            )}
                        </div>

                        <div className="flex-1">
                            <label className="block mb-2">Pass Mark</label>
                            <input
                                type="number"
                                className="border border-slate-700 rounded p-3 bg-slate-100 text-slate-900 placeholder-slate-900 w-full"
                                {...register("passMark", {
                                    required: "Pass mark is required",
                                    min: {
                                        value: 1,
                                        message: "Must be at least 1",
                                    },
                                })}
                            />
                            {errors.passMark && (
                                <p className="text-red-500">
                                    {errors.passMark.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="mr-5">
                            <input
                                type="checkbox"
                                className="mr-2"
                                {...register("community")}
                            />
                            <label>Community Badge</label>
                        </div>

                        <div>
                            <input
                                type="checkbox"
                                className="mr-2"
                                {...register("is_active")}
                            />
                            <label>Active</label>
                        </div>
                    </div>

                    {/* Questions Section */}
                    <h3 className="text-xl font-semibold mb-4">Questions</h3>

                    <div className="space-y-6">
                        {[...Array(totalQuestions)].map((_, index) => (
                            <div key={index} className="border p-4 rounded">
                                <h3 className="text-lg font-semibold mb-2 flex justify-between">
                                    <span>
                                        Q{index + 1} of {totalQuestions}
                                    </span>
                                </h3>

                                <input
                                    type="text"
                                    placeholder={`Question ${index + 1}`}
                                    className="border border-slate-700 rounded p-3 bg-slate-100 text-slate-900 placeholder-slate-900 w-full mb-4"
                                    {...register(`question_${index + 1}`, {
                                        required: "Question is required",
                                    })}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {["A", "B", "C", "D"].map((option) => (
                                        <div
                                            key={option}
                                            className="flex items-center space-x-2"
                                        >
                                            <input
                                                type="radio"
                                                value={option}
                                                {...register(
                                                    `correct_${index + 1}`,
                                                    {
                                                        required:
                                                            "Correct answer must be selected",
                                                    }
                                                )}
                                            />
                                            <input
                                                type="text"
                                                placeholder={`Option ${option}`}
                                                className="border border-slate-700 rounded p-3 bg-slate-100 text-slate-900 placeholder-slate-900 w-full"
                                                {...register(
                                                    `answer_${
                                                        index + 1
                                                    }_${option}`,
                                                    {
                                                        required:
                                                            "Option is required",
                                                    }
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/badges")}
                            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                        >
                            Update Badge
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal for scheduling */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div 
                        className="bg-card rounded-lg p-6 max-w-md w-full shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Schedule Meeting</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-full hover:bg-secondary"
                            >
                                <X size={20} />
                            </button>
                        </div>
                                                
                        <form onSubmit={handleSubmitSchedule}>
                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <div className="relative">
                                        <FolderPen size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                        <input 
                                            type="text"
                                            required
                                            value={scheduleTitle}
                                            placeholder="Enter meeting title"
                                            onChange={(e) => setScheduleTitle(e.target.value)}
                                            className="pl-10 pr-4 py-2 w-full bg-secondary rounded-md border border-input"
                                        />
                                    </div>
                                </div>
                                

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                        <input 
                                            type="date"
                                            required
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="pl-10 pr-4 py-2 w-full bg-secondary rounded-md border border-input"
                                            min={new Date().toISOString().split('T')[0]} // Prevent past dates
                                        />
                                    </div>
                                </div>
                                
                                {/* Time */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Time (Your Local Time)</label>
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                        <input 
                                            type="time"
                                            required
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            className="pl-10 pr-4 py-2 w-full bg-secondary rounded-md border border-input"
                                        />
                                    </div>
                                </div>
                                                                
                                {/* Actions */}
                                <div className="flex justify-end space-x-3 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="btn-outline"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="btn-primary flex items-center"
                                    >
                                        <Check size={18} className="mr-1" />
                                        Approve & Schedule
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBadgeUpdate;
