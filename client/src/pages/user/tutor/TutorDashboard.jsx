import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, LineChart, Line, YAxis, CartesianGrid, Legend } from "recharts";
import coursesLaptopImg from '../../../assets/tutor/courses-laptop.avif'; 
import { Link } from "react-router-dom";
import api from "../../../services/api/axiosInterceptor"
import handleError from "../../../utils/handleError";
// import RoundedImage from "../../../components/ui/RoundedImage";

const TutorDashboard = () => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState({});
    const [students, setStudents] = useState([]);
    const [filter, setFilter] = useState('all');
    const [chartFilter, setChartFilter] = useState('daily');
    const [barChartData, setBarChartData] = useState([]);
    const [lineChartData, setlineChartData] = useState([]);
    const [totalSubscriptions, setTotalSubscriptions] = useState(0);
    const [totalFreemium, setTotalFreemium] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    // const dashboardData = {
    //     totalCourses: 5,
    //     totalStudents: 345,
    //     groupsCreated: 10,
    //     feesCollected: "₹1,45,880",
    //     courseProgress: {
    //         subscribed: 150,
    //         freemium: 250,
    //         waitlisted: 295,
    //     },
    //     recentStudents: [
    //         {
    //             id: 1,
    //             name: "Samantha Mann",
    //             code: "#1234",
    //             status: "Subscribed",
    //         },
    //         { id: 2, name: "Jasper Chongs", code: "#1234", status: "Freemium" },
    //         {
    //             id: 3,
    //             name: "Gabe Lustman",
    //             code: "#1234",
    //             status: "Waitlisted",
    //         },
    //         {
    //             id: 4,
    //             name: "Manuel Labor",
    //             code: "#1234",
    //             status: "Subscribed",
    //         },
    //         {
    //             id: 5,
    //             name: "Sharon Needles",
    //             code: "#1234",
    //             status: "Waitlisted",
    //         },
    //     ],
    // };

    const fetchData = async () => {
        try {
            setLoading(true)
            const response = await api.get("courses/dashboard/tutor-dashboard/", {
                params: {
                    filter: filter
                }
            });
            console.log('dashboard response', response);
            const data = await response.data;
            setDashboardData(data);
        } catch (error) {
            console.error("Error fetching data:", error);
            handleError(error, 'Error fetching dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const fetchChartData = async () => {
        try {
            setLoading(true)
            const response = await api.get("courses/dashboard/tutor-dashboard-chart/", {
                params: {
                    filter: chartFilter
                }
            });
            console.log('charts response', response);
            setBarChartData(response.data?.amount_chart_data || [])
            setlineChartData(response.data?.purchase_chart_data || [])
            setTotalAmount(response.data?.total_amount || 0)
            setTotalSubscriptions(response.data?.total_subscriptions || 0)
            setTotalFreemium(response.data?.total_freemium || 0)
        } catch (error) {
            console.error("Error fetching charts data:", error);
            handleError(error, 'Error fetching charts data')
        } finally {
            setLoading(false)
        }
    };


    useEffect(() => {
        fetchData();
    }, [filter])

    useEffect(() => {
        fetchChartData();
    }, [chartFilter])
    
    const handleChange = (event) => {
        setFilter(event.target.value);
    };
    const options = ['all', 'month', 'week', 'today'];
    const options_map ={'all': 'All', 'month': 'This Month', 'week': 'This Week', 'today': 'Today'};

    return (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto text-white">
            {/* Period Selection */}
            <div className="flex justify-end mb-6">
                <select
                    value={filter}
                    onChange={handleChange}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-600 transition-colors"
                >
                    {options.map((option) => (
                        <option key={option} value={option} className="bg-gray-700 text-white">
                            {options_map[option]}
                        </option>
                    ))}
                </select>
            </div>

            {/* Stats Cards */}
            <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="glass-effect p-4 rounded-md">
                        <div className="text-sm opacity-80">TOTAL COURSES</div>
                        <div className="text-3xl font-bold">{dashboardData.total_courses || 0}</div>
                    </div>
                    <div className="glass-effect p-4 rounded-md">
                        <div className="text-sm opacity-80">TOTAL STUDENTS</div>
                        <div className="text-3xl font-bold">{dashboardData.total_students || 0}</div>
                    </div>
                    <div className="glass-effect p-4 rounded-md">
                        <div className="text-sm opacity-80">TOTAL REVIEW</div>
                        <div className="text-3xl font-bold">{dashboardData.average_course_rating?.toLocaleString('en-IN', { maximumFractionDigits: 1 }) || 0}</div>
                    </div>
                    <div className="glass-effect p-4 rounded-md">
                        <div className="text-sm opacity-80">REPORTS RECIEVED</div>
                        <div className="text-3xl font-bold">{dashboardData.total_reports > 0 ? dashboardData.total_reports : 'Clean'}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="glass-effect p-4 rounded-md">
                        <div className="text-sm opacity-80">TOTAL ENROLLMENTS</div>
                        <div className="text-3xl font-bold">{dashboardData.total_enrollments || 0}</div>
                    </div>
                    <div className="glass-effect p-4 rounded-md">
                        <div className="text-sm opacity-80">SUBSCRIPTION</div>
                        <div className="text-3xl font-bold">{dashboardData.total_subscriptions || 0}</div>
                    </div>
                    <div className="glass-effect p-4 rounded-md">
                        <div className="text-sm opacity-80">FREEMIUM</div>
                        <div className="text-3xl font-bold">{dashboardData.total_freemium || 0}</div>
                    </div>
                    <div className="glass-effect p-4 rounded-md">
                        <div className="text-sm opacity-80">COMPLITION RATE</div>
                        <div className="text-3xl font-bold">{dashboardData.total_completed_courses && dashboardData.total_enrollments ? ((dashboardData.total_completed_courses / dashboardData.total_enrollments) * 100).toLocaleString('en-IN', { maximumFractionDigits: 1 })  : 0}%</div>
                    </div>
                </div>

            </div>

            {/* Course Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Current Course */}
                {dashboardData.draft && (<div className="glass-effect p-4 rounded-md flex items-center">
                    <div className="flex-1">
                        <div className="text-gray-400font-semibold mb-2">
                            {dashboardData.draft?.title}
                        </div>
                        <div className="text-gray-400 text-sm mb-2">
                            Finish your course
                        </div>
                        <div className="relative w-full bg-gray-600 h-2 rounded-full">
                            <div className="bg-gray-300 h-2 rounded-full" style={{width: `${(dashboardData.draft?.step - 1) * 30}%`,}}></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-5 flex items-center justify-between">
                            <h1>
                                DRAFT State
                            </h1>
                            <Link to={`/tutor/my-courses/create-course/${dashboardData.draft?.id}`} className="flex items-center text-sm bg-gray-400 hover:bg-gray-500 text-black py-1 px-4 rounded-md transition-colors">
                                <span>Complete</span>
                            </Link>
                        </div>
                    </div>
                    <div className="ml-4 w-2/4 rounded-xl overflow-hidden h-full">
                        <img
                            src={dashboardData.draft?.thumbnail}
                            alt="CDN Diagram"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>)}

                {/* Create Course */}
                <div className="glass-effect p-4 rounded-md flex items-center">
                    <div className="flex-1">
                        <div className="font-semibold mb-2">
                            Create an Engaging Course
                        </div>
                        <div className="text-sm opacity-80 mb-3">
                            Whether you've been teaching for years or are
                            teaching for the first time, you can make an
                            engaging course. We've compiled resources and best
                            practices to help you get to the next level, no
                            matter where you're starting.
                        </div>
                        <Link to={'/tutor/my-courses'} className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-500 rounded text-sm">
                            Upload Course
                        </Link>
                    </div>
                    <div className="ml-4 hidden md:block w-[25%] overflow-hidden">
                        <img
                            src={coursesLaptopImg}
                            alt="Course Creation"
                            className="rounded-md object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* Charts and Recent Students */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Course Progress Chart */}
                <div className="col-span-1 md:col-span-2 glass-effect p-4 rounded-lg">
                    <div className="flex justify-between mb-4">
                        <div className="flex space-x-4">
                            <div>
                                <span className="block text-2xl font-semibold">
                                {totalAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                </span>
                                    <div className="flex items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                    <span className="text-sm">Total Sale</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Filter Buttons */}
                        <div className="flex items-center">
                            <div className="flex space-x-2">
                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        chartFilter === 'daily'
                                            ? 'bg-gray-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                    onClick={() => setChartFilter('daily')}
                                >
                                    Daily
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        chartFilter === 'monthly'
                                            ? 'bg-gray-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                    onClick={() => setChartFilter('monthly')}
                                >
                                    Monthly
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        chartFilter === 'yearly'
                                            ? 'bg-gray-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                    onClick={() => setChartFilter('yearly')}
                                >
                                    Yearly
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData}>
                                <XAxis dataKey="name" />
                                <Tooltip />
                                <Bar dataKey="amount" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 glass-effect p-4 rounded-lg">
                    <div className="flex justify-between mb-4">
                        <div className="flex space-x-4">
                            <div>
                            <span className="block text-2xl font-semibold">{totalSubscriptions}</span>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                <span className="text-sm">Total Subscriptions</span>
                            </div>
                            </div>
                            <div>
                            <span className="block text-2xl font-semibold">{totalFreemium}</span>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm">Total Freemium</span>
                            </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineChartData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="subscribed" stroke="#3B82F6" activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="freemium" stroke="#10B981" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorDashboard;
