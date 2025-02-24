import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowBigLeft } from 'lucide-react';
import api from '../../../services/api/axiosInterceptor';
import ImageUpload from '../../../components/user/common/Profile/ImageUpload';
import ImageUploadModal from '../../../components/user/common/Profile/ImageUploadModal';
import ProfileForm from '../../../components/user/common/Profile/ProfileForm'

const Profile = () => {
    const user = useSelector((state) => state.auth.user);
    const userError = useSelector((state) => state.auth.error);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

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
                <ImageUpload 
                    user={user} 
                    setSelectedFile={setSelectedFile} 
                    setPreviewImage={setPreviewImage} 
                    setShowModal={setShowModal} 
                />

                {/* Profile information form */}
                <ProfileForm user={user}/>
            </div>

            {/* Image Preview Modal */}
            {showModal && (
                <ImageUploadModal
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    previewImage={previewImage}
                    setPreviewImage={setPreviewImage}
                    setShowModal={setShowModal}
                    api={api}
                    user={user}
                />
            )}
        </div>
    );
};

export default Profile;