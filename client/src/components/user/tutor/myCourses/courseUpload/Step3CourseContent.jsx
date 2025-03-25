import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import CourseUploadHeader from "./CourseUploadHeader";
import CourseFormNavigation from "./CourseFormNavigation";
import SectionCard from "./SectionCard";
import InputField from "./InputField";
import api from "../../../../../services/api/axiosInterceptor";

const Step3CourseContent = ({
    setStep,
    setLoading,
    uploadedCourse,
    setUploadedCourse,
    sections,
    setSections,
    showSectionForm,
    setShowSectionForm,
    sectionTitle,
    setSectionTitle,
    editingSectionIndex,
    setEditingSectionIndex,
}) => {

    const [errors, setErrors] = useState({});
    // // Load existing data if editing
    // useEffect(() => {
    //     const existingSections = localStorage.getItem("courseSections");

    //     if (existingSections) {
    //         setSections(JSON.parse(existingSections));
    //     }
    // }, []);

    const handleError = (error, noData) => {
        if (error.response?.data) {
            toast.error(Object.values(error.response?.data)?.[0]);
        } else {
            toast.error(noData);
            toast.error(error.message || 'Something went wrong');
        }
    };
    
    const fetchSections = async (id) => {
        setLoading(true);
        try {
            const response = await api.get(`courses/incomplete-course/${id}/content/`);
            console.log('++++++++++\n', response)
            const fetchedSections = Array.isArray(response.data.sections) ? response.data.sections : [];
            setUploadedCourse(prev => ({ ...prev, sections: fetchedSections }));
            setSections(fetchedSections);
        } catch (error) {
            console.error("Error fetching sections:", error);
            handleError(error, "There was a problem fetching sections.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!uploadedCourse.sections) fetchSections(uploadedCourse.id);
        else setSections(uploadedCourse.sections);
    }, [uploadedCourse.sections]);

    const handleAddSectionItem = (itemData, sectionIndex) => {
        console.log('Sections before .map:', sections)
        setSections(prev => 
            prev.map((section, index) => 
                index === sectionIndex 
                    ? { ...section, items: [...(section.items || []), itemData] }
                    : section
            )
        );

        console.log('uploadedCourse before: sections.map', uploadedCourse)        
        setUploadedCourse(prev => ({
            ...prev,
            sections: prev.sections?.map((section, index) =>
                index === sectionIndex
                    ? { ...section, items: [...(section.items || []), itemData] }
                    : section
            )
        }));
        console.log('uploadedCourse: after sections.map', uploadedCourse)   
    };

    const handleDeleteSectionItem = (sectionIndex, result) => {
        console.log("handleDeleteSectionItem:", sectionIndex, result)
        const updatedSections = [...sections];
        updatedSections[sectionIndex].items = result;
        setSections(updatedSections);
        setUploadedCourse(prev => ({
            ...prev,
            sections: updatedSections,
        }));
    };

    // Handle section title change
    const handleSectionTitleChange = (e) => {
        setSectionTitle(e.target.value);
    };

    // Handle add section
    const handleAddSection = async () => {
        try{
            const sectionTitleTrimmed = sectionTitle.trim()
            if (!sectionTitleTrimmed) {
                setErrors({ sectionTitle: "Section title is required" });
                return;
            }
            if (sectionTitleTrimmed.length < 10){
                setErrors({ sectionTitle: "Section title must contain 10 letters" });
                return;
            }
            setLoading(true)
            
            const sectionLastOrder = sections?.length > 0 ? sections[sections.length - 1].order : 0
            // Add new section
            console.log('sectionLastOrder:', sectionLastOrder)
            const body = {
                course: uploadedCourse.id,
                title: sectionTitle,
                order: sectionLastOrder + 1,
            }
            const response = await api.post('courses/sections/', body);
            console.log('Data sent successfully:', response.data);
            setUploadedCourse(prev => ({
                ...prev,
                sections: [...prev.sections, response.data]
                }))
            toast("Course section have been saved.");
            setSections([
                ...sections,
                {
                    title: sectionTitle,
                    order: sections.length + 1,
                    items: [],
                },
            ]);
        
            // Reset form
            setSectionTitle("");
            setShowSectionForm(false);
            setErrors({});
        }
        catch (error) {
            console.log('error:', error)
            toast.error("Something went wrong.");
        }finally{
            setLoading(false)
        }
    };

    // Handle edit section
    const handleEditSection = (index) => {
        setSectionTitle(sections[index].title);
        setEditingSectionIndex(index);
        setShowSectionForm(true);
    };

    // Handle delete section
    const handleDeleteSection = async (sectionId, index) => {
        try{
            setLoading(true)
            if (sections[index].id !== sectionId){
                toast.error('Face a mismatch')
                return
            }
            if (sections[index].items && sections[index].items.length >= 1) {
                toast.error('Delete all section items before deleting a session')
                return
            }
            const response = await api.delete(`courses/sections/${sectionId}/delete`)
            console.log('delete section response:', response)
            if (response.status !== 200){
                toast.error('Something went wrong')
                return
            }
    
            const updatedSections = response.data
            setSections(updatedSections);
            setUploadedCourse(prev => ({ ...prev, sections: updatedSections}))
            toast.success("Section removed successfully")
        }catch (error){
            handleError(error, "Section deletion failed")
        }finally{
            setLoading(false)
        }

        // // Save to localStorage
        // localStorage.setItem("courseSections", JSON.stringify(updatedSections));
    };

    // Handle add section item
    // const handleAddSectionItem = (itemData) => {
    //     const { section_index, ...sectionItemData } = itemData;

    //     const updatedSections = [...sections];
    //     const currentItems = updatedSections[section_index].items || [];

    //     updatedSections[section_index].items = [
    //         ...currentItems,
    //         {
    //             ...sectionItemData,
    //             order: currentItems.length,
    //         },
    //     ];
    //     console.log('updated_sections:', updatedSections)
    //     setSections(updatedSections);

    //     // // Save to localStorage
    //     // localStorage.setItem("courseSections", JSON.stringify(updatedSections));

    //     // Save to backend
    //     handleSaveItem(section_index, sectionItemData);
    // };

    // Handle edit section item
    const handleEditSectionItem = (sectionIndex, itemIndex, itemData) => {
        const updatedSections = [...sections];
        console.log('itemdata:', itemData)
        // Preserve order and merge in updates
        const updatedItem = {
            ...updatedSections[sectionIndex].items[itemIndex],
            ...itemData,
        };
        console.log('updatedItem:', updatedItem)


        updatedSections[sectionIndex].items[itemIndex] = updatedItem;
        setSections(updatedSections);

        // // Save to localStorage
        // localStorage.setItem("courseSections", JSON.stringify(updatedSections));

        // Update item on backend
        handleUpdateItem(sectionIndex, itemIndex, updatedItem);
    };

    // Handle delete section item
    // const handleDeleteSectionItem = (sectionIndex, itemIndex) => {
    //     const updatedSections = [...sections];

    //     // Remove the item
    //     updatedSections[sectionIndex].items.splice(itemIndex, 1);

    //     // Update order for remaining items
    //     updatedSections[sectionIndex].items.forEach((item, idx) => {
    //         item.order = idx;
    //     });

    //     setSections(updatedSections);

    //     // // Save to localStorage
    //     // localStorage.setItem("courseSections", JSON.stringify(updatedSections));

    //     toast( "Section item has been removed.");
    // };

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
            toast("Section item has been updated successfully.");
        } catch (error) {
            console.error("Error updating item:", error);
            toast("There was a problem updating the section item. Please try again.");
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        try {
            setLoading(true)
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
            if (uploadedCourse.step <= 3){
                const response = await api.patch('courses/', {
                    id: uploadedCourse.id,
                    step: 4,
                })
                console.log('update step 4:', response)
                if (response.status !== 200){
                    toast.error('Failed to update course details')
                    return
                }
                const result = response.data
                setUploadedCourse(prev => ({...prev, ...result}))
            }
            // Navigate to next step
            setStep(4);
        } catch (error) {
            console.error("Error saving content:", error);
            handleError(error, "There was a problem saving your course content. Please try again.")
        }finally{
            setLoading(false)
        }
    };

    // Handle going back to previous step
    const handlePrevious = () => {
        setStep(2);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
            <CourseUploadHeader currentStep={3} totalSteps={4} title="Course Content" />
            <div className="mb-6">
                {uploadedCourse.sections && uploadedCourse.sections.length > 0 ? (
                    <div className="space-y-4">
                        {uploadedCourse.sections?.map((section, index) => (
                            <SectionCard
                                key={index}
                                setLoading={setLoading}
                                section={section}
                                sectionIndex={index}
                                onAddItem={handleAddSectionItem}
                                onEditSection={handleEditSection}
                                onDeleteSection={handleDeleteSection}
                                onDeleteItem={handleDeleteSectionItem}
                                uploadedCourse={uploadedCourse}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground mb-4">No course sections added yet. Add your first section to get started.</p>
                    </div>
                )}
            </div>
            {showSectionForm ? (
                <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in">
                    <h3 className="text-lg font-medium mb-4">{editingSectionIndex !== null ? "Edit Section" : "Add New Section"}</h3>
                    <InputField id="section-title" label="Section Title" value={sectionTitle} onChange={handleSectionTitleChange} placeholder="Enter section title" error={errors.sectionTitle} required />
                    <div className="flex justify-end space-x-3 mt-4">
                        <button type="button" onClick={() => { setShowSectionForm(false); setSectionTitle(""); setEditingSectionIndex(null); setErrors({}); }} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors">Cancel</button>
                        <button type="button" onClick={handleAddSection} className="px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-md transition-colors">{editingSectionIndex !== null ? "Update Section" : "Add Section"}</button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => setShowSectionForm(true)} className="w-full py-4 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors mb-6"><Plus size={20} className="mr-2" /> Add New Section</button>
            )}
            <CourseFormNavigation currentStep={3} onNext={handleSubmit} onPrevious={handlePrevious} disableNext={sections.length === 0} />
        </div>
    );
};

export default Step3CourseContent;
