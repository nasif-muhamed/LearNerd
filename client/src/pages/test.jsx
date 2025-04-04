import { useState } from 'react';
import { FiPlay, FiCheck, FiBook, FiAward, FiClock, FiStar, FiChevronDown, FiChevronUp, FiArrowLeft, FiArrowRight } from 'react-icons/fi';

const CoursePage = () => {
  const [activeTab, setActiveTab] = useState('content');
  const [expandedSections, setExpandedSections] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Dummy course data
  const course = {
    id: 1,
    title: "Advanced React Development with Hooks and Context",
    instructor: "Jane Smith",
    instructorAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
    description: "Master React hooks, context API, and advanced patterns to build scalable applications. This course covers everything from basic hooks to custom hooks and performance optimization.",
    thumbnail: "https://via.placeholder.com/800x450",
    rating: 4.7,
    totalRatings: 1245,
    studentsEnrolled: 8500,
    duration: "12.5 hours",
    lastUpdated: "June 2023",
    language: "English",
    price: 89.99,
    discountPrice: 12.99,
    requirements: ["Basic JavaScript knowledge", "Familiarity with React basics"],
    whatYoullLearn: [
      "Master React hooks like useState, useEffect, useContext",
      "Build custom hooks for reusable logic",
      "Optimize React application performance",
      "Manage complex state with useReducer",
      "Implement context API for global state"
    ],
    sections: [
      {
        id: 1,
        title: "Getting Started",
        duration: "45 min",
        items: [
          { 
            id: 1, 
            type: "video", 
            title: "Course Introduction", 
            duration: "5:20", 
            completed: true,
            videoUrl: "https://example.com/video1",
            description: "This video introduces the course and what you'll learn."
          },
          { 
            id: 2, 
            type: "video", 
            title: "Setting Up Your Environment", 
            duration: "10:45", 
            completed: true,
            videoUrl: "https://example.com/video2",
            description: "Learn how to set up your development environment for React."
          },
          { 
            id: 3, 
            type: "article", 
            title: "React Fundamentals Recap", 
            duration: "15 min", 
            completed: true,
            content: "This article covers the fundamental concepts of React that you should be familiar with before proceeding with this course."
          }
        ]
      },
      {
        id: 2,
        title: "Core React Hooks",
        duration: "3.5 hours",
        items: [
          { 
            id: 4, 
            type: "video", 
            title: "useState Deep Dive", 
            duration: "32:15", 
            completed: true,
            videoUrl: "https://example.com/video3",
            description: "A comprehensive look at the useState hook and its advanced patterns."
          },
          { 
            id: 5, 
            type: "video", 
            title: "useEffect Patterns", 
            duration: "45:30", 
            completed: true,
            videoUrl: "https://example.com/video4",
            description: "Learn how to properly use useEffect and avoid common pitfalls."
          },
          { 
            id: 6, 
            type: "quiz", 
            title: "Hooks Knowledge Check", 
            duration: "10 questions", 
            completed: false,
            questions: [
              {
                id: 1,
                text: "What is the correct way to initialize state with useState?",
                options: [
                  { id: 1, text: "const [state, setState] = useState(initialValue)" },
                  { id: 2, text: "const state = useState(initialValue)" },
                  { id: 3, text: "const [state] = useState(initialValue)" },
                  { id: 4, text: "const state = useHook(initialValue)" }
                ],
                correctAnswer: 1
              },
              {
                id: 2,
                text: "When does useEffect run by default?",
                options: [
                  { id: 1, text: "Only on component mount" },
                  { id: 2, text: "On every render" },
                  { id: 3, text: "Only when specified dependencies change" },
                  { id: 4, text: "Both on mount and every render" }
                ],
                correctAnswer: 4
              }
            ]
          },
          { 
            id: 7, 
            type: "video", 
            title: "useContext for Global State", 
            duration: "28:45", 
            completed: false,
            videoUrl: "https://example.com/video5",
            description: "Learn how to use useContext to manage global state in your application."
          }
        ]
      },
      {
        id: 3,
        title: "Advanced Patterns",
        duration: "5 hours",
        items: [
          { 
            id: 8, 
            type: "video", 
            title: "Building Custom Hooks", 
            duration: "38:20", 
            completed: false,
            videoUrl: "https://example.com/video6",
            description: "Learn how to create your own custom hooks for reusable logic."
          },
          { 
            id: 9, 
            type: "video", 
            title: "Performance Optimization", 
            duration: "42:15", 
            completed: false,
            videoUrl: "https://example.com/video7",
            description: "Techniques to optimize your React application performance."
          },
          { 
            id: 10, 
            type: "quiz", 
            title: "Advanced Concepts Quiz", 
            duration: "15 questions", 
            completed: false,
            questions: [
              {
                id: 1,
                text: "What is the purpose of useMemo?",
                options: [
                  { id: 1, text: "To memoize functions" },
                  { id: 2, text: "To memoize values" },
                  { id: 3, text: "To create side effects" },
                  { id: 4, text: "To manage context" }
                ],
                correctAnswer: 2
              }
            ]
          }
        ]
      }
    ],
    reviews: [
      {
        id: 1,
        user: "Alex Johnson",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        rating: 5,
        date: "2 weeks ago",
        comment: "This course transformed how I work with React. The custom hooks section was particularly enlightening!"
      },
      {
        id: 2,
        user: "Sarah Williams",
        avatar: "https://randomuser.me/api/portraits/women/63.jpg",
        rating: 4,
        date: "1 month ago",
        comment: "Great content overall, but I wish there were more real-world examples in the performance section."
      }
    ]
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleItemClick = (item) => {
    setCurrentItem(item);
    if (item.type === 'quiz') {
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
    }
  };

  const submitFeedback = (e) => {
    e.preventDefault();
    // Handle feedback submission
    console.log({ rating, review });
    setShowFeedbackModal(false);
    setRating(0);
    setReview('');
  };

  const handleAnswerSelect = (questionId, answerId) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentItem.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = () => {
    // Calculate score
    const score = currentItem.questions.reduce((acc, question) => {
      return acc + (selectedAnswers[question.id] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    alert(`You scored ${score} out of ${currentItem.questions.length}`);
    // Mark as completed in a real app
  };

  const progress = 45; // Calculate based on completed items

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Content Display Area */}
      {currentItem && (
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <h2 className="text-xl font-bold mb-2">{currentItem.title}</h2>
            
            {currentItem.type === 'video' && (
              <div className="bg-black rounded-lg aspect-video mb-4 flex items-center justify-center">
                <div className="text-center">
                  <FiPlay className="w-16 h-16 mx-auto text-white/50" />
                  <p className="text-white/70 mt-2">Video Player Placeholder</p>
                  <p className="text-sm text-white/50 mt-1">{currentItem.videoUrl}</p>
                </div>
              </div>
            )}
            
            {currentItem.type === 'article' && (
              <div className="bg-muted rounded-lg p-6 mb-4">
                <h3 className="font-bold mb-2">Article Content</h3>
                <p>{currentItem.content}</p>
              </div>
            )}
            
            {currentItem.type === 'quiz' && (
              <div className="bg-muted rounded-lg p-6 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">
                    Question {currentQuestionIndex + 1} of {currentItem.questions.length}
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      className="btn-outline px-3 py-1 text-sm"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      <FiArrowLeft />
                    </button>
                    <button 
                      className="btn-outline px-3 py-1 text-sm"
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === currentItem.questions.length - 1}
                    >
                      <FiArrowRight />
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-lg mb-4">
                    {currentItem.questions[currentQuestionIndex].text}
                  </p>
                  
                  <div className="space-y-3">
                    {currentItem.questions[currentQuestionIndex].options.map(option => (
                      <div 
                        key={option.id}
                        className={`p-3 rounded-md cursor-pointer border ${
                          selectedAnswers[currentItem.questions[currentQuestionIndex].id] === option.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-secondary'
                        }`}
                        onClick={() => handleAnswerSelect(
                          currentItem.questions[currentQuestionIndex].id, 
                          option.id
                        )}
                      >
                        {option.text}
                      </div>
                    ))}
                  </div>
                </div>
                
                {currentQuestionIndex === currentItem.questions.length - 1 && (
                  <button 
                    className="btn-primary"
                    onClick={submitQuiz}
                    disabled={Object.keys(selectedAnswers).length < currentItem.questions.length}
                  >
                    Submit Quiz
                  </button>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground text-sm">
                {currentItem.type === 'video' ? 'Video' : currentItem.type === 'article' ? 'Reading' : 'Assessment'} • {currentItem.duration}
              </p>
              <button className="btn-outline">
                {currentItem.completed ? 'Mark as incomplete' : 'Mark as complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Course Content */}
          <div className="lg:w-2/3">
            <div className="flex border-b border-border mb-6">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'content' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('content')}
              >
                Content
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'reviews' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews
              </button>
            </div>

            {activeTab === 'content' && (
              <div className="bg-card rounded-lg overflow-hidden">
                {course.sections.map(section => (
                  <div key={section.id} className="course-section">
                    <div 
                      className="flex justify-between items-center cursor-pointer px-4"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div>
                        <h3 className="font-semibold">{section.title}</h3>
                        <p className="text-sm text-muted-foreground">{section.items.length} lessons • {section.duration}</p>
                      </div>
                      {expandedSections[section.id] ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                    
                    {expandedSections[section.id] && (
                      <div className="mt-4 px-4">
                        {section.items.map(item => (
                          <div 
                            key={item.id}
                            className={`flex items-center p-3 rounded-md mb-2 cursor-pointer hover:bg-secondary ${currentItem?.id === item.id ? 'bg-secondary' : ''}`}
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="mr-3">
                              {item.completed ? (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                  <FiCheck className="text-primary-foreground" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border border-muted flex items-center justify-center">
                                  {item.type === 'video' || item.type === 'article' ? (
                                    <FiPlay className="text-muted-foreground" size={12} />
                                  ) : (
                                    <FiAward className="text-muted-foreground" size={12} />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.duration}</p>
                            </div>
                            {item.type === 'quiz' && (
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                Quiz
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="bg-card rounded-lg p-6">                
              <div className="">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{course.title}</h1>
                <p className="text-muted-foreground mb-4">{course.description}</p>
                
                <div className="flex items-center mb-4">
                  <div className="rating-stars mr-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className={`${i < Math.floor(course.rating) ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {course.rating} ({course.totalRatings} ratings) • {course.studentsEnrolled.toLocaleString()} students
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="tag"><FiClock className="mr-1" /> {course.duration}</span>
                  <span className="tag"><FiBook className="mr-1" /> {course.sections.length} sections</span>
                  <span className="tag"><FiAward className="mr-1" /> Certificate of completion</span>
                </div>
              </div>


                <h2 className="text-xl font-bold mb-4">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {course.whatYoullLearn.map((item, index) => (
                    <div key={index} className="checklist-item">
                      <FiCheck className="text-primary mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <h2 className="text-xl font-bold mb-4">Requirements</h2>
                <ul className="list-disc pl-5 mb-8">
                  {course.requirements.map((req, index) => (
                    <li key={index} className="mb-2">{req}</li>
                  ))}
                </ul>

                <h2 className="text-xl font-bold mb-4">Course Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Last updated</p>
                    <p>{course.lastUpdated}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Language</p>
                    <p>{course.language}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p>{course.duration}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Instructor</p>
                    <p>{course.instructor}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-card rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Student Reviews</h2>
                  <button 
                    className="btn-primary"
                    onClick={() => setShowFeedbackModal(true)}
                  >
                    Leave a Review
                  </button>
                </div>

                {course.reviews.map(review => (
                  <div key={review.id} className="mb-6 pb-6 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                    <div className="flex items-center mb-3">
                      <img 
                        src={review.avatar} 
                        alt={review.user} 
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <p className="font-medium">{review.user}</p>
                        <div className="flex items-center">
                          <div className="rating-stars mr-2">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={`${i < review.rating ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p>{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Instructor & More */}
          <div className="lg:w-1/3">
            <div className="bg-card rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Instructor</h2>
              <div className="flex items-center mb-4">
                <img 
                  src={course.instructorAvatar} 
                  alt={course.instructor} 
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div>
                  <p className="font-bold">{course.instructor}</p>
                  <p className="text-muted-foreground text-sm">Senior React Developer</p>
                </div>
              </div>
              <p className="text-sm mb-4">Jane has over 8 years of experience building web applications with React. She has worked with companies like Google and Facebook as a frontend architect.</p>
              <button className="btn-outline w-full">View Profile</button>
            </div>

            <div className="bg-card rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">More Courses</h2>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4">
                    <div className="w-24 h-16 bg-muted rounded-md flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm">React Native: Building Mobile Apps</p>
                      <p className="text-muted-foreground text-xs">Jane Smith</p>
                      <div className="flex items-center mt-1">
                        <div className="rating-stars mr-1">
                          <FiStar className="fill-current" />
                          <FiStar className="fill-current" />
                          <FiStar className="fill-current" />
                          <FiStar className="fill-current" />
                          <FiStar />
                        </div>
                        <span className="text-xs text-muted-foreground">(1,245)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Course Feedback</h2>
            
            <form onSubmit={submitFeedback}>
              <div className="mb-4">
                <label className="block mb-2">Rating</label>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-2xl mr-2"
                    >
                      <FiStar className={star <= rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="review" className="block mb-2">Review</label>
                <textarea
                  id="review"
                  rows="4"
                  className="w-full bg-muted border border-border rounded-md p-3 text-foreground"
                  placeholder="Share your experience with this course..."
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
    </div>
  );
};

export default CoursePage;