import { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Phone, Share, MessageSquare, 
  MoreVertical, Users, Settings, Maximize, Minimize, ChevronLeft,
  Clock, Paperclip
} from 'lucide-react';

const VideoCallPage = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Sarah Johnson', content: 'Hi there! Can you see my screen?', time: '10:02 AM' },
    { id: 2, sender: 'You', content: 'Yes, I can see it clearly. Let me show you my progress.', time: '10:03 AM' },
  ]);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatEndRef = useRef(null);
  
  // Mock user data
  const remoteUser = {
    name: 'Sarah Johnson',
    role: 'Course Mentor',
    avatar: null
  };

  // Timer for call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock video streams
  useEffect(() => {
    // In a real implementation, this would use WebRTC to connect to peer streams
    // For this demo, we'll use getUserMedia to show the local camera feed
    if (!isVideoOff) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: !isMuted })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          // In a real app, you would connect this stream to a peer connection
        })
        .catch(err => console.error('Error accessing media devices:', err));
    } else if (localVideoRef.current && localVideoRef.current.srcObject) {
      // Stop all tracks when video is turned off
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    
    // Auto-scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isVideoOff, isMuted, messages]);

  const handleSendMessage = () => {
    if (message.trim() === '') return;
    
    const newMessage = {
      id: messages.length + 1,
      sender: 'You',
      content: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const endCall = () => {
    // In a real app, this would disconnect the WebRTC connection
    alert('Call ended. This would navigate back to the previous page in a real app.');
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center">
          <button className="mr-3 p-2 rounded-full hover:bg-muted">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            {remoteUser.avatar ? (
              <img src={remoteUser.avatar} alt={remoteUser.name} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-md font-medium">{remoteUser.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h3 className="font-medium">{remoteUser.name}</h3>
              <p className="text-xs text-muted-foreground">{remoteUser.role}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center text-muted-foreground">
            <Clock size={16} className="mr-1" />
            <span>{formatDuration(callDuration)}</span>
          </div>
          <button className="p-2 rounded-full hover:bg-muted" onClick={toggleFullScreen}>
            {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <button className="p-2 rounded-full hover:bg-muted">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className={`flex-1 bg-card relative p-5 ${isChatOpen ? 'lg:mr-80' : ''}`}>
          {/* Remote video (large) */}
          <div className="">
            {/* This would normally be the remote peer's video */}
            <div className=" flex items-center justify-center relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="md:w-9/12 h-screen md:h-auto object-cover rounded-lg shadow-lg bg-black"
                style={{ filter: isVideoOff ? 'blur(10px)' : 'none' }}
                poster="/api/placeholder/800/600"
              />
              
              {/* Remote user info overlay - shown when video is off */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-medium">{remoteUser.name.charAt(0)}</span>
                  </div>
                  <h3 className="text-xl font-medium">{remoteUser.name}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Local video (small) */}
          <div className="absolute top-6 right-6 w-48 h-36 rounded-lg overflow-hidden border-2 border-border shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="w-full h-full bg-card flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <span className="text-xl font-medium">Y</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Call controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="glass-effect rounded-full py-3 px-6 flex items-center gap-3">
              <button 
                className={`p-3 rounded-full ${isMuted ? 'bg-muted-foreground' : 'bg-muted'}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button 
                className={`p-3 rounded-full ${isVideoOff ? 'bg-muted-foreground' : 'bg-muted'}`}
                onClick={() => setIsVideoOff(!isVideoOff)}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
              <button 
                className="p-3 rounded-full bg-destructive"
                onClick={endCall}
              >
                <Phone size={20} className="transform rotate-225" />
              </button>
              <button 
                className={`p-3 rounded-full ${isScreenSharing ? 'bg-muted-foreground' : 'bg-muted'}`}
                onClick={() => setIsScreenSharing(!isScreenSharing)}
              >
                <Share size={20} />
              </button>
              <button 
                className={`p-3 rounded-full ${isChatOpen ? 'bg-muted-foreground' : 'bg-muted'}`}
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        {isChatOpen && (
          <div className="w-full lg:w-80 border-l border-border h-full flex flex-col bg-card absolute lg:relative right-0 top-0 bottom-0 z-10">
            {/* Chat header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-medium">Chat</h3>
              <button 
                className="p-2 rounded-full hover:bg-muted"
                onClick={() => setIsChatOpen(false)}
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${msg.sender === 'You' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'} rounded-2xl px-4 py-2`}>
                    {msg.sender !== 'You' && (
                      <div className="font-medium text-xs mb-1">{msg.sender}</div>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <div className="text-xs opacity-70 text-right mt-1">
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-border">
              <div className="relative flex items-center">
                <button className="p-2 text-muted-foreground hover:text-foreground">
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-muted rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-accent resize-none h-10 max-h-32 text-sm"
                  rows={1}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={message.trim() === ''}
                  className={`ml-2 p-2 rounded-full ${message.trim() === '' ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'}`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallPage;