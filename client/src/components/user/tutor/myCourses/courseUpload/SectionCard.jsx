import React, { useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    FileText,
    Video,
    CheckSquare,
    Edit,
    Trash2,
} from "lucide-react";
import SectionItemForm from "./SectionItemForm";

const SectionCard = ({
    section,
    sectionIndex,
    onAddItem,
    onEditSection,
    onDeleteSection,
    onEditItem,
    onDeleteItem,
}) => {
    const [expanded, setExpanded] = useState(true);
    const [addingItem, setAddingItem] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState(null);

    const handleSaveItem = (itemData) => {
        if (editingItemIndex !== null) {
            // Handle edit
            onEditItem(sectionIndex, editingItemIndex, itemData);
            setEditingItemIndex(null);
        } else {
            // Handle add
            onAddItem(itemData);
        }
        setAddingItem(false);
    };

    const handleEditItem = (itemIndex) => {
        setEditingItemIndex(itemIndex);
        setAddingItem(true);
    };

    const getItemIcon = (type) => {
        switch (type) {
            case "video":
                return <Video size={16} className="text-primary" />;
            case "assessment":
                return <CheckSquare size={16} className="text-accent" />;
            default:
                return <FileText size={16} />;
        }
    };

    return (
        <div className="mb-4 overflow-hidden bg-card border border-border rounded-lg animate-slide-up transition-all duration-300 ease-out">
            <div className="p-4 flex justify-between items-center">
                <div className="flex items-center">
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="mr-3 text-muted-foreground hover:text-foreground"
                    >
                        {expanded ? (
                            <ChevronUp size={20} />
                        ) : (
                            <ChevronDown size={20} />
                        )}
                    </button>
                    <h3 className="text-lg font-medium">
                        Section {sectionIndex + 1}: {section.title}
                    </h3>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => onEditSection(sectionIndex)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-full bg-secondary/30 hover:bg-secondary/70 transition-colors"
                        aria-label="Edit section"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeleteSection(sectionIndex)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-full bg-secondary/30 hover:bg-secondary/70 transition-colors"
                        aria-label="Delete section"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-4 animate-fade-in">
                    {section.items && section.items.length > 0 ? (
                        <div className="space-y-2 mb-4">
                            {section.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center p-3 bg-secondary/30 rounded-md group"
                                >
                                    <div className="mr-3">
                                        {getItemIcon(item.item_type)}
                                    </div>
                                    <span className="flex-1 text-sm">
                                        {item.title}
                                    </span>
                                    <div className="opacity-100 group-hover:opacity-100 transition-opacity flex space-x-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEditItem(index)
                                            }
                                            className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onDeleteItem(
                                                    sectionIndex,
                                                    index
                                                )
                                            }
                                            className="p-1 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                            <p className="mb-2 text-sm">
                                No items in this section yet
                            </p>
                        </div>
                    )}

                    {addingItem ? (
                        <SectionItemForm
                            sectionIndex={sectionIndex}
                            itemToEdit={
                                editingItemIndex !== null
                                    ? section.items[editingItemIndex]
                                    : null
                            }
                            onSave={handleSaveItem}
                            onCancel={() => {
                                setAddingItem(false);
                                setEditingItemIndex(null);
                            }}
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setAddingItem(true)}
                            className="w-full mt-2 py-2 flex items-center justify-center text-sm bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-md transition-colors"
                        >
                            <Plus size={16} className="mr-1" /> Add Section Item
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SectionCard;
