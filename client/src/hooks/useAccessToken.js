import { useSelector } from 'react-redux';

const useAccessToken = (role='user') => {
    let token
    if (role == 'admin') token = useSelector((state) => state.auth.adminUserAccessToken);
    else token = useSelector((state) => state.auth.accessToken);
    return token;
};

export default useAccessToken;