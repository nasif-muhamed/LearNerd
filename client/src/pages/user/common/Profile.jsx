import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserDetails } from "../../../redux/features/authSlice";
import { useNavigate, Link } from 'react-router-dom';
import { UserRound, X, ArrowBigLeft } from 'lucide-react';
import api from '../../../services/api/axiosInterceptor';

const Profile = () => {
    const user = useSelector((state) => state.auth.user);
    const userError = useSelector((state) => state.auth.error);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!user) {
            // If user not available Dispatch action to fetch user details
            dispatch(fetchUserDetails())
                .catch(() => {
                    // If fetching user details fails, logout the user and navigate to login page
                    navigate('/logout');
                });
        }
    }, [user, dispatch, navigate]);

    // State for the profile data
    const [profileData, setProfileData] = useState({
        firstName: user.first_name,
        lastName: user.last_Name,
        email: user.email,
        biography: user.biography
    });

    // State to track if fields are being edited
    const [isEditing, setIsEditing] = useState({
        firstName: false,
        lastName: false,
        biography: false
    });

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

    // Handle image upload confirmation
    const handleConfirmUpload = async () => {
        if (!selectedFile) return;
        
        setIsUploading(true);
        
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', selectedFile);
            console.log('formData:', formData)
            console.log('formData Image:', formData.get('image'))

            const response = await api.patch('users/user/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',  // Ensure the correct content type is set
                },
            });
            
            if (response.status !== 200) throw new Error('Failed to upload image');
                        
            // After successful upload, refresh user data
            dispatch(fetchUserDetails());
            
            // Close modal and reset states
            setShowModal(false);
            setPreviewImage(null);
            setSelectedFile(null);
        } catch (error) {
            console.error('Error uploading image:', error);
            // Handle error - you might want to show a toast notification
        } finally {
            setIsUploading(false);
        }
    };

    // Cancel upload
    const handleCancelUpload = () => {
        setShowModal(false);
        setPreviewImage(null);
        setSelectedFile(null);
    };

    // Handler for editing fields
    const handleEdit = (field) => {
        setIsEditing({ ...isEditing, [field]: true });
    };

    // Handler for saving fields
    const handleSave = (field, value) => {
        setProfileData({ ...profileData, [field]: value });
        setIsEditing({ ...isEditing, [field]: false });
    };

    return (
        <div className="bg-slate-900 text-white p-8 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold ">My Profile</h1>
                    
                    <Link to={'/logout'}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition"
                    >
                        <span className="text-xl"><ArrowBigLeft /></span> Logout
                    </Link>

                </div>

                {/* Profile picture and skills section */}
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

                {/* Profile information form */}
                <div className="space-y-6">
                    {/* First name */}
                    <div>
                        <label className="block text-slate-400 mb-1">first name</label>
                        <div className="relative">
                            {isEditing.firstName ? (
                                <input
                                    type="text"
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white"
                                    value={profileData.firstName}
                                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                    onBlur={() => handleSave('firstName', profileData.firstName)}
                                    autoFocus
                                />
                            ) : (
                                <div className="flex justify-between items-center w-full bg-slate-100 text-slate-900 rounded p-3">
                                    <span>{profileData.firstName}</span>
                                    <button
                                        onClick={() => handleEdit('firstName')}
                                        className="text-slate-600 hover:text-slate-800"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Last name */}
                    <div>
                        <label className="block text-slate-400 mb-1">last name</label>
                        <div className="relative">
                            {isEditing.lastName ? (
                                <input
                                    type="text"
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white"
                                    value={profileData.lastName}
                                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                    onBlur={() => handleSave('lastName', profileData.lastName)}
                                    autoFocus
                                />
                            ) : (
                                <div className="flex justify-between items-center w-full bg-slate-100 text-slate-900 rounded p-3">
                                    <span>{profileData.lastName}</span>
                                    <button
                                        onClick={() => handleEdit('lastName')}
                                        className="text-slate-600 hover:text-slate-800"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-slate-400 mb-1">email</label>
                        <input
                            type="email"
                            className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white"
                            value={profileData.email}
                            readOnly
                        />
                    </div>

                    {/* Biography */}
                    <div>
                        <label className="block text-slate-400 mb-1">biography</label>
                        <div className="relative">
                            {isEditing.biography ? (
                                <textarea
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white min-h-32"
                                    value={profileData.biography}
                                    onChange={(e) => setProfileData({ ...profileData, biography: e.target.value })}
                                    onBlur={() => handleSave('biography', profileData.biography)}
                                    autoFocus
                                />
                            ) : (
                                <div className="relative w-full bg-slate-100 text-slate-900 rounded p-3 min-h-32">
                                    <p>{profileData.biography}</p>
                                    <button
                                        onClick={() => handleEdit('biography')}
                                        className="absolute top-2 right-2 text-slate-600 hover:text-slate-800"
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-lg max-w-lg w-full mx-auto overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700">
                            <h3 className="text-xl font-medium">Profile Image Preview</h3>
                            <button 
                                onClick={handleCancelUpload}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="w-full max-h-56 mx-auto overflow-hidden rounded-lg mb-6">
                                {previewImage && (
                                    <img 
                                        src={previewImage} 
                                        alt="Profile Preview" 
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={handleCancelUpload}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition"
                                    disabled={isUploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmUpload}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition flex items-center justify-center"
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    ) : null}
                                    {isUploading ? 'Uploading...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;