import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X, Trash2, FilePenLine } from "lucide-react";
import CourseUploadHeader from './CourseUploadHeader';
import CourseFormNavigation from './CourseFormNavigation';
import api from "../../../../../services/api/axiosInterceptor";

const CourseObjectives = ({
    setStep, 
    setLoading,
    setUploadedCourse,
    uploadedCourse,
    objectives,
    setObjectives,
    requirements,
    setRequirements
}) => {
    const [errors, setErrors] = useState({});
    const uploadedObjectives = uploadedCourse.objectives || []
    const uploadedRequirements = uploadedCourse.requirements || []
    
    // useEffect(() => {
    //     console.log('useEffect:', requirements.length + uploadedRequirements.length, objectives.length + uploadedObjectives.length)
    //     if (requirements.length + uploadedRequirements.length < 1) setRequirements([""])
    //     if (objectives.length + uploadedObjectives.length < 1) setObjectives([""])
    // }, [requirements, uploadedRequirements, objectives, uploadedObjectives])

    const handleError = (error, noData) => {
        if (error.response?.data) {
            toast.error(Object.values(error.response?.data)?.[0]);
        } else {
            toast.error(noData);
            toast.error(error.message || 'Something went wrong');
        }
    };

    const fetchObjectives = async (id) => {
        setLoading(true)
        try{
            const response = await api.get(`courses/${id}/objectives/`);
            console.log('res obj:', response)
            setUploadedCourse(prevState => ({
                ...prevState,
                objectives: Array.isArray(response.data) ? response.data : []
            }));    
        } catch (error) {
            console.error("Error saving course:", error);
            handleError(error, "There was a problem fetching your course details. Please try again.");
        }finally{
            setLoading(false)
        }
    }

    const fetchRequirements = async (id) => {
        setLoading(true)
        try{
            const response = await api.get(`courses/${id}/requirements/`);
            console.log('res req:', response)
            setUploadedCourse(prevState => ({
                ...prevState,
                requirements: Array.isArray(response.data) ? response.data : []
            }));
    
        } catch (error) {
            console.error("Error saving course:", error);
            handleError(error, "There was a problem fetching your course details. Please try again.");
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log('uploadedCourse:', uploadedCourse)
        if (!uploadedCourse.objectives) {
            fetchObjectives(uploadedCourse.id);
        }

        if (!uploadedCourse.requirements) {
            fetchRequirements(uploadedCourse.id);
        }
    }, [uploadedCourse.requirements, uploadedCourse.objectives]);

    // Handle objective change
    const handleObjectiveChange = (index, value) => {
        const newObjectives = [...objectives];
        newObjectives[index] = value;
        setObjectives(newObjectives);
    };

    // Add new objective
    const addObjective = () => {
        const length = objectives.length + uploadedObjectives.length
        console.log('add:', length)
        if (length < 5){
            setObjectives([...objectives, ""]);
        }else{
            toast.info('You can only add upto 5 Objectives')
        }

    };

    // Remove objective
    const removeObjective = (index) => {
        const length = objectives.length + uploadedObjectives.length
        if (length > 1) {
            const newObjectives = [...objectives];
            newObjectives.splice(index, 1);
            setObjectives(newObjectives);
        }else{
            toast.error('Atleast One Objective should be there')
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
        const length = requirements.length + uploadedRequirements.length
        console.log('length:', length)
        if (length < 5){
            setRequirements([...requirements, ""]);
        }else{
            toast.info('You can only add upto 5 requirements')
        }
    };

    // Remove requirement
    const removeRequirement = (index) => {
        const length = requirements.length + uploadedRequirements.length
        if (length > 1) {
            const newRequirements = [...requirements];
            newRequirements.splice(index, 1);
            setRequirements(newRequirements);
        }else{
            toast.error('Atleast One requirement should be there')
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Check if any objective is empty or limitted length
        const emptyObjectives = objectives.filter((obj) => !obj.trim()).length > 0;
        const lenObjectives = objectives.filter((obj) => (obj.trim()).length < 5).length > 0;
        if (emptyObjectives) {
            newErrors.objectives = "All learning objectives must have content";
        } else if (lenObjectives) {
            newErrors.objectives = "All learning objectives must have at least 5 letters";
        }

        // Check if any requirement is empty or limited lenth
        const emptyRequirements = requirements.filter((req) => !req.trim()).length > 0;
        const lenRequirements = requirements.filter((req) => (req.trim()).length < 5).length > 0;
        if (emptyRequirements) {
            newErrors.requirements = "All course requirements must have content";
        } else if (lenRequirements) {
            newErrors.requirements = "All course requirements must have at least 5 letters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        setStep(3)
    }
    // Handle form submission
    const handleSubmit = async () => {
        if (validateForm()) {
            // Filter out empty entries
            
            const filteredObjectives = objectives.filter((obj) => obj.trim());
            const filteredRequirements = requirements.filter((req) => req.trim());
            console.log('fil', filteredObjectives, filteredRequirements)
            if (filteredObjectives.length + filteredRequirements.length < 1){
                toast.info('At least one entry should be there.')
                return
            }
            const objectiveLastOrder = uploadedObjectives?.length > 0 ? uploadedObjectives[uploadedObjectives.length - 1].order : 0
            const requirementLastOrder = uploadedRequirements?.length > 0 ? uploadedRequirements[uploadedRequirements.length - 1].order : 0
            console.log('lastorder:', objectiveLastOrder, requirementLastOrder)
            const body = {
                        course_id: uploadedCourse.id,
                        objectives: filteredObjectives.map((obj, index) => ({
                            objective: obj,
                            order: objectiveLastOrder + index + 1
                        })),
                        requirements: filteredRequirements.map((req, index) => ({
                            requirement: req,
                            order: requirementLastOrder + index + 1
                        }))
                  }
            console.log(body)
            try {
                const response = await api.post('courses/objectives-requirements/', body);
                const result = response.data 
                console.log('Data sent successfully:', result);
                const tempCourse = {...uploadedCourse}
                tempCourse.objectives = result.objectives
                tempCourse.requirements = result.requirements
                setUploadedCourse(tempCourse)
                toast.success("Course objectives and requirements have been uploaded.");
                setObjectives([])
                setRequirements([])
                // Navigate to next step
                setStep(2);
            } catch (error) {
                console.error("Error saving:", error);
                toast("There was a problem saving objectives and requirements. Please try again.");
            }
        }
    };

    // Handle going back to previous step
    const handlePrevious = () => {
        setStep(1);
    };

    const deleteObjective = async (objId) => {
        setLoading(true)
        try{
            const response = await api.delete(`courses/objectives/${objId}/delete/`)
            console.log('res obje:', response)
            setUploadedCourse(prevState => ({
                ...prevState,
                objectives: Array.isArray(response.data) ? response.data : []
            }));
            toast.info('Objective deleted successfully')
        } catch (error) {
            console.error("Error saving course:", error);
            handleError(error, "There was a problem deleting objective. Please try again.");
        }finally{
            setLoading(false)
        }
    }

    const deleteRequirements = async (objId) => {
        setLoading(true)
        try{
            const response = await api.delete(`courses/requirements/${objId}/delete/`)
            console.log('res obje:', response)
            setUploadedCourse(prevState => ({
                ...prevState,
                requirements: Array.isArray(response.data) ? response.data : []
            }));
            toast.info('Requirement deleted successfully')
        } catch (error) {
            console.error("Error saving course:", error);
            handleError(error, "There was a problem deleting requirement. Please try again.");
        }finally{
            setLoading(false)
        }
    }


    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
            <CourseUploadHeader
                currentStep={2}
                totalSteps={4}
                title="Learning Objectives & Requirements"
            />

            <div className="">
                {/* Learning Objectives Section */}
                <div className="mb-8 bg-card border border-border rounded-lg shadow-lg p-6">
                    {uploadedObjectives.length > 0 && 
                        (<div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium">
                                    Uploaded Learning Objectives
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {uploadedObjectives.map((objective, index) => (
                                    <div key={index} className="flex items-center">
                                        <div className="flex-shrink-0 mr-3 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                                            {index + 1}
                                        </div>
                                        <input
                                            type="text"
                                            value={objective.objective}
                                            onChange={(e) =>
                                                handleObjectiveChange(
                                                    index,
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter a learning objective"
                                            className="flex-1 px-4 py-3 bg-secondary text-foreground rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                        />

                                        {/* <button
                                            type="button"
                                            onClick={() => updateObjective(objective.id)}
                                            className={`ml-4 text-muted-foreground hover:text-destructive transition-colors`}
                                        >
                                            <FilePenLine size={25} />
                                        </button> */}

                                        <button
                                            id={objective.id}
                                            type="button"
                                            onClick={() => deleteObjective(objective.id)}
                                            className={`ml-4 text-muted-foreground hover:text-destructive transition-colors`}
                                        >
                                            <Trash2 size={25}  />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>)
                    }
                    
                    {uploadedObjectives.length < 6 &&
                        (<div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium">
                                    Add New Learning Objectives
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
                                            {uploadedObjectives.length + index + 1}
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
                                            disabled={objectives.length + uploadedObjectives.length === 1}
                                            className={`ml-2 text-muted-foreground hover:text-destructive transition-colors ${
                                                objectives.length + uploadedObjectives.length === 1
                                                    ? "opacity-30 cursor-not-allowed"
                                                    : ""
                                            }`}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>)
                    }
                </div>

                {/* Course Requirements Section */}
                <div className="mb-6 bg-card border border-border rounded-lg shadow-lg p-6">
                    
                    {uploadedRequirements.length > 0 &&
                        (<div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium">
                                    Uploaded Course Requirements
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {uploadedRequirements.map((requirement, index) => (
                                    <div key={index} className="flex items-center">
                                        <div className="flex-shrink-0 mr-3 w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm">
                                            {index + 1}
                                        </div>
                                        <input
                                            type="text"
                                            value={requirement.requirement}
                                            onChange={(e) =>
                                                handleRequirementChange(
                                                    index,
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter a course requirement"
                                            className="flex-1 px-4 py-3 bg-secondary text-foreground rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                        />

                                        {/* <button
                                            type="button"
                                            onClick={() => updateRequirements(requirement.id)}
                                            className={`ml-4 text-muted-foreground hover:text-destructive transition-colors`}
                                        >
                                            <FilePenLine size={25} />
                                        </button> */}
                                        
                                        <button
                                            type="button"
                                            onClick={() => deleteRequirements(requirement.id)}
                                            className={`ml-4 text-muted-foreground hover:text-destructive transition-colors `}
                                        >
                                            <Trash2 size={25}  />
                                        </button>

                                    </div>
                                ))}
                            </div>
                        </div>)
                    }

                    {(uploadedRequirements.length < 6 &&
                        <div >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium">
                                    Add new Course Requirements
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
                                            {uploadedRequirements.length + index + 1}
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
                                            disabled={requirements.length + uploadedRequirements.length === 1}
                                            className={`ml-2 text-muted-foreground hover:text-destructive transition-colors ${
                                                requirements.length + uploadedRequirements.length === 1
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
                    )}
                </div >
            </div>
            <CourseFormNavigation
            
                currentStep={2}
                onNext={handleNext}
                onUpsert={handleSubmit}
                onPrevious={handlePrevious}
                disableNext= {(uploadedObjectives.length < 1 || uploadedRequirements.length < 1)}//{uploadedCourse.requirements && uploadedCourse.requirements.length > 0 && uploadedCourse.objectives && uploadedCourse.requirements.objectives > 0}
            />
        </div>
    );
};

export default CourseObjectives;
