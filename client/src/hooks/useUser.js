import { useSelector } from 'react-redux';

const useUser = () => {
    const user = useSelector((state) => state.auth.user);
    return user;
};

export default useUser;