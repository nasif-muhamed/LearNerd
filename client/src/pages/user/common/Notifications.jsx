import { useState, useEffect } from "react";
import { Bell, Check, X, MessageSquare, Video, CreditCard, BookOpen, Star } from "lucide-react";

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState("unread");
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with your API call
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setNotifications([
        {
          id: 1,
          message: "You have purchased 'Advanced JavaScript Patterns' course",
          notification_type: "purchase",
          is_read: false,
          created_at: "2025-04-18T14:30:00Z"
        },
        {
          id: 2,
          message: "Admin has credited $50 to your wallet",
          notification_type: "wallet",
          is_read: false,
          created_at: "2025-04-17T10:15:00Z"
        },
        {
          id: 3,
          message: "Tutor John Smith has scheduled a video call for tomorrow at 3 PM",
          notification_type: "video_call",
          is_read: false,
          created_at: "2025-04-16T18:45:00Z"
        },
        {
          id: 4,
          message: "You have a new message from Instructor Emily in the React course",
          notification_type: "message",
          is_read: true,
          created_at: "2025-04-15T09:20:00Z"
        },
        {
          id: 5,
          message: "Thank you for reviewing 'Data Structures and Algorithms' course",
          notification_type: "review",
          is_read: true,
          created_at: "2025-04-14T16:05:00Z"
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  const markAsRead = async (id) => {
    // In a real app, make API call to update status in backend
    // await fetch('/api/notifications/mark-read', { method: 'POST', body: JSON.stringify({ id }) });
    
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, is_read: true } : notification
    ));
  };

  const markAllAsRead = async () => {
    // In a real app, make API call to update all statuses
    // await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    
    setNotifications(notifications.map(notification => ({ ...notification, is_read: true })));
  };

  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

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
        return <Bell className="text-muted-foreground" />;
    }
  };

  // Get background color based on notification type
  const getNotificationBg = (type) => {
    switch (type) {
      case 'purchase':
        return 'bg-blue-500/10';
      case 'wallet':
        return 'bg-green-500/10';
      case 'video_call':
        return 'bg-purple-500/10';
      case 'message':
        return 'bg-yellow-500/10';
      case 'review':
        return 'bg-orange-500/10';
      default:
        return 'bg-muted/20';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="text-accent" />
          Notifications
        </h1>
        
        {unreadNotifications.length > 0 && activeTab === "unread" && (
          <button 
            onClick={markAllAsRead}
            className="btn-outline flex items-center gap-2"
          >
            <Check size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "unread"
              ? "text-accent border-b-2 border-accent"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("unread")}
        >
          Unread
          {unreadNotifications.length > 0 && (
            <span className="ml-2 bg-accent text-gray-200 text-xs rounded-full px-2 py-0.5">
              {unreadNotifications.length}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "history"
              ? "text-accent border-b-2 border-accent"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : (
        <>
          {/* Empty state */}
          {(activeTab === "unread" && unreadNotifications.length === 0) || 
           (activeTab === "history" && readNotifications.length === 0) ? (
            <div className="text-center py-16 bg-card rounded-lg">
              <Bell size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {activeTab === "unread" 
                  ? "You don't have any unread notifications." 
                  : "Your notification history is empty."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Notification list */}
              {(activeTab === "unread" ? unreadNotifications : readNotifications).map(notification => (
                <div 
                  key={notification.id} 
                  className={`rounded-lg p-4 border border-border ${getNotificationBg(notification.notification_type)} flex items-start`}
                >
                  <div className="flex-shrink-0 mr-4 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  
                  <div className="flex-grow">
                    <p className="mb-1">{notification.message}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  
                  {!notification.is_read && (
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="ml-2 p-1 hover:bg-secondary rounded-full"
                      aria-label="Mark as read"
                    >
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NotificationsPage
