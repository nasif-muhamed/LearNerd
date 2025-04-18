import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import axios from "axios";
import api from "../../../../services/api/axiosInterceptor";


function QuizAttempt() {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const { id } = useParams();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [isQuizCompleted, setIsQuizCompleted] = useState(false); // New state for quiz completion
    const [result, setResult] = useState(null); // New state for storing result
    const question = quiz?.questions[currentQuestion];

    const fetchBadge = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${BASE_URL}api/v1/badges/${id}`);
            setQuiz(response.data);
        } catch (err) {
            setError("Failed to fetch badges.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        console.log('inside useEffect')
        fetchBadge();
    }, [fetchBadge]);

    const handleAnswer = (questionId, answerId) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: answerId,
        }));
    };

    const handleNext = () => {
        if (currentQuestion < quiz?.questions?.length - 1) {
            setCurrentQuestion((prev) => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion((prev) => prev - 1);
        }
    };

    const handleFinish = async () => {
        if (Object.keys(answers).length < quiz.total_questions) {
            toast.error("You must attend all questions");
            return;
        }
        const body = {
            badge_id: quiz.id,
            answers: answers,
        };
        try {
            setLoading(true);
            const response = await api.post("users/quiz/submit/", body);
            const { badge_acquired, is_passed, aquired_mark } = response.data; // Assuming score is returned
            setResult({ badge_acquired, is_passed, aquired_mark: aquired_mark || 0 }); // Default score to 0 if not provided
            setIsQuizCompleted(true); // Show result on the same page
            if (is_passed) {
                toast.success("Congratulations! You earned the badge!");
            } else {
                toast.info("Better luck next time!");
            }
        } catch (err) {
            toast.error("Failed to submit quiz. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Render quiz questions or result based on isQuizCompleted
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
            {loading && <LoadingSpinner />}
            {!isQuizCompleted ? (
                // Step 1 & Step 2: Quiz Questions
                <div className="max-w-3xl w-full mx-auto">
                    <div className="mb-4 text-white">
                        <div className="h-24 w-24">
                            <img
                                className="object-fill h-full w-full"
                                src={quiz?.image_url}
                                alt={quiz?.title}
                            />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">{quiz?.title}</h1>
                        <p className="mb-4 font-light text-sm">{quiz?.description}</p>
                        <p className="mb-1 font-extralight text-xs">
                            Total Questions: {quiz?.total_questions}
                        </p>
                        <p className="mb-1 font-extralight text-xs">
                            Pass Mark: {quiz?.pass_mark}
                        </p>
                    </div>

                    <div className="bg-[#242B3D] rounded-lg p-6 mb-6 text-white">
                        <h2 className="text-xl mb-6">
                            Q{currentQuestion + 1}. {question?.question}
                        </h2>
                        <div className="grid gap-4">
                            {question?.answers.map((answer) => (
                                <button
                                    key={answer.id}
                                    onClick={() => handleAnswer(question?.id, answer.id)}
                                    className={`text-left px-4 py-2 rounded-lg ${
                                        answers[question?.id] === answer.id
                                            ? "bg-[#0066FF] text-white"
                                            : "bg-[#1B2332] hover:bg-[#2A3447]"
                                    }`}
                                >
                                    {answer.options}. {answer.answer}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuestion === 0}
                            className="px-6 py-2 bg-[#242B3D] text-white rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        {currentQuestion === quiz?.questions?.length - 1 ? (
                            <button
                                onClick={handleFinish}
                                className="px-6 py-2 bg-[#28A745] text-white rounded-md"
                            >
                                Finish
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-[#0066FF] text-white rounded-md"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                // Result Display
                <div className="max-w-3xl w-full mx-auto text-center text-white">
                    <h1 className="text-3xl font-bold mb-6">
                        {result?.is_passed ? "Congratulations!" : "Quiz Result"}
                    </h1>
                    <p className="text-lg mb-4">
                        {result?.is_passed
                            ? "You passed the quiz and earned the badge!"
                            : "You didn't pass this time. Keep practicing!"}
                    </p>
                    <p className="text-xl mb-6">
                        Your Score: {result?.aquired_mark} / {quiz?.total_questions}
                    </p>
                    <button
                        onClick={() => {
                            setIsQuizCompleted(false);
                            setCurrentQuestion(0);
                            setAnswers({});
                            setResult(null);
                        }}
                        className="px-6 py-2 bg-[#0066FF] text-white rounded-md"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}

export default QuizAttempt;
