import { useSelector } from 'react-redux';

const useAccessToken = () => {
    const token = useSelector((state) => state.auth.accessToken);
    return token;
};

export default useAccessToken;