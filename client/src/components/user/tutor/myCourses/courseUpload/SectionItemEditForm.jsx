import React, { useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    Trash2,
    Check,
} from "lucide-react";
import InputField from "./InputField";
import handleError from "../../../../../utils/handleError";
import api from "../../../../../services/api/axiosInterceptor";
import { toast } from "sonner";
// import InputField from "./InputField";
// import { Plus } from "lucide-react";
// import { toast } from "sonner";
// import api from "../../../../../services/api/axiosInterceptor";

const SectionItemEditForm = ({
    sectionIndex,
    sectionItem,
    getItemIcon,
    setLoading,
    onDelete,
}) => {
    const [expanded, setExpanded] = useState(false);
    const [errors, setErrors] = useState({})
    
    const onDeleteItem = async (sectionIndex, sectionItemId) => {
        try{
            setLoading(true)
            const response = await api.delete(`courses/section-items/${sectionItemId}/delete`)
            const result = response.data
            console.log('on delete Item:', result)
            onDelete(sectionIndex, result)
            toast.success("Section item has been removed.");
        }catch (error) {
            handleError(error, "Section Item deletion failed")
        }finally{
            setLoading(false)
        }
    }
    return (
        <div className="p-3 bg-secondary/30 rounded-md">
            <div 
                className="flex items-center mb-2"
            >
                <button type="button" onClick={() => setExpanded(!expanded)} className="mr-3 text-muted-foreground hover:text-foreground">
                    {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <div className="mr-3">{getItemIcon(sectionItem.item_type)}</div>
                <span className="flex-1 text-sm">{sectionItem.title}</span>
                <div className="opacity-100 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button
                        title="delete"
                        type="button"
                        onClick={() => onDeleteItem(sectionIndex, sectionItem.id)}
                        className="p-1 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        
            {expanded && 
            (<div
                // onSubmit={handleSubmit}
                className="p-6 animate-fade-in mb-2 rounded-md bg-transparent"
            >
                    <div className="mb-6">
                        <InputField
                            id="section-item-title"
                            label="Title"
                            value={sectionItem.title}
                            // onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter section item title"
                            error={errors.title}
                        />

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Item Type <span className="text-destructive">*</span>
                            </label>
                            <div
                                type="button"
                                className={`px-4 py-2 rounded-md transition-all bg-primary text-primary-foreground`}
                            >
                                {sectionItem.item_type}
                            </div>
                        </div>
                    </div>

                    {sectionItem.item_type === "video" && sectionItem.video ? (
                        <div className="mb-6 animate-fade-in">
                            <h3 className="text-lg font-medium mb-4">Session Details</h3>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Uploaded Video <span className="text-destructive">*</span>
                                </label>
                                {/* <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
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
                                </div> */}
                               
                                <div className="mt-4">
                                    <video
                                        controls
                                        // poster={sectionItem.video.thumbnail}
                                        className="w-full max-w-md mx-auto rounded-lg object-cover"
                                    >
                                        <source src={sectionItem.video.video_url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>

                                {errors.video && (
                                    <p className="mt-2 text-sm text-destructive">
                                        {errors.video}
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Uploaded Thumbnail
                                </label>
                                {/* <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
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
                                </div> */}
                                 
                                    <div className="mt-4">
                                        <img
                                            src={sectionItem.video.thumbnail}
                                            alt="Thumbnail preview"
                                            className="w-full max-w-xs mx-auto rounded-lg object-cover"
                                        />
                                    </div>
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
                                value={sectionItem.assessment.instructions}
                                // onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Enter instructions for the assessment"
                                error={errors.instructions}
                                required
                                textarea
                            />

                            <InputField
                                id="passing-score"
                                label="Passing Score (%)"
                                type="number"
                                value={sectionItem.assessment.passing_score}
                                // onChange={(e) => setPassingScore(e.target.value)}
                                placeholder="Enter passing score percentage"
                                min="0"
                                max="100"
                            />

                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-md font-medium">Questions</h4>
                                    {/* <button
                                        type="button"
                                        onClick={handleAddQuestion}
                                        className="flex items-center text-primary hover:text-primary/80 transition-colors"
                                    >
                                        <Plus size={16} className="mr-1" /> Add Question
                                    </button> */}
                                </div>

                                {errors.questions && (
                                    <p className="mb-2 text-sm text-destructive">
                                        {errors.questions}
                                    </p>
                                )}

                                {sectionItem.assessment.questions.map((question, questionIndex) => (
                                    <div
                                        key={questionIndex}
                                        className="mb-6 p-4 bg-secondary/50 rounded-md border border-border"
                                    >
                                        <div className="flex justify-between mb-3">
                                            <h5 className="text-sm font-medium">
                                                Question {questionIndex + 1}
                                            </h5>
                                            {/* {questions.length > 1 && (
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
                                            )} */}
                                        </div>

                                        <InputField
                                            id={`question-${questionIndex}`}
                                            label="Question Text"
                                            value={question.text}
                                            // onChange={(e) =>
                                            //     handleQuestionChange(
                                            //         questionIndex,
                                            //         e.target.value
                                            //     )
                                            // }
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
                                                            // onClick={() =>
                                                            //     handleChoiceCorrectChange(
                                                            //         questionIndex,
                                                            //         choiceIndex
                                                            //     )
                                                            // }
                                                            className={`w-5 h-5 mr-3 rounded-full flex items-center justify-center transition-colors ${
                                                                choice.is_correct
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "bg-secondary-foreground/10 text-secondary-foreground/30"
                                                            }`}
                                                        >
                                                            {choice.is_correct && (
                                                                <Check size={12} strokeWidth={5}/>
                                                            )}
                                                        </button>

                                                        <input
                                                            type="text"
                                                            value={choice.text}
                                                            // onChange={(e) =>
                                                            //     handleChoiceChange(
                                                            //         questionIndex,
                                                            //         choiceIndex,
                                                            //         e.target.value
                                                            //     )
                                                            // }
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

                    {/* <div className="mb-6">
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
                    </div> */}

                    {/* <div className="flex justify-end space-x-3 mt-6">
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
                            {sectionItem ? "Update Item" : "Save Section Item"}
                        </button>
                    </div> */}
                </div>)}
        </div>
    );
};

// const SectionItemEditForm = ({
//     sectionIndex,
//     itemIndex,
//     sectionItem,
//     uploadedCourse,
//     onSave,
//     onCancel
// }) => {
//     const [title, setTitle] = useState(sectionItem.title || "");
//     const [videoFile, setVideoFile] = useState(sectionItem.video?.video_file || null);
//     const [thumbnailFile, setThumbnailFile] = useState(sectionItem.video?.thumbnail_file || null);
//     const [duration, setDuration] = useState(sectionItem.video?.duration || 0);
//     const [instructions, setInstructions] = useState(sectionItem.assessment?.instructions || "");
//     const [passingScore, setPassingScore] = useState(sectionItem.assessment?.passing_score?.toString() || "70");
//     const [pdfs, setPdfs] = useState(sectionItem.supporting_documents || []);
//     const [questions, setQuestions] = useState(sectionItem.assessment?.questions || []);
//     const [errors, setErrors] = useState({});

//     const itemType = sectionItem.item_type;

//     const validateForm = () => {
//         const newErrors = {};
//         if (!title.trim()) newErrors.title = "Title is required";

//         if (itemType === "video" && !videoFile) newErrors.video = "Video file is required";
//         if (itemType === "assessment") {
//             if (!instructions.trim()) newErrors.instructions = "Instructions are required";
//             if (questions.length === 0) newErrors.questions = "At least one question is required";
//             questions.forEach((q, idx) => {
//                 if (!q.text.trim()) newErrors[`question_${idx}`] = "Question text is required";
//                 const hasCorrectAnswer = q.choices.some(c => c.is_correct);
//                 if (!hasCorrectAnswer) newErrors[`question_${idx}_choices`] = "At least one correct answer is required";
//                 q.choices.forEach((c, cIdx) => {
//                     if (!c.text.trim()) newErrors[`question_${idx}_choice_${cIdx}`] = "Choice text is required";
//                 });
//             });
//         }

//         setErrors(newErrors);
//         return Object.keys(newErrors).length === 0;
//     };

//     const handleVideoUpload = (event) => {
//         const file = event.target.files[0];
//         if (file) {
//             setVideoFile(file);
//             const videoURL = URL.createObjectURL(file);
//             const videoElement = document.createElement('video');
//             videoElement.src = videoURL;
//             videoElement.onloadedmetadata = () => setDuration(videoElement.duration);
//         }
//     };

//     const handleThumbnailUpload = (event) => {
//         const file = event.target.files[0];
//         if (file) setThumbnailFile(file);
//     };

//     const handleAddQuestion = () => {
//         setQuestions([...questions, { text: "", choices: [{ text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }] }]);
//     };

//     const handleRemoveQuestion = (index) => {
//         const newQuestions = [...questions];
//         newQuestions.splice(index, 1);
//         setQuestions(newQuestions);
//     };

//     const handleQuestionChange = (index, text) => {
//         const newQuestions = [...questions];
//         newQuestions[index].text = text;
//         setQuestions(newQuestions);
//     };

//     const handleChoiceChange = (questionIndex, choiceIndex, text) => {
//         const newQuestions = [...questions];
//         newQuestions[questionIndex].choices[choiceIndex].text = text;
//         setQuestions(newQuestions);
//     };

//     const handleChoiceCorrectChange = (questionIndex, choiceIndex) => {
//         const newQuestions = [...questions];
//         newQuestions[questionIndex].choices.forEach(c => c.is_correct = false);
//         newQuestions[questionIndex].choices[choiceIndex].is_correct = true;
//         setQuestions(newQuestions);
//     };

//     const handlePdfUpload = (event) => {
//         const file = event.target.files[0];
//         if (file && file.type === "application/pdf") setPdfs([{ title: file.name, file: file, size: file.size }]);
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!validateForm()) return;

//         const formData = new FormData();
//         formData.append('title', title);

//         if (itemType === "video") {
//             if (videoFile && videoFile !== sectionItem.video?.video_file) formData.append('video_file', videoFile);
//             if (thumbnailFile && thumbnailFile !== sectionItem.video?.thumbnail_file) formData.append('thumbnail_file', thumbnailFile);
//             formData.append('video_data', JSON.stringify({ duration }));
//         } else {
//             const assessmentData = {
//                 instructions,
//                 passing_score: parseFloat(passingScore) || 70,
//                 questions: questions.map((q, idx) => ({
//                     text: q.text,
//                     order: idx,
//                     choices: q.choices.map(c => ({ text: c.text, is_correct: c.is_correct })),
//                 })),
//             };
//             formData.append('assessment_data', JSON.stringify(assessmentData));
//         }

//         if (pdfs.length > 0 && pdfs[0].file !== sectionItem.supporting_documents?.[0]?.file) {
//             const pdf = pdfs[0];
//             formData.append('document_file', pdf.file);
//             formData.append('document_data', JSON.stringify({ title: pdf.title }));
//         }

//         try {
//             const sectionId = uploadedCourse.sections[sectionIndex].id;
//             const itemId = uploadedCourse.sections[sectionIndex].items[itemIndex].id;
//             const response = await api.patch(`courses/section-items/${itemId}/`, formData);
//             console.log('Section item updated:', response.data);
//             onSave(sectionIndex, itemIndex, response.data);
//             toast.success("Section item updated successfully.");
//         } catch (error) {
//             console.error('Update failed:', error);
//             toast.error("Failed to update section item.");
//         }
//     };

//     return (
//         <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg shadow-lg p-6 animate-fade-in">
//             <div className="mb-6">
//                 <h3 className="text-lg font-medium mb-4">Edit Section Item</h3>
//                 <InputField id="section-item-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter section item title" error={errors.title} required />
//                 <div className="mb-4">
//                     <label className="block text-sm font-medium text-foreground mb-1">Item Type</label>
//                     <p>{itemType.charAt(0).toUpperCase() + itemType.slice(1)} (Cannot be changed)</p>
//                 </div>
//             </div>

//             {itemType === "video" ? (
//                 <div className="mb-6 animate-fade-in">
//                     <h3 className="text-lg font-medium mb-4">Video Details</h3>
//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-foreground mb-2">Upload Video <span className="text-destructive">*</span></label>
//                         <input type="file" id="video-upload" accept="video/*" onChange={handleVideoUpload} className="hidden" />
//                         <label htmlFor="video-upload" className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md cursor-pointer inline-block transition-colors">Browse Files</label>
//                         {videoFile && <div className="mt-4"><span>{typeof videoFile === "string" ? videoFile : videoFile.name}</span></div>}
//                         {errors.video && <p className="mt-2 text-sm text-destructive">{errors.video}</p>}
//                     </div>
//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-foreground mb-2">Upload Thumbnail</label>
//                         <input type="file" id="thumbnail-upload" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
//                         <label htmlFor="thumbnail-upload" className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md cursor-pointer inline-block transition-colors">Browse Files</label>
//                         {thumbnailFile && <div className="mt-4"><img src={typeof thumbnailFile === "string" ? thumbnailFile : URL.createObjectURL(thumbnailFile)} alt="Thumbnail preview" className="w-full max-w-xs mx-auto rounded-lg object-cover" /></div>}
//                     </div>
//                 </div>
//             ) : (
//                 <div className="mb-6 animate-fade-in">
//                     <h3 className="text-lg font-medium mb-4">Assessment Details</h3>
//                     <InputField id="instructions" label="Instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Enter instructions" error={errors.instructions} required textarea />
//                     <InputField id="passing-score" label="Passing Score (%)" type="number" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} placeholder="Enter passing score percentage" min="0" max="100" />
//                     <div className="mt-6">
//                         <div className="flex justify-between items-center mb-4">
//                             <h4 className="text-md font-medium">Questions</h4>
//                             <button type="button" onClick={handleAddQuestion} className="flex items-center text-primary hover:text-primary/80 transition-colors"><Plus size={16} className="mr-1" /> Add Question</button>
//                         </div>
//                         {questions.map((question, qIdx) => (
//                             <div key={qIdx} className="mb-6 p-4 bg-secondary/50 rounded-md border border-border">
//                                 <InputField id={`question-${qIdx}`} label={`Question ${qIdx + 1}`} value={question.text} onChange={(e) => handleQuestionChange(qIdx, e.target.value)} placeholder="Enter question text" error={errors[`question_${qIdx}`]} required />
//                                 {question.choices.map((choice, cIdx) => (
//                                     <div key={cIdx} className="flex items-center mb-2">
//                                         <button type="button" onClick={() => handleChoiceCorrectChange(qIdx, cIdx)} className={`w-5 h-5 mr-3 rounded-full flex items-center justify-center ${choice.is_correct ? "bg-primary text-primary-foreground" : "bg-secondary-foreground/10 text-secondary-foreground/30"}`}>{choice.is_correct && <Check size={12} />}</button>
//                                         <input type="text" value={choice.text} onChange={(e) => handleChoiceChange(qIdx, cIdx, e.target.value)} placeholder={`Choice ${cIdx + 1}`} className="flex-1 px-3 py-2 bg-secondary text-foreground rounded border" />
//                                     </div>
//                                 ))}
//                                 {questions.length > 1 && <button type="button" onClick={() => handleRemoveQuestion(qIdx)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={16} /></button>}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}

//             <div className="mb-6">
//                 <h3 className="text-lg font-medium mb-4">Supporting Document (Optional)</h3>
//                 <input type="file" id="pdf-upload" accept=".pdf" onChange={handlePdfUpload} className="hidden" disabled={pdfs.length > 0} />
//                 <label htmlFor="pdf-upload" className={`px-4 py-2 rounded-md cursor-pointer inline-block transition-colors ${pdfs.length > 0 ? "bg-secondary/50 text-foreground/50 cursor-not-allowed" : "bg-secondary hover:bg-secondary/80 text-foreground"}`}>Browse File</label>
//                 {pdfs.length > 0 && <div className="mt-4"><span>{pdfs[0].title}</span></div>}
//             </div>

//             <div className="flex justify-end space-x-3 mt-6">
//                 <button type="button" onClick={onCancel} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors">Cancel</button>
//                 <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-md transition-colors">Update Item</button>
//             </div>
//         </form>
//     );
// };

export default SectionItemEditForm;
