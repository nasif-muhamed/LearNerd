import { useSelector } from 'react-redux';

const useMessageCount = () => {
    const unReadMessages = useSelector((state) => state.auth.unReadMessages);
    const totalCount = Object.values(unReadMessages).reduce((acc, count) => acc + count, 0)
    return totalCount;
};

export default useMessageCount;