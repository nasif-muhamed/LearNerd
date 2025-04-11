function formatTime(timeStr, pos=3) {
    // Split the input string into hours, minutes, and seconds
    const [h, m, s] = timeStr.split(':').map(Number);

    if (pos === 3){
        return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    }

    // else if pos is 2
    // If hours are non-zero, display hours and minutes
    if (h > 0) {
        return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
    } 
    // If hours are zero, display minutes and seconds
    else {
        return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    }
}

export default formatTime