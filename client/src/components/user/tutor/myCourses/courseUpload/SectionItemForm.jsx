import React, { useState, useEffect } from "react";
import { X, Upload, Check, Plus } from "lucide-react";
import InputField from "./InputField";

const SectionItemForm = ({ sectionIndex, itemToEdit, onSave, onCancel }) => {
    const [title, setTitle] = useState("");
    const [itemType, setItemType] = useState("video");
    const [videoUrl, setVideoUrl] = useState("");
    const [thumbnail, setThumbnail] = useState("");
    const [duration, setDuration] = useState("");
    const [instructions, setInstructions] = useState("");
    const [passingScore, setPassingScore] = useState("70");
    const [pdfs, setPdfs] = useState([]);
    const [questions, setQuestions] = useState([
        { text: "", choices: [{ text: "", isCorrect: false }] },
    ]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (itemToEdit) {
            setTitle(itemToEdit.title || "");
            setItemType(itemToEdit.item_type || "video");

            if (itemToEdit.item_type === "video" && itemToEdit.video) {
                setVideoUrl(itemToEdit.video.video_url || "");
                setThumbnail(itemToEdit.video.thumbnail || "");
                setDuration(
                    itemToEdit.video.duration
                        ? itemToEdit.video.duration.toString()
                        : ""
                );
            } else if (
                itemToEdit.item_type === "assessment" &&
                itemToEdit.assessment
            ) {
                setInstructions(itemToEdit.assessment.instructions || "");
                setPassingScore(
                    itemToEdit.assessment.passing_score
                        ? itemToEdit.assessment.passing_score.toString()
                        : "70"
                );

                if (
                    itemToEdit.assessment.questions &&
                    itemToEdit.assessment.questions.length > 0
                ) {
                    setQuestions(
                        itemToEdit.assessment.questions.map((q) => ({
                            text: q.text || "",
                            choices: q.choices
                                ? q.choices.map((c) => ({
                                      text: c.text || "",
                                      isCorrect: c.is_correct || false,
                                  }))
                                : [{ text: "", isCorrect: false }],
                        }))
                    );
                }
            }

            if (
                itemToEdit.supporting_documents &&
                itemToEdit.supporting_documents.length > 0
            ) {
                setPdfs(itemToEdit.supporting_documents);
            }
        }
    }, [itemToEdit]);

    const validateForm = () => {
        const newErrors = {};

        if (!title.trim()) newErrors.title = "Title is required";

        if (itemType === "video") {
            if (!videoUrl.trim()) newErrors.videoUrl = "Video URL is required";
            if (!duration.trim()) newErrors.duration = "Duration is required";
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
        return Object.keys(newErrors).length === 0;
    };

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            { text: "", choices: [{ text: "", isCorrect: false }] },
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

    const handleAddChoice = (questionIndex) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].choices.push({
            text: "",
            isCorrect: false,
        });
        setQuestions(newQuestions);
    };

    const handleRemoveChoice = (questionIndex, choiceIndex) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].choices.splice(choiceIndex, 1);
        setQuestions(newQuestions);
    };

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
        setQuestions(newQuestions);
    };

    const handlePdfUpload = (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const newPdfs = Array.from(files).map((file) => ({
                title: file.name,
                file: file,
                size: file.size,
            }));
            setPdfs([...pdfs, ...newPdfs]);
        }
    };

    const handleRemovePdf = (index) => {
        const newPdfs = [...pdfs];
        newPdfs.splice(index, 1);
        setPdfs(newPdfs);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            const sectionItemData = {
                title,
                item_type: itemType,
                order: itemToEdit?.order || 0,
            };

            let specificData = {};

            if (itemType === "video") {
                specificData = {
                    video: {
                        video_url: videoUrl,
                        thumbnail: thumbnail,
                        duration: parseInt(duration, 10) || 0,
                    },
                };
            } else {
                specificData = {
                    assessment: {
                        instructions,
                        passing_score: parseFloat(passingScore) || 70,
                        questions: questions.map((q, idx) => ({
                            text: q.text,
                            order: idx,
                            choices: q.choices.map((c) => ({
                                text: c.text,
                                is_correct: c.isCorrect,
                            })),
                        })),
                    },
                };
            }

            const supportingDocuments = pdfs.map((pdf) => ({
                title: pdf.title,
                file: pdf.file,
                size: pdf.size,
            }));

            onSave({
                ...sectionItemData,
                ...specificData,
                supporting_documents: supportingDocuments,
                section_index: sectionIndex,
            });
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

                    <InputField
                        id="video-url"
                        label="Video URL"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                        error={errors.videoUrl}
                        required
                    />

                    <InputField
                        id="thumbnail"
                        label="Thumbnail URL"
                        value={thumbnail}
                        onChange={(e) => setThumbnail(e.target.value)}
                        placeholder="Enter thumbnail URL (optional)"
                    />

                    <InputField
                        id="duration"
                        label="Duration (seconds)"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="Enter video duration in seconds"
                        error={errors.duration}
                        required
                    />
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
                                        <button
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
                                        </button>
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

                                                {question.choices.length >
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
                                                )}
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
                    Supporting Documents (Optional)
                </h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Upload PDFs
                    </label>

                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <div className="mb-3 flex flex-col items-center">
                            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Drag and drop your PDFs here, or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PDF files only (max 5MB each)
                            </p>
                        </div>

                        <input
                            type="file"
                            id="pdf-upload"
                            accept=".pdf"
                            multiple
                            onChange={handlePdfUpload}
                            className="hidden"
                        />
                        <label
                            htmlFor="pdf-upload"
                            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md cursor-pointer inline-block transition-colors"
                        >
                            Browse Files
                        </label>
                    </div>
                </div>

                {pdfs.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">
                            Uploaded Documents
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
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePdf(index)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
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

export default SectionItemForm;
