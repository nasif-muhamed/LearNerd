import React from "react";

const CourseFormNavigation = ({
    currentStep,
    onNext,
    onPrevious,
    disableNext = false,
    submitLabel = "Next",
}) => {
    
    return (
        <div className="flex flex-col sm:flex-row justify-between items-center py-6 border-t border-border mt-8 animate-fade-in">
            <div className="flex-1 flex justify-start mb-4 sm:mb-0">
                {currentStep > 1 && (
                    <button
                        type="button"
                        onClick={onPrevious}
                        className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors"
                    >
                        Previous
                    </button>
                )}
            </div>

            <div className="flex space-x-3">
                <button
                    type="button"
                    onClick={onNext}
                    disabled={disableNext}
                    className={`px-6 py-3 bg-primary hover:bg-primary/80 text-primary-foreground rounded-md transition-colors ${
                        disableNext ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                    {submitLabel}
                </button>
            </div>
        </div>
    );
};

export default CourseFormNavigation;
