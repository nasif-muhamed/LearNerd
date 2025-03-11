import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../../services/api/axiosInterceptor";
import LoadingSpinner from "../../../components/ui/LoadingSpinner"


const AdminBadgeCreate = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()
    const {
        register,
        handleSubmit,
        formState: { errors },
        trigger,
        getValues,
        setValue,
    } = useForm();

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setValue("badgeImage", file); // Store file for FormData submission
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmitFirstStep = async () => {
        const isValid = await trigger([
            "title",
            "description",
            "totalQuestions",
            "passMark",
        ]);
        if (isValid) {
            setCurrentStep(2);
        }
    };

    const onSubmitFinalForm = async (data) => {
        setLoading(true);
        try {
            // Prepare FormData for multipart/form-data submission
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("description", data.description);
            if (!data.badgeImage) {
                toast.error('Image is required')
                return 
            }
            formData.append("image", data.badgeImage);
            formData.append("community", data.community || false);
            if (parseInt(data.totalQuestions) < parseInt(data.passMark)) {
                toast.error('Passmark should not be greater than total questions')
                return 
            }
            formData.append("total_questions", parseInt(data.totalQuestions));
            formData.append("pass_mark", parseInt(data.passMark));

            // Prepare questions array
            const questions = Array.from(
                { length: totalQuestions },
                (_, index) => ({
                    question: data[`question_${index + 1}`],
                    order: index + 1,
                    answers: [
                        {
                            options: "A",
                            answer: data[`answer_${index + 1}_A`],
                            is_correct: data[`correct_${index + 1}`] === "A",
                        },
                        {
                            options: "B",
                            answer: data[`answer_${index + 1}_B`],
                            is_correct: data[`correct_${index + 1}`] === "B",
                        },
                        {
                            options: "C",
                            answer: data[`answer_${index + 1}_C`],
                            is_correct: data[`correct_${index + 1}`] === "C",
                        },
                        {
                            options: "D",
                            answer: data[`answer_${index + 1}_D`],
                            is_correct: data[`correct_${index + 1}`] === "D",
                        },
                    ],
                })
            );
            formData.append("questions_raw", JSON.stringify(questions));

            // Submit to backend
            const response = await api.post(
                "badges/",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log("Badge created:", response.data);
            toast.success("Badge created successfully!");
            navigate('/admin/badges')

        } catch (error) {

            console.error("Error creating badge:", error);
            if (error.response?.data){
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error(error instanceof Error ? error.message : 'Something went wrong');
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {loading && <LoadingSpinner />}

            <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Add Badge</h2>

                <form onSubmit={handleSubmit(onSubmitFinalForm)} className="">
                    {currentStep === 1 && (
                        // ... First step form fields ...
                        <div className="space-y-4">
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
                                <label className="block mb-2">
                                    Description
                                </label>

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
                                <label className="block mb-2">
                                    Badge Image
                                </label>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="border border-slate-700 rounded p-3 bg-slate-100 text-slate-900 placeholder-slate-900 w-full"
                                        onChange={handleImageUpload}
                                    />
                                    {imagePreview && (
                                        <div className="w-20 h-20 rounded-full overflow-hidden">
                                            <img
                                                src={imagePreview}
                                                alt="Badge Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className="block mb-2">
                                        Total Questions
                                    </label>
                                    <input
                                        type="number"
                                        className="border border-slate-700 rounded p-3 bg-slate-100 text-slate-900 placeholder-slate-900 w-full"
                                        defaultValue={10}
                                        {...register("totalQuestions", {
                                            required:
                                                "Total questions is required",
                                            min: {
                                                value: 1,
                                                message:
                                                    "Must be at least 1 question",
                                            },
                                        })}
                                        onChange={(e) =>
                                            setTotalQuestions(
                                                parseInt(e.target.value)
                                            )
                                        }
                                    />
                                    {errors.totalQuestions && (
                                        <p className="text-red-500">
                                            {errors.totalQuestions.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <label className="block mb-2">
                                        Pass Mark
                                    </label>
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
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    {...register("community")}
                                />
                                <label>Community</label>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={onSubmitFirstStep}
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        // ... Second step form fields ...
                        <div className="space-y-6">
                            {[...Array(totalQuestions)].map((_, index) => (
                                <div key={index} className="border p-4 rounded">
                                    <h3 className="text-lg font-semibold mb-2">
                                        Q{index + 1} of {totalQuestions}
                                    </h3>
                                    <input
                                        type="text"
                                        placeholder={`Question ${index + 1}`}
                                        className="border border-slate-700 rounded p-3 bg-slate-100 text-slate-900 placeholder-slate-900 w-full mb-4"
                                        {...register(`question_${index + 1}`, {
                                            required: "Question is required",
                                        })}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
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

                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    Finish
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AdminBadgeCreate;
