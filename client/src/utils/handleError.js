import { toast } from "sonner";

const handleError = (error, noData) => {
    if (error.response?.data) {
        toast.error(Object.values(error.response?.data)?.[0]);
    } else {
        toast.error(noData);
        toast.error(error.message || 'Something went wrong');
    }
};

export default handleError
