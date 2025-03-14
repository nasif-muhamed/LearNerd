
import { ArrowLeft } from "lucide-react";
import React from 'react';
import { useNavigate } from 'react-router-dom';

const CourseUploadHeader = ({ currentStep, totalSteps, title }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col w-full mb-8 animate-fade-in">
            <div className="flex items-center mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors mr-4"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    <span>Back</span>
                </button>
                <h1 className="text-xl font-medium">{title}</h1>
            </div>

            <div className="w-full">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>
                        Step {currentStep} of {totalSteps}
                    </span>
                    <span>
                        {Math.round((currentStep / totalSteps) * 100)}% Complete
                    </span>
                </div>
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{
                            width: `${(currentStep / totalSteps) * 100}%`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default CourseUploadHeader;
