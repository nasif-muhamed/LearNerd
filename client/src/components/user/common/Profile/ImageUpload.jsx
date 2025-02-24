import React, {useRef} from 'react'
import { UserRound } from 'lucide-react';

const ImageUpload = ({ user, setSelectedFile, setPreviewImage, setShowModal }) => {
    const fileInputRef = useRef(null);

    // User skills/programming languages
    const skills = [
        { name: 'Python', icon: '🐍' },
        { name: 'Data Science', icon: '📊' },
        { name: 'JavaScript', icon: 'JS' }
    ];
    
    // Handler for uploading profile picture
    const handleUpload = () => {
        fileInputRef.current.click();
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setShowModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-start gap-8 mb-10">
            {/* Profile picture */}
            <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700">
                    {user && user.image ? (
                        <img
                            src={user.image}
                            alt="Profile Image"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                            <UserRound className='w-full h-full p-5' />
                        </div>
                    )}
                </div>
                <button
                    onClick={handleUpload}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition"
                >
                    <span className="text-xl">☁️</span> upload
                </button>
                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
            </div>

            {/* Skills section */}
            <div className="flex flex-wrap gap-5 mt-4 md:mt-10">
                {skills.map((skill, index) => (
                    <div key={index} className="w-16 h-16 flex items-center justify-center bg-slate-800 rounded-md text-2xl border border-slate-700">
                        {skill.icon}
                    </div>
                ))}
            </div>
        </div>

    )
}

export default ImageUpload