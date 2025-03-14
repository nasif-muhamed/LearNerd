import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import CourseUploadHeader from "./CourseUploadHeader";
import CourseFormNavigation from "./CourseFormNavigation";
import SectionCard from "./SectionCard";
import InputField from "./InputField";

const Step3CourseContent = ({setStep}) => {

    // State for sections
    const [sections, setSections] = useState([]);
    const [showSectionForm, setShowSectionForm] = useState(false);
    const [sectionTitle, setSectionTitle] = useState("");
    const [editingSectionIndex, setEditingSectionIndex] = useState(null);
    const [errors, setErrors] = useState({});

    // Load existing data if editing
    useEffect(() => {
        const existingSections = localStorage.getItem("courseSections");

        if (existingSections) {
            setSections(JSON.parse(existingSections));
        }
    }, []);

    // Handle section title change
    const handleSectionTitleChange = (e) => {
        setSectionTitle(e.target.value);
    };

    // Handle add section
    const handleAddSection = () => {
        if (!sectionTitle.trim()) {
            setErrors({ sectionTitle: "Section title is required" });
            return;
        }

        // Check if we're editing or adding
        if (editingSectionIndex !== null) {
            const updatedSections = [...sections];
            updatedSections[editingSectionIndex] = {
                ...updatedSections[editingSectionIndex],
                title: sectionTitle,
            };
            setSections(updatedSections);
            setEditingSectionIndex(null);
        } else {
            // Add new section
            setSections([
                ...sections,
                {
                    title: sectionTitle,
                    order: sections.length,
                    items: [],
                },
            ]);
        }

        // Reset form
        setSectionTitle("");
        setShowSectionForm(false);
        setErrors({});

        // Save to localStorage
        localStorage.setItem("courseSections", JSON.stringify(sections));
    };

    // Handle edit section
    const handleEditSection = (index) => {
        setSectionTitle(sections[index].title);
        setEditingSectionIndex(index);
        setShowSectionForm(true);
    };

    // Handle delete section
    const handleDeleteSection = (index) => {
        const updatedSections = [...sections];
        updatedSections.splice(index, 1);

        // Update order for remaining sections
        updatedSections.forEach((section, idx) => {
            section.order = idx;
        });

        setSections(updatedSections);

        // Save to localStorage
        localStorage.setItem("courseSections", JSON.stringify(updatedSections));
    };

    // Handle add section item
    const handleAddSectionItem = (itemData) => {
        const { section_index, ...sectionItemData } = itemData;

        const updatedSections = [...sections];
        const currentItems = updatedSections[section_index].items || [];

        updatedSections[section_index].items = [
            ...currentItems,
            {
                ...sectionItemData,
                order: currentItems.length,
            },
        ];

        setSections(updatedSections);

        // Save to localStorage
        localStorage.setItem("courseSections", JSON.stringify(updatedSections));

        // Save to backend
        handleSaveItem(section_index, sectionItemData);
    };

    // Handle edit section item
    const handleEditSectionItem = (sectionIndex, itemIndex, itemData) => {
        const updatedSections = [...sections];

        // Preserve order and merge in updates
        const updatedItem = {
            ...updatedSections[sectionIndex].items[itemIndex],
            ...itemData,
        };

        updatedSections[sectionIndex].items[itemIndex] = updatedItem;
        setSections(updatedSections);

        // Save to localStorage
        localStorage.setItem("courseSections", JSON.stringify(updatedSections));

        // Update item on backend
        handleUpdateItem(sectionIndex, itemIndex, updatedItem);
    };

    // Handle delete section item
    const handleDeleteSectionItem = (sectionIndex, itemIndex) => {
        const updatedSections = [...sections];

        // Remove the item
        updatedSections[sectionIndex].items.splice(itemIndex, 1);

        // Update order for remaining items
        updatedSections[sectionIndex].items.forEach((item, idx) => {
            item.order = idx;
        });

        setSections(updatedSections);

        // Save to localStorage
        localStorage.setItem("courseSections", JSON.stringify(updatedSections));

        toast( "Section item has been removed.");
    };

    // Handle save item to backend
    const handleSaveItem = async (sectionIndex, itemData) => {
        try {
            // API call to save section item
            // const courseId = localStorage.getItem('currentCourseId');
            // const sectionId = sections[sectionIndex].id; // Assuming you have section ID from backend

            // await fetch(`api/courses/${courseId}/sections/${sectionId}/items`, {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json',
            //   },
            //   body: JSON.stringify(itemData),
            // });

            toast("Section item has been added successfully.");
        } catch (error) {
            console.error("Error saving item:", error);
            toast("There was a problem saving the section item. Please try again.");
        }
    };

    // Handle update item on backend
    const handleUpdateItem = async (sectionIndex, itemIndex, itemData) => {
        try {
            // API call to update section item
            // const courseId = localStorage.getItem('currentCourseId');
            // const sectionId = sections[sectionIndex].id;
            // const itemId = sections[sectionIndex].items[itemIndex].id;

            // await fetch(`api/courses/${courseId}/sections/${sectionId}/items/${itemId}`, {
            //   method: 'PUT',
            //   headers: {
            //     'Content-Type': 'application/json',
            //   },
            //   body: JSON.stringify(itemData),
            // });

            toast("Section item has been updated successfully.");
        } catch (error) {
            console.error("Error updating item:", error);
            toast("There was a problem updating the section item. Please try again.");
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (sections.length === 0) {
            toast("You must add at least one section before continuing.");
            return;
        }

        // Check if any sections have no items
        const emptySections = sections.filter(
            (section) => !section.items || section.items.length === 0
        );
        if (emptySections.length > 0) {
            toast(`${emptySections.length} section(s) have no content. Add at least one item to each section.`);
            return;
        }

        localStorage.setItem("courseSections", JSON.stringify(sections));

        try {
            // API call to save all sections and items
            // const courseId = localStorage.getItem('currentCourseId');
            // await fetch(`api/courses/${courseId}/sections`, {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json',
            //   },
            //   body: JSON.stringify({ sections }),
            // });

            toast("Course content has been saved successfully.");

            // Navigate to next step
            setStep(4);
        } catch (error) {
            console.error("Error saving content:", error);
            toast("There was a problem saving your course content. Please try again.");
        }
    };

    // Handle going back to previous step
    const handlePrevious = () => {
        setStep(2);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
            <CourseUploadHeader
                currentStep={3}
                totalSteps={4}
                title="Course Content"
            />

            <div className="mb-6">
                {sections.length > 0 ? (
                    <div className="space-y-4">
                        {sections.map((section, index) => (
                            <SectionCard
                                key={index}
                                section={section}
                                sectionIndex={index}
                                onAddItem={handleAddSectionItem}
                                onEditItem={handleEditSectionItem}
                                onDeleteItem={handleDeleteSectionItem}
                                onEditSection={handleEditSection}
                                onDeleteSection={handleDeleteSection}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground mb-4">
                            No course sections added yet. Add your first section
                            to get started.
                        </p>
                    </div>
                )}
            </div>

            {showSectionForm ? (
                <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in">
                    <h3 className="text-lg font-medium mb-4">
                        {editingSectionIndex !== null
                            ? "Edit Section"
                            : "Add New Section"}
                    </h3>

                    <InputField
                        id="section-title"
                        label="Section Title"
                        value={sectionTitle}
                        onChange={handleSectionTitleChange}
                        placeholder="Enter section title"
                        error={errors.sectionTitle}
                        required
                    />

                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowSectionForm(false);
                                setSectionTitle("");
                                setEditingSectionIndex(null);
                                setErrors({});
                            }}
                            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAddSection}
                            className="px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-md transition-colors"
                        >
                            {editingSectionIndex !== null
                                ? "Update Section"
                                : "Add Section"}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setShowSectionForm(true)}
                    className="w-full py-4 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors mb-6"
                >
                    <Plus size={20} className="mr-2" /> Add New Section
                </button>
            )}

            <CourseFormNavigation
                currentStep={3}
                onNext={handleSubmit}
                onPrevious={handlePrevious}
                disableNext={sections.length === 0}
            />
        </div>
    );
};

export default Step3CourseContent;
