const formatDateMonth = (dateString) => {
    if (!dateString) return "Not scheduled";
    try {
        const date = new Date(dateString);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        
        // Format time with AM/PM
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Handle midnight (0 hours)
    
    return `${month} ${day}, ${year} • ${hours}:${minutes} ${ampm}`;
    } catch (error) {
        return dateString;
    }
};

export default formatDateMonth;
