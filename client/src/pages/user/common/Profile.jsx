import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../../services/api/axiosInterceptor';
import ImageUpload from '../../../components/user/common/Profile/ImageUpload';
import ImageUploadModal from '../../../components/user/common/Profile/ImageUploadModal';
import ProfileForm from '../../../components/user/common/Profile/ProfileForm'

const Profile = () => {
    const user = useSelector((state) => state.auth.user);
    const refreshToken = useSelector((state) => state.auth.refreshToken);
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    return (
        <div className="text-white p-8 min-h-screen">
            <div className="md:px-10 mx-auto flex flex-col md:flex-row gap-10">
                {/* <div className="flex justify-between items-center mb-10">                    
                    <Link to={'/logout'}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition "
                    >
                        <span className="text-xl"><ArrowBigLeft /></span> Logout
                    </Link>

                </div> */}

                {/* Profile picture and skills section */}
                <ImageUpload 
                    user={user} 
                    setSelectedFile={setSelectedFile} 
                    setPreviewImage={setPreviewImage} 
                    setShowModal={setShowModal} 
                />

                {/* Profile information and update form */}
                <ProfileForm user={user} refreshToken={refreshToken} />
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