import { toast } from "sonner";

const handleError = (error, noData) => {
    if (error && error.response?.data) {
        toast.error(Object.values(error.response?.data)?.[0]);
    } else {
        toast.error(noData);
        if (error && error.message) toast.error(error.message || 'Something went wrong');
    }
};

export default handleError
