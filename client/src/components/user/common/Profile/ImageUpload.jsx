import React, {useEffect, useRef} from 'react'
import { ImageUp, UserRound } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBadges } from '../../../../redux/features/authSlice';


const ImageUpload = ({ user, setSelectedFile, setPreviewImage, setShowModal }) => {
    const fileInputRef = useRef(null);
    const badges = useSelector((state) => state.auth.badges)
    const dispatch = useDispatch()

    useEffect(() => {
        if(!badges){
            dispatch(fetchBadges())
        }
    }, [badges, dispatch])
    
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
        <div className="flex flex-col items-center w-full md:w-1/4 gap-8 mt-10">
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
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition"
                >
                    <span className="text-xl"><ImageUp /></span> Upload
                </button>
                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
            </div>

            {/* Badges section */}
            <div className="flex flex-wrap gap-5">
                {badges && badges.map((badge, index) => (
                    <div key={index} className="w-8 h-8 flex items-center justify-center rounded-md text-2xl overflow-hidden flex-wrap">
                        <img className='object-cover w-full h-full' src={badge.badge_image} alt={badge.badge_title} />
                    </div>
                ))}
            </div>
        </div>

    )
}

export default ImageUpload