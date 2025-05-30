import { useState, useEffect, useRef } from "react";
import { Bell, X, MessageSquare, Video, CreditCard, BookOpen, Star } from "lucide-react";

const NotificationToast = ({ socket }) => {
  const [notifications, setNotifications] = useState([]);
  const [toastCount, setToastCount] = useState(0);
  const maxToasts = 3; // Maximum number of toasts visible at once
  const toastTimeout = 5000; // Time in ms before toast auto-dismisses

  // Set up socket listener for new notifications
  useEffect(() => {
    // This is a mock implementation - replace with your actual socket integration
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [...prev, { 
        ...notification, 
        id: notification.id || Date.now(),
        isVisible: true 
      }]);
      setToastCount(prev => prev + 1);
    };

    // Mock socket implementation for demo purposes
    // In a real implementation, you would use your socket instance
    const mockNotificationInterval = setInterval(() => {
      // This simulates receiving a socket notification - remove in actual implementation
      const types = ['purchase', 'wallet', 'video_call', 'message', 'review'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const mockMessages = {
        'purchase': 'You purchased a new course: "Advanced React Patterns"',
        'wallet': 'Your wallet has been credited with $25',
        'video_call': 'Tutor Alex has scheduled a session for tomorrow',
        'message': 'New message from instructor in Web Development course',
        'review': 'Thanks for reviewing the Python Fundamentals course'
      };
      
      handleNewNotification({
        id: Date.now(),
        message: mockMessages[randomType],
        notification_type: randomType,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }, 15000);

    // In real implementation, use this:
    // socket.on('new_notification', handleNewNotification);

    return () => {
      clearInterval(mockNotificationInterval);
      // In real implementation, use this:
      // socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  // Auto-dismiss toasts after timeout
  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
      setNotifications(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0].isVisible = false;
        }
        return updated;
      });

      setTimeout(() => {
        setNotifications(prev => prev.slice(1));
        setToastCount(prev => prev - 1);
      }, 500); // Wait for exit animation
    }, toastTimeout);

    return () => clearTimeout(timer);
  }, [notifications]);

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'purchase':
        return <BookOpen className="text-blue-400" />;
      case 'wallet':
        return <CreditCard className="text-green-400" />;
      case 'video_call':
        return <Video className="text-purple-400" />;
      case 'message':
        return <MessageSquare className="text-yellow-400" />;
      case 'review':
        return <Star className="text-orange-400" />;
      default:
        return <Bell className="text-accent" />;
    }
  };

  // Get background color based on notification type
  const getNotificationBg = (type) => {
    switch (type) {
      case 'purchase':
        return 'bg-blue-500/20 border-blue-400/30';
      case 'wallet':
        return 'bg-green-500/20 border-green-400/30';
      case 'video_call':
        return 'bg-purple-500/20 border-purple-400/30';
      case 'message':
        return 'bg-yellow-500/20 border-yellow-400/30';
      case 'review':
        return 'bg-orange-500/20 border-orange-400/30';
      default:
        return 'bg-accent/20 border-accent/30';
    }
  };

  // Handle dismissing a toast manually
  const dismissToast = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isVisible: false } 
          : notification
      )
    );

    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      setToastCount(prev => prev - 1);
    }, 500); // Wait for exit animation
  };

  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-full sm:w-80 md:w-96">
      {notifications.slice(0, maxToasts).map((notification, index) => (
        <div 
          key={notification.id}
          className={`
            pointer-events-auto glass-effect ${getNotificationBg(notification.notification_type)} 
            rounded-lg shadow-lg w-full transform transition-all duration-500 overflow-hidden border
            ${notification.isVisible 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-full opacity-0'}
          `}
          style={{ 
            transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            animationDelay: `${index * 100}ms`
          }}
        >
          <div className="p-3 flex items-start">
            <div className="flex-shrink-0 mr-3 p-1">
              {getNotificationIcon(notification.notification_type)}
            </div>
            
            <div className="flex-grow">
              <p className="text-sm font-medium">{notification.message}</p>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(notification.created_at)}
              </span>
            </div>
            
            <button 
              onClick={() => dismissToast(notification.id)}
              className="flex-shrink-0 ml-2 p-1 hover:bg-secondary rounded-full"
              aria-label="Dismiss notification"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="h-1 bg-background">
            <div 
              className="h-full bg-accent/50"
              style={{ 
                width: '100%',
                animation: `shrink ${toastTimeout}ms linear forwards`
              }}
            />
          </div>
        </div>
      ))}
      
      {/* Global CSS for animations */}
      <style jsx global>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default NotificationToast