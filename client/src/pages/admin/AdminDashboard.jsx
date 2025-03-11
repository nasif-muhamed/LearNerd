import React from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
    // Sample data for the chart
    const chartData = [
        { name: "Jan", subscribed: 70, freemium: 45, wishlisted: 25 },
        { name: "Feb", subscribed: 85, freemium: 35, wishlisted: 30 },
        { name: "Mar", subscribed: 45, freemium: 110, wishlisted: 40 },
        { name: "Apr", subscribed: 60, freemium: 100, wishlisted: 75 },
        { name: "May", subscribed: 75, freemium: 45, wishlisted: 30 },
        { name: "Jun", subscribed: 30, freemium: 60, wishlisted: 65 },
        { name: "Jul", subscribed: 55, freemium: 50, wishlisted: 25 },
        { name: "Aug", subscribed: 100, freemium: 45, wishlisted: 50 },
        { name: "Sep", subscribed: 45, freemium: 55, wishlisted: 30 },
        { name: "Oct", subscribed: 50, freemium: 80, wishlisted: 65 },
        { name: "Nov", subscribed: 35, freemium: 45, wishlisted: 25 },
        { name: "Dec", subscribed: 60, freemium: 75, wishlisted: 50 },
    ];

    // Sample user data
    const users = [
        {
            id: "#1234",
            name: "Samantha Melon",
            img: "/api/placeholder/40/40",
            trend: "up",
        },
        {
            id: "#1234",
            name: "Jimmy Changa",
            img: "/api/placeholder/40/40",
            trend: "down",
        },
        {
            id: "#1234",
            name: "Gabe Lackmen",
            img: "/api/placeholder/40/40",
            trend: "up",
        },
        {
            id: "#1234",
            name: "Manuel Labor",
            img: "/api/placeholder/40/40",
            trend: "down",
        },
        {
            id: "#1234",
            name: "Sharon Needles",
            img: "/api/placeholder/40/40",
            trend: "up",
        },
    ];

    return (
        <div className="bg-gray-900 text-white p-6">
            {/* Time Filter */}
            <div className="flex justify-end mb-6">
                <div className="relative inline-block">
                    <button className="px-4 py-2 bg-gray-700 rounded-md flex items-center">
                        This Month
                        <svg
                            className="w-4 h-4 ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Stats Cards - First Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-600 p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL COURSES
                    </h3>
                    <p className="text-center text-4xl font-bold">109</p>
                </div>
                <div className="bg-red-500 p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL STUDENTS
                    </h3>
                    <p className="text-center text-4xl font-bold">+1023</p>
                </div>
                <div className="bg-gray-200 text-gray-900 p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL TUTORS
                    </h3>
                    <p className="text-center text-4xl font-bold">+20</p>
                </div>
                <div className="bg-green-500 p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL SUBSCRIPTION
                    </h3>
                    <p className="text-center text-4xl font-bold">504</p>
                </div>
            </div>

            {/* Stats Cards - Second Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-200 text-gray-900 p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        TOTAL FREEMIUM
                    </h3>
                    <p className="text-center text-4xl font-bold">3552</p>
                </div>
                <div className="bg-green-500 p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        FEES COLLECTED
                    </h3>
                    <p className="text-center text-4xl font-bold">₹44,45,880</p>
                </div>
                <div className="bg-blue-600 p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        COMMISSION ON FEES
                    </h3>
                    <p className="text-center text-4xl font-bold">₹3,40,000</p>
                </div>
                <div className="bg-red-500 p-4 rounded-lg">
                    <h3 className="text-center text-lg font-medium">
                        AD REVENUE
                    </h3>
                    <p className="text-center text-4xl font-bold">₹2,00,000</p>
                </div>
            </div>

            {/* Chart and User List Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between mb-4">
                        <div className="flex space-x-4">
                            <div>
                                <span className="block text-2xl font-semibold">
                                    150
                                </span>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                    <span className="text-sm">Subscribed</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-2xl font-semibold">
                                    295
                                </span>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                    <span className="text-sm">Freemium</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-2xl font-semibold">
                                    250
                                </span>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                    <span className="text-sm">Wishlisted</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" />
                                <Bar dataKey="subscribed" fill="#3B82F6" />
                                <Bar dataKey="freemium" fill="#EF4444" />
                                <Bar dataKey="wishlisted" fill="#EAB308" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User List */}
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Active Users</h2>
                    <div className="space-y-4">
                        {users.map((user, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center">
                                    <img
                                        src={user.img}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full mr-3"
                                    />
                                    <div>
                                        <h3 className="font-medium">
                                            {user.name}
                                        </h3>
                                        <span className="text-sm text-gray-400">
                                            ID: {user.id}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`w-16 h-8 ${
                                        user.trend === "up"
                                            ? "text-green-500"
                                            : "text-red-500"
                                    }`}
                                >
                                    {user.trend === "up" ? (
                                        <svg
                                            className="w-full h-full"
                                            viewBox="0 0 100 30"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M0 30 L10 20 L30 25 L50 10 L70 15 L90 5 L100 10"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-full h-full"
                                            viewBox="0 0 100 30"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M0 10 L20 20 L40 5 L60 15 L80 10 L100 25"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Additional Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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
            </div>
        </div>
    );
};

export default AdminDashboard;
