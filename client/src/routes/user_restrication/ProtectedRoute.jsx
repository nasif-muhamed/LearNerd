import React, {useEffect} from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import UserAuthenticatedLayout from "../../components/layout/UserAuthenticatedLayout";
import { fetchUserDetails } from "../../redux/features/authSlice";
import LoadingSpinner from "../../components/user/common/ui/LoadingSpinner"

const ProtectedRoute = () => {
    const token = useSelector((state) => state.auth.accessToken);
    const user = useSelector((state) => state.auth.user);
    const status = useSelector((state) => state.auth.status);

    const navigate = useNavigate()
    const dispatch = useDispatch()

    useEffect(() => {
        console.log('user:', user);
        if (token && !user && status === 'idle') {
            // If user not available Dispatch action to fetch user details
            dispatch(fetchUserDetails())
                .catch(() => {
                    // If fetching user details fails, logout the user and navigate to login page
                    navigate('/logout');
                });
        } else if (status === 'failed') {
            // If the status is already failed, logout the user and navigate to login page
            navigate('/logout');
        }
    }, [token, user, status, dispatch, navigate]);

    // fallback ui for loading
    if (status === 'loading') {
        return <LoadingSpinner />;
    }

    return token ? (
        <UserAuthenticatedLayout>
            <Outlet />
        </UserAuthenticatedLayout>
    ) : (
        <Navigate to="/login" />
    );
};

export default ProtectedRoute;
