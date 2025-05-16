function formatExpiryMessage(dateString) {
    const now = new Date();
    const expiryDate = new Date(dateString);
    const diffMs = expiryDate - now;

    const MS_IN_MINUTE = 60 * 1000;
    const MS_IN_HOUR = 60 * MS_IN_MINUTE;
    const MS_IN_DAY = 24 * MS_IN_HOUR;

    const isExpired = diffMs < 0;

    const absDiff = Math.abs(diffMs);

    // Format date as "Month Day, Year" (e.g., May 10, 2025)
    const formattedDate = expiryDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    if (isExpired) {
        return `Expired on ${formattedDate}`;
    } else if (absDiff < MS_IN_MINUTE * 5) {
        return 'Expires within minutes';
    } else if (absDiff < MS_IN_HOUR) {
        const minutes = Math.floor(absDiff / MS_IN_MINUTE);
        return `Expires within ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (absDiff < MS_IN_DAY) {
        const hours = Math.floor(absDiff / MS_IN_HOUR);
        return `Expires within ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (absDiff < MS_IN_DAY * 7) {
        const days = Math.floor(absDiff / MS_IN_DAY);
        return `Expires within ${days} day${days !== 1 ? 's' : ''}`;
    } else {
        return `Expires on ${formattedDate}`;
    }
}

export default formatExpiryMessage 