import React from 'react'
import { X } from 'lucide-react';
import { fetchUserDetails } from "../../../../redux/features/authSlice";
import { useDispatch } from "react-redux";
const ImageUploadModal = ({previewImage, isUploading, setIsUploading, selectedFile, setSelectedFile, setShowModal, setPreviewImage, api, user }) => {
    const dispatch = useDispatch();

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
            if(user) {dispatch(fetchUserDetails());}
            
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

    return (
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
    )
}

export default ImageUploadModal