import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import CourseUploadHeader from './CourseUploadHeader';
import CourseFormNavigation from './CourseFormNavigation';

const CourseObjectives = ({setStep}) => {

    // State for objectives and requirements
    const [objectives, setObjectives] = useState([""]);
    const [requirements, setRequirements] = useState([""]);
    const [errors, setErrors] = useState({});

    // Load existing data if editing
    useEffect(() => {
        const existingObjectives = localStorage.getItem("courseObjectives");
        const existingRequirements = localStorage.getItem("courseRequirements");

        if (existingObjectives) {
            setObjectives(JSON.parse(existingObjectives));
        }

        if (existingRequirements) {
            setRequirements(JSON.parse(existingRequirements));
        }
    }, []);

    // Handle objective change
    const handleObjectiveChange = (index, value) => {
        const newObjectives = [...objectives];
        newObjectives[index] = value;
        setObjectives(newObjectives);
    };

    // Add new objective
    const addObjective = () => {
        setObjectives([...objectives, ""]);
    };

    // Remove objective
    const removeObjective = (index) => {
        if (objectives.length > 1) {
            const newObjectives = [...objectives];
            newObjectives.splice(index, 1);
            setObjectives(newObjectives);
        }
    };

    // Handle requirement change
    const handleRequirementChange = (index, value) => {
        const newRequirements = [...requirements];
        newRequirements[index] = value;
        setRequirements(newRequirements);
    };

    // Add new requirement
    const addRequirement = () => {
        setRequirements([...requirements, ""]);
    };

    // Remove requirement
    const removeRequirement = (index) => {
        if (requirements.length > 1) {
            const newRequirements = [...requirements];
            newRequirements.splice(index, 1);
            setRequirements(newRequirements);
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Check if any objective is empty
        const emptyObjectives =
            objectives.filter((obj) => !obj.trim()).length > 0;
        if (emptyObjectives) {
            newErrors.objectives = "All learning objectives must have content";
        }

        // Check if any requirement is empty
        const emptyRequirements =
            requirements.filter((req) => !req.trim()).length > 0;
        if (emptyRequirements) {
            newErrors.requirements =
                "All course requirements must have content";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    // Handle form submission
    const handleSubmit = async () => {
        if (validateForm()) {
            // Filter out empty entries
            const filteredObjectives = objectives.filter((obj) => obj.trim());
            const filteredRequirements = requirements.filter((req) =>
                req.trim()
            );

            // Save to localStorage
            localStorage.setItem(
                "courseObjectives",
                JSON.stringify(filteredObjectives)
            );
            localStorage.setItem(
                "courseRequirements",
                JSON.stringify(filteredRequirements)
            );

            try {
                // API call to save objectives and requirements
                // const courseId = localStorage.getItem('currentCourseId');
                // await fetch(`api/courses/${courseId}/objectives-requirements`, {
                //   method: 'POST',
                //   headers: {
                //     'Content-Type': 'application/json',
                //   },
                //   body: JSON.stringify({
                //     objectives: filteredObjectives.map((obj, index) => ({
                //       objective: obj,
                //       order: index
                //     })),
                //     requirements: filteredRequirements.map((req, index) => ({
                //       requirement: req,
                //       order: index
                //     }))
                //   }),
                // });

                toast("Course objectives and requirements have been saved.");

                // Navigate to next step
                setStep(3);
            } catch (error) {
                console.error("Error saving:", error);
                toast("There was a problem saving your data. Please try again.");
            }
        }
    };

    // Handle going back to previous step
    const handlePrevious = () => {
        setStep(1);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
            <CourseUploadHeader
                currentStep={2}
                totalSteps={4}
                title="Learning Objectives & Requirements"
            />

            <div className="bg-card border border-border rounded-lg shadow-lg p-6">
                {/* Learning Objectives Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium">
                            Learning Objectives
                        </h2>
                        <button
                            type="button"
                            onClick={addObjective}
                            className="flex items-center text-primary hover:text-primary/80 transition-colors"
                        >
                            <Plus size={16} className="mr-1" /> Add Objective
                        </button>
                    </div>

                    {errors.objectives && (
                        <p className="text-sm text-destructive mb-3">
                            {errors.objectives}
                        </p>
                    )}

                    <div className="space-y-3">
                        {objectives.map((objective, index) => (
                            <div key={index} className="flex items-center">
                                <div className="flex-shrink-0 mr-3 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                                    {index + 1}
                                </div>
                                <input
                                    type="text"
                                    value={objective}
                                    onChange={(e) =>
                                        handleObjectiveChange(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter a learning objective"
                                    className="flex-1 px-4 py-3 bg-secondary text-foreground rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeObjective(index)}
                                    disabled={objectives.length === 1}
                                    className={`ml-2 text-muted-foreground hover:text-destructive transition-colors ${
                                        objectives.length === 1
                                            ? "opacity-30 cursor-not-allowed"
                                            : ""
                                    }`}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Course Requirements Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium">
                            Course Requirements
                        </h2>
                        <button
                            type="button"
                            onClick={addRequirement}
                            className="flex items-center text-primary hover:text-primary/80 transition-colors"
                        >
                            <Plus size={16} className="mr-1" /> Add Requirement
                        </button>
                    </div>

                    {errors.requirements && (
                        <p className="text-sm text-destructive mb-3">
                            {errors.requirements}
                        </p>
                    )}

                    <div className="space-y-3">
                        {requirements.map((requirement, index) => (
                            <div key={index} className="flex items-center">
                                <div className="flex-shrink-0 mr-3 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm">
                                    {index + 1}
                                </div>
                                <input
                                    type="text"
                                    value={requirement}
                                    onChange={(e) =>
                                        handleRequirementChange(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter a course requirement"
                                    className="flex-1 px-4 py-3 bg-secondary text-foreground rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeRequirement(index)}
                                    disabled={requirements.length === 1}
                                    className={`ml-2 text-muted-foreground hover:text-destructive transition-colors ${
                                        requirements.length === 1
                                            ? "opacity-30 cursor-not-allowed"
                                            : ""
                                    }`}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <CourseFormNavigation
                currentStep={2}
                onNext={handleSubmit}
                onPrevious={handlePrevious}
            />
        </div>
    );
};

export default CourseObjectives;
