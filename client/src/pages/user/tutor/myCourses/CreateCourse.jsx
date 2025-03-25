import React, { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";
import Step1CourseBasicInfo from "../../../../components/user/tutor/myCourses/courseUpload/Step1CourseBasicInfo";
import Step2CourseObjectives from "../../../../components/user/tutor/myCourses/courseUpload/Step2CourseObjectives";
import Step3CourseContent from "../../../../components/user/tutor/myCourses/courseUpload/Step3CourseContent";
import Step4CoursePreview from "../../../../components/user/tutor/myCourses/courseUpload/Step4CoursePreview";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner"
import CourseUploadHeader from "../../../../components/user/tutor/myCourses/courseUpload/CourseUploadHeader";
import api from "../../../../services/api/axiosInterceptor";
import handleError from "../../../../utils/handleError";
import { useParams } from "react-router-dom";

const CreateCourse = ({}) => {
    const { draftId } = useParams();
    const [step, setStep] = useState(1);
    const [uploadedCourse, setUploadedCourse] = useState(null)
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    console.log('draftId', draftId)
    // step1 state for basic course details
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [thumbnail, setThumbnail] = useState(null);
    const [freemium, setFreemium] = useState(true);
    const [subscription, setSubscription] = useState(true);
    const [subscriptionAmount, setSubscriptionAmount] = useState("");
    const [videoSession, setVideoSession] = useState(null);
    const [chat_upto, setChatUpto] = useState(null);
    const [safe_period, setSafePeriod] = useState(null);
    const [categories, setCategories] = useState([]);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [updateCourseThumb, setUpdateCourseThumb] = useState(null)

    // step2 State for objectives and requirements
    const [objectives, setObjectives] = useState([]);
    const [requirements, setRequirements] = useState([]);

    // step3 State for sections
    const [sections, setSections] = useState([]);
    const [showSectionForm, setShowSectionForm] = useState(false);
    const [sectionTitle, setSectionTitle] = useState("");
    const [editingSectionIndex, setEditingSectionIndex] = useState(null);

    const fetchUploadedCourse = async (id) => {
        setLoading(true)
        try{
            const response = await api.get(`courses/incomplete-course/${id}/content/`);
            console.log('res create or draft:', response)
            const result = response.data 
            setUploadedCourse(prevState => ({
                ...prevState,
                ...result,
            }));
            // setStep(result.step)
        } catch (error) {
            console.error("Error saving course:", error);
            handleError(error, "There was a problem fetching your course details. Please try again.");
        }finally{
            setLoading(false)
        }
    }
    
    useEffect(() => {
        if (draftId && !uploadedCourse){
            fetchUploadedCourse(draftId);
        } 
        if (uploadedCourse?.id && !uploadedCourse.description){
            fetchUploadedCourse(uploadedCourse.id);
        } 
    }, [draftId, uploadedCourse?.id])

    useEffect(() => {
        if (sessionStorage.getItem("isRefreshing")) {
            sessionStorage.removeItem("isRefreshing"); // Remove flag after refresh
            navigate("/tutor/my-courses"); // Redirect user to the my-course page
        }

        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue =
                "The data you've added may be lost if it is not saved. The saved data can be accessed through drafts.";
            sessionStorage.setItem("isRefreshing", "true"); // Set flag before refresh
        };

        const handlePopState = () => {
            const confirmLeave = window.confirm(
                "The data you've added may be lost if it is not saved. The saved data can be accessed through drafts."
            );
            if (!confirmLeave) {
                window.history.pushState(null, null, window.location.pathname);
            } else {
                navigate("/tutor/my-courses");
            }
        };

        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [navigate]);

    // // Handle refresh or tab close
    // useEffect(() => {
    //     const handleBeforeUnload = (event) => {
    //         event.preventDefault();
    //         event.returnValue = confirmMessage; // For modern browsers
    //         return confirmMessage; // For older browsers
    //     };

    //     window.addEventListener('beforeunload', handleBeforeUnload);

    //     return () => {
    //         window.removeEventListener('beforeunload', handleBeforeUnload);
    //     };
    // }, []);

    // // Handle browser back button
    // useEffect(() => {
    //     const handlePopState = (event) => {
    //         const confirmed = window.confirm(confirmMessage);
    //         if (!confirmed) {
    //             // If the user cancels, push the current state back to prevent navigation
    //             window.history.pushState(null, null, window.location.pathname);
    //         } else {
    //             // If confirmed, allow navigation (e.g., back to my-courses)
    //             navigate('/tutor/my-courses');
    //         }
    //     };

    //     // Add a history state to detect back navigation
    //     window.history.pushState(null, null, window.location.pathname);
    //     window.addEventListener('popstate', handlePopState);

    //     return () => {
    //         window.removeEventListener('popstate', handlePopState);
    //     };
    // }, [navigate]);

    return (
        <div>
            {loading && <LoadingSpinner/>}
            {step == 1 ? (
                <Step1CourseBasicInfo
                    setStep={setStep}
                    // loading={loading}
                    setLoading={setLoading}
                    setUploadedCourse={setUploadedCourse}
                    uploadedCourse={uploadedCourse}
                    title={title}
                    setTitle={setTitle}
                    description={description}
                    setDescription={setDescription}
                    category={category}
                    setCategory={setCategory}
                    thumbnail={thumbnail}
                    setThumbnail={setThumbnail}
                    freemium={freemium}
                    setFreemium={setFreemium}
                    subscription={subscription}
                    setSubscription={setSubscription}
                    subscriptionAmount={subscriptionAmount}
                    setSubscriptionAmount={setSubscriptionAmount}
                    videoSession={videoSession}
                    setVideoSession={setVideoSession}
                    chat_upto={chat_upto}
                    setChatUpto={setChatUpto}
                    safe_period={safe_period}
                    setSafePeriod={setSafePeriod}
                    categories={categories}
                    setCategories={setCategories}
                    thumbnailPreview={thumbnailPreview}
                    setThumbnailPreview={setThumbnailPreview}
                    updateCourseThumb={updateCourseThumb}
                    setUpdateCourseThumb={setUpdateCourseThumb}
                />
            ) : step === 2 && uploadedCourse ? (
                <Step2CourseObjectives 
                    setStep={setStep} 
                    // loading={loading}
                    setLoading={setLoading}
                    uploadedCourse={uploadedCourse}
                    setUploadedCourse={setUploadedCourse}
                    objectives = {objectives}
                    setObjectives = {setObjectives}
                    requirements = {requirements}
                    setRequirements = {setRequirements}
                />
            ) : step === 3 && uploadedCourse ? (
                <Step3CourseContent
                    setStep={setStep}
                    // loading={loading}
                    setLoading={setLoading}
                    uploadedCourse={uploadedCourse}
                    setUploadedCourse={setUploadedCourse}
                    sections={sections}
                    setSections={setSections}
                    showSectionForm={showSectionForm}
                    setShowSectionForm={setShowSectionForm}
                    sectionTitle={sectionTitle}
                    setSectionTitle={setSectionTitle}
                    editingSectionIndex={editingSectionIndex}
                    setEditingSectionIndex={setEditingSectionIndex}
                />
            ) : uploadedCourse ? (
                <Step4CoursePreview setStep={setStep} uploadedCourse={uploadedCourse} />
            ): (
                <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in ">
                    <CourseUploadHeader currentStep={0} totalSteps={4} title="Something Went wrong" />
                </div>
            )}
        </div>
    );
};

export default CreateCourse;
