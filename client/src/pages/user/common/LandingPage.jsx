import { useCallback, useEffect, useState } from 'react';
import { Menu, X, CheckCircle, BookOpen, Users, MessageCircle, ArrowRight, User, Search, UserRound } from 'lucide-react';
import StudTutor from '../../../assets/user-auth/studs-login.png'
import Studs from '../../../assets/user-auth/studs-register.png'
import { useSelector } from "react-redux";
import { Link } from 'react-router-dom';
import api from '../../../services/api/axiosInterceptor';


const LandingPage = () => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const token = useSelector((state) => state.auth.accessToken);
    const [loading, setLoading] = useState(false);
    const [tutors, setTutors] = useState([1, 2, 3, 4]);
    // const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pageSize = 4
    const fetchTutors = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("courses/tutors/", {
                params: {
                    page_size: pageSize,
                },
            });
            console.log('tutors response:', response);
            setTutors(response.data.results);
        } catch (err) {
            console.log("err:", err);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchTutors()
    }, [])
  // Demo statistics data
    const stats = {
        courses: 1250,
        users: 25000,
        instructors: 450,
        satisfaction: 98
    };

  // Demo featured courses
    const featuredCourses = [
        {
        id: 1,
        title: "React Fundamentals",
        instructor: "Alex Johnson",
        price: 49.99,
        image: "/api/placeholder/320/180",
        rating: 4.8,
        category: "Web Development",
        studentsCount: 1243
        },
        {
        id: 2,
        title: "Python for Data Science",
        instructor: "Maria Stevens",
        price: 59.99,
        image: "/api/placeholder/320/180",
        rating: 4.9,
        category: "Data Science",
        studentsCount: 2198
        },
        {
        id: 3,
        title: "UX Design Principles",
        instructor: "Sam Taylor",
        price: 39.99,
        image: "/api/placeholder/320/180",
        rating: 4.7,
        category: "Design",
        studentsCount: 856
        }
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative overflow-hidden">
                    {/* Background gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 opacity-30"></div>
                
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
                            Learn. Teach. <span className="text-accent">Connect.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                            LearNerds is a community-driven platform where passionate learners meet dedicated teachers. Upload courses, learn at your pace, and connect through personalized sessions.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                            <Link to={token ? '/student/study-room' : '/register'} className="btn-primary flex items-center gap-2">
                                {token ? 'My Study Room' : 'Get Started'} <ArrowRight size={16} />
                            </Link>
                            <a href="#how-it-works" className="btn-outline">
                                How It Works
                            </a>
                            </div>
                            <div className="flex items-center gap-6 pt-2">
                            <div className="flex -space-x-2">
                                {tutors.map((tutor, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-semibold overflow-hidden">
                                    {tutor.tutor_details?.image ? (
                                        <img
                                            src={BASE_URL + tutor.tutor_details.image}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <UserRound />
                                    )}
                                </div>
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Joined by <span className="text-foreground font-semibold">{stats.users.toLocaleString()}+</span> learners
                            </p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="glass-effect rounded-xl p-4 relative z-10">
                                <img 
                                    src={Studs}
                                    alt="E-learning in action" 
                                    className="rounded-lg w-full h-auto"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 bg-card p-4 rounded-lg shadow-lg z-20 border border-border max-w-xs">
                            <div className="flex items-start gap-3">
                                <div className="bg-accent/20 p-2 rounded-full">
                                <CheckCircle size={20} className="text-accent" />
                                </div>
                                <div>
                                <h3 className="font-semibold">Learn Your Way</h3>
                                <p className="text-sm text-muted-foreground">Choose between free courses with ads or premium subscriptions with personalized support.</p>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </section>
                
                {/* Stats Section */}
                <section className="bg-secondary/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4">
                        <div className="text-3xl md:text-4xl font-bold text-accent">{stats.courses.toLocaleString()}+</div>
                        <div className="text-sm text-muted-foreground mt-1">Courses Available</div>
                    </div>
                    <div className="p-4">
                        <div className="text-3xl md:text-4xl font-bold text-accent">{stats.users.toLocaleString()}+</div>
                        <div className="text-sm text-muted-foreground mt-1">Active Learners</div>
                    </div>
                    <div className="p-4">
                        <div className="text-3xl md:text-4xl font-bold text-accent">{stats.instructors.toLocaleString()}+</div>
                        <div className="text-sm text-muted-foreground mt-1">Expert Instructors</div>
                    </div>
                    <div className="p-4">
                        <div className="text-3xl md:text-4xl font-bold text-accent">{stats.satisfaction}%</div>
                        <div className="text-sm text-muted-foreground mt-1">Satisfaction Rate</div>
                    </div>
                    </div>
                </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose LearNerds</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">Our platform offers unique features designed for both learners and teachers, creating a community where knowledge is easily accessible and teaching is rewarding.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="glass-effect rounded-xl p-6 transition-all duration-300 hover:scale-105">
                        <div className="bg-accent/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                        <BookOpen size={24} className="text-accent" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Dual Access Options</h3>
                        <p className="text-muted-foreground">Choose between free courses with ads to support creators or premium subscriptions for unlimited access and personalized support.</p>
                    </div>
                    
                    {/* Feature 2 */}
                    <div className="glass-effect rounded-xl p-6 transition-all duration-300 hover:scale-105">
                        <div className="bg-accent/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                        <Users size={24} className="text-accent" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">One-on-One Sessions</h3>
                        <p className="text-muted-foreground">Premium subscribers gain access to personal video sessions with instructors, getting direct guidance and feedback on their progress.</p>
                    </div>
                    
                    {/* Feature 3 */}
                    <div className="glass-effect rounded-xl p-6 transition-all duration-300 hover:scale-105">
                        <div className="bg-accent/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                        <MessageCircle size={24} className="text-accent" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Chat Support</h3>
                        <p className="text-muted-foreground">Get your questions answered quickly with dedicated chat support from course instructors, available to premium subscribers.</p>
                    </div>
                    </div>
                </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="py-16 bg-card">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">How LearNerds Works</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">Our platform is designed to be simple and intuitive, connecting learners with quality educational content.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        {/* Step 1 */}
                        <div className="flex items-start gap-4">
                        <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                            1
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Browse or Create</h3>
                            <p className="text-muted-foreground">Search through our vast library of courses or create and upload your own to share your expertise with the world.</p>
                        </div>
                        </div>
                        
                        {/* Step 2 */}
                        <div className="flex items-start gap-4">
                        <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                            2
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Choose Your Access</h3>
                            <p className="text-muted-foreground">Select between free access with ads or premium subscription for unlimited viewing and personalized support.</p>
                        </div>
                        </div>
                        
                        {/* Step 3 */}
                        <div className="flex items-start gap-4">
                        <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                            3
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Learn & Connect</h3>
                            <p className="text-muted-foreground">Engage with course materials at your own pace and connect with instructors through video sessions and chat support.</p>
                        </div>
                        </div>
                        
                        {/* Step 4 */}
                        <div className="flex items-start gap-4">
                        <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                            4
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Earn & Grow</h3>
                            <p className="text-muted-foreground">As a teacher, earn from your courses through ads and subscriptions. As a learner, track your progress and earn certificates.</p>
                        </div>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="glass-effect rounded-xl overflow-hidden">
                            <img 
                                src={StudTutor}
                                alt="LearNerds platform in action" 
                                className="w-full h-auto"
                            />
                        </div>
                        <div className="absolute -top-6 -left-6 bg-card p-4 rounded-lg shadow-lg border border-border max-w-xs">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-accent font-bold">T</span>
                            </div>
                            <div>
                            <h4 className="font-medium">Teacher Dashboard</h4>
                            <div className="text-xs text-muted-foreground">Monitor your courses, students, and earnings</div>
                            </div>
                        </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 bg-card p-4 rounded-lg shadow-lg border border-border max-w-xs">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-accent font-bold">S</span>
                            </div>
                            <div>
                            <h4 className="font-medium">Student Experience</h4>
                            <div className="text-xs text-muted-foreground">Track progress and engage with instructors</div>
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                </section>

                {/* Featured Courses Section */}
                <section id="courses" className="py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Courses</h2>
                        <p className="text-muted-foreground max-w-2xl">Explore our most popular courses across various categories.</p>
                    </div>
                    <a href="/courses" className="btn-outline mt-4 md:mt-0 flex items-center gap-2">
                        View All Courses <ArrowRight size={16} />
                    </a>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredCourses.map((course) => (
                        <div key={course.id} className="course-card border border-border">
                        <div className="relative">
                            <img 
                            src={course.image} 
                            alt={course.title} 
                            className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                            {course.category}
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold mb-1">{course.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3">By {course.instructor}</p>
                            
                            <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <div className="rating-stars flex">
                                {Array(5).fill(0).map((_, i) => (
                                    <svg 
                                    key={i} 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill={i < Math.floor(course.rating) ? "currentColor" : "none"} 
                                    stroke="currentColor"
                                    className="text-yellow-400"
                                    >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ))}
                                </div>
                                <span className="ml-2 text-sm">{course.rating}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {course.studentsCount.toLocaleString()} students
                            </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">${course.price}</span>
                            <a href={`/courses/${course.id}`} className="btn-primary text-sm">
                                View Course
                            </a>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="py-16 bg-card">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">Hear from our community of learners and teachers about their experience with LearNerds.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                    {/* Testimonial 1 */}
                    <div className="glass-effect rounded-xl p-6">
                        <div className="rating-stars flex mb-4">
                        {Array(5).fill(0).map((_, i) => (
                            <svg 
                            key={i} 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="currentColor" 
                            stroke="currentColor"
                            className="text-yellow-400"
                            >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        ))}
                        </div>
                        <p className="mb-4 text-muted-foreground">"As a self-taught developer, LearNerds has been an incredible resource. The one-on-one sessions with experienced instructors helped me overcome challenges I couldn't solve through traditional courses."</p>
                        <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="font-semibold">JD</span>
                        </div>
                        <div>
                            <h4 className="font-medium">John Doe</h4>
                            <div className="text-xs text-muted-foreground">Software Developer</div>
                        </div>
                        </div>
                    </div>
                    
                    {/* Testimonial 2 */}
                    <div className="glass-effect rounded-xl p-6">
                        <div className="rating-stars flex mb-4">
                        {Array(5).fill(0).map((_, i) => (
                            <svg 
                            key={i} 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="currentColor" 
                            stroke="currentColor"
                            className="text-yellow-400"
                            >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        ))}
                        </div>
                        <p className="mb-4 text-muted-foreground">"Teaching on LearNerds has allowed me to share my knowledge with students worldwide. The platform's dual access model ensures my content is accessible while still providing fair compensation."</p>
                        <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="font-semibold">JS</span>
                        </div>
                        <div>
                            <h4 className="font-medium">Jane Smith</h4>
                            <div className="text-xs text-muted-foreground">Digital Marketing Instructor</div>
                        </div>
                        </div>
                    </div>
                    
                    {/* Testimonial 3 */}
                    <div className="glass-effect rounded-xl p-6">
                        <div className="rating-stars flex mb-4">
                        {Array(5).fill(0).map((_, i) => (
                            <svg 
                            key={i} 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="currentColor" 
                            stroke="currentColor"
                            className="text-yellow-400"
                            >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        ))}
                        </div>
                        <p className="mb-4 text-muted-foreground">"The chat support feature has been a game-changer for my learning journey. Being able to ask questions and get quick responses helped me progress much faster than with other platforms."</p>
                        <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                            <span className="font-semibold">RJ</span>
                        </div>
                        <div>
                            <h4 className="font-medium">Robert Johnson</h4>
                            <div className="text-xs text-muted-foreground">Data Science Student</div>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 relative overflow-hidden">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-30"></div>
                
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Learning Journey?</h2>
                    <p className="text-lg text-muted-foreground mb-8">Join our community of learners and teachers today and transform the way you learn and share knowledge.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="/register" className="btn-primary text-center px-8 py-3">
                        Sign Up Now
                        </a>
                        <a href="/courses" className="btn-outline text-center px-8 py-3">
                        Browse Courses
                        </a>
                    </div>
                    <p className="text-muted-foreground mt-6 text-sm">No credit card required. Start learning today.</p>
                    </div>
                </div>
                </section>
            </main>

            <footer className="bg-card border-t border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid md:grid-cols-4 gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                    <div className="bg-accent rounded-full p-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#3B82F6" />
                        <circle cx="8" cy="10" r="2" fill="white" />
                        <circle cx="16" cy="10" r="2" fill="white" />
                        <path d="M8 15H16M12 13V17" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <path d="M7 7L9 9M15 7L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-foreground">LearNerds</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">Empowering self-learners and teachers with a platform that makes education accessible and teaching rewarding.</p>
                    <div className="flex space-x-4">
                    <a href="#" className="text-muted-foreground hover:text-accent">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                        </svg>
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-accent">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
                        </svg>
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-accent">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                        </svg>
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-accent">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                        </svg>
                    </a>
                    </div>
                </div>
                
                <div>
                    <h3 className="font-semibold text-lg mb-4">Platform</h3>
                    <ul className="space-y-2">
                    <li><a href="/courses" className="text-muted-foreground hover:text-accent">Browse Courses</a></li>
                    <li><a href="/teach" className="text-muted-foreground hover:text-accent">Become an Instructor</a></li>
                    <li><a href="/pricing" className="text-muted-foreground hover:text-accent">Pricing Plans</a></li>
                    <li><a href="/features" className="text-muted-foreground hover:text-accent">Features</a></li>
                    <li><a href="/affiliates" className="text-muted-foreground hover:text-accent">Affiliate Program</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 className="font-semibold text-lg mb-4">Resources</h3>
                    <ul className="space-y-2">
                    <li><a href="/help" className="text-muted-foreground hover:text-accent">Help Center</a></li>
                    <li><a href="/blog" className="text-muted-foreground hover:text-accent">Blog</a></li>
                    <li><a href="/tutorials" className="text-muted-foreground hover:text-accent">Tutorials</a></li>
                    <li><a href="/webinars" className="text-muted-foreground hover:text-accent">Webinars</a></li>
                    <li><a href="/community" className="text-muted-foreground hover:text-accent">Community</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 className="font-semibold text-lg mb-4">Company</h3>
                    <ul className="space-y-2">
                    <li><a href="/about" className="text-muted-foreground hover:text-accent">About Us</a></li>
                    <li><a href="/careers" className="text-muted-foreground hover:text-accent">Careers</a></li>
                    <li><a href="/contact" className="text-muted-foreground hover:text-accent">Contact Us</a></li>
                    <li><a href="/press" className="text-muted-foreground hover:text-accent">Press</a></li>
                    <li><a href="/investors" className="text-muted-foreground hover:text-accent">Investors</a></li>
                    </ul>
                </div>
                </div>
                
                <div className="border-t border-border mt-10 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="text-sm text-muted-foreground mb-4 md:mb-0">
                    &copy; {new Date().getFullYear()} LearNerds. All rights reserved.
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                    <a href="/terms" className="text-muted-foreground hover:text-accent">Terms of Service</a>
                    <a href="/privacy" className="text-muted-foreground hover:text-accent">Privacy Policy</a>
                    <a href="/cookies" className="text-muted-foreground hover:text-accent">Cookie Policy</a>
                    <a href="/accessibility" className="text-muted-foreground hover:text-accent">Accessibility</a>
                    </div>
                </div>
                </div>
            </div>
            </footer>
        </div>
    )
}

export default LandingPage