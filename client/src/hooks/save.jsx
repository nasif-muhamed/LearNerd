import { useState, useEffect } from 'react';
import { Plus, X, Check, Upload } from 'lucide-react';
import InputField from './InputField';
import api from '../../../../../services/api/axiosInterceptor';
import { toast } from 'sonner'; 

const SectionItemForm = ({ 
    sectionIndex, 
    itemToEdit, 
    onSave, 
    onCancel,
}) => {
    const [title, setTitle] = useState("");
    const [itemType, setItemType] = useState("video");
    const [videoFile, setVideoFile] = useState(null);
    const [duration, setDuration] = useState(0)
    const [thumbnailFile, setThumbnailFile] = useState(null);
    // const [videoPreview, setVideoPreview] = useState('');
    // const [thumbnailPreview, setThumbnailPreview] = useState('');
    const [instructions, setInstructions] = useState("");
    const [passingScore, setPassingScore] = useState("70");
    const [pdfs, setPdfs] = useState([]);
    const [questions, setQuestions] = useState([
        { text: "", choices: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }]},
    ]);
    const [errors, setErrors] = useState({});
    // console.log('videoFile:', videoFile)
    // console.log('videoPreview:', videoPreview)
    // console.log('thumbnailFile:', thumbnailFile)
    // console.log('thumbnailPreview:', thumbnailPreview)

    const handleError = (error, noData) => {
        if (error.response?.data) {
            toast.error(Object.values(error.response?.data)?.[0]);
        } else {
            toast.error(noData);
            toast.error(error.message || 'Something went wrong');
        }
    };

    useEffect(() => {
        if (itemToEdit) {
            setTitle(itemToEdit.title || "");
            setItemType(itemToEdit.item_type || "video");

            if (itemToEdit.item_type === "video" && itemToEdit.video) {
                setVideoFile(itemToEdit.video?.video_file);
                setThumbnailFile(itemToEdit.video?.thumbnail_file || "");
            } else if (itemToEdit.item_type === "assessment" && itemToEdit.assessment) {
                setInstructions(itemToEdit.assessment.instructions || "");
                setPassingScore(
                    itemToEdit.assessment.passing_score
                        ? itemToEdit.assessment.passing_score.toString()
                        : "70"
                );

                if (itemToEdit.assessment.questions && itemToEdit.assessment.questions.length > 0) {
                    setQuestions(
                        itemToEdit.assessment.questions.map((q) => ({
                            text: q.text || "",
                            choices: q.choices && q.choices.length === 4
                                ? q.choices.map((c) => ({
                                      text: c.text || "",
                                      isCorrect: c.is_correct || false,
                                  }))
                                : [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }]
                        }))
                    );
                }
            }

            if (itemToEdit.supporting_documents && itemToEdit.supporting_documents.length > 0) {
                setPdfs(itemToEdit.supporting_documents);
            }
        }
    }, [itemToEdit]);

    const validateForm = () => {
        const newErrors = {};
        if (!title.trim()) newErrors.title = "Title is required";
        
        if (itemType === "video") {
            if (!videoFile) newErrors.video = "Video file is required";
        } else {
            if (!instructions.trim())
                newErrors.instructions = "Instructions are required";
            if (questions.length === 0)
                newErrors.questions = "At least one question is required";

            questions.forEach((question, index) => {
                if (!question.text.trim()) {
                    newErrors[`question_${index}`] =
                        "Question text is required";
                }

                const hasCorrectAnswer = question.choices.some(
                    (choice) => choice.isCorrect
                );
                if (!hasCorrectAnswer) {
                    newErrors[`question_${index}_choices`] =
                        "At least one correct answer is required";
                }

                question.choices.forEach((choice, choiceIndex) => {
                    if (!choice.text.trim()) {
                        newErrors[`question_${index}_choice_${choiceIndex}`] =
                            "Choice text is required";
                    }
                });
            });
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0){
            return true
        } else {
            const dupCheck = new Set()
            for(let val in newErrors){
                console.log('dupCheck:', dupCheck)
                if (!dupCheck.has(newErrors[val])){
                    toast.error(newErrors[val])
                } 
                dupCheck.add(newErrors[val])
            }
            return false
        }
    };

    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        console.log('video:',file)
        if (file) {
            setVideoFile(file);
            const videoURL = URL.createObjectURL(file);

            // Create a temporary video element to load the file
            const videoElement = document.createElement('video');
    
            // Set the video element's source to the created URL
            videoElement.src = videoURL;
            console.log('hereddd')
            // Once the metadata (like duration) is loaded, log the duration
            videoElement.onloadedmetadata = () => {
                console.log('Video Duration:', videoElement.duration);  // duration in seconds
                setDuration(videoElement.duration)
            };
        }
    };

    const handleThumbnailUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setThumbnailFile(file);
            // setThumbnail(file); // Store file object instead of URL
            // const previewUrl = URL.createObjectURL(file);
            // setThumbnailPreview(previewUrl);
        }
    };

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            { text: "", choices: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] },
        ]);
    };

    const handleRemoveQuestion = (index) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const handleQuestionChange = (index, text) => {
        const newQuestions = [...questions];
        newQuestions[index].text = text;
        setQuestions(newQuestions);
    };

    // const handleAddChoice = (questionIndex) => {
    //     const newQuestions = [...questions];
    //     newQuestions[questionIndex].choices.push({
    //         text: "",
    //         isCorrect: false,
    //     });
    //     setQuestions(newQuestions);
    // };

    // const handleRemoveChoice = (questionIndex, choiceIndex) => {
    //     const newQuestions = [...questions];
    //     newQuestions[questionIndex].choices.splice(choiceIndex, 1);
    //     setQuestions(newQuestions);
    // };

    const handleChoiceChange = (questionIndex, choiceIndex, text) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].choices[choiceIndex].text = text;
        setQuestions(newQuestions);
    };

    const handleChoiceCorrectChange = (questionIndex, choiceIndex) => {
        const newQuestions = [...questions];
        if (itemType === "assessment") {
            newQuestions[questionIndex].choices.forEach(
                (choice) => (choice.isCorrect = false)
            );
        }
        newQuestions[questionIndex].choices[choiceIndex].isCorrect = true;
        console.log('newQuestions:', newQuestions)
        setQuestions(newQuestions);
    };

    const handlePdfUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
            setPdfs([{
                title: file.name,
                file: file,
                size: file.size,
            }]);
        }
    };

    // const handleSubmit = (e) => {
    //     e.preventDefault();
    //     if (validateForm()) {
    //         const sectionItemData = {
    //             title,
    //             item_type: itemType,
    //             order: itemToEdit?.order || 0,
    //         };

    //         let specificData = {};

    //         if (itemType === "video") {
    //             specificData = {
    //                 video: {
    //                     video_file: videoFile,
    //                     thumbnail_file: thumbnailFile,
    //                 },
    //             };
    //         } else {
    //             specificData = {
    //                 assessment: {
    //                     instructions,
    //                     passing_score: parseFloat(passingScore) || 70,
    //                     questions: questions.map((q, idx) => ({
    //                         text: q.text,
    //                         order: idx,
    //                         choices: q.choices.map((c) => ({
    //                             text: c.text,
    //                             is_correct: c.isCorrect,
    //                         })),
    //                     })),
    //                 },
    //             };
    //         }

    //         const supportingDocuments = pdfs.map((pdf) => ({
    //             title: pdf.title,
    //             file: pdf.file,
    //             size: pdf.size,
    //         }));

    //         onSave({
    //             ...sectionItemData,
    //             ...specificData,
    //             supporting_documents: supportingDocuments,
    //             section_index: sectionIndex,
    //         });
    //     }
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            const formData = new FormData();
            
            // Add basic section item data
            formData.append('section', 2)
            formData.append('title', title);
            formData.append('item_type', itemType);
            formData.append('order', itemToEdit?.order || 0);
    
            if (itemType === 'video') {
                if (videoFile) formData.append('video_file', videoFile);
                if (thumbnailFile) formData.append('thumbnail_file', thumbnailFile);
                const videoData = {
                    duration: duration,
                }
                formData.append('video_data', JSON.stringify(videoData))
            } else {
                const assessmentData = {
                    instructions: instructions,
                    passing_score: parseFloat(passingScore) || 70,
                    questions: questions.map((question, qIndex) => ({
                        text: question.text,
                        order: qIndex,
                        choices: question.choices.map(choice => ({
                            text: choice.text,
                            is_correct: choice.isCorrect,
                        })),
                    })),
                };
                formData.append('assessment_data', JSON.stringify(assessmentData));
            }
    
            if (pdfs.length > 0) {
                const pdf = pdfs[0] 
                const documentData = {
                    title : pdf.title
                }
                formData.append(`document_file`, pdf.file);
                formData.append(`document_data`, JSON.stringify(documentData));
            }
    
            try {
                const response = await api.post('courses/section-items/', formData);
                console.log('response assessment:', response)
                if (response.ok) {
                    const data = response.data;
                    // onSave(data);
                } else {
                    const errorData = response.data;
                    // setErrors(errorData);
                }

            } catch (error) {
                console.error('Upload failed:', error);
            }
        }
    };
    
    return (
        <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-lg shadow-lg p-6 animate-fade-in"
        >
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">
                    {itemToEdit ? "Edit Section Item" : "New Section Item"}
                </h3>

                <InputField
                    id="section-item-title"
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter section item title"
                    error={errors.title}
                    required
                />

                <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Item Type <span className="text-destructive">*</span>
                    </label>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => setItemType("video")}
                            className={`px-4 py-2 rounded-md transition-all ${
                                itemType === "video"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-foreground"
                            }`}
                            disabled={!!itemToEdit}
                        >
                            Video
                        </button>
                        <button
                            type="button"
                            onClick={() => setItemType("assessment")}
                            className={`px-4 py-2 rounded-md transition-all ${
                                itemType === "assessment"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-foreground"
                            }`}
                            disabled={!!itemToEdit}
                        >
                            Assessment
                        </button>
                    </div>
                    {itemToEdit && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Item type cannot be changed after creation
                        </p>
                    )}
                </div>
            </div>

            {itemType === "video" ? (
                <div className="mb-6 animate-fade-in">
                    <h3 className="text-lg font-medium mb-4">Video Details</h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Upload Video <span className="text-destructive">*</span>
                        </label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <div className="mb-3 flex flex-col items-center">
                                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Drag and drop your video here, or click to browse
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    MP4, AVI, MOV files (max 10MB)
                                </p>
                            </div>
                            <input
                                type="file"
                                id="video-upload"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="hidden"
                            />
                            <label
                                htmlFor="video-upload"
                                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md cursor-pointer inline-block transition-colors"
                            >
                                Browse Files
                            </label>
                        </div>
                        {videoFile && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                                    <div className="flex items-center">
                                        <span className="text-sm truncate max-w-[250px]">
                                            {videoFile.name}
                                        </span>
                                        {videoFile && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                ({Math.round(videoFile.size / 1024)} KB)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {errors.video && (
                            <p className="mt-2 text-sm text-destructive">
                                {errors.video}
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Upload Thumbnail
                        </label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <div className="mb-3 flex flex-col items-center">
                                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Drag and drop your image here, or click to browse
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    JPG, PNG files (max 5MB)
                                </p>
                            </div>
                            <input
                                type="file"
                                id="thumbnail-upload"
                                accept="image/*"
                                onChange={handleThumbnailUpload}
                                className="hidden"
                            />
                            <label
                                htmlFor="thumbnail-upload"
                                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md cursor-pointer inline-block transition-colors"
                            >
                                Browse Files
                            </label>
                        </div>
                        {thumbnailFile && (
                            <div className="mt-4">
                                <img
                                    src={URL.createObjectURL(thumbnailFile)}
                                    alt="Thumbnail preview"
                                    className="w-full max-w-xs mx-auto rounded-lg object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="mb-6 animate-fade-in">
                    <h3 className="text-lg font-medium mb-4">
                        Assessment Details
                    </h3>

                    <InputField
                        id="instructions"
                        label="Instructions"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Enter instructions for the assessment"
                        error={errors.instructions}
                        required
                        textarea
                    />

                    <InputField
                        id="passing-score"
                        label="Passing Score (%)"
                        type="number"
                        value={passingScore}
                        onChange={(e) => setPassingScore(e.target.value)}
                        placeholder="Enter passing score percentage"
                        min="0"
                        max="100"
                    />

                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-md font-medium">Questions</h4>
                            <button
                                type="button"
                                onClick={handleAddQuestion}
                                className="flex items-center text-primary hover:text-primary/80 transition-colors"
                            >
                                <Plus size={16} className="mr-1" /> Add Question
                            </button>
                        </div>

                        {errors.questions && (
                            <p className="mb-2 text-sm text-destructive">
                                {errors.questions}
                            </p>
                        )}

                        {questions.map((question, questionIndex) => (
                            <div
                                key={questionIndex}
                                className="mb-6 p-4 bg-secondary/50 rounded-md border border-border"
                            >
                                <div className="flex justify-between mb-3">
                                    <h5 className="text-sm font-medium">
                                        Question {questionIndex + 1}
                                    </h5>
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveQuestion(
                                                    questionIndex
                                                )
                                            }
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                <InputField
                                    id={`question-${questionIndex}`}
                                    label="Question Text"
                                    value={question.text}
                                    onChange={(e) =>
                                        handleQuestionChange(
                                            questionIndex,
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter question text"
                                    error={errors[`question_${questionIndex}`]}
                                    required
                                />

                                <div className="mt-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <h6 className="text-sm font-medium">
                                            Choices
                                        </h6>
                                        {/* <button
                                            type="button"
                                            onClick={() =>
                                                handleAddChoice(questionIndex)
                                            }
                                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                                        >
                                            <Plus
                                                size={14}
                                                className="mr-1 inline"
                                            />{" "}
                                            Add Choice
                                        </button> */}
                                    </div>

                                    {errors[
                                        `question_${questionIndex}_choices`
                                    ] && (
                                        <p className="mb-2 text-xs text-destructive">
                                            {
                                                errors[
                                                    `question_${questionIndex}_choices`
                                                ]
                                            }
                                        </p>
                                    )}

                                    {question.choices.map(
                                        (choice, choiceIndex) => (
                                            <div
                                                key={choiceIndex}
                                                className="flex items-center mb-2"
                                            >
                                                <button
                                                    type="button"
                                                    key={choiceIndex}
                                                    onClick={() =>
                                                        handleChoiceCorrectChange(
                                                            questionIndex,
                                                            choiceIndex
                                                        )
                                                    }
                                                    className={`w-5 h-5 mr-3 rounded-full flex items-center justify-center transition-colors ${
                                                        choice.isCorrect
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-secondary-foreground/10 text-secondary-foreground/30"
                                                    }`}
                                                >
                                                    {choice.isCorrect && (
                                                        <Check size={12} />
                                                    )}
                                                </button>

                                                <input
                                                    type="text"
                                                    value={choice.text}
                                                    onChange={(e) =>
                                                        handleChoiceChange(
                                                            questionIndex,
                                                            choiceIndex,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={`Choice ${
                                                        choiceIndex + 1
                                                    }`}
                                                    className={`flex-1 px-3 py-2 bg-secondary text-foreground rounded border ${
                                                        errors[
                                                            `question_${questionIndex}_choice_${choiceIndex}`
                                                        ]
                                                            ? "border-destructive"
                                                            : "border-input"
                                                    } focus:outline-none focus:ring-1 focus:ring-primary/20 text-sm`}
                                                />

                                                {/* {question.choices.length >
                                                    1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveChoice(
                                                                questionIndex,
                                                                choiceIndex
                                                            )
                                                        }
                                                        className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )} */}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">
                    Supporting Document (Optional)
                </h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Upload PDF
                    </label>

                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <div className="mb-3 flex flex-col items-center">
                            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Drag and drop your PDF here, or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PDF file only (max 5MB)
                            </p>
                        </div>

                        <input
                            type="file"
                            id="pdf-upload"
                            accept=".pdf"
                            onChange={handlePdfUpload}
                            className="hidden"
                            disabled={pdfs.length > 0}
                        />
                        <label
                            htmlFor="pdf-upload"
                            className={`px-4 py-2 rounded-md cursor-pointer inline-block transition-colors ${
                                pdfs.length > 0
                                    ? "bg-secondary/50 text-foreground/50 cursor-not-allowed"
                                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                            }`}
                        >
                            Browse File
                        </label>
                    </div>
                </div>

                {pdfs.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">
                            Uploaded Document
                        </h4>
                        <div className="space-y-2">
                            {pdfs.map((pdf, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-md"
                                >
                                    <div className="flex items-center">
                                        <span className="text-sm truncate max-w-[250px]">
                                            {pdf.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            ({Math.round(pdf.size / 1024)} KB)
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-md transition-colors"
                >
                    {itemToEdit ? "Update Item" : "Save Section Item"}
                </button>
            </div>
        </form>
    );
};

// export default SectionItemForm;


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
            console.log('Add item on SectionCard')
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

// export default SectionCard;


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

    console.log('uploadedCourse:', uploadedCourse)
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
        setLoading(true)
        try{
            const response = await api.get(`courses/incomplete-course/${id}/content/`);
            console.log('res req:', response)
            setUploadedCourse(prevState => ({
                ...prevState,
                sections: Array.isArray(response.sections) ? response.sections : []
            }));
    
        } catch (error) {
            console.error("Error saving course:", error);
            handleError(error, "There was a problem fetching sections.");
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log('uploadedCourse:', uploadedCourse)
        if (!uploadedCourse.sections) {
            fetchSections(uploadedCourse.id);
        }
    }, [uploadedCourse.sections]);

    // Handle section title change
    const handleSectionTitleChange = (e) => {
        setSectionTitle(e.target.value);
    };

    // Handle add section
    const handleAddSection = async () => {
        const sectionTitleTrimmed = sectionTitle.trim()
        if (!sectionTitleTrimmed) {
            setErrors({ sectionTitle: "Section title is required" });
            return;
        }
        if (sectionTitleTrimmed.length < 10){
            setErrors({ sectionTitle: "Section title must contain 10 letters" });
            return;
        }
        try{
            setLoading(true)
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
                const body = {
                    course: uploadedCourse.id,
                    title: sectionTitle,
                    order: sections.length + 1,
                }
                const response = await api.post('courses/sections/', body);
                console.log('Data sent successfully:', response.data);
                toast("Course section have been saved.");
                setSections([
                    ...sections,
                    {
                        title: sectionTitle,
                        order: sections.length + 1,
                        items: [],
                    },
                ]);
            }
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
    const handleDeleteSection = (index) => {
        const updatedSections = [...sections];
        updatedSections.splice(index, 1);

        // Update order for remaining sections
        updatedSections.forEach((section, idx) => {
            section.order = idx;
        });

        setSections(updatedSections);

        // // Save to localStorage
        // localStorage.setItem("courseSections", JSON.stringify(updatedSections));
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
        console.log('updated_sections:', updatedSections)
        setSections(updatedSections);

        // // Save to localStorage
        // localStorage.setItem("courseSections", JSON.stringify(updatedSections));

        // Save to backend
        handleSaveItem(section_index, sectionItemData);
    };

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
    const handleDeleteSectionItem = (sectionIndex, itemIndex) => {
        const updatedSections = [...sections];

        // Remove the item
        updatedSections[sectionIndex].items.splice(itemIndex, 1);

        // Update order for remaining items
        updatedSections[sectionIndex].items.forEach((item, idx) => {
            item.order = idx;
        });

        setSections(updatedSections);

        // // Save to localStorage
        // localStorage.setItem("courseSections", JSON.stringify(updatedSections));

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

        // localStorage.setItem("courseSections", JSON.stringify(sections));

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

// export default Step3CourseContent;
