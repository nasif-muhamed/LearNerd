import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Edit, ChevronRight, ChevronDown, CheckSquare, Video } from "lucide-react";
import CourseUploadHeader from "./CourseUploadHeader";
import CourseFormNavigation from "./CourseFormNavigation";
import handleError from "../../../../../utils/handleError";
import api from "../../../../../services/api/axiosInterceptor";

const Step4CoursePreview = ({ 
    setStep,
    uploadedCourse,
}) => {
    const navigate = useNavigate();
    // // State for course data
    // const [courseData, setCourseData] = useState({
    //     basicInfo: null,
    //     objectives: [],
    //     requirements: [],
    //     sections: [],
    // });

    console.log('uploadedCourse step4:', uploadedCourse)
    const [expandedSections, setExpandedSections] = useState({});
    const [loading, setLoading] = useState(false);

    // Toggle section expansion
    const toggleSection = (index) => {
        setExpandedSections((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    // Navigate to edit page
    const handleEdit = (section) => {
        switch (section) {
            case "basicInfo":
                setStep(1);
                break;
            case "objectives":
                setStep(2);
                break;
            case "content":
                setStep(3);
                break;
            default:
                break;
        }
    };

    // Submit course
    const handleSubmit = async () => {
        try {
            setLoading(true);
            const response = await api.patch('courses/', {
                id:uploadedCourse.id,
                is_complete: true,
                is_available: true,
            })
            toast.success("Your course is now live and available to students.");
            // Navigate to dashboard or course list
            navigate("/tutor/my-courses");
        } catch (error) {
            console.error("Error publishing course:", error);
            handleError(error, "Failed Publishing course")
        } finally {
            setLoading(false);
        }
    };

    // Handle going back to previous step
    const handlePrevious = () => {
        setStep(3);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
            <CourseUploadHeader
                currentStep={4}
                totalSteps={4}
                title="Review Your Course"
            />

            <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
                {/* Basic Info Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-medium">
                            Basic Information
                        </h2>
                        <button
                            type="button"
                            onClick={() => handleEdit("basicInfo")}
                            className="flex items-center text-primary hover:text-primary/80 transition-colors"
                        >
                            <Edit size={16} className="mr-1" /> Edit
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Title
                            </p>
                            <p className="font-medium">
                                {uploadedCourse.title}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Category
                            </p>
                            <p className="font-medium">
                                {uploadedCourse.category}
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">
                                Description
                            </p>
                            <p className="font-medium">
                                {uploadedCourse.description}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Price Model
                            </p>
                            <div className="flex space-x-2 mt-3">
                                {uploadedCourse.freemium && (
                                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                        Freemium
                                    </span>
                                )}
                                {uploadedCourse.subscription && (
                                    <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                                        Subscription (₹{uploadedCourse.subscription_amount})
                                    </span>
                                )}
                            </div>
                        </div>

                        {uploadedCourse.subscription &&
                            (<div>
                                <p className="text-sm text-muted-foreground">
                                    Support Details
                                </p>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                    <div className="text-center px-2 py-1 bg-secondary/80 rounded-md">
                                        <p className="text-xs text-muted-foreground">
                                            Video Sessions
                                        </p>
                                        <p className="font-medium">
                                            {uploadedCourse.video_session}
                                        </p>
                                    </div>
                                    <div className="text-center px-2 py-1 bg-secondary/80 rounded-md">
                                        <p className="text-xs text-muted-foreground">
                                            Chat Available
                                        </p>
                                        <p className="font-medium">
                                            {uploadedCourse.chat_upto} days
                                        </p>
                                    </div>
                                    <div className="text-center px-2 py-1 bg-secondary/80 rounded-md">
                                        <p className="text-xs text-muted-foreground">
                                            Safe Period
                                        </p>
                                        <p className="font-medium">
                                            {uploadedCourse.safe_period} days
                                        </p>
                                    </div>
                                </div>
                            </div>)
                        }

                    </div>

                    <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground my-2">Thumbnail</p>
                    <div className="flex justify-center">
                        <div className="w-full max-w-md aspect-video overflow-hidden">
                            <img
                                src={uploadedCourse.thumbnail}
                                alt="Course Thumbnail"
                                className="w-full h-full object-cover object-center"
                            />
                        </div>
                    </div>
                    </div>                
                </div>

                {/* Objectives & Requirements Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-medium">
                            Objectives & Requirements
                        </h2>
                        <button
                            type="button"
                            onClick={() => handleEdit("objectives")}
                            className="flex items-center text-primary hover:text-primary/80 transition-colors"
                        >
                            <Edit size={16} className="mr-1" /> Edit
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                            <p className="text-sm font-medium mb-2">
                                Learning Objectives
                            </p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {uploadedCourse?.objectives.map(
                                    (objective, index) => (
                                        <li key={index} className="text-sm">
                                            {objective.objective}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>

                        <div>
                            <p className="text-sm font-medium mb-2">
                                Course Requirements
                            </p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {uploadedCourse?.requirements.map(
                                    (requirement, index) => (
                                        <li key={index} className="text-sm">
                                            {requirement.requirement}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Course Content Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-medium">Course Content</h2>
                        <button
                            type="button"
                            onClick={() => handleEdit("content")}
                            className="flex items-center text-primary hover:text-primary/80 transition-colors"
                        >
                            <Edit size={16} className="mr-1" /> Edit
                        </button>
                    </div>

                    <div className="space-y-4">
                        {uploadedCourse.sections.map((section, sectionIndex) => (
                            <div
                                key={sectionIndex}
                                className="border border-border rounded-lg overflow-hidden"
                            >
                                <div
                                    className="flex justify-between items-center p-4 bg-secondary/30 cursor-pointer"
                                    onClick={() => toggleSection(sectionIndex)}
                                >
                                    <h3 className="font-medium">
                                        Section {sectionIndex + 1}:{" "}
                                        {section.title}
                                    </h3>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <span className="mr-2">
                                            {section.items.length} items
                                        </span>
                                        {expandedSections[sectionIndex] ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </div>
                                </div>

                                {expandedSections[sectionIndex] && (
                                    <div className="p-4 animate-accordion-down">
                                        <ul className="space-y-2">
                                            {section.items.map(
                                                (item, itemIndex) => (
                                                    <li
                                                        key={itemIndex}
                                                        className="text-sm flex items-start pl-4"
                                                    >
                                                        <div className="min-w-[20px] mt-0.5 mr-4">
                                                            {item.item_type ===
                                                            "video" ? (
                                                                <span className="text-primary">
                                                                    <Video size={18}/>
                                                                </span>
                                                            ) : (
                                                                <span className="text-accent">
                                                                    <CheckSquare size={18}/>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">
                                                                {item.title}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground capitalize">
                                                                {item.item_type}
                                                                {item.item_type ===
                                                                    "video" &&
                                                                    item.video &&
                                                                    ` • ${Math.floor(
                                                                        item
                                                                            .video
                                                                            .duration /
                                                                            60
                                                                    )}:${(
                                                                        item
                                                                            .video
                                                                            .duration %
                                                                        60
                                                                    )
                                                                        .toString()
                                                                        .padStart(
                                                                            2,
                                                                            "0"
                                                                        )}`}
                                                                {item.item_type ===
                                                                    "assessment" &&
                                                                    item.assessment &&
                                                                    ` • ${
                                                                        item
                                                                            .assessment
                                                                            .questions
                                                                            ?.length ||
                                                                        0
                                                                    } questions`}
                                                            </p>
                                                        </div>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center text-sm mb-4">
                    <CheckCircle2 size={20} className="text-primary mr-2" />
                    <span>
                        By submitting this course, you confirm that all content
                        complies with our terms of service.
                    </span>
                </div>

                <div className="flex items-center text-sm">
                    <CheckCircle2 size={20} className="text-primary mr-2" />
                    <span>
                        Your course will be reviewed by our team before being
                        published.
                    </span>
                </div>
            </div>

            <CourseFormNavigation
                currentStep={4}
                onNext={handleSubmit}
                onPrevious={handlePrevious}
                submitLabel="Submit Course"
            />
        </div>
    );
};

export default Step4CoursePreview;
