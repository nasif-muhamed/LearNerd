import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import CourseUploadHeader from './CourseUploadHeader';
import InputField from './InputField';
import CourseFormNavigation from './CourseFormNavigation';

const Step1CourseBasicInfo = ({setStep}) => {
    // Form state
    const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm({
        defaultValues: {
            title: "",
            description: "",
            category: "",
            thumbnail: "",
            freemium: true,
            subscription: true,
            subscription_amount: "",
            video_session: 1,
            chat_upto: 30,
            safe_period: 14,
        }
    });
    
    const [categories, setCategories] = useState([]);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const subscription = watch("subscription");
    console.log(watch("title"), watch("description"));


    // Load existing data if editing
    useEffect(() => {
        // // Fetch categories from backend
        // fetch("/api/categories") // Change this to your API endpoint
        //     .then((res) => res.json())
        //     .then((data) => setCategories(data))
        //     .catch((err) => console.error("Error fetching categories", err));
        setCategories(['tech', 'biology', 'commerce'])
        // const existingData = localStorage.getItem("courseBasicInfo");
        // if (existingData) {
        //     setFormData(JSON.parse(existingData));
        // }
    }, []);

    // // Handle input change
    // const handleChange = (e) => {
    //     const { id, value, type, checked } = e.target;
    //     setFormData((prev) => ({
    //         ...prev,
    //         [id]: type === "checkbox" ? checked : value,
    //     }));
    // };


    // Handle form submission
    const onSubmit = async (data) => {
            // Save to localStorage for persistence between steps
            // localStorage.setItem("courseBasicInfo", JSON.stringify(formData));
            if (!data.thumbnail) {
                toast.error('Thumbnail is required')
                return
            }
            try {
                console.log('data:', data)
                // API call to save basic info
                // const response = await fetch('api/courses', {
                //   method: 'POST',
                //   headers: {
                //     'Content-Type': 'application/json',
                //   },
                //   body: JSON.stringify(formData),
                // });
                // const data = await response.json();

                // Mock response for now
                // const mockResponse = { id: 1, ...formData };

                // Store course ID for subsequent steps 
                // localStorage.setItem("currentCourseId", mockResponse.id);

                toast("Basic course details have been saved successfully.");

                // Navigate to next step
                setStep(2);
            } catch (error) {
                console.error("Error saving course:", error);
                toast.error(
                    "There was a problem saving your course details. Please try again."
                );
            }
        
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setThumbnailPreview(reader.result);
            reader.readAsDataURL(file);
            setValue("thumbnail", file);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in ">
            <CourseUploadHeader currentStep={1} totalSteps={4} title="Course Basic Information" />

            <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <InputField
                            label="Course Title"
                            placeholder="Enter course title"
                            error={errors.title?.message}
                            register={{...register("title", { required: "Title is required", minLength: { value: 10, message: "Title must be at least 10 characters" } })}}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <InputField
                            label="Course Description"
                            placeholder="Enter detailed course description"
                            textarea
                            error={errors.description?.message}
                            register={{...register("description", { required: "Description is required", minLength: { value: 50, message: "Description must be at least 50 characters" } })}}
                        />
                    </div>
                    
                    <Controller
                        name="category"
                        control={control}
                        rules={{ required: "Category is required" }}
                        render={({ field }) => (
                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <select {...field} className="input-field text-black">
                                    <option value="">Select a category</option>
                                    {categories.map((cat, idx) => (
                                        <option key={idx} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-red-400 text-sm">{errors.category.message}</p>}
                            </div>
                        )}
                    />
                    <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium">Access Options</label>
                        <label className="flex items-center">
                            <input type="checkbox" {...register("freemium")} className="mr-2 h-4 w-4" />
                            Freemium (Allow free preview)
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" {...register("subscription")} className="mr-2 h-4 w-4" />
                            Subscription
                        </label>
                    </div>



                    {subscription && (
                        <>
                            <InputField
                                label="Subscription Amount"
                                type="number"
                                placeholder="Enter amount"
                                error={errors.subscription_amount?.message}
                                register={{...register("subscription_amount", { required: "Subscription amount is required", min: { value: 1, message: "Amount must be greater than 0" } })}}
                            />
                            <InputField
                                label="Video Sessions"
                                type="number"
                                placeholder="Number of video sessions"
                                error={errors.video_session?.message}
                                register={{...register("video_session", { required: "Must be at least 1", min: { value: 1, message: "Must be at least 1" } })}}
                            />
                            <InputField
                                label="Chat Available (days)"
                                type="number"
                                placeholder="Number of days"
                                error={errors.chat_upto?.message}
                                register={{...register("chat_upto", { required: "Must be at least 1", min: { value: 1, message: "Must be at least 1 day" } })}}
                            />
                            <InputField
                                label="Safe Period (days)"
                                type="number"
                                placeholder="Number of days"
                                error={errors.safe_period?.message}
                                register={{...register("safe_period", { required: "Must be at least 1", min: { value: 1, message: "Must be at least 1 day" } })}}
                            />
                        </>
                    )}
        
                    <div className="">
                        <label className="block text-sm font-medium mb-2">Thumbnail</label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="input-field" />
                        {thumbnailPreview && <img src={thumbnailPreview} alt="Thumbnail Preview" className="mt-2 rounded-lg max-h-48" />}
                        {errors.thumbnail && <p className="text-red-500 text-sm">{errors.thumbnail.message}</p>}
                    </div>

                </div>
                <CourseFormNavigation currentStep={1} onNext={handleSubmit(onSubmit)} />
            </form>
        </div>
    );
};

export default Step1CourseBasicInfo;
