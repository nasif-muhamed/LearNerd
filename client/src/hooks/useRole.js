import { useSelector } from 'react-redux';

const useRole = () => {
    const role = useSelector((state) => state.auth.role);
    return role;
};

export default useRole;