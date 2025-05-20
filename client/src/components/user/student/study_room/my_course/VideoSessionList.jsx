import { Link } from "react-router-dom"

// const VideoSessionList = ({videoSessions}) => {

//     return (
//         <div className="bg-card rounded-lg p-6 mb-6">
//             <h2 className="text-xl font-bold mb-4">
//                 Sessions History
//             </h2>
//             {
//                 videoSessions?.map((session, idx) => (
//                     <div key={idx} className="w-full">
//                     </div>
//                 ))
//             }
//         </div>
//     )
// }

// export default VideoSessionList
import { Calendar, Clock, Video, CheckCircle, AlertCircle, MoreVertical, RefreshCw } from "lucide-react";
import formatDateMonth from "../../../../../utils/formatDateMonth";

const VideoSessionList = ({ videoSessions }) => {
  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusConfig = () => {
      switch (status) {
        case "pending":
          return {
            bgColor: "bg-pending/20",
            textColor: "text-pending",
            icon: <RefreshCw size={14} className="mr-1" />,
            text: "Pending"
          };
        case "approved":
          return {
            bgColor: "bg-success/20",
            textColor: "text-success",
            icon: <CheckCircle size={14} className="mr-1" />,
            text: "Approved"
          };
        case "completed":
          return {
            bgColor: "bg-info/20",
            textColor: "text-info",
            icon: <CheckCircle size={14} className="mr-1" />,
            text: "Completed"
          };
        default:
          return {
            bgColor: "bg-muted",
            textColor: "text-muted-foreground",
            icon: <AlertCircle size={14} className="mr-1" />,
            text: status
          };
      }
    };

    const config = getStatusConfig();

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };


  // Session card component
  const SessionCard = ({ session, number }) => {
    return (
      <div className="transaction-card flex flex-col items-start justify-between gap-3">
        <div className="flex items-center gap-3 w-auto">
          <div className={`transaction-icon ${session.status === "completed" ? "bg-info/20" : session.status === "approved" ? "bg-success/20" : "bg-pending/20"}`}>
            <Video size={20} className={session.status === "completed" ? "text-info" : session.status === "approved" ? "text-success" : "text-pending"} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between w-auto">
              <h3 className="font-medium">Session #{number}</h3>
              {/* <div className="md:hidden">
                <StatusBadge status={session.status} />
              </div> */}
            </div>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{session.scheduled_time ? formatDateMonth(session.scheduled_time) : "Scheduling pending"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Created: {formatDateMonth(session.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-auto justify-end mt-0">
          <div className="block">
            <StatusBadge status={session.status} />
          </div>
          
          {session.status === "approved" && (
            <button className="btn-primary flex items-center text-xs">
              <Video size={14} className="mr-1" />
              Join Room
            </button>
          )}
          
          {session.status === "pending" && (
            <button className="btn-outline flex items-center text-xs">
              <AlertCircle size={14} className="mr-1" />
              Awaiting Approval
            </button>
          )}
          
          {/* <button className="p-2 rounded-full hover:bg-secondary transition-colors">
            <MoreVertical size={16} />
          </button> */}
        </div>
      </div>
    );
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <Video size={24} className="text-muted-foreground" />
      </div>
      <h3 className="font-medium mb-1">No sessions found</h3>
      <p className="text-sm text-muted-foreground mb-4">
        You don't have any video sessions yet
      </p>
    </div>
  );

  return (
    <div className="bg-card rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-6">Sessions History</h2>
      
      {videoSessions?.length > 0 ? (
        <div className="space-y-4">
          {videoSessions.map((session, idx) => (
            <SessionCard key={idx} session={session} number={videoSessions.length - idx} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default VideoSessionList;
