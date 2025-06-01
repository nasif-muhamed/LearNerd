import { useState, useEffect } from 'react';
import { Plus, X, Check, Upload } from 'lucide-react';
import InputField from './InputField';
import api from '../../../../../services/api/axiosInterceptor';
import { toast } from 'sonner'; 
import handleError from '../../../../../utils/handleError'
import ProgressCircle from '../../../../../components/ui/ProgressCircle ';

const SectionItemForm = ({ 
    section,
    sectionIndex,
    onSave, 
    onCancel,
    setLoading,
}) => {
    const [title, setTitle] = useState("");
    const [itemType, setItemType] = useState("video");
    const [videoFile, setVideoFile] = useState(null);
    const [duration, setDuration] = useState(0);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [instructions, setInstructions] = useState("");
    const [passingScore, setPassingScore] = useState("70");
    const [pdfFile, setPdfFile] = useState(null);
    const [questions, setQuestions] = useState([
        { text: "", choices: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }]},
    ]);
    const [errors, setErrors] = useState({});
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadId, setUploadId] = useState(null);

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    console.log('uploadProgress:', uploadProgress)

    const validateForm = () => {
        const newErrors = {};
        if (!title.trim()) newErrors.title = "Title is required";
        
        if (itemType === "video") {
            if (!videoFile) newErrors.video = "Video file is required";
            if (!thumbnailFile) newErrors.thumbnail = "Thumbnail file is required";
        } else {
            if (!instructions.trim()) newErrors.instructions = "Instructions are required";
            if (questions.length === 0) newErrors.questions = "At least one question is required";

            questions.forEach((question, index) => {
                if (!question.text.trim()) newErrors[`question_${index}`] = "Question text is required";
                const hasCorrectAnswer = question.choices.some(choice => choice.isCorrect);
                if (!hasCorrectAnswer) newErrors[`question_${index}_choices`] = "At least one correct answer is required";
                question.choices.forEach((choice, choiceIndex) => {
                    if (!choice.text.trim()) newErrors[`question_${index}_choice_${choiceIndex}`] = "Choice text is required";
                });
            });
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) return true;
        const dupCheck = new Set();
        for (let val in newErrors) {
            if (!dupCheck.has(newErrors[val])) toast.error(newErrors[val]);
            dupCheck.add(newErrors[val]);
        }
        return false;
    };

    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setVideoFile(file);
            setUploadId(`${file.name}-${Date.now()}`);
            const videoURL = URL.createObjectURL(file);
            const videoElement = document.createElement('video');
            videoElement.src = videoURL;
            videoElement.onloadedmetadata = () => setDuration(videoElement.duration);
        }
    };

    const handleThumbnailUpload = (event) => {
        const file = event.target.files[0];
        if (file) setThumbnailFile(file);
    };

    const handleAddQuestion = () => {
        setQuestions([...questions, { text: "", choices: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] }]);
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

    const handleChoiceChange = (questionIndex, choiceIndex, text) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].choices[choiceIndex].text = text;
        setQuestions(newQuestions);
    };

    const handleChoiceCorrectChange = (questionIndex, choiceIndex) => {
        const newQuestions = [...questions];
        if (itemType === "assessment") newQuestions[questionIndex].choices.forEach(choice => choice.isCorrect = false);
        newQuestions[questionIndex].choices[choiceIndex].isCorrect = true;
        setQuestions(newQuestions);
    };

    const handlePdfUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") setPdfFile({ title: file.name, file: file, size: file.size });
    };

    const uploadChunk = async (chunk, chunkNumber, totalChunks, fileName) => {
        const formData = new FormData();
        formData.append('upload_id', uploadId);
        formData.append('chunk_number', chunkNumber);
        formData.append('total_chunks', totalChunks);
        formData.append('chunk', chunk);
        formData.append('file_name', fileName);

        const response = await api.post('courses/upload-chunk/', formData);
        return response.data;
    };

    const handleChunkUpload = async (file) => {
        if (!file || !uploadId) {
            throw new Error("Value must be non-negative");
        }

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let uploadedChunks = 0;

        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const response = await uploadChunk(chunk, i + 1, totalChunks, file.name);
            uploadedChunks = response.chunks_uploaded;
            setUploadProgress((uploadedChunks / (totalChunks + 1)) * 100);

            // if (uploadedChunks === totalChunks) {
            //     // Trigger Cloudinary upload
            //     const cloudinaryResponse = await api.post('http://localhost:8000/api/upload-to-cloudinary/', {
            //         upload_id: uploadId,
            //     });
            //     setCloudinaryUrl(cloudinaryResponse.data.data.cloudinary_url);
            // }
        }

        return
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        // setLoading(true)
        try {
            const formData = new FormData();
            formData.append('section', section.id);
            formData.append('title', title);
            formData.append('item_type', itemType);
            formData.append('order', 0);

            if (itemType === 'video') {
                if (!videoFile || !thumbnailFile) {
                    toast.error("Video and thumbnail files are required.");
                    return;
                };
                // if (videoFile) formData.append('video_file', videoFile);
                await handleChunkUpload(videoFile);
                formData.append('thumbnail_file', thumbnailFile);
                formData.append('video_data', JSON.stringify({ duration, video_id: uploadId }));
            } else {
                setUploadProgress(50);
                const assessmentData = {
                    instructions,
                    passing_score: parseFloat(passingScore) || 70,
                    questions: questions.map((q, idx) => ({
                        text: q.text,
                        order: idx,
                        choices: q.choices.map(c => ({ text: c.text, is_correct: c.isCorrect })),
                    })),
                };
                formData.append('assessment_data', JSON.stringify(assessmentData));
            }

            if (pdfFile) {
                formData.append('document_file', pdfFile.file);
                formData.append('document_data', JSON.stringify({ title: pdfFile.title }));
            }
            const response = await api.post('courses/section-items/', formData);
            setUploadProgress(100);
            const result = response.data
            console.log('Section item created:', response.data);
            onSave(result);
            toast.success("Section item created successfully.");
        } catch (error) {
            console.error('Upload failed:', error);
            handleError(error, "Failed to create section item.");
        }finally{
            // setLoading(false)
            setUploadProgress(0)
        }
    };
    console.log('videoFile:', videoFile)

    // Render form (same as original, omitting itemToEdit checks)
    return (
        <>  
            {uploadProgress > 0 && <ProgressCircle progress={uploadProgress} />}
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg shadow-lg p-6 animate-fade-in">
                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">New Section Item</h3>
                    <InputField id="section-item-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter section item title" error={errors.title} required />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-foreground mb-1">Item Type <span className="text-destructive">*</span></label>
                        <div className="flex space-x-4">
                            <button type="button" onClick={() => setItemType("video")} className={`px-4 py-2 rounded-md transition-all ${itemType === "video" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}> Video</button>
                            <button type="button" onClick={() => setItemType("assessment")} className={`px-4 py-2 rounded-md transition-all ${itemType === "assessment" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>Assessment</button>
                        </div>
                    </div>
                </div>

                {itemType === "video" ? (
                    <div className="mb-6 animate-fade-in">
                        <h3 className="text-lg font-medium mb-4">Video Details</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-foreground mb-2">Upload Video <span className="text-destructive">*</span></label>
                            <input type="file" id="video-upload" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                            <label htmlFor="video-upload" className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md cursor-pointer inline-block transition-colors">Browse Files</label>
                            {videoFile && (
                                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md max-w-xs mt-2">
                                    <span className="text-sm truncate max-w-[250px]">
                                        {videoFile?.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                        ({Math.round(videoFile?.size / 1024)} KB)
                                    </span>
                                </div>
                            )}

                            {errors.video && <p className="mt-2 text-sm text-destructive">{errors.video}</p>}
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-foreground mb-2">Upload Thumbnail</label>
                            <input type="file" id="thumbnail-upload" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                            <label htmlFor="thumbnail-upload" className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md cursor-pointer inline-block transition-colors">Browse Files</label>
                            {thumbnailFile && <div className="mt-4"><img src={URL.createObjectURL(thumbnailFile)} alt="Thumbnail preview" className="w-full max-w-xs mx-auto rounded-lg object-cover" /></div>}
                            {errors.thumbnail && <p className="mt-2 text-sm text-destructive">{errors.thumbnail}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 animate-fade-in">
                        <h3 className="text-lg font-medium mb-4">Assessment Details</h3>
                        <InputField id="instructions" label="Instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Enter instructions" error={errors.instructions} required textarea />
                        <InputField id="passing-score" label="Passing Score (%)" type="number" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} placeholder="Enter passing score percentage" min="0" max="100" />
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-md font-medium">Questions</h4>
                                <button type="button" onClick={handleAddQuestion} className="flex items-center text-primary hover:text-primary/80 transition-colors"><Plus size={16} className="mr-1" /> Add Question</button>
                            </div>
                            {questions.map((question, qIdx) => (
                                <div key={qIdx} className="mb-6 p-4 bg-secondary/50 rounded-md border border-border">
                                    <InputField id={`question-${qIdx}`} label={`Question ${qIdx + 1}`} value={question.text} onChange={(e) => handleQuestionChange(qIdx, e.target.value)} placeholder="Enter question text" error={errors[`question_${qIdx}`]} required />
                                    {question.choices.map((choice, cIdx) => (
                                        <div key={cIdx} className="flex items-center mb-2">
                                            <button type="button" onClick={() => handleChoiceCorrectChange(qIdx, cIdx)} className={`w-5 h-5 mr-3 rounded-full flex items-center justify-center ${choice.isCorrect ? "bg-primary text-primary-foreground" : "bg-secondary-foreground/10 text-secondary-foreground/30"}`}>{choice.isCorrect && <Check size={12} />}</button>
                                            <input type="text" value={choice.text} onChange={(e) => handleChoiceChange(qIdx, cIdx, e.target.value)} placeholder={`Choice ${cIdx + 1}`} className="flex-1 px-3 py-2 bg-secondary text-foreground rounded border" />
                                        </div>
                                    ))}
                                    {questions.length > 1 && <button type="button" onClick={() => handleRemoveQuestion(qIdx)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={16} /></button>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Supporting Document (Optional)</h3>
                    <input type="file" id="pdf-upload" accept=".pdf" onChange={handlePdfUpload} className="hidden"/>
                    <label htmlFor="pdf-upload" className={`px-4 py-2 rounded-md cursor-pointer inline-block transition-colors ${pdfFile ? "bg-secondary/50 text-foreground/50 cursor-not-allowed" : "bg-secondary hover:bg-secondary/80 text-foreground"}`}>Browse File</label>
                    {pdfFile && 
                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md max-w-xs mt-2">
                                <span className="text-sm truncate max-w-[250px]">
                                    {pdfFile.title}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                    ({Math.round(pdfFile.size / 1024)} KB)
                                </span>
                        </div>
                    }
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-md transition-colors">Save Section Item</button>
                </div>
            </form>
        </>
    );
};

export default SectionItemForm;