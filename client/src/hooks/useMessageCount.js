import { useSelector } from 'react-redux';

const useMessageCount = () => {
    const unReadMessages = useSelector((state) => state.auth.unReadMessages);
    console.log('unReadMessages:', unReadMessages)
    const totalCount = unReadMessages ? Object.values(unReadMessages).reduce((acc, count) => acc + count, 0) : 0
    return totalCount;
};

export default useMessageCount;