import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";

import api from "../../services/api/axiosInterceptor";
import handleError from '../../utils/handleError';
import RoundedImage from "../../components/ui/RoundedImage"

const AdminDashboard = () => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState({});
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('all');
    const [barFilter, setBarFilter] = useState('daily');
    const [barChartData, setBarChartData] = useState([]);
    const [totalSubscriptions, setTotalSubscriptions] = useState(0);
    const [totalFreemium, setTotalFreemium] = useState(0);

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await api.get("courses/tutors/", {
                params: {
                    page: 1,
                    page_size: 5,
                }
            });
            console.log('users response', response);
            const results = await response.data.results;
            setUsers(results);
        } catch (error) {
            console.error("Error fetching users:", error);
            handleError(error, 'Error fetching users')
        } finally {
            setLoading(false)
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true)
            const response = await api.get("admin/dashboard/", {
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
            const response = await api.get("/admin/dashboard-charts/", {
                params: {
                    filter: barFilter
                }
            });
            console.log('charts response', response);
            setBarChartData(response.data?.purchase_chart_data || [])
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
        fetchUsers();
    }, [])

    useEffect(() => {
        fetchData();
    }, [filter])

    useEffect(() => {
        fetchChartData();
    }, [barFilter])

    // Options for the dropdown
    const options = ['all', 'month', 'week', 'today'];
    const options_map ={'all': 'All', 'month': 'This Month', 'week': 'This Week', 'today': 'Today'};

    // Handle selection change
    const handleChange = (event) => {
        setFilter(event.target.value);
    };


    return (
        <div className="bg-gray-900 text-white p-6">
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


            {/* Stats Cards - First Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL COURSES
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_courses || 0}</p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL USERS
                    </h3>
                    <p className="text-center text-4xl font-bold">+{dashboardData.active_users || 0}</p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL TUTORS
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_instructors || 0}</p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        Active Students
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_students || 0}</p>
                </div>
            </div>


            {/* Chart and User List Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 glass-effect p-4 rounded-lg">
                    <div className="flex justify-between mb-4">
                        <div className="flex space-x-4">
                        <div>
                            <span className="block text-2xl font-semibold">
                            {totalSubscriptions}
                            </span>
                            <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-sm">Subscribed</span>
                            </div>
                        </div>
                        <div>
                            <span className="block text-2xl font-semibold">
                            {totalFreemium}
                            </span>
                            <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-sm">Freemium</span>
                            </div>
                        </div>
                        </div>
                        
                        {/* Filter Buttons */}
                        <div className="flex items-center">
                            <div className="flex space-x-2">
                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        barFilter === 'daily'
                                            ? 'bg-gray-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                    onClick={() => setBarFilter('daily')}
                                >
                                    Daily
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        barFilter === 'monthly'
                                            ? 'bg-gray-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                    onClick={() => setBarFilter('monthly')}
                                >
                                    Monthly
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        barFilter === 'yearly'
                                            ? 'bg-gray-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                    onClick={() => setBarFilter('yearly')}
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
                                <Bar dataKey="subscribed" fill="#3B82F6" />
                                <Bar dataKey="freemium" fill="#EF4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* User List */}
                <div className="glass-effect p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Active Tutors</h2>
                    <div className="space-y-6">
                        {users.map((user, index) => (
                            <div key={index} className="flex items-center gap-2 w-full">
                                <RoundedImage 
                                    style={`w-10 h-10 bg-primary/20`}
                                    source={`${BASE_URL}${user.tutor_details?.image}`} 
                                    alternative={user.tutor_details?.first_name}
                                    userName={user.tutor_details?.first_name}
                                />
                                <div className={'flex-1 flex-col'}>
                                    <div className="flex gap-4 items-center">
                                        <span className="text-sm text-gray-400">
                                            ID: {user.tutor_id}
                                        </span>
                                        <h3 className="font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                                            {user.tutor_details?.first_name + ' ' + user.tutor_details?.last_name}
                                        </h3>
                                    </div>

                                    <div className="flex gap-4 items-center">
                                        <span className="text-sm text-gray-400">
                                            Courses: {user.course_count}
                                        </span>
                                        <span className="text-sm text-gray-400">
                                            Enrollment: {user.enrollment_count}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Cards - Second Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL PURCHASES
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_purchases || 0}</p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        SUBSCRIPTION
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_subscriptions || 0}</p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        FREEMIUM
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_freemium || 0}</p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        COMPLETION PERCENTAGE
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_completed_courses && dashboardData.total_purchases ? ((dashboardData.total_completed_courses / dashboardData.total_purchases) * 100).toLocaleString('en-IN', { maximumFractionDigits: 1 }) : 0}%</p>
                </div>
            </div>

            {/* Stats Cards - Third Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL FEES COLLECTED
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_fees_collected ? dashboardData.total_fees_collected.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) : 0}</p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL PAYOUTS 
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_payouts ? dashboardData.total_payouts.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) : 0}</p>
                </div>
                <div className="glass-effect p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        COMMISSION ON FEES
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_commission ? dashboardData.total_commission.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) : 0}</p>
                </div>
                <div className="glass-effect p-4 rounded-lg" >
                    <h3 className="text-center text-lg font-medium">
                        REFUNDS
                    </h3>
                    <p className="text-center text-4xl font-bold">{dashboardData.total_refunds ? dashboardData.total_refunds.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) : 0}</p>
                </div>
            </div>

            {/* Additional Analytics Cards */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-purple-600 p-4 rounded-lg">
                    <h3 className="text-lg font-medium">AVG. SESSION TIME</h3>
                    <p className="text-3xl font-bold">24m 32s</p>
                </div>
                <div className="bg-yellow-500 p-4 rounded-lg">
                    <h3 className="text-lg font-medium">COMPLETION RATE</h3>
                    <p className="text-3xl font-bold">68.5%</p>
                </div>
                <div className="bg-indigo-600 p-4 rounded-lg">
                    <h3 className="text-lg font-medium">COURSE ENGAGEMENT</h3>
                    <p className="text-3xl font-bold">78.2%</p>
                </div>
                <div className="bg-teal-500 p-4 rounded-lg">
                    <h3 className="text-lg font-medium">ACTIVE ENROLLMENTS</h3>
                    <p className="text-3xl font-bold">754</p>
                </div>
            </div> */}

        </div>
    );
};

export default AdminDashboard;
