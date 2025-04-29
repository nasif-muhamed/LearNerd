import React, { useState, useEffect } from 'react';
import api from '../../../services/api/axiosInterceptor'
import handleError from '../../../utils/handleError'
import { toast } from 'sonner';

// Mock API endpoint (replace with your actual API)
const API_URL = 'https://your-api-endpoint.com/api';

const BillboardLanding = () => {
// State for different media sections
    const [homeBanner, setHomeBanner] = useState(null);
    const [studyRoomBanner, setStudyRoomBanner] = useState(null);
    const [preRollVideo, setPreRollVideo] = useState(null);

    // State for file uploads and previews
    const [homePreview, setHomePreview] = useState(null);
    const [studyRoomPreview, setStudyRoomPreview] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch existing media on component mount
    useEffect(() => {
        fetchBillBoardData();
    }, []);

    // Fetch all media data
    const fetchBillBoardData = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/banners/active/`);
            console.log('active response:', response)
            // Update states with existing media
            const { home_banner:homeBanner, study_room_banner:studyRoomBanner, pre_rollVideo:preRollVideo } = response.data;
            console.log('homeBanner:', homeBanner)
            setHomeBanner(homeBanner);
            setStudyRoomBanner(studyRoomBanner);
            setPreRollVideo(preRollVideo);
        } catch (error) {
            console.error('Error fetching media data:', error);
        // Use sample data if API fails
        } finally {
            setIsLoading(false);
        }
    };

    // Handle file selection for home banner
    const handleHomeBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setHomePreview({
                file,
                preview: reader.result,
                title: '',
                description: '',
            });
        };
        reader.readAsDataURL(file);
        }
    };

    // Handle file selection for study room banner
    const handleStudyRoomBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setStudyRoomPreview({
                file,
                preview: reader.result,
                title: '',
            });
        };
        reader.readAsDataURL(file);
        }
    };

    // Handle file selection for pre-roll video
    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setVideoPreview({
                    file,
                    preview: reader.result,
                    title: '',
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Text field change handlers
    const handleHomeTitleChange = (e) => {
        if (homePreview) {
        setHomePreview({...homePreview, title: e.target.value});
        }
    };

    const handleHomeDescriptionChange = (e) => {
        if (homePreview) {
        setHomePreview({...homePreview, description: e.target.value});
        }
    };

    const handleStudyRoomTitleChange = (e) => {
        if (studyRoomPreview) {
        setStudyRoomPreview({...studyRoomPreview, title: e.target.value});
        }
    };

    const handleVideoTitleChange = (e) => {
        if (videoPreview) {
            setVideoPreview({...videoPreview, title: e.target.value});
        }
    };

    // Submit updated home banner
    const submitHomeBanner = async () => {
        if (!homePreview) return;
        
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('banner', homePreview.file);
        formData.append('title', homePreview.title);
        formData.append('description', homePreview.description);
        
        try {
            const response = await api.post(`banners/home-banner/`, formData);
            console.log('response home-banner:', response)
            setHomeBanner(response.data);
            setHomePreview(null);
            toast.success('Home banner updated successfully!');
        } catch (error) {
            console.error('Error updating home banner:', error);
            handleError(error, 'Failed to update home banner. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit updated study room banner
    const submitStudyRoomBanner = async () => {
        if (!studyRoomPreview) return;
        
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('banner', studyRoomPreview.file);
        formData.append('title', studyRoomPreview.title);
        
        try {
            const response = await api.post(`banners/ad-banner/`, formData);
            console.log('response ad-banner:', response)
            setStudyRoomBanner(response.data);
            setStudyRoomPreview(null);
            toast.success('Study room banner updated successfully!');
        } catch (error) {
            console.error('Error updating study room banner:', error);
            handleError(error, 'Failed to update study room banner. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit updated pre-roll video
    const submitPreRollVideo = async () => {
        console.log('', videoPreview)
        if (!videoPreview || !videoPreview.file || !videoPreview.title) {
            toast.error('You have to complete all fields')
            return
        };
        
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('video', videoPreview.file);
        formData.append('title', videoPreview.title);
            
        try {
            const response = await api.post(`banners/ad-videos/`, formData);
            setPreRollVideo(response.data);
            setVideoPreview(null);
            toast.success('Pre-roll video updated successfully!');
        } catch (error) {
            console.error('Error updating pre-roll video:', error);
            handleError(error, 'Failed to update pre-roll video. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // // Delete media handlers
    // const deleteHomeBanner = async () => {
    //     if (!homeBanner?.id) return;
        
    //     if (window.confirm('Are you sure you want to delete this home banner?')) {
    //     try {
    //         await api.delete(`/media/banner/home/${homeBanner.id}`);
    //         setHomeBanner(null);
    //         alert('Home banner deleted successfully!');
    //     } catch (error) {
    //         console.error('Error deleting home banner:', error);
    //         alert('Failed to delete home banner. Please try again.');
    //     }
    //     }
    // };

    // const deleteStudyRoomBanner = async () => {
    //     if (!studyRoomBanner?.id) return;
        
    //     if (window.confirm('Are you sure you want to delete this study room banner?')) {
    //     try {
    //         await api.delete(`/media/banner/study/${studyRoomBanner.id}`);
    //         setStudyRoomBanner(null);
    //         alert('Study room banner deleted successfully!');
    //     } catch (error) {
    //         console.error('Error deleting study room banner:', error);
    //         alert('Failed to delete study room banner. Please try again.');
    //     }
    //     }
    // };

    // const deletePreRollVideo = async () => {
    //     if (!preRollVideo?.id) return;
        
    //     if (window.confirm('Are you sure you want to delete this pre-roll video?')) {
    //     try {
    //         await api.delete(`/media/video/${preRollVideo.id}`);
    //         setPreRollVideo(null);
    //         alert('Pre-roll video deleted successfully!');
    //     } catch (error) {
    //         console.error('Error deleting pre-roll video:', error);
    //         alert('Failed to delete pre-roll video. Please try again.');
    //     }
    //     }
    // };

    // Cancel preview handlers
    
    const cancelHomePreview = () => setHomePreview(null);
    const cancelStudyRoomPreview = () => setStudyRoomPreview(null);
    const cancelVideoPreview = () => setVideoPreview(null);

    if (isLoading) {
        return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Media Management</h1>
        
        {/* Home Banner Section */}
        <section className="mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Banner Home</h2>
                <div className="mt-2 md:mt-0">
                    <input
                        type="file"
                        id="home-banner-upload"
                        accept="image/*"
                        onChange={handleHomeBannerChange}
                        className="hidden"
                        />
                        <label 
                        htmlFor="home-banner-upload" 
                        className="btn-primary inline-block cursor-pointer"
                    >
                        Upload new banner
                    </label>
                </div>
            </div>
            
            {/* Display current banner or preview */}
            <div className="glass-effect rounded-lg overflow-hidden">
                {homePreview ? (
                    <div className="relative">
                        <div className="bg-card p-6 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Preview</h3>
                            <div className="relative aspect-[3/1] overflow-hidden rounded-md mb-4">
                            <img 
                                src={homePreview.preview} 
                                alt="Home Banner Preview" 
                                className="w-full h-full object-cover"
                            />
                            </div>
                            <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Banner Title</label>
                            <input 
                                type="text" 
                                value={homePreview.title} 
                                onChange={handleHomeTitleChange}
                                className="w-full p-2 bg-secondary text-foreground rounded-md border border-border"
                            />
                            </div>
                            <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Banner Description</label>
                            <textarea 
                                value={homePreview.description} 
                                onChange={handleHomeDescriptionChange}
                                className="w-full p-2 bg-secondary text-foreground rounded-md border border-border"
                                rows="3"
                            />
                            </div>
                            <div className="flex justify-end space-x-3">
                            <button 
                                onClick={cancelHomePreview}
                                className="btn-outline"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={submitHomeBanner}
                                className="btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                            </div>
                        </div>
                    </div>
                ) : homeBanner ? (
                    <div className="relative">
                        <div className="bg-card p-6 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Current Banner</h3>
                            {/* <button 
                                onClick={deleteHomeBanner}
                                className="text-destructive hover:underline text-sm"
                            >
                                Delete
                            </button> */}
                            </div>
                            <div className="relative aspect-[3/1] overflow-hidden rounded-md">
                            <img 
                                src={homeBanner.banner_url}
                                alt={homeBanner.title} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex flex-col justify-center p-6 bg-gradient-to-r from-black/60 to-transparent">
                                <h4 className="text-xl font-bold text-white mb-2">{homeBanner.title}</h4>
                                <p className="text-white/90 max-w-md">{homeBanner.description}</p>
                            </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card p-6 rounded-lg flex flex-col items-center justify-center">
                        <p className="text-muted-foreground mb-4">No home banner uploaded yet</p>
                        <label 
                            htmlFor="home-banner-upload" 
                            className="btn-primary inline-block cursor-pointer"
                        >
                            Upload banner
                        </label>
                    </div>
                )}
            </div>
        </section>
        
        {/* Study Room Banner Section */}
        <section className="mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Banner Study Room ad</h2>
                <div className="mt-2 md:mt-0">
                    <input
                        type="file"
                        id="study-room-banner-upload"
                        accept="image/*"
                        onChange={handleStudyRoomBannerChange}
                        className="hidden"
                        />
                        <label 
                        htmlFor="study-room-banner-upload" 
                        className="btn-primary inline-block cursor-pointer"
                    >
                        Upload Ad banner
                    </label>
                </div>
            </div>
            
            {/* Display current study room banner or preview */}
            <div className="glass-effect rounded-lg overflow-hidden">
                {studyRoomPreview ? (
                    <div className="relative">
                        <div className="bg-card p-6 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Preview</h3>
                            <div className="relative aspect-[8/1] overflow-hidden rounded-md mb-4">
                                <img 
                                    src={studyRoomPreview.preview} 
                                    alt="Study Room Banner Preview" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Ad Banner Title</label>
                                <input 
                                    type="text" 
                                    value={studyRoomPreview.title} 
                                    onChange={handleStudyRoomTitleChange}
                                    className="w-full p-2 bg-secondary text-foreground rounded-md border border-border"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button 
                                    onClick={cancelStudyRoomPreview}
                                    className="btn-outline"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={submitStudyRoomBanner}
                                    className="btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : studyRoomBanner ? (
                    <div className="relative">
                    <div className="bg-card p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Current Banner</h3>
                        {/* <button 
                            onClick={deleteStudyRoomBanner}
                            className="text-destructive hover:underline text-sm"
                        >
                            Delete
                        </button> */}
                        </div>
                        <h4 className="text-md font-semibold mb-4">Title: <span className='font-extralight'>{studyRoomBanner.title}</span></h4>
                        <div className="relative aspect-[8/1] overflow-hidden rounded-md">
                            <img 
                                src={studyRoomBanner.banner_url} 
                                alt={studyRoomBanner.title} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    </div>
                ) : (
                    <div className="bg-card p-6 rounded-lg flex flex-col items-center justify-center">
                        <p className="text-muted-foreground mb-4">No study room banner uploaded yet</p>
                        <label 
                            htmlFor="study-room-banner-upload" 
                            className="btn-primary inline-block cursor-pointer"
                        >
                            Upload banner
                        </label>
                    </div>
                )}
            </div>
        </section>
        
        {/* Pre-roll Video Section */}
        <section className="mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Pre-roll ad</h2>
                <div className="mt-2 md:mt-0">
                    <input
                        type="file"
                        id="pre-roll-video-upload"
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="hidden"
                        />
                        <label 
                        htmlFor="pre-roll-video-upload" 
                        className="btn-primary inline-block cursor-pointer"
                    >
                        Upload new video
                    </label>
                </div>
            </div>
            
            {/* Display current video or preview */}
            <div className="glass-effect rounded-lg overflow-hidden">
            {videoPreview ? (
                <div className="relative">
                    <div className="bg-card p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Preview</h3>
                        <div className="relative aspect-video overflow-hidden rounded-md mb-4">
                            <video 
                                src={videoPreview.preview} 
                                controls
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Ad Video Title</label>
                            <input 
                                type="text" 
                                value={videoPreview.title} 
                                onChange={handleVideoTitleChange}
                                className="w-full p-2 bg-secondary text-foreground rounded-md border border-border"
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={cancelVideoPreview}
                                className="btn-outline"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={submitPreRollVideo}
                                className="btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : preRollVideo ? (
                <div className="relative">
                    <div className="bg-card p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Current Video</h3>
                            {/* <button 
                                onClick={deletePreRollVideo}
                                className="text-destructive hover:underline text-sm"
                            >
                                Delete
                            </button> */}
                        </div>
                        <h4 className="text-md font-semibold mb-4">Title: <span className='font-extralight'>{preRollVideo.title}</span></h4>
                        <div className="relative aspect-video overflow-hidden rounded-md">
                            <video 
                                src={preRollVideo.video_url} 
                                controls
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-card p-6 rounded-lg flex flex-col items-center justify-center">
                <p className="text-muted-foreground mb-4">No pre-roll video uploaded yet</p>
                <label 
                    htmlFor="pre-roll-video-upload" 
                    className="btn-primary inline-block cursor-pointer"
                >
                    Upload video
                </label>
                </div>
            )}
            </div>
        </section>
        </div>
    );
};

export default BillboardLanding;
