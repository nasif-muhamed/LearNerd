import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  RefreshCcw, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  DollarSign, 
  User, 
  BookOpenText ,
  Clock,
  AlertTriangle,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Loader
} from "lucide-react";
import api from "../../../services/api/axiosInterceptor";
import { toast } from "sonner";
import handleError from "../../../utils/handleError";

// Sample data - replace with your actual API call
const initialReports = [
  {
    id: 1,
    message: "Course content doesn't match the description. Most videos are outdated.",
    userId: "user123",
    userName: "John Smith",
    courseId: "course456",
    courseName: "Advanced React Patterns",
    courseAmount: 49.99,
    tutorId: "tutor789",
    tutorName: "Alex Johnson",
    status: "pending",
    createdAt: "2025-04-25T14:30:00",
    response: "",
  },
  {
    id: 2,
    message: "The tutor is not responding to my questions for the past 2 weeks. Need a refund.",
    userId: "user234",
    userName: "Emily Parker",
    courseId: "course789",
    courseName: "Complete Python Masterclass",
    courseAmount: 69.99,
    tutorId: "tutor456",
    tutorName: "Michael Davis",
    status: "resolved",
    createdAt: "2025-04-20T09:15:00",
    response: "We have contacted the tutor. They will respond within 24 hours. Please let us know if the issue persists.",
  },
  {
    id: 3,
    message: "Some course materials are missing. Unable to complete assignment of Module 5.",
    userId: "user345",
    userName: "Sarah Williams",
    courseId: "course123",
    courseName: "UI/UX Design Fundamentals",
    courseAmount: 59.99,
    tutorId: "tutor123",
    tutorName: "David Wilson",
    status: "rejected",
    createdAt: "2025-04-18T16:45:00",
    response: "We've verified all materials are available. The assignment files are in the resources section of Module 5.",
  },
  {
    id: 4,
    message: "The certificate generation is broken. I've completed the course but can't get my certificate.",
    userId: "user456",
    userName: "Robert Brown",
    courseId: "course234",
    courseName: "Data Science Bootcamp",
    courseAmount: 89.99,
    tutorId: "tutor345",
    tutorName: "Jennifer Taylor",
    status: "pending",
    createdAt: "2025-04-28T11:20:00",
    response: "",
  },
  {
    id: 5,
    message: "Course quality is extremely poor. Videos are blurry and audio has constant static noise.",
    userId: "user567",
    userName: "Lisa Anderson",
    courseId: "course345",
    courseName: "Digital Marketing Strategy",
    courseAmount: 39.99,
    tutorId: "tutor567",
    tutorName: "Richard Miller",
    status: "pending",
    createdAt: "2025-04-27T13:10:00",
    response: "",
  },
];

export default function AdminReportsPage() {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");
    const [currentReport, setCurrentReport] = useState(null);
    const [responseText, setResponseText] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [refundAmount, setRefundAmount] = useState(0);
    const [refundReason, setRefundReason] = useState("");
    // pagination related
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || "");
    const pageSize = 3;
    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        page_size: pageSize,
        search: searchQuery,
      }

      const response = await api.get("admin/all-reports/",  {
        params: params
      });
      console.log("Fetched reports:", response.data);
      setTotalCount(response.data?.count);
      setNextPage(response.data?.next);
      setPrevPage(response.data?.previous);
      setReports(response.data?.results || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setLoading(false);
    }finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentPage, searchQuery]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle filtering and sorting
  const filteredAndSortedReports = reports
    .filter((report) => {
      const matchesFilter = filterStatus === "all" || report.status === filterStatus;
      const matchesSearch = 
        searchTerm === "" || 
        report.report.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.tutorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortField === "createdAt") {
        return sortDirection === "asc" 
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortField === "courseAmount") {
        return sortDirection === "asc"
          ? a.courseAmount - b.courseAmount
          : b.courseAmount - a.courseAmount;
      } else {
        const aValue = a[sortField]?.toString().toLowerCase() || "";
        const bValue = b[sortField]?.toString().toLowerCase() || "";
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });

  // Handle opening the response modal
  const openResponseModal = (report) => {
    setCurrentReport(report);
    setResponseText(report.reason || "");
    setIsModalOpen(true);
  };

//   // Handle opening the refund modal
//   const openRefundModal = (report) => {
//     setCurrentReport(report);
//     setRefundAmount(report.courseAmount);
//     setIsRefundModalOpen(true);
//   };

  // Handle resolving a report
//   const handleResolveReport = () => {
//     if (!responseText.trim()) {
//         toast.error("Please provide a message");
//         return;
//     }

//     // Update report in state (replace with API call)
//     const updatedReports = reports.map(report => 
//       report.id === currentReport.id 
//         ? { ...report, status: "resolved", response: responseText }
//         : report
//     );
    
//     setReports(updatedReports);
//     setIsModalOpen(false);
//     // Here you would make an API call to update the report
//   };

//   // Handle rejecting a report
//   const handleRejectReport = () => {
//     if (!responseText.trim()) {
//         toast.error("Please provide a rejection reason");
//         return;
//     }

//     // Update report in state (replace with API call)
//     const updatedReports = reports.map(report => 
//       report.id === currentReport.id 
//         ? { ...report, status: "rejected", response: responseText }
//         : report
//     );
    
//     setReports(updatedReports);
//     setIsModalOpen(false);
//     // Here you would make an API call to update the report
//   };

  // Handle processing a refund
    const handleRefund = async (type) => {
        if (!responseText.trim()) {
            toast.error(`Please provide a reason for the ${type}`);
            return;
        }

        const status = type == 'refund' ? 'refunded' : type == 'reject' ? 'rejected' : 'resolved'
        try{
            setLoading(true)
            const body = {
                reason: responseText,
                status: status
            }
            const response = await api.patch(`admin/report/${currentReport.id}/`, body)
            console.log("Refund response:", response.data);
            toast.success('Report status updated successfully')
            fetchReports()
        }catch(error){
            console.log("Error processing refund:", error);
            handleError(error, 'error updating report status')
        }finally{
            setLoading(false)
        }
        // Update report in state (replace with API call)
        // const updatedReports = reports.map(report => 
        // report.id === currentReport.id 
        //     ? { 
        //         ...report, 
        //         status: "resolved", 
        //         response: `Refund processed: $${refundAmount}. Reason: ${refundReason}` 
        //     }
        //     : report
        // );
        
        // setReports(updatedReports);
        // setIsRefundModalOpen(false);
        setIsModalOpen(false);
        // Here you would make API calls to process the refund and update the report
    };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-pending/20 text-pending";
      case "resolved":
        return "bg-success/20 text-success";
      case "rejected":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="container mx-auto py-5 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">User Reports</h1>
        <button 
          className="btn-primary flex items-center mt-4 md:mt-0"
          onClick={fetchReports}
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="glass-effect p-4 rounded-lg mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search reports by user, course, or content..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`filter-button ${filterStatus === "all" ? "filter-button-active" : "filter-button-inactive"}`}
              onClick={() => setFilterStatus("all")}
            >
              All Reports
            </button>
            <button
              className={`filter-button ${filterStatus === "pending" ? "filter-button-active" : "filter-button-inactive"}`}
              onClick={() => setFilterStatus("pending")}
            >
              <Clock className="w-3 h-3 mr-1 inline" />
              Pending
            </button>
            <button
              className={`filter-button ${filterStatus === "resolved" ? "filter-button-active" : "filter-button-inactive"}`}
              onClick={() => setFilterStatus("resolved")}
            >
              <CheckCircle className="w-3 h-3 mr-1 inline" />
              Resolved
            </button>
            <button
              className={`filter-button ${filterStatus === "rejected" ? "filter-button-active" : "filter-button-inactive"}`}
              onClick={() => setFilterStatus("rejected")}
            >
              <XCircle className="w-3 h-3 mr-1 inline" />
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table/Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader className="w-8 h-8 animate-spin text-accent" />
          <span className="ml-3 text-lg">Loading reports...</span>
        </div>
      ) : filteredAndSortedReports.length === 0 ? (
        <div className="glass-effect rounded-lg p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 w-12 h-12 text-warning" />
          <h3 className="text-xl font-semibold mb-2">No reports found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterStatus !== "all" 
              ? "Try adjusting your filters or search terms"
              : "There are currently no reports to review"}
          </p>
        </div>
      ) : (
        <>
          {/* Table Headers - visible on larger screens */}
          <div className="hidden lg:grid grid-cols-8 gap-4 px-4 mb-4 font-medium text-muted-foreground">
            <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort("userName")}>
              Details
              {sortField === "userName" && (
                sortDirection === "asc" ? <ArrowUp className="ml-1 w-4 h-4" /> : <ArrowDown className="ml-1 w-4 h-4" />
              )}
            </div>
            <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort("message")}>
              Report 
              {sortField === "message" && (
                sortDirection === "asc" ? <ArrowUp className="ml-1 w-4 h-4" /> : <ArrowDown className="ml-1 w-4 h-4" />
              )}
            </div>
            <div className="flex items-center cursor-pointer" onClick={() => handleSort("courseAmount")}>
              Amount
              {sortField === "courseAmount" && (
                sortDirection === "asc" ? <ArrowUp className="ml-1 w-4 h-4" /> : <ArrowDown className="ml-1 w-4 h-4" />
              )}
            </div>
            <div className="flex items-center cursor-pointer" onClick={() => handleSort("createdAt")}>
              Date
              {sortField === "createdAt" && (
                sortDirection === "asc" ? <ArrowUp className="ml-1 w-4 h-4" /> : <ArrowDown className="ml-1 w-4 h-4" />
              )}
            </div>
            <div className="flex items-center cursor-pointer" onClick={() => handleSort("status")}>
              Status
              {sortField === "status" && (
                sortDirection === "asc" ? <ArrowUp className="ml-1 w-4 h-4" /> : <ArrowDown className="ml-1 w-4 h-4" />
              )}
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {filteredAndSortedReports.map((report) => (
              <div key={report.id} className="transaction-card grid grid-cols-1 lg:grid-cols-8 gap-4">
                {/* User */}
                <div className="flex flex-col gap-2 lg:col-span-2">
                  <div>
                    <h3 className="font-medium text-foreground mb-1 lg:hidden">User:</h3>
                    <div className="flex items-center">
                        <div className="w-5 h-5 mr-2 text-accent rounded-full overflow-hidden">
                            {report.user?.image ? 
                                (
                                    <img src={`${BASE_URL}${report.user?.image}`} alt="instructor" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full " />
                                )
                            }
                        </div>
                        <span className="text-sm flex-1 line-clamp-1">{report.user?.email}</span>
                    </div>
                  </div>

                    {/* Course */}
                    <div>
                        <h3 className="font-medium text-foreground mb-1 lg:hidden">Course:</h3>
                        <div className="flex items-center">
                            <BookOpenText  className="w-5 h-5 mr-2 text-primary" />
                            <span className="text-sm line-clamp-1">{report.course_title}</span>
                        </div>
                    </div>
                
                    {/* Tutor */}
                    <div>
                        <h3 className="font-medium text-foreground mb-1 lg:hidden">Tutor:</h3>
                        <div className="flex items-center">
                            <div className="w-5 h-5 mr-2 text-accent rounded-full overflow-hidden">
                                {report.instructor.image ? 
                                    (
                                        <img src={`${BASE_URL}${report.instructor.image}`} alt="instructor" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-full h-full " />
                                    )
                                }
                            </div>
                            <span className="text-sm text-destructive flex-1 line-clamp-1">{report.instructor?.email}</span>
                        </div>
                    </div>
                </div>

                
                {/* Report Content - Full width on mobile */}
                <div className="lg:col-span-2 lg:flex lg:items-center">
                  <h3 className="font-medium text-foreground mb-1 lg:hidden">Report:</h3>
                  <p className="text-sm line-clamp-2">{report.report}</p>
                  {report.response && (
                    <div className="mt-2 p-2 bg-muted rounded-md text-xs lg:hidden">
                      <p className="font-medium">Response:</p>
                      <p className="text-muted-foreground">{report.response}</p>
                    </div>
                  )}
                </div>                
                
                {/* Amount */}
                <div className="flex items-center" >
                  <h3 className="font-medium text-foreground mb-1 lg:hidden mr-2">Amount:</h3>
                  <span className="text-sm font-medium">{report.purchase_details?.subscription_amount ? `₹${report.purchase_details?.subscription_amount}` : 'Freemium'}</span>
                </div>
                
                {/* Date */}
                <div className="flex flex-col gap-1 justify-center" >
                  <div className="flex items-center lg:block">
                    <h3 className="font-medium lg:text-xs text-foreground mr-2">Report Date:</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()} 
                      {" · "}
                      {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center lg:block">
                    <h3 className="font-medium lg:text-xs text-foreground mr-2">Exp Date:</h3>
                    {!report.purchase_details?.expire_at ? (<span className="text-xs text-muted-foreground">
                      freemium
                    </span>)
                    :
                    (<span className="text-xs text-muted-foreground">
                      {new Date(report.purchase_details?.expire_at).toLocaleDateString()} 
                      {" · "}
                      {new Date(report.purchase_details?.expire_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>)}
                  </div>
                </div>
                
                {/* Status */}
                <div className="flex items-center">
                  <h3 className="font-medium text-foreground mb-1 lg:hidden mr-2">Status:</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(report.status)}`}>
                    {report.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                    {report.status === "resolved" && <CheckCircle className="w-3 h-3 mr-1" />}
                    {report.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                    {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="flex items-center w-100">
                  {report.status === "pending" && (
                    <div className="flex lg:flex-col gap-2" >
                      <button 
                        className="btn-primary flex items-center text-xs py-1"
                        onClick={() => openResponseModal(report)}
                      >
                        <MessageSquare className="w-3 h-3 mr-1 inline" />
                        Respond
                      </button>
                      {/* <button 
                        className="btn-outline flex items-center text-xs py-1"
                        onClick={() => openRefundModal(report)}
                      >
                        <DollarSign className="w-3 h-3 mr-1 inline" />
                        Refund
                      </button> */}
                    </div>
                  )}
                  {report.status !== "pending" && (
                    <div>

                        <button 
                        className="btn-secondary flex items-center text-xs py-1"
                        onClick={() => openResponseModal(report)}
                        >
                        <MessageSquare className="w-3 h-3 mr-1 inline" />
                        View
                        </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Response Modal */}
      {isModalOpen && currentReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Report Response</h2>
              
                <div className="mb-6 p-4 bg-muted rounded-lg ">
                    <p className="text-sm mb-3">{currentReport.report}</p>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-1">
                        <div className="flex items-center truncate">
                            <div className="w-5 h-5 mr-2 text-accent rounded-full overflow-hidden">
                                {currentReport.instructor?.image ? 
                                    (
                                        <img src={`${BASE_URL}${currentReport.user.image}`} alt="instructor" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-full h-full " />
                                    )
                                }
                            </div>
                            <span className="font-medium line-clamp-1 truncate">{currentReport.user?.email}</span>
                        </div>
                        <div>
                            <button 
                                className="btn-primary flex items-center text-xs py-1"
                                onClick={() => {}}
                            >
                                <MessageSquare className="w-3 h-3 mr-1 inline" />
                                message student
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-1">
                        <div className="flex items-center">
                            <div className="w-5 h-5 mr-2 text-accent rounded-full overflow-hidden">
                                {currentReport.instructor?.image ? 
                                    (
                                        <img src={`${BASE_URL}${currentReport.instructor.image}`} alt="instructor" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-full h-full " />
                                    )
                                }
                            </div>
                            <span className="font-medium line-clamp-1 truncate text-destructive">{currentReport.instructor?.email}</span>
                        </div>
                        <div>
                            <button 
                                className="btn-primary flex items-center text-xs py-1"
                                onClick={() => {}}
                            >
                                <MessageSquare className="w-3 h-3 mr-1 inline" />
                                message tutor
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col text-xs text-muted-foreground gap-3">
                        <div className="flex items-center line-clamp-1">
                            <BookOpenText  className="w-4 h-4 mr-2" />
                            {currentReport.course_title}
                        </div>
                        <div className="flex justify-between items-center">
                            <h1 className="text-secondary-foreground text-sm" >
                                {currentReport.purchase_details?.subscription_amount ? `₹ ${currentReport.purchase_details?.subscription_amount?.toFixed(2)}` : 'Freemium'}
                            </h1>
                            <span className="text-xs text-muted-foreground">
                                {new Date(currentReport.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
              
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Reason:</label>
                    <textarea
                        className="w-full bg-background border border-border rounded-md p-3 min-h-32 focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Enter your reason..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        disabled={currentReport.status !== "pending"}
                    />
                </div>
              
                <div className="flex flex-wrap gap-3 justify-end">
                    <button 
                    className="btn-outline"
                    onClick={() => setIsModalOpen(false)}
                    >
                    Cancel
                    </button>
                    
                    {currentReport.status === "pending" && (
                    <>
                        <button 
                        className="btn-primary flex items-center"
                        onClick={() => handleRefund('resolve')}
                        >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
                        </button>
                        <button 
                        className="btn-secondary flex items-center"
                        onClick={() => handleRefund('reject')}
                        >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                        </button>
                        {currentReport.purchase_details?.subscription_amount > 0 && <button 
                        className="btn-destructive flex items-center"
                        onClick={() => handleRefund('refund')}
                        >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Process Refund
                        </button>}
                    </>
                    )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {/* {isRefundModalOpen && currentReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Process Refund</h2>
              
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Course:</span>
                  <span>{currentReport.courseName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Student:</span>
                  <span>{currentReport.userName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Tutor:</span>
                  <span>{currentReport.tutorName}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-4">
                  <span>Refund Amount:</span>
                  <span>${currentReport.courseAmount?.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Refund Amount:</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    className="w-full bg-background border border-border rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-accent"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Math.min(currentReport.courseAmount, Math.max(0, parseFloat(e.target.value) || 0)))}
                    max={currentReport.courseAmount}
                    min="0"
                    step="0.01"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Maximum refund: ${currentReport.courseAmount?.toFixed(2)}
                </span>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Refund Reason:</label>
                <textarea
                  className="w-full bg-background border border-border rounded-md p-3 h-24 focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Enter the reason for processing this refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-3 justify-end">
                <button 
                  className="btn-outline"
                  onClick={() => setIsRefundModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleProcessRefund}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Pagination */}
      {totalPages > 1 && (
          <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2 transition-all duration-300 ease-in-out">
                  {totalPages > 3 && (
                      <button
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
                          onClick={() =>
                              handlePageChange(currentPage - 1)
                          }
                          disabled={!prevPage}
                      >
                          <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                          >
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 19l-7-7 7-7"
                              ></path>
                          </svg>
                      </button>
                  )}

                  <div className="flex gap-2">
                      {(() => {
                          const getPageNumbers = () => {
                              if (totalPages <= 3) {
                                  return Array.from(
                                      { length: totalPages },
                                      (_, i) => i + 1
                                  );
                              }
                              let startPage = Math.max(
                                  1,
                                  currentPage - 1
                              );
                              let endPage = Math.min(
                                  totalPages,
                                  currentPage + 1
                              );
                              if (currentPage === 1) {
                                  endPage = 3;
                              } else if (currentPage === totalPages) {
                                  startPage = totalPages - 2;
                              }
                              return Array.from(
                                  { length: endPage - startPage + 1 },
                                  (_, i) => startPage + i
                              );
                          };
                          return getPageNumbers().map((page) => (
                              <button
                                  key={page}
                                  onClick={() =>
                                      handlePageChange(page)
                                  }
                                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${
                                      currentPage === page
                                          ? "bg-blue-600 text-white scale-110"
                                          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:scale-105"
                                  }`}
                              >
                                  {page}
                              </button>
                          ));
                      })()}
                  </div>

                  {totalPages > 3 && (
                      <button
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
                          onClick={() =>
                              handlePageChange(currentPage + 1)
                          }
                          disabled={!nextPage}
                      >
                          <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                          >
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 5l7 7-7 7"
                              ></path>
                          </svg>
                      </button>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}