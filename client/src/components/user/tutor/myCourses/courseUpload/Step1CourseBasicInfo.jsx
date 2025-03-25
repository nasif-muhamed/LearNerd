import { useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import CourseUploadHeader from './CourseUploadHeader';
import InputField from './InputField';
import CourseFormNavigation from './CourseFormNavigation';
import api from '../../../../../services/api/axiosInterceptor'

const Step1CourseBasicInfo = ({
    setStep,
    setLoading,
    setUploadedCourse,
    uploadedCourse,
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    thumbnail,
    setThumbnail,
    freemium,
    setFreemium,
    subscription,
    setSubscription,
    subscriptionAmount,
    setSubscriptionAmount,
    videoSession,
    setVideoSession,
    chat_upto,
    setChatUpto,
    safe_period,
    setSafePeriod,
    categories,
    setCategories,
    thumbnailPreview,
    setThumbnailPreview,
    updateCourseThumb,
    setUpdateCourseThumb,
}) => {
    // Form state
    console.log('categories:', categories, categories.length)
    console.log('uploadedCourse', uploadedCourse)
    const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm({
        defaultValues: {
            title: title,
            description: description,
            category: category,
            thumbnail: thumbnail,
            freemium: freemium,
            subscription: subscription,
            subscription_amount: subscriptionAmount,
            video_session: videoSession,
            chat_upto: chat_upto,
            safe_period: safe_period,
        }
    });
    const subscriptionWatch = watch("subscription");

    useEffect(() => {
        if (uploadedCourse) {
            setTitle(uploadedCourse.title || "");
            setDescription(uploadedCourse.description || "");
            setCategory(uploadedCourse.category || "");
            setFreemium(uploadedCourse.freemium ?? true);
            setSubscription(uploadedCourse.subscription ?? true);
            setSubscriptionAmount(uploadedCourse.subscription_amount || "");
            setVideoSession(uploadedCourse.video_session || null);
            setChatUpto(uploadedCourse.chat_upto || null);
            setSafePeriod(uploadedCourse.safe_period || null);
            setThumbnailPreview(uploadedCourse.thumbnail || null);
            reset({
                title: uploadedCourse.title || "",
                description: uploadedCourse.description || "",
                category: uploadedCourse.category || "",
                freemium: uploadedCourse.freemium ?? true,
                subscription: uploadedCourse.subscription ?? true,
                subscription_amount: uploadedCourse.subscription_amount || "",
                video_session: uploadedCourse.video_session || null,
                chat_upto: uploadedCourse.chat_upto || null,
                safe_period: uploadedCourse.safe_period || null,
            });
        }
    }, [uploadedCourse, reset]);

    const fetchCategories = async () => {
        setLoading(true)
        try{
            const response = await api.get('/courses/categories/user/')
            console.log(response)
            setCategories(response.data)
        }catch (error) {
            console.error("Error saving course:", error);
            toast.error("There was a problem where fetching categories.");
        }finally{
            setLoading(false)
        }
        
    }

    // Load existing data if editing
    useEffect(() => {
        if (!categories.length){
            fetchCategories()
        }
    }, [categories]);

    const handleImageUpload = (e) => {
        console.log('here in the image upload')
        const file = e.target.files[0];
        if (uploadedCourse) setUpdateCourseThumb(file)
        console.log('file:',file)
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setThumbnailPreview(reader.result);
            reader.readAsDataURL(file);
            setValue("thumbnail", file);
        }
    };

    // // Handle input change
    // const handleChange = (e) => {
    //     const { id, value, type, checked } = e.target;
    //     setFormData((prev) => ({
    //         ...prev,
    //         [id]: type === "checkbox" ? checked : value,
    //     }));
    // };

    // Handle form upload
    const onUpload = async (data) => {
        console.log('data upload:', data)
        setLoading(true)
        if (!data.thumbnail) {
            toast.error('Thumbnail is required')
            setLoading(false)
            return
        }
        setTitle(data.title)
        setDescription(data.description)
        setCategory(data.category)
        setThumbnail(data.thumbnail)
        setFreemium(data.freemium)
        setSubscription(data.subscription)
        setSubscriptionAmount(data.subscription_amount)
        setVideoSession(data.video_session)
        setChatUpto(data.chat_upto)
        setSafePeriod(data.safe_period)
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('category', data.category);
            formData.append('freemium', data.freemium);
            formData.append('subscription', data.subscription);
            if (data.subscription){
                formData.append('subscription_amount', data.subscription_amount);
                formData.append('video_session', data.video_session);
                formData.append('chat_upto', data.chat_upto);
                formData.append('safe_period', data.safe_period);
            }
            formData.append('thumbnail_file', data.thumbnail);
            
            const response = await api.post('courses/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const result = await response.data;
            console.log('response:', result)
            setUploadedCourse(result);
            toast("Basic course details have been saved successfully.");
        } catch (error) {
            console.error("Error saving course:", error);
            if (error.response?.data){
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error("There was a problem saving your course details. Please try again.");
                toast.error(error.message || 'Something went wrong');
            }
        
        } finally {
            setLoading(false)
        }
    };

    // Handle form update
    const onUpdate = async (data) => {
        console.log('data update:', data)
        setLoading(true)
        
        // Create plain JSON object for changed data only
        const updateData = {};
        
        if (data.title !== title) {
            updateData.title = data.title;
        }
        if (data.description !== description) {
            updateData.description = data.description;
        }
        if (data.category !== category) {
            updateData.category = data.category;
        }
        if (data.freemium !== freemium) {
            updateData.freemium = data.freemium;
        }
        if (data.subscription !== subscription) {
            updateData.subscription = data.subscription;
            if (data.subscription) {
                updateData.subscription_amount = data.subscription_amount;
                updateData.video_session = data.video_session;
                updateData.chat_upto = data.chat_upto;
                updateData.safe_period = data.safe_period;
            }
        }
        console.log('obje:', updateData)
        // Check if there are any changes
        if (Object.keys(updateData).length === 0) {
            toast.info("No changes detected");
            setLoading(false);
            return;
        }
        updateData.id= uploadedCourse.id
        try {
            const response = await api.patch('courses/', updateData);
            const result = await response.data;
            console.log('response:', result)
            setUploadedCourse(result);
            toast.success("Basic course details have been updated successfully.");
            if (data.title !== title) {
                setTitle(data.title)
            }
            if (data.description !== description) {
                setDescription(data.description)
            }
            if (data.category !== category) {
                setCategory(data.category)
            }
            if (data.freemium !== freemium) {
                setFreemium(data.freemium)
            }
            if (data.subscription !== subscription) {
                setSubscription(data.subscription)
                if (data.subscription) {
                    setSubscriptionAmount(data.subscription_amount)
                    setVideoSession(data.video_session)
                    setChatUpto(data.chat_upto)
                    setSafePeriod(data.safe_period)        
                }
            }    
        } catch (error) {
            console.error("Error saving course:", error);
            if (error.response?.data) {
                toast.error(Object.values(error.response?.data)?.[0]);
            } else {
                toast.error("There was a problem saving your course details. Please try again.");
                toast.error(error.message || 'Something went wrong');
            }
        } finally {
            setLoading(false)
        }
    };

    // Handle update image only
    const updateThumbnail = async () => {
        if (!updateCourseThumb) {
            toast.info("Please select an image to update the thumbnail.");
            return;
        }
        // console.log('differences',thumbnail.name, updateCourseThumb.name, thumbnail.name === updateCourseThumb.name && thumbnail.size === updateCourseThumb.size, thumbnail , updateCourseThumb)
        if (thumbnail?.name && updateCourseThumb && thumbnail.name === updateCourseThumb.name && thumbnail.size === updateCourseThumb.size) {
            toast.info("Thumbnail Not changed.");
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append('id', uploadedCourse.id)
        formData.append("thumbnail_file", updateCourseThumb);
        console.log('form:', formData.entries())
        try {
            const response = await api.patch("courses/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            const result = await response.data;
            console.log("response image upload:", result);
            setUploadedCourse(prev => ({...prev, ...result}))
            setThumbnail(updateCourseThumb)
            setUpdateCourseThumb(null); // Reset on success
            toast.success("Thumbnail updated successfully.");
        } catch (error) {
            console.error("Error updating thumbnail:", error);
            const errorMessage =
                error.response?.data && Object.values(error.response.data)[0]
                    ? Object.values(error.response.data)[0]
                    : "There was a problem updating the thumbnail. Please try again.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle next button
    const handleNext = () => {
        setStep(2)
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
            <CourseUploadHeader currentStep={1} totalSteps={4} title="Course Basic Information" />

            <form onSubmit={handleSubmit(onUpload)} className="bg-card border border-border rounded-lg shadow-lg p-6">
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
                                        <option key={idx} value={cat.id}>{cat.title}</option>
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



                    {subscriptionWatch && (
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
        
                    <div className="flex gap-2 flex-col md:flex-row">
                        <div>
                            <label className="block text-sm font-medium mb-2">Thumbnail</label>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="input-field" />
                            {
                                updateCourseThumb && 
                                <button
                                    type="button"
                                    onClick={updateThumbnail}
                                    className="mt-6 px-6 py-3 bg-green-900 hover:bg-secondary/80 text-foreground rounded-md transition-colors"
                                >
                                    Update Thumbnail
                                </button>
                            }
                        </div>
                        {thumbnailPreview && <img src={thumbnailPreview} alt="Thumbnail Preview" className="mt-2 rounded-lg max-h-48" />}
                        {errors.thumbnail && <p className="text-red-500 text-sm">{errors.thumbnail.message}</p>}
                    </div>

                </div>
                <CourseFormNavigation currentStep={1} update={uploadedCourse} disableNext={!uploadedCourse} onUpsert={!uploadedCourse? handleSubmit(onUpload) : handleSubmit(onUpdate)} onNext={handleNext} uploadedCourse={uploadedCourse} />
            </form>
        </div>
    );
};

export default Step1CourseBasicInfo;
