import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Loader, X } from 'lucide-react';
import { toast } from 'sonner';
import handleError from '../../../../utils/handleError';
import { useChatWebSocket } from '../../../../context/WebSocketContext';

const MessageInput = ({ setActiveTyper, selectedItem }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const ws = useChatWebSocket();
    const typingTimeoutRef = useRef(null);
    const lastTypingSentRef = useRef(0);
    const fileInputRef = useRef(null);

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;
    const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
    const CLOUDINARY_IMAGE_UPLOAD_URL = import.meta.env.VITE_CLOUDINARY_IMAGE_UPLOAD_URL;

    const sendTypingEvent = (isTyping) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const now = Date.now();
        if (now - lastTypingSentRef.current >= 2000) {
            ws.send(JSON.stringify({
                type: 'typing',
                is_typing: isTyping
            }));
            lastTypingSentRef.current = now;
        }
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        if (e.target.value.trim() === '') return;
        sendTypingEvent(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingEvent(false);
        }, 3000);
    };

    const handleSendMessage = async (content, messageType) => {
        if (content.trim() === '' || !ws || ws.readyState !== WebSocket.OPEN) return;
        try {
            setLoading(true);
            ws.send(JSON.stringify({
                type: 'message',
                message: content,
                message_type: messageType
            }));
            setMessage('');
            setActiveTyper(null);
            clearTimeout(typingTimeoutRef.current);
            if (messageType === 'image') {
                setPreviewImage(null);
                setSelectedFile(null);
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.log('error sending message:', error);
            handleError(error, 'Error sending message');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(message, 'text');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            handleError(new Error('Invalid file type'), 'Please upload an image file');
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            toast.error('File size exceeds 5MB limit. Please select a smaller image.');
            fileInputRef.current.value = '';
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = () => {
            setPreviewImage(reader.result);
            setSelectedFile(file);
        };
        reader.readAsDataURL(file);
    };

    const handleSendImage = async () => {
        if (!selectedFile) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('upload_preset', UPLOAD_PRESET);
            formData.append('cloud_name', CLOUD_NAME);

            const response = await fetch(CLOUDINARY_IMAGE_UPLOAD_URL, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (data.secure_url) {
                await handleSendMessage(data.secure_url, 'image');
            } else {
                throw new Error('Image upload failed');
            }
        } catch (error) {
            console.log('error uploading image:', error);
            handleError(error, 'Error uploading image');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPreview = () => {
        setPreviewImage(null);
        setSelectedFile(null);
        fileInputRef.current.value = '';
    };

    useEffect(() => {
        return () => {
            clearTimeout(typingTimeoutRef.current);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'typing',
                    is_typing: false
                }));
            }
        };
    }, [ws]);

    return (
        <div className="p-4 border-t border-border">
            <div className="relative flex items-center">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                />
                <button
                    onClick={() => fileInputRef.current.click()}
                    className="p-2 text-muted-foreground hover:text-foreground"
                    disabled={loading}
                >
                    <Paperclip size={20} />
                </button>
                {previewImage ? (
                    <div className="flex-1 flex items-center bg-muted rounded-md py-3 px-4 relative">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-h-24 object-contain rounded-md"
                        />
                        <button
                            onClick={handleCancelPreview}
                            className="absolute top-1 right-1 p-1 bg-muted-foreground/50 rounded-full text-white hover:bg-muted-foreground"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <textarea
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 bg-muted rounded-md py-3 px-4 focus:outline-none focus:ring-1 focus:ring-accent resize-none h-12 max-h-32"
                        rows={1}
                        disabled={loading}
                    />
                )}
                <button
                    onClick={() => previewImage ? handleSendImage() : handleSendMessage(message, 'text')}
                    disabled={(previewImage ? !selectedFile : message.trim() === '') || loading}
                    className={`ml-2 p-2 rounded-full ${(previewImage ? !selectedFile : message.trim() === '') || loading ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'}`}
                >
                    {loading ? <Loader className="animate-spin" /> : <Send size={20} />}
                </button>
            </div>
        </div>
    );
};

export default MessageInput;