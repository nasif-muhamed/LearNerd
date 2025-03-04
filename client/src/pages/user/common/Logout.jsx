import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../redux/features/authSlice";
import { adminLogout } from '../../../redux/features/adminAuthSlice';
import { persistor } from '../../../redux/app/store';
import { toast } from 'sonner'

const Logout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const role = useSelector((state) => state.auth.role);

    useEffect(() => {
        if (role) {
            dispatch(logout());
            persistor.purge();  // Clears persisted state properly
            console.log('inside: token')
            toast('Logged Out', {
                description: 'see you soon',
            })
              
        }
        console.log('role:', role)
        navigate(role === 'admin' ? 'admin/login' : '/login', { replace: true })
    }, [role, navigate, dispatch]);
    
    return null;
}

export default Logout