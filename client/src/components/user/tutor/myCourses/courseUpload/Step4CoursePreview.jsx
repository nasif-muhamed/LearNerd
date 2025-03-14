import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Edit, ChevronRight, ChevronDown } from "lucide-react";
import CourseUploadHeader from "./CourseUploadHeader";
import CourseFormNavigation from "./CourseFormNavigation";

const Step4CoursePreview = ({ setStep }) => {
    const navigate = useNavigate();

    // State for course data
    const [courseData, setCourseData] = useState({
        basicInfo: null,
        objectives: [],
        requirements: [],
        sections: [],
    });

    const [expandedSections, setExpandedSections] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load data from local storage
    useEffect(() => {
        const basicInfo = localStorage.getItem("courseBasicInfo");
        const objectives = localStorage.getItem("courseObjectives");
        const requirements = localStorage.getItem("courseRequirements");
        const sections = localStorage.getItem("courseSections");

        setCourseData({
            basicInfo: basicInfo ? JSON.parse(basicInfo) : null,
            objectives: objectives ? JSON.parse(objectives) : [],
            requirements: requirements ? JSON.parse(requirements) : [],
            sections: sections ? JSON.parse(sections) : [],
        });

        // Initialize expanded sections
        if (sections) {
            const sectionsData = JSON.parse(sections);
            const expanded = {};
            sectionsData.forEach((_, index) => {
                expanded[index] = false;
            });
            setExpandedSections(expanded);
        }
    }, []);

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
                navigate("/course-upload/basics");
                break;
            case "objectives":
                navigate("/course-upload/objectives");
                break;
            case "content":
                navigate("/course-upload/content");
                break;
            default:
                break;
        }
    };

    // Submit course
    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            // API call to publish course
            // const courseId = localStorage.getItem('currentCourseId');
            // await fetch(`api/courses/${courseId}/publish`, {
            //   method: 'PUT',
            //   headers: {
            //     'Content-Type': 'application/json',
            //   },
            //   body: JSON.stringify({ is_active: true }),
            // });

            toast("Your course is now live and available to students.");

            // Clear local storage after successful submission
            localStorage.removeItem("courseBasicInfo");
            localStorage.removeItem("courseObjectives");
            localStorage.removeItem("courseRequirements");
            localStorage.removeItem("courseSections");
            localStorage.removeItem("currentCourseId");

            // Navigate to dashboard or course list
            navigate("/tutor/dashboard");
        } catch (error) {
            console.error("Error publishing course:", error);
            toast({
                variant: "destructive",
                title: "Error publishing course",
                description:
                    "There was a problem publishing your course. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Handle going back to previous step
    const handlePrevious = () => {
        setStep(3);
    };

    if (!courseData.basicInfo) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                <p className="text-lg text-muted-foreground">
                    Loading course data...
                </p>
            </div>
        );
    }

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
                                {courseData.basicInfo.title}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Category
                            </p>
                            <p className="font-medium">
                                {courseData.basicInfo.category}
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">
                                Description
                            </p>
                            <p className="font-medium">
                                {courseData.basicInfo.description}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Price Model
                            </p>
                            <div className="flex space-x-2 mt-1">
                                {courseData.basicInfo.freemium && (
                                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                        Freemium
                                    </span>
                                )}
                                {courseData.basicInfo.subscription && (
                                    <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">
                                        Subscription ($
                                        {
                                            courseData.basicInfo
                                                .subscription_amount
                                        }
                                        )
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Support Details
                            </p>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                <div className="text-center px-2 py-1 bg-secondary/80 rounded-md">
                                    <p className="text-xs text-muted-foreground">
                                        Video Sessions
                                    </p>
                                    <p className="font-medium">
                                        {courseData.basicInfo.video_session}
                                    </p>
                                </div>
                                <div className="text-center px-2 py-1 bg-secondary/80 rounded-md">
                                    <p className="text-xs text-muted-foreground">
                                        Chat Available
                                    </p>
                                    <p className="font-medium">
                                        {courseData.basicInfo.chat_upto} days
                                    </p>
                                </div>
                                <div className="text-center px-2 py-1 bg-secondary/80 rounded-md">
                                    <p className="text-xs text-muted-foreground">
                                        Safe Period
                                    </p>
                                    <p className="font-medium">
                                        {courseData.basicInfo.safe_period} days
                                    </p>
                                </div>
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
                                {courseData.objectives.map(
                                    (objective, index) => (
                                        <li key={index} className="text-sm">
                                            {objective}
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
                                {courseData.requirements.map(
                                    (requirement, index) => (
                                        <li key={index} className="text-sm">
                                            {requirement}
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
                        {courseData.sections.map((section, sectionIndex) => (
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
                                                        <div className="min-w-[20px] mt-0.5 mr-2">
                                                            {item.item_type ===
                                                            "video" ? (
                                                                <span className="text-primary">
                                                                    •
                                                                </span>
                                                            ) : (
                                                                <span className="text-accent">
                                                                    ■
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
