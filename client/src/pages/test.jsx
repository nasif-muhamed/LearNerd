import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, X, ArrowRight, User, MessageCircle } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import api from '../services/api/axiosInterceptor';
import handleError from '../utils/handleError'
import RoundedImage from '../components/ui/RoundedImage'

const TutorSessionsPage = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  // State management
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingScheduleButton, setLoadingScheduleButton] = useState(false);
  const [loadingMarkCompletedButton, setLoadingMarkCompletedButton] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state for scheduling
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  
  // Paginat    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    // const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const pageSize = 3;

  // Common durations
  const commonDurations = [30, 45, 60, 90, 120];
  
    console.log('sessions:', sessions)

  // Format date for display with timezone awareness
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };
  
  // Format time for display with timezone awareness
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'h:mm a');
    } catch (e) {
      console.error('Error formatting time:', e);
      return 'Invalid time';
    }
  };
  
  // Fetch sessions with pagination and filtering
    const fetchSessions = async () => {
        try {
            
            setLoading(true);
            //   const params = new URLSearchParams({ currentPage });
            const params = {
                page: currentPage,
                page_size: pageSize,
                // search: searchQuery,
            }

            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }
            
            // const response = await api.get(`courses/tutor/video-sessions/?${params.toString()}`);
            const response = await api.get(`courses/tutor/video-sessions/`, {
                params: params
            });
            console.log('response fetch sessions:', response);
            setSessions(response.data.results);
            setNextPage(response.data?.next);
            setPrevPage(response.data?.previous);
            setTotalPages(Math.ceil(response.data.count / pageSize));

        } catch (err) {
            handleError(err, 'Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };
  
  useEffect(() => {
    fetchSessions();
  }, [currentPage, statusFilter]);

  // Handle pagination change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle filter change
  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Open modal for session approval and scheduling
  const handleApproveClick = (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
    // Reset form fields
    setScheduledDate('');
    setScheduledTime('');
    setDurationMinutes(60);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  // Submit session approval
  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    
    if (!scheduledDate || !scheduledTime || !durationMinutes) {
      return; // Form validation
    }
    
    try {
      setLoadingScheduleButton(true)
      // Combine date and time into ISO string
      // const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      console.log('scheduledDateTime:', scheduledDateTime);
      
    //   const localDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    //   console.log('localDateTime:', localDateTime)
    //   const isoDateTime = localDateTime.toISOString();
    //   console.log('isoDateTime:', isoDateTime)

      const now = new Date();

      // Add 1 hour (in milliseconds) to the current time
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      if (scheduledDateTime < oneHourFromNow) {
          handleError(null, 'You must schedule a session at least one hour in advance');
          return;
      }

      const response = await api.patch(`courses/video-sessions/${selectedSession.id}/`, {
        status: 'approved',
        scheduled_time: scheduledDateTime.toISOString(),
        duration_minutes: parseInt(durationMinutes)
      });
      const sessionId = response.data.id
      console.log('response from video-sessions:', response)

      // Update the sessions list with the new data
      setSessions(prev => 
        prev.map(session => 
            session.id === sessionId ? {...response.data, student: session.student} : session
        )
      );
      
      // Close modal
      setIsModalOpen(false);
      setSelectedSession(null);
    } catch (err) {
      console.log('schedule session error', err)
      handleError(err, 'Failed to schedule session');
    } finally {
      setLoadingScheduleButton(false)
    }
  };
  
  // Handle marking a session as completed
  const handleMarkComplete = async (sessionId) => {
    try {
      setLoadingMarkCompletedButton(true)
      const response = await api.patch(`courses/video-sessions/${sessionId}/`, {
        status: 'completed',
      });
      // Update the sessions list with the new status
      setSessions(prev => 
        prev.map(session => 
            session.id === sessionId ? {...response.data, student: session.student} : session
        )
      );
    } catch (err) {
      console.log('complete session error', err)
      handleError(err, 'Failed to mark session as completed');
    } finally {
      setLoadingMarkCompletedButton(false)
    }
  };

  // Get badge class based on status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'approved':
        return 'bg-info/20 text-info';
      case 'completed':
        return 'bg-success/20 text-success';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  // Render loading state
  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center max-h-[100vh] min-h-[60vh] py-5">
        <div className="animate-pulse flex flex-col space-y-4 w-full max-w-4xl">
          <div className="h-12 bg-secondary rounded-md w-1/4"></div>
          <div className="h-10 bg-secondary rounded-md w-1/3"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-card rounded-lg border border-border"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-destructive text-lg font-semibold mb-2">Failed to load sessions</div>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button 
          className="btn-primary"
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Teaching Sessions</h1>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm text-muted-foreground self-center mr-2">Filter by:</span>
        {['all', 'pending', 'approved', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => handleFilterChange(status)}
            className={`filter-button ${
              statusFilter === status 
                ? 'filter-button-active' 
                : 'filter-button-inactive'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Sessions list */}
      <div className="space-y-4 mb-8">
        {sessions.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-lg text-muted-foreground">No sessions found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {statusFilter !== 'all' 
                ? `Try changing your filter from "${statusFilter}"`
                : 'Students will appear here when they request sessions'}
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="transaction-card flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                {/* Student Info */}
                <div className="flex items-center mb-2">
                  <RoundedImage 
                    style="w-10 h-10 transaction-icon transaction-icon-credit mr-2"
                    source={session.student?.image ? `${BASE_URL}${session.student.image}` : null}
                    alternative={session.student?.first_name && session.student?.last_name 
                      ? `${session.student.first_name} ${session.student.last_name}` 
                      : session.student?.email}
                    userName={session.student?.first_name && session.student?.last_name 
                      ? session.student.first_name 
                      : session.student?.email}
                  />
                  <div>
                    <span className="font-medium">
                      Student: {session.student?.first_name && session.student?.last_name 
                        ? `${session.student.first_name} ${session.student.last_name}` 
                        : session.student?.email || session.student_name || `Student ID: ${session.student}`}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {session.course && (
                        <span className="mr-2">{session.course}</span>
                      )}
                      Room: {session.room_id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                
                {/* Session Details */}
                <div className="pl-12">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(session.status)}`}>
                      {session.status.toUpperCase()}
                    </span>
                    
                    {session.scheduled_time && (
                      <span className="flex items-center text-muted-foreground">
                        <Calendar size={14} className="mr-1" />
                        {formatDate(session.scheduled_time)}
                      </span>
                    )}
                    
                    {session.scheduled_time && session.ending_time && (
                      <span className="flex items-center text-muted-foreground">
                        <Clock size={14} className="mr-1" />
                        {formatTime(session.scheduled_time)} - 
                        {formatTime(session.ending_time)}
                      </span>
                    )}
                    
                    {session.status === 'pending' && (
                        <span className="flex items-center text-muted-foreground">
                        <MessageCircle size={14} className="mr-1" />
                        <button className="text-primary hover:underline">Open Chat</button>
                        </span>
                    )}

                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-end space-x-2">
                {session.status === 'pending' && (
                  <button 
                    className="btn-primary text-sm py-1.5 px-3"
                    onClick={() => handleApproveClick(session)}
                  >
                    Approve & Schedule
                  </button>
                )}
                
                {session.status === 'approved' && !session.is_upcoming && (
                  <button 
                    className="btn-secondary text-sm py-1.5 px-3"
                    onClick={() => handleMarkComplete(session.id)}
                  >
                    Mark Complete
                  </button>
                )}
                
                {session.status === 'approved' && session.is_upcoming && (
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-success mb-1">Scheduled</span>
                    <button 
                      className="btn-outline text-sm py-1 px-3"
                      onClick={() => handleApproveClick(session)}
                    >
                      Reschedule
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
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
      
      {/* Modal for scheduling */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div 
            className="bg-card rounded-lg p-6 max-w-md w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Schedule Session</h3>
              <button 
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-secondary"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-2">
                Scheduling for Student: {selectedSession.student?.first_name && selectedSession.student?.last_name 
                  ? `${selectedSession.student.first_name} ${selectedSession.student.last_name}` 
                  : selectedSession.student?.email || selectedSession.student_name || `Student ID: ${selectedSession.student}`}
                {selectedSession.course && (
                  <span className="block mt-1">Course: {selectedSession.course}</span>
                )}
              </div>
            </div>
            
            <form onSubmit={handleSubmitSchedule}>
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full bg-secondary rounded-md border border-input"
                      min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    />
                  </div>
                </div>
                
                {/* Time */}
                <div>
                  <label className="block text-sm font-medium mb-1">Time (Your Local Time)</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="time"
                      required
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full bg-secondary rounded-md border border-input"
                    />
                  </div>
                </div>
                
                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {commonDurations.map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setDurationMinutes(duration)}
                        className={`px-3 py-1 text-xs rounded-md ${
                          durationMinutes === duration
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-muted'
                        }`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                  <input 
                    type="number"
                    min="15"
                    max="240"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="px-4 py-2 w-full bg-secondary rounded-md border border-input"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: 15 minutes, Max: 240 minutes (4 hours)
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary flex items-center"
                  >
                    <Check size={18} className="mr-1" />
                    Approve & Schedule
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorSessionsPage;