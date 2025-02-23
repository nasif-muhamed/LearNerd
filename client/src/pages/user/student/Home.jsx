import React, { useState } from 'react';
import studs1 from '../../../assets/user-auth/studs-login.png'
import studs2 from '../../../assets/user-auth/studs-otp.webp'
import studs3 from '../../../assets/user-auth/studs-register.png'

const Home = () => {

    return (
        <>

            {/* Hero Carousel */}
            <div className="relative w-full p-4 mt-6">
                <div className="flex items-center justify-between">
                    <button className="absolute left-4 z-10 bg-white bg-opacity-20 rounded-full p-2">
                        &lt;
                    </button>

                    <div className="mx-auto max-w-5xl w-full flex bg-gray-200 rounded-lg overflow-hidden">
                        <div className="w-2/5 p-8 text-gray-800">
                            <h2 className="text-3xl font-bold mb-4">Learning that gets you</h2>
                            <p className="mb-4">Skills for your present (and your future). Get started with us.</p>
                            <button className="bg-gray-600 text-white py-2 px-6 rounded-md">
                                Explore Courses
                            </button>
                        </div>
                        <div className="w-3/5">
                            <img
                                src={studs2}
                                alt="Learning illustration"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>

                    <button className="absolute right-4 z-10 bg-white bg-opacity-20 rounded-full p-2">
                        &gt;
                    </button>
                </div>
            </div>

            {/* Course Section */}
            <section className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold">Let's Complete Learning</h2>
                    <a href="#" className="text-purple-400 hover:underline">my study room -&gt;</a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Course Cards */}
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                            <img
                                src={studs1}
                                alt="Course thumbnail"
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-xl font-semibold mb-2">Web Development Course</h3>
                                <p className="text-gray-400 mb-4">Learn modern web development techniques</p>
                                <div className="flex justify-between">
                                    <span className="text-yellow-400">⭐ 4.8</span>
                                    <button className="bg-blue-600 text-white py-1 px-4 rounded-md">
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

        </>
    );
};

export default Home;
