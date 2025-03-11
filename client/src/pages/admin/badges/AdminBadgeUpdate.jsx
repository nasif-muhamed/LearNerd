import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import api from "../../../services/api/axiosInterceptor";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

const AdminBadgeUpdate = () => {
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const { badgeId } = useParams();
    const navigate = useNavigate();
    const [originalData, setOriginalData] = useState(null); // Store original data for comparison

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues,
        reset,
    } = useForm();

    useEffect(() => {
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
            toast.success("Badge updated successfully!");
        } catch (error) {
            console.error("Error updating badge:", error);
            if (error.response?.data) {
                toast.error(Object.values(error.response.data)?.[0]);
            } else {
                toast.error(
                    error instanceof Error ? error.message : "Something went wrong"
                );
            }
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {loading && <LoadingSpinner />}

            <div className="p-6 w-full max-w-4xl">
                <h2 className="text-2xl font-bold mb-4">Update Badge</h2>

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
        </div>
    );
};

export default AdminBadgeUpdate;
