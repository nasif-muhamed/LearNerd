// Format timer to display as MM:SS
export const formatTimeMinSec = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${
        remainingSeconds < 10 ? "0" : ""
    }${remainingSeconds}`;
};
