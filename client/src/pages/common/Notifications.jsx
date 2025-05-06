import { useState, useEffect } from "react";
import {
    Bell,
    Check,
    X,
    MessageSquare,
    Video,
    CreditCard,
    BookOpen,
    Star,
    ShieldAlert,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { changeNotificationCount } from "../../redux/features/authSlice";
import formatTimeAgo from "../../utils/formatTimeAgo";
import handleError from "../../utils/handleError";
import api from "../../services/api/axiosInterceptor";

const NotificationsPage = () => {
    const role = useSelector((state) => state.auth?.role);
    const [activeTab, setActiveTab] = useState("unread");
    const [unReadNotifications, setUnReadNotifications] = useState(null)
    const [readNotifications, setReadNotifications] = useState(null)
    const [loading, setLoading] = useState(true);
    const url = role == 'admin' ? 'admin/notifications/' : 'users/notifications/'
    const dispatch = useDispatch()

    const fetchUnReadNotifications = async () => {
        try{
            setLoading(true)
            const response = await api.get(url, {params: {status: 'unread',}})
            console.log('response featch unread notifications:', response)
            setUnReadNotifications(response.data)
        }catch (error) {
            console.log('error fetching notification:', error)
            handleError(error, 'Error fetching Unread Notifications')
        }finally{
            setLoading(false)
        }
    }

    const fetchReadNotifications = async () => {
        try{
            setLoading(true)
            const response = await api.get(url, {params: {status: 'read',}})
            console.log('response featch read notifications:', response)
            setReadNotifications(response.data)
        }catch (error) {
            console.log('error fetching notification:', error)
            handleError(error, 'Error fetching Read Notifications')
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'unread' && !unReadNotifications){
            fetchUnReadNotifications()
        }
    }, []);

    const setActiveTabHistory = () => {
        if (!readNotifications){
            fetchReadNotifications()
        }
        setActiveTab("history")
    }

    const markAsRead = async (id, idx) => {
        const toRead = unReadNotifications[idx]
        console.log('toREad:', toRead)
        setUnReadNotifications((prevNotifications) => {
            const newUnread = [...prevNotifications];
            newUnread.splice(idx, 1);
            return newUnread;
        });
        const response = await api.patch(url, {notification_id : id})
        console.log('mark as read response:',response)
        setReadNotifications(response?.data?.notifications || []);
        dispatch(changeNotificationCount('deduct'))
    };

    const markAllAsRead = async () => {
        if (!unReadNotifications || unReadNotifications.length === 0) return
        setUnReadNotifications([]);
        const response = await api.patch(url, {mark_all : true})
        setReadNotifications(response?.data?.notifications || []);
        dispatch(changeNotificationCount('readAll'))
    };


    // Get icon based on notification type
    const getNotificationIcon = (type) => {
        switch (type) {
            case "COURSE_PURCHASE":
                return <BookOpen className="text-blue-400" />;
            case "WALLET_CREDIT":
                return <CreditCard className="text-green-400" />;
            case "USER_REPORT":
                return <ShieldAlert  className="text-red-400" />;
            case "video_call":
                return <Video className="text-purple-400" />;
            case "message":
                return <MessageSquare className="text-orange-400" />;
            case "COURSE_REVIEW":
                return <Star className="text-yellow-400" />;
            default:
                return <Bell className="text-muted-foreground" />;
        }
    };

    // Get background color based on notification type
    const getNotificationBg = (type) => {
        switch (type) {
            case "COURSE_PURCHASE":
                return "bg-blue-500/10";
            case "WALLET_CREDIT":
                return "bg-green-500/10";
            case "USER_REPORT":
                return "bg-red-500/10";
            case "video_call":
                return "bg-purple-500/10";    
            case "message":
                return "bg-orange-500/10";
            case "COURSE_REVIEW":
                return "bg-yellow-500/10";
            default:
                return "bg-muted/20";
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="text-accent" />
                    Notifications
                </h1>

                {unReadNotifications?.length > 0 && activeTab === "unread" && (
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
                    {unReadNotifications?.length > 0 && (
                        <span className="ml-2 bg-accent text-gray-200 text-xs rounded-full px-2 py-0.5">
                            {unReadNotifications?.length || 0}
                        </span>
                    )}
                </button>
                <button
                    className={`px-4 py-2 font-medium ${
                        activeTab === "history"
                            ? "text-accent border-b-2 border-accent"
                            : "text-muted-foreground"
                    }`}
                    onClick={setActiveTabHistory}
                >
                    History
                </button>
            </div>

            {/* Loading state */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
            ) : (
                <>
                    {/* Empty state */}
                    {(activeTab === "unread" && (!unReadNotifications || unReadNotifications.length === 0)) ||
                    (activeTab === "history" && (!readNotifications || readNotifications.length === 0)) ? (
                        <div className="text-center py-16 bg-card rounded-lg">
                            <Bell
                                size={48}
                                className="mx-auto text-muted-foreground mb-4"
                            />
                            <h3 className="text-xl font-medium mb-2">
                                No notifications
                            </h3>
                            <p className="text-muted-foreground">
                                {activeTab === "unread"
                                    ? "You don't have any unread notifications."
                                    : "Your notification history is empty."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Notification list */}
                            {(activeTab === "unread"
                                ? unReadNotifications
                                : readNotifications
                            ).map((notification, idx) => (
                                <div
                                    key={notification.id}
                                    className={`rounded-lg p-4 border border-border ${getNotificationBg(
                                        notification.notification_type
                                    )} flex items-start`}
                                >
                                    <div className="flex-shrink-0 mr-4 mt-1">
                                        {getNotificationIcon(
                                            notification.notification_type
                                        )}
                                    </div>

                                    <div className="flex-grow">
                                        <p className="mb-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                            {formatTimeAgo(
                                                notification.created_at
                                            )}
                                        </span>
                                    </div>

                                    {!notification.is_read && (
                                        <button
                                            onClick={() =>
                                                markAsRead(notification.id, idx)
                                            }
                                            className="ml-2 p-1 hover:bg-secondary rounded-full"
                                            aria-label="Mark as read"
                                        >
                                            <X
                                                size={16}
                                                className="text-muted-foreground"
                                            />
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
};

export default NotificationsPage;
