import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, X, ArrowRight, User, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { format, parseISO, addMinutes } from 'date-fns';

const TutorSessionsPage = () => {
  // State management
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state for scheduling
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Common durations
  const commonDurations = [30, 45, 60, 90, 120];
  
  // Fetch sessions with pagination and filtering
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage,
        });
        
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        const response = await axios.get(`/api/tutor/sessions/?${params.toString()}`);
        setSessions(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
        setLoading(false);
      } catch (err) {
        setError('Failed to load sessions');
        setLoading(false);
        console.error('Error fetching sessions:', err);
      }
    };
    
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
      const scheduledDateTime = `${scheduledDate}T${scheduledTime}`;
      
      // Calculate ending time based on duration
      const startDate = new Date(`${scheduledDate}T${scheduledTime}`);
      const endDate = addMinutes(startDate, parseInt(durationMinutes));
      
      const response = await axios.patch(`/api/tutor/sessions/${selectedSession.id}/`, {
        status: 'approved',
        scheduled_time: scheduledDateTime,
        ending_time: endDate.toISOString()
      });
      
      // Update the sessions list with the new data
      setSessions(sessions.map(session => 
        session.id === selectedSession.id ? response.data : session
      ));
      
      // Close modal
      setIsModalOpen(false);
      setSelectedSession(null);
    } catch (err) {
      setError('Failed to schedule session');
      console.error('Error scheduling session:', err);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col space-y-4 w-full max-w-4xl">
          <div className="h-12 bg-secondary rounded-md w-1/4"></div>
          <div className="h-10 bg-secondary rounded-md w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
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
        <p className="text-muted-foreground mb-4">Please try again later</p>
        <button 
          className="btn-primary"
          onClick={() => window.location.reload()}
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
                  <div className="transaction-icon transaction-icon-credit mr-3">
                    <User size={18} className="text-success" />
                  </div>
                  <div>
                    <span className="font-medium">Student ID: {session.student}</span>
                    <span className="text-xs text-muted-foreground ml-2">
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
                        {format(parseISO(session.scheduled_time), 'MMM dd, yyyy')}
                      </span>
                    )}
                    
                    {session.scheduled_time && session.ending_time && (
                      <span className="flex items-center text-muted-foreground">
                        <Clock size={14} className="mr-1" />
                        {format(parseISO(session.scheduled_time), 'h:mm a')} - 
                        {format(parseISO(session.ending_time), 'h:mm a')}
                      </span>
                    )}
                    
                    <span className="flex items-center text-muted-foreground">
                      <MessageCircle size={14} className="mr-1" />
                      <button className="text-primary hover:underline">Open Chat</button>
                    </span>
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
                  <button className="btn-secondary text-sm py-1.5 px-3">
                    Mark Complete
                  </button>
                )}
                
                {session.status === 'approved' && session.is_upcoming && (
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-success mb-1">Scheduled</span>
                    <button className="btn-outline text-sm py-1 px-3">
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
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`btn-outline py-1 px-3 ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                  currentPage === i + 1
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`btn-outline py-1 px-3 ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Next
          </button>
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
              <div className="text-sm text-muted-foreground mb-2">Scheduling for Student ID: {selectedSession.student}</div>
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
                  <label className="block text-sm font-medium mb-1">Time</label>
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