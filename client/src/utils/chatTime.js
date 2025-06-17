function chatTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);

    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    let datePart = "";

    if (isSameDay(date, now)) {
        datePart = "Today";
    } else if (isSameDay(date, yesterday)) {
        datePart = "Yesterday";
    } else {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        datePart = `${dd}/${mm}/${yy}`;
    }

    const timePart = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });

    return `${datePart} ${timePart}`;
}

export default chatTime;