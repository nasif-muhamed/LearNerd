import { useEffect, useState, useRef } from "react";
import {
    FiVideo ,
    FiCheck,
    FiBook,
    FiAward,
    FiClock,
    FiStar,
    FiChevronDown,
    FiChevronUp,
    FiArrowLeft,
    FiArrowRight,
    FiX ,
    FiRefreshCw,
    FiDownload,
} from "react-icons/fi";
import { MdError } from "react-icons/md";
import { Link, useParams } from "react-router-dom";
import api from "../../../../services/api/axiosInterceptor";
import handleError from "../../../../utils/handleError";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { toast } from "sonner";
import { UserRound } from "lucide-react";

const StreamCourse = () => {
    const BASE_URL = import.meta.env.VITE_BASE_URL
    const { purchaseId } = useParams();
    const [loading, setLoading] = useState(null);
    const [myCourse, setMyCourse] = useState(null);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [expandedSections, setExpandedSections] = useState({});
    const [showFeedbackModal, setShowFeedbackModal] = useState(false); 
    const [showReportModal, setShowReportModal] = useState(false); 
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [report, setReport] = useState("");
    const [myReview, setMyReview] = useState(null);
    const [myReport, setMyReport] = useState(null);
    const [reviews, setReviews] = useState(null);
    const [currentItem, setCurrentItem] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [assessmentComplete, setAssessmentComplete] = useState(false);
    const [assessmentScore, setAssessmentScore] = useState({ score: 0, total: 0, percentage: 0, passed: false });
    const [showVideoAd, setShowVideoAd] = useState(false);
    const [adViewed, setAdViewed] = useState([])
    const contentRef = useRef(null);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response = await api.get(`courses/stream/${purchaseId}/`);
            console.log("My Purchased course response:", response);
            const result = response.data;
            setMyCourse(result);
            setAdViewed(result.ad_viewed)
        } catch (error) {
            console.log("Couses Error:", error);
            handleError(error, "Error fetching Couses");
            setError("Failed to fetch courses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch course data based on courseId
        fetchCourse();
    }, []);
    // Dummy course data

    const fetchFeedbacks = async () => {
        if (!reviews || !myReview) {
            try{
                setLoading(true);
                const response = await api.get(`courses/my-course/${myCourse?.course?.id}/feedback/`);
                console.log("My reviews response:", response);
                const result = response.data;

                if(result.reviews?.length) setReviews(result.reviews);
                if(result.my_review) setMyReview(result.my_review);
                if(result.my_report) setMyReport(result.my_report);
            }catch (error) {
                console.log("Couses Error:", error);
                handleError(error, "Error fetching reviews");
                setError("Failed to fetch reviews.");
            } finally {
                setLoading(false);
            }
        }
    }

    const toggleSection = (sectionId) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    const handleItemClick = (item) => {
        setCurrentItem(item);
        console.log("currentItem", item);

        if (item?.item_type === "assessment") {
            if (item?.assessment?.id !== assessmentScore.assementId) {
                setAssessmentComplete(false);
            }
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
        }
        // Scroll to the content area using the ref
        console.log('myCourse?.purchase_type == ', (item?.item_type === "video" && myCourse?.purchase_type == 'freemium' && !adViewed.includes(item.id)))
        if (item?.item_type === "video" && myCourse?.purchase_type == 'freemium' && !adViewed.includes(item.id)){
            setShowVideoAd(true)
        }
        contentRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });

        console.log('myCourse:', myCourse)
    };

    const submitFeedback = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await api.post(`courses/${myCourse?.course?.id}/reviews/`, { rating, review });
            console.log("My feedback response:", response);
            toast.success("Feedback submitted successfully!");
            fetchFeedbacks();
        } catch (error) {
            console.log("Couses Error:", error);
            handleError(error, "Error submitting feedback");
            setError("Failed to submit feedback.");
        } finally {
            setLoading(false);
        }
        console.log('ratings:', { rating, review });
        setShowFeedbackModal(false);
        setRating(0);
        setReview("");
    };

    const submitReport = async (e) => {
        e.preventDefault();
        try {
            if (!report) {
                toast.info('you must give a report')
                return
            }
            setLoading(true);
            const response = await api.post(`courses/${myCourse?.course?.id}/reports/`, { report });
            console.log("My report response:", response);
            toast.success("Report submitted successfully!");
            setMyReport(response.data)
        } catch (error) {
            console.log("Couses Error:", error);
            handleError(error, "Error submitting report");
            setError("Failed to report.");
        } finally {
            setLoading(false);
        }
        setShowReportModal(false);
        setReport("");
    };


    const handleAnswerSelect = (questionId, answerId) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: answerId,
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < currentItem?.assessment?.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    const submitAssessment = async (assessmentId) => {
        try {
            setLoading(true);
            const body = {
                answers: selectedAnswers,
            }
            console.log('selectedAnswers:', body);
            const response = await api.post(`courses/assessments/${assessmentId}/submit/`, body);
            console.log('Assessment response:', response);
            const result = response.data;
            if (result?.purchase) setMyCourse(result.purchase);
    
            // Calculate score
            const totalQuestions = currentItem?.assessment?.questions.length;
            const correctAnswers = result?.score || 0
            
            // Calculate percentage
            const percentage = (correctAnswers / totalQuestions) * 100;
            const passed = percentage >= currentItem?.assessment?.passing_score;
            
            // Save score to state
            setAssessmentScore({
                assementId: assessmentId,
                score: correctAnswers,
                total: totalQuestions,
                percentage: percentage.toFixed(0),
                passed
            });
            
            // Set assessment as complete to trigger results display
            setAssessmentComplete(true);
    
        } catch (error) {
            console.log("Couses Error:", error);
            handleError(error, "Error submitting assessment");
            setError("Failed to submit assessment.");
        } finally {
            setLoading(false);
        }

    };

    const submitVideo = async () => {
        console.log('currentItem:++', currentItem)
        const videoId = currentItem?.id
        const isCompleted= currentItem?.completion?.completed || false
        if (!isCompleted){
            try {
                const body = {
                    completed: true,
                };
        
                const response = await api.post(`courses/lecture/${videoId}/submit/`, body);
                console.log('Video response:', response);
                const result = response.data;
        
                if (result?.purchase) setMyCourse(result.purchase);
                toast.success("Video marked as completed successfully!");
            } catch (error) {
                console.log("Courses Error:", error);
                handleError(error, "Error submitting video");
            } 
        }
    };

    const handleAdEnded = async () => {
        console.log('handleEnded')
        setShowVideoAd(false);
        try{
            const response = await api.post(`courses/ad-viewed/${currentItem.id}/`)
            setAdViewed([...adViewed, currentItem.id])
            console.log('handleAdEnded response:', response)
        }catch (error) {
            console.log('handleAdEnded error response:', error)
        }
    };
    
    return (
        <div className="min-h-screen text-foreground">
            {loading && <LoadingSpinner />}
            {myCourse?.ads?.study_room_banner && (
                <div className="relative aspect-[8/1] overflow-hidden bg-gray-400 my-5 mx-10">
                    <img
                        src={myCourse.ads.study_room_banner.banner_url}
                        alt={myCourse.ads.study_room_banner?.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            {/* for scrolling to the top on click of section item */}
            <div ref={contentRef}> </div>
            {/* Content Display Area */}
            {currentItem && (
                <div  className="container mx-auto px-10 pt-6">
                    <h2 className="text-xl font-bold mb-2">
                        {currentItem.title}
                    </h2>

                    {currentItem?.item_type === "video" && (
                        <div className="relative w-full max-w-3xl mx-auto mb-4">
                            <div className="rounded-lg overflow-hidden shadow-md aspect-video">
                                <video
                                    className="w-full h-full object-cover"
                                    src={showVideoAd? myCourse.ads?.pre_rollVideo?.video_url : currentItem?.video?.video_url}
                                    controls={!showVideoAd}
                                    autoPlay={showVideoAd}
                                    poster={showVideoAd ? '' : currentItem?.video?.thumbnail || ''}
                                    controlsList="nodownload"   
                                    onEnded={() => {
                                        showVideoAd ? handleAdEnded() : submitVideo()
                                    }}
                                >
                                    Your browser does not support the video tag.
                                    Try with another browser.
                                </video>
                            </div>
                        </div>
                    )}

                    {currentItem?.item_type === "assessment" && (
                        <div className="max-w-3xl mx-auto mb-6 bg-gradient-to-br from-primary/5 to-secondary/10 rounded-xl shadow-lg overflow-hidden">
                            {/* Progress bar */}
                            {!assessmentComplete && (<div className="w-full bg-muted h-1">
                                <div
                                    className="bg-primary h-full transition-all duration-300 ease-in-out"
                                    style={{
                                        width: `${
                                            ((currentQuestionIndex + 1) /
                                                currentItem?.assessment?.questions.length) * 100
                                        }%`,
                                    }}
                                ></div>
                            </div>)}

                            {assessmentComplete ? (
                                <div className="p-6 text-center">
                                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                                        assessmentScore.passed 
                                            ? "bg-green-100 text-green-600" 
                                            : "bg-red-100 text-red-600"
                                    }`}>
                                        {assessmentScore.passed ? (
                                            <FiCheck className="w-10 h-10" />
                                        ) : (
                                            <FiX className="w-10 h-10" />
                                        )}
                                    </div>
                                    
                                    <h2 className="text-2xl font-bold mb-2">
                                        {assessmentScore.passed ? "Congratulations!" : "Better Luck Next Time"}
                                    </h2>
                                    
                                    <p className="text-lg mb-4">
                                        {assessmentScore.passed 
                                            ? "You've successfully passed the assessment." 
                                            : `You didn't meet the passing score of ${currentItem?.assessment?.passing_score}%.`}
                                    </p>
                                    
                                    <div className="flex justify-center mb-6">
                                        <div className="bg-background rounded-lg p-4 shadow-sm">
                                            <div className="text-sm text-muted-foreground mb-2">Your Score</div>
                                            <div className="text-3xl font-bold">
                                                {assessmentScore.percentage}%
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {assessmentScore.score} out of {assessmentScore.total} correct
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-center gap-3">
                                        <button 
                                            className="px-4 py-2 rounded-lg font-medium text-sm bg-muted hover:bg-muted/80 transition-all"
                                            onClick={() => {
                                                // Reset assessment state to try again
                                                setAssessmentComplete(false);
                                                setCurrentQuestionIndex(0);
                                                setSelectedAnswers({});
                                            }}
                                        >
                                            <span className="flex items-center">
                                                <FiRefreshCw className="mr-2 w-4 h-4" />
                                                Try Again
                                            </span>
                                        </button>
                                        
                                        {/* <button 
                                            className="px-4 py-2 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                                            onClick={() => {
                                                // Navigate back to course or whatever is appropriate in your app
                                                // This might look different based on your navigation structure
                                                router.push(`/course/${currentItem.course_id}`);
                                            }}
                                        >
                                            <span className="flex items-center">
                                                Continue
                                                <FiArrowRight className="ml-2 w-4 h-4" />
                                            </span>
                                        </button> */}
                                    </div>
                                </div>
                            ):(
                                <div className="p-5">
                                    {/* Compact header with instructions in popover/dropdown */}
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="relative group">
                                            <button className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md cursor-help">
                                                Instructions
                                            </button>
                                            {/* Custom tooltip that appears on hover */}
                                            <div className="absolute left-0 top-full mt-1 z-10 bg-background border border-border rounded-md shadow-lg p-3 w-96 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                                <p className="text-xs mb-2">{currentItem?.assessment?.instructions}</p>
                                                <p className="text-xs">You have to score atleast {currentItem?.assessment?.passing_score}% to pass the assessment.</p>
                                            </div>
                                        </div>

                                        {/* Navigation with question counter in center */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                className={`rounded-full p-1.5 transition-colors ${
                                                    currentQuestionIndex === 0
                                                        ? "text-muted-foreground bg-muted cursor-not-allowed"
                                                        : "text-primary hover:bg-primary/10"
                                                }`}
                                                onClick={handlePrevQuestion}
                                                disabled={currentQuestionIndex === 0}
                                                aria-label="Previous question"
                                            >
                                                <FiArrowLeft className="w-4 h-4" />
                                            </button>
                                            
                                            <h3 className="text-sm font-medium px-2">
                                                {currentQuestionIndex + 1} of {currentItem?.assessment?.questions.length}
                                            </h3>
                                            
                                            <button
                                                className={`rounded-full p-1.5 transition-colors ${
                                                    currentQuestionIndex === currentItem?.assessment?.questions.length - 1
                                                        ? "text-muted-foreground bg-muted cursor-not-allowed"
                                                        : "text-primary hover:bg-primary/10"
                                                }`}
                                                onClick={handleNextQuestion}
                                                disabled={currentQuestionIndex === currentItem?.assessment?.questions.length - 1}
                                                aria-label="Next question"
                                            >
                                                <FiArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Question content with number */}
                                    <div className="mb-4">
                                        <p className="text-lg font-medium mb-3 text-wrap">
                                            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-xs mr-2">
                                                Q{currentQuestionIndex + 1}
                                            </span>
                                            {currentItem?.assessment?.questions[currentQuestionIndex].text}
                                        </p>

                                        <div className="space-y-2">
                                            {currentItem?.assessment?.questions[currentQuestionIndex].choices?.map((option, index) => (
                                                <div
                                                    key={option.id}
                                                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center ${
                                                        selectedAnswers[currentItem?.assessment?.questions[currentQuestionIndex].id] === option.id
                                                            ? "bg-primary text-primary-foreground shadow-md translate-y-px"
                                                            : "bg-background border border-border hover:border-primary/30 hover:bg-primary/5"
                                                    }`}
                                                    onClick={() => handleAnswerSelect(
                                                        currentItem?.assessment?.questions[currentQuestionIndex].id,
                                                        option.id
                                                    )}
                                                >
                                                    <div
                                                        className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center shrink-0 ${
                                                            selectedAnswers[currentItem?.assessment?.questions[currentQuestionIndex].id] === option.id
                                                                ? "bg-white/20"
                                                                : "bg-muted"
                                                        }`}
                                                    >
                                                        {String.fromCharCode(65 + index)}
                                                    </div>
                                                    <span className="text-sm">{option.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Submit button or progress indicator */}
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-muted-foreground">
                                            {Object.keys(selectedAnswers).length} of {currentItem?.assessment?.questions.length} answered
                                        </div>

                                        {currentQuestionIndex === currentItem?.assessment?.questions.length - 1 ? (
                                            <button
                                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                                    Object.keys(selectedAnswers).length < currentItem?.assessment?.questions.length
                                                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg"
                                                }`}
                                                onClick={() => submitAssessment(currentItem?.assessment?.id)}
                                                disabled={Object.keys(selectedAnswers).length < currentItem?.assessment?.questions.length}
                                            >
                                                <span className="flex items-center">
                                                    Submit Assessment
                                                    <FiCheck className="ml-2 w-3 h-3" />
                                                </span>
                                            </button>
                                        ) : (
                                            <button
                                                className="px-4 py-2 rounded-lg font-medium text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                                                onClick={handleNextQuestion}
                                            >
                                                <span className="flex items-center">
                                                    Next Question
                                                    <FiArrowRight className="ml-2 w-3 h-3" />
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* <div className="flex justify-between items-center">
                        <p className="text-muted-foreground text-sm">
                            {currentItem.item_type === "video"
                                ? "Video"
                                : "Assessment"}{" "}
                            • {currentItem.duration}
                        </p>
                        <button className="btn-outline">
                            {currentItem.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        </button>
                    </div> */}
                </div>
            )}

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column - Course Content */}
                    <div className="lg:w-2/3">
                        <div className="flex border-b border-border mb-6">
                            <button
                                className={`px-4 py-2 font-medium ${
                                    activeTab === "content"
                                        ? "text-primary border-b-2 border-primary"
                                        : "text-muted-foreground"
                                }`}
                                onClick={() => setActiveTab("content")}
                            >
                                Content
                            </button>
                            <button
                                className={`px-4 py-2 font-medium ${
                                    activeTab === "overview"
                                        ? "text-primary border-b-2 border-primary"
                                        : "text-muted-foreground"
                                }`}
                                onClick={() => setActiveTab("overview")}
                            >
                                Overview
                            </button>
                            <button
                                className={`px-4 py-2 font-medium ${
                                    activeTab === "reviews"
                                        ? "text-primary border-b-2 border-primary"
                                        : "text-muted-foreground"
                                }`}
                                onClick={() => {
                                    setActiveTab("reviews")
                                    fetchFeedbacks()
                                }}
                            >
                                Reviews & feedback
                            </button>
                        </div>

                        {activeTab === "content" && (
                            <div className="bg-card rounded-lg overflow-hidden">
                                {myCourse?.sections?.map((section, idx) => (
                                    <div key={idx} className="course-section">
                                        <div
                                            className="flex justify-between items-center cursor-pointer px-4"
                                            onClick={() => toggleSection(idx)}
                                        >
                                            <div>
                                                <h3 className="font-semibold">
                                                    <span className="font-extralight text-gray-400 ">
                                                        Section {idx + 1} - 
                                                    </span>{" "}
                                                    {section.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {section.items.length}{" "}
                                                    lessons • {section.duration}
                                                </p>
                                            </div>
                                            {expandedSections[idx] ? (
                                                <FiChevronUp />
                                            ) : (
                                                <FiChevronDown />
                                            )}
                                        </div>

                                        {expandedSections[idx] && (
                                            <div className="mt-4 px-4">
                                                {section.items?.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={`flex items-center p-3 rounded-md mb-2 cursor-pointer hover:bg-secondary border ${
                                                            currentItem?.id ===
                                                            item.id
                                                                ? "bg-secondary"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            handleItemClick(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        <div className="mr-3 flex gap-2 items-center">
                                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item?.completion?.completed ? "bg-primary" : "bg-muted"}`}>
                                                                {item?.completion?.completed && (
                                                                    <FiCheck className="text-primary-foreground" size={12} />
                                                                )}
                                                            </div>
                                                            <div className="w-6 h-6 flex items-center justify-center">
                                                                {item?.item_type ===
                                                                    "video" ? (
                                                                    <FiVideo 
                                                                        className="text-muted-foreground"
                                                                    />
                                                                ) : (
                                                                    <FiAward
                                                                        className="text-muted-foreground"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium">
                                                                {item.title}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {item?.duration}
                                                            </p>
                                                            
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {item?.documents && (
                                                                <div 
                                                                    className="p-1 rounded-md hover:bg-muted"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const url = item.documents.pdf_url.endsWith('.pdf') ? item.documents.pdf_url : item.documents.pdf_url + '.pdf';
                                                                        window.open(url, '_blank');
                                                                    }}
                                                                    title={`Download ${item.documents.title}`}
                                                                >
                                                                    <FiDownload size={16} className="text-primary" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === "overview" && (
                            <div className="bg-card rounded-lg p-6">
                                <div className="">
                                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                        {myCourse?.course?.title}
                                    </h1>
                                    <p className="text-muted-foreground mb-4">
                                        {myCourse?.course?.description}
                                    </p>

                                    <div className="flex items-center mb-4">
                                        <div className="rating-stars mr-2">
                                            {[...Array(5)]?.map((_, i) => (
                                                <FiStar
                                                    key={i}
                                                    className={`${
                                                        i <
                                                        Math.floor(
                                                            myCourse?.course?.average_rating
                                                        )
                                                            ? "fill-current"
                                                            : ""
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-muted-foreground text-sm">
                                            {myCourse?.course?.average_rating} (
                                            {myCourse?.course?.total_reviews} ratings) •{" "}
                                            {Number(myCourse?.course?.analytics?.total_admission)?.toLocaleString()}{" "}
                                            students
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="tag">
                                            <FiClock className="mr-1" />{" "}
                                            {myCourse?.course?.analytics?.total_video_duration}
                                        </span>
                                        <span className="tag">
                                            <FiBook className="mr-1" />{" "}
                                            {myCourse?.course?.analytics?.section_count} sections
                                        </span>
                                        <span className="tag">
                                            <FiAward className="mr-1" />{" "}
                                            {myCourse?.course?.analytics?.video_count + myCourse?.course?.analytics?.assessment_count} Lectures
                                        </span>
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold mb-4">
                                    What you'll learn
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    {myCourse?.course?.objectives?.map(
                                        (item, index) => (
                                            <div
                                                key={index}
                                                className="checklist-item"
                                            >
                                                <FiCheck className="text-primary mt-1 flex-shrink-0" />
                                                <span>{item.objective}</span>
                                            </div>
                                        )
                                    )}
                                </div>

                                <h2 className="text-xl font-bold mb-4">
                                    Requirements
                                </h2>
                                <ul className="list-disc pl-5 mb-8">
                                    {myCourse?.course?.requirements?.map((req, index) => (
                                        <li key={index} className="mb-2">
                                            {req.requirement}
                                        </li>
                                    ))}
                                </ul>

                                <h2 className="text-xl font-bold mb-4">
                                    Course Details
                                </h2>
                                {myCourse?.purchase_type == 'subscription' && (<div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-muted-foreground">
                                            Video Sessions
                                        </p>
                                        <p>{myCourse?.course?.video_session} out of {myCourse?.course?.video_session} left</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Chat up to
                                        </p>
                                        <p>
                                        {(() => {
                                            const date = new Date(myCourse?.course?.created_at);
                                            date.setDate(date.getDate() + myCourse?.course?.chat_upto); // Adds 30 days to the current date
                                            return date.toLocaleDateString(); // Formats the date into a readable string
                                        })()}
                                        </p>
                                    </div>
                                </div>)}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-muted-foreground">
                                            Uploaded at
                                        </p>
                                        <p>{new Date(myCourse?.course?.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">
                                            Last updated at
                                        </p>
                                        <p>{new Date(myCourse?.course?.updated_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div>
                                <div className="bg-card rounded-lg p-6">
                                    {myReview && (
                                        <div className="mb-4">
                                            <h2 className="text-xl font-bold mb-2">
                                                Your Review
                                            </h2>
    
                                            <div className="mb-6 pb-6 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                                                <div className="flex items-center mb-3">
                                                    {/* <img
                                                        src={review.avatar}
                                                        alt={review.user}
                                                        className="w-10 h-10 rounded-full mr-3"
                                                    /> */}
                                                    <div>
                                                        <p className="text-gray-400 font-light">
                                                            {myReview.review}
                                                        </p>
                                                        <div className="flex items-center">
                                                            <div className="rating-stars mr-2">
                                                                {[...Array(5)]?.map(
                                                                    (_, i) => (
                                                                        <FiStar
                                                                            key={i}
                                                                            className={`${
                                                                                i <
                                                                                myReview.rating
                                                                                    ? "fill-current"
                                                                                    : ""
                                                                            }`}
                                                                        />
                                                                    )
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">
                                                                {myReview?.created_at && new Date(
                                                                    myReview?.created_at
                                                                ).toLocaleDateString()
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p>{review.comment}</p>
                                            </div>
    
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="text-xl font-bold text-gray-300">
                                            Students Reviews
                                        </h2>
                                        {!myReview && (<button
                                            className="btn-primary "
                                            onClick={() =>
                                                setShowFeedbackModal(true)
                                            }
                                        >
                                            Leave a Review
                                        </button>)}
                                    </div>
    
                                    {reviews ? 
                                        reviews.map((review) => (
                                            <div
                                                key={review.id}
                                                className="mb-3 pb-3 border-b border-border last:border-b-0 last:mb-0 last:pb-0"
                                            >
                                                <div className="flex items-center mb-3">
                                                    {review.user_image ? (
                                                        <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                                                            <img
                                                                src={BASE_URL + review.user_image}
                                                                alt={review.full_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center mr-3">
                                                            <UserRound />
                                                        </div>
                                                    )}
        
                                                    <div className="flex-1">
                                                        <h5>{review.full_name}</h5>
                                                        <p className="text-gray-400 font-light line-clamp-2">
                                                            {review.review}
                                                        </p>
                                                        <div className="flex items-center">
                                                            <div className="rating-stars mr-2">
                                                                {[...Array(5)]?.map(
                                                                    (_, i) => (
                                                                        <FiStar
                                                                            key={i}
                                                                            className={`${
                                                                                i <
                                                                                review.rating
                                                                                    ? "fill-current"
                                                                                    : ""
                                                                            }`}
                                                                        />
                                                                    )
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">
                                                                {myReview?.created_at && new Date(
                                                                        myReview?.created_at
                                                                    ).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p>{review.comment}</p>
                                            </div>
                                        ))
                                        :
                                        (
                                            <div className="text-gray-400 font-light italic">
                                                No other students reviewed the course yet
                                            </div>
                                        )
                                    }
                                </div>

                                <div className="bg-card rounded-lg p-6 mt-4">
                                    {myReport ? 
                                        (<div className="mb-4">
                                            <div className="flex md:justify-between md:items-center flex-col md:flex-row">
                                                <h2 className="text-xl font-bold mb-2 text-gray-300 flex items-center gap-2">
                                                    <MdError className="text-red-600"/> Your Report
                                                </h2>

                                                <h5 className="text-sm text-muted-foreground">
                                                    {myReport?.created_at && new Date(
                                                        myReport?.created_at
                                                    ).toLocaleDateString()
                                                    }
                                                </h5>
                                            </div>
    
                                            <div className="mb-6 pb-6 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                                                <div className="flex items-center mb-3">
                                                    {/* <img
                                                        src={review.avatar}
                                                        alt={review.user}
                                                        className="w-10 h-10 rounded-full mr-3"
                                                    /> */}
                                                    <p className="text-gray-400 font-light">
                                                        {myReport.report}
                                                    </p>
                                                </div>
                                            </div>
    
                                        </div>)
                                        :
                                        (<div className="flex justify-between items-center mb-2">
                                            <h2 className="text-xl font-bold mb-2 text-gray-300 flex items-center gap-2">
                                                <MdError className="text-destructive"/> Report Course
                                            </h2>

                                            <button
                                                className="btn-primary bg-destructive"
                                                onClick={() =>
                                                    setShowReportModal(true)
                                                }
                                            >
                                                Report
                                            </button>
                                        </div>)
                                    }
                                </div>
                            </div>    

                        )}
                    </div>

                    {/* Right Column - Instructor & More */}
                    <div className="lg:w-1/3">
                        <div className="bg-card rounded-lg p-6 mb-6">
                            <h2 className="text-xl font-bold mb-4">
                                Instructor
                            </h2>
                            <div className="flex items-center mb-4">
                                <div className="w-16 h-16 mr-4 rounded-full overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all">
                                    <img
                                        src={myCourse?.course?.instructor_details?.image}
                                        alt={myCourse?.course?.instructor_details?.email}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-bold">
                                        {myCourse?.course?.instructor_details?.first_name + " " + myCourse?.course?.instructor_details?.last_name}
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        {myCourse?.course?.instructor_details?.email}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm mb-4">
                                {myCourse?.course?.instructor_details?.biography}                         
                            </p>
                            <Link to={`/student/tutors/${myCourse?.course?.instructor}`} className="btn-outline w-full">
                                View Profile
                            </Link>
                        </div>

                    </div>
                </div>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">
                            Course Feedback
                        </h2>

                        <form onSubmit={submitFeedback}>
                            <div className="mb-4">
                                <label className="block mb-2">Rating</label>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5]?.map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="text-2xl mr-2"
                                        >
                                            <FiStar
                                                className={
                                                    star <= rating
                                                        ? "text-yellow-400 fill-current"
                                                        : "text-muted-foreground"
                                                }
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="review" className="block mb-2">
                                    Review
                                </label>
                                <textarea
                                    id="review"
                                    rows="4"
                                    className="w-full bg-muted border border-border rounded-md p-3 text-foreground"
                                    placeholder="Share your experience with this course ..."
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={() => setShowFeedbackModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={rating === 0}
                                >
                                    Submit Review
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">
                            Course Feedback
                        </h2>

                        <form onSubmit={submitReport}>
                            <div className="mb-6">
                                <label htmlFor="report" className="block mb-2">
                                    Report
                                </label>
                                <textarea
                                    id="report"
                                    rows="4"
                                    className="w-full bg-muted border border-border rounded-md p-3 text-foreground"
                                    placeholder="Report your experience with this course ..."
                                    value={report}
                                    onChange={(e) => setReport(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={() => setShowReportModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StreamCourse;
