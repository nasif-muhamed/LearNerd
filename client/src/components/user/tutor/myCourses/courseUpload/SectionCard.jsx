import React, { useState, useEffect } from "react";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    FileText,
    Video,
    CheckSquare,
    Trash2,
} from "lucide-react";
import SectionItemForm from "./SectionItemForm";
import SectionItemEditForm from "./SectionItemEditForm"

const SectionCard = ({
    update,
    section,
    setLoading,
    sectionIndex,
    onAddItem,
    onEditSection,
    onDeleteSection,
    onDeleteItem,
    uploadedCourse,
}) => {
    const [expanded, setExpanded] = useState(true);
    const [addingItem, setAddingItem] = useState(false);
    const [localItems, setLocalItems] = useState(section.items || []);

    useEffect(() => {
        setLocalItems(section.items || []);
    }, [section.items]);

    const handleUpdateItem = async (itemIndex, updatedData) => {
        try {
            const itemId = localItems[itemIndex].id;
            const sectionId = uploadedCourse.sections[sectionIndex].id;
            const formData = new FormData();

            for (const key in updatedData) {
                if (typeof updatedData[key] === 'object') {
                    formData.append(key, JSON.stringify(updatedData[key]));
                } else {
                    formData.append(key, updatedData[key]);
                }
            }

            const response = await api.patch(`courses/section-items/${itemId}/`, formData);
            const updatedItem = response.data;
            setLocalItems(prev => prev.map((item, idx) => idx === itemIndex ? updatedItem : item));
            toast.success("Section item updated successfully.");
        } catch (error) {
            console.error("Error updating item:", error);
            toast.error("Failed to update section item.");
        }
    };

    const handleTitleChange = (itemIndex, newTitle) => {
        const updatedItems = [...localItems];
        updatedItems[itemIndex].title = newTitle;
        setLocalItems(updatedItems);
        handleUpdateItem(itemIndex, { title: newTitle });
    };

    const handleVideoFileChange = (itemIndex, file) => {
        const updatedItems = [...localItems];
        updatedItems[itemIndex].video.video_file = file;
        setLocalItems(updatedItems);
        handleUpdateItem(itemIndex, { video_file: file });
    };

    const handleThumbnailChange = (itemIndex, file) => {
        const updatedItems = [...localItems];
        updatedItems[itemIndex].video.thumbnail_file = file;
        setLocalItems(updatedItems);
        handleUpdateItem(itemIndex, { thumbnail_file: file });
    };

    const handleInstructionsChange = (itemIndex, newInstructions) => {
        const updatedItems = [...localItems];
        updatedItems[itemIndex].assessment.instructions = newInstructions;
        setLocalItems(updatedItems);
        handleUpdateItem(itemIndex, { assessment_data: { instructions: newInstructions } });
    };

    const handlePassingScoreChange = (itemIndex, newScore) => {
        const updatedItems = [...localItems];
        updatedItems[itemIndex].assessment.passing_score = newScore;
        setLocalItems(updatedItems);
        handleUpdateItem(itemIndex, { assessment_data: { passing_score: parseFloat(newScore) || 70 } });
    };

    const handleQuestionChange = (itemIndex, qIndex, newText) => {
        const updatedItems = [...localItems];
        updatedItems[itemIndex].assessment.questions[qIndex].text = newText;
        setLocalItems(updatedItems);
        handleUpdateItem(itemIndex, {
            assessment_data: {
                questions: updatedItems[itemIndex].assessment.questions,
            },
        });
    };

    const handleChoiceChange = (itemIndex, qIndex, cIndex, newText) => {
        const updatedItems = [...localItems];
        updatedItems[itemIndex].assessment.questions[qIndex].choices[cIndex].text = newText;
        setLocalItems(updatedItems);
        handleUpdateItem(itemIndex, {
            assessment_data: {
                questions: updatedItems[itemIndex].assessment.questions,
            },
        });
    };

    const handleChoiceCorrectChange = (itemIndex, qIndex, cIndex) => {
        const updatedItems = [...localItems];
        updatedItems[itemIndex].assessment.questions[qIndex].choices.forEach(c => c.is_correct = false);
        updatedItems[itemIndex].assessment.questions[qIndex].choices[cIndex].is_correct = true;
        setLocalItems(updatedItems);
        handleUpdateItem(itemIndex, {
            assessment_data: {
                questions: updatedItems[itemIndex].assessment.questions,
            },
        });
    };

    const getItemIcon = (type) => {
        switch (type) {
            case "video": return <Video size={16} className="text-primary" />;
            case "assessment": return <CheckSquare size={16} className="text-accent" />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="mb-4 overflow-hidden bg-card border border-border rounded-lg animate-slide-up transition-all duration-300 ease-out">
            <div className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                    <button type="button" onClick={() => setExpanded(!expanded)} className="mr-3 text-muted-foreground hover:text-foreground">
                        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <h3 className="text-lg font-medium">Section {sectionIndex + 1}: {section.title}</h3>
                </div>
                {!update && (<div className="flex items-center space-x-2">
                    {/* <button type="button" onClick={() => onEditSection(sectionIndex)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-full bg-secondary/30 hover:bg-secondary/70 transition-colors"><Edit size={16} /></button> */}
                    <button type="button" onClick={() => onDeleteSection(section.id, sectionIndex)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-full bg-secondary/30 hover:bg-secondary/70 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>)}
            </div>

            {expanded && (
                <div className="px-4 pb-4 animate-fade-in">
                    {localItems.length > 0 ? (
                        <div className="space-y-4 mb-4">
                            {localItems.map((item, index) => (
                                <SectionItemEditForm update={update} key={index} sectionIndex={sectionIndex} setLoading={setLoading} sectionItem={item} getItemIcon={getItemIcon} onDelete={onDeleteItem} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                            <p className="mb-2 text-sm">No items in this section yet</p>
                        </div>
                    )}

                    {addingItem ? (
                        <SectionItemForm
                            section={section}
                            sectionIndex={sectionIndex}
                            onSave={(itemData) => {
                                onAddItem(itemData, sectionIndex);
                                setAddingItem(false);
                            }}
                            onCancel={() => setAddingItem(false)}
                            setLoading={setLoading}
                        />
                    ) : (
                        <button type="button" onClick={() => setAddingItem(true)} className="w-full mt-2 py-2 flex items-center justify-center text-sm bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-md transition-colors">
                            <Plus size={16} className="mr-1" /> Add Section Item
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SectionCard;
