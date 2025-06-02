import { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../services/api/axiosInterceptor';
import useUser from '../../../hooks/useUser'
import handleError from '../../../utils/handleError';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

function CommunityVideoCall() {
    const [roomId, setRoomId] = useState('');
    const [loading, setLoading] = useState(true);
    const containerRef = useRef(null);
    const zpRef = useRef(null);
    const location = useLocation();
    const user = useUser();
    const navigate = useNavigate();

    const initZego = async () => {
        try {
            const sessionId = new URLSearchParams(location.search).get('session_id');
            if (!sessionId) throw new Error('Session ID not provided');

            const response = await api.post('courses/video-session/get-session-token/', {
                session_id: sessionId,
            });

            const { token, app_id, room_id, user_id } = response.data;
            const user_name = `${user.first_name} ${user.last_name}`;
            setRoomId(room_id);

            if (!zpRef.current) {
                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                    Number(app_id),
                    token,
                    room_id,
                    user_id,
                    user_name
                );

                zpRef.current = ZegoUIKitPrebuilt.create(kitToken);

                zpRef.current.joinRoom({
                    container: containerRef.current,
                    scenario: {
                        mode: ZegoUIKitPrebuilt.GroupCall, // GROUP CALL
                    },
                    sharedLinks: [
                        {
                            name: 'Community Link',
                            url: `${window.location.protocol}//${window.location.host}${window.location.pathname}?session_id=${sessionId}`,
                        },
                    ],
                    turnOnMicrophoneWhenJoining: false,
                    turnOnCameraWhenJoining: false,
                    showMyCameraToggleButton: true,
                    showMyMicrophoneToggleButton: true,
                    showAudioVideoSettingsButton: true,
                    showScreenSharingButton: true,
                    showTextChat: true,
                    showUserList: true,
                    maxUsers: 50, // ✅ Increased for community
                    layout: 'Auto',
                    showLayoutButton: true,
                    showPreJoinView: true,
                });
            }
        } catch (error) {
            console.error('Error initializing ZEGOCLOUD:', error);
            handleError(error, 'Error fetching session token');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initZego();

        return () => {
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
                window.location.reload(); // Optional: only if needed
            }
        };
    }, [location]);

    if (loading) return <div><LoadingSpinner /></div>;

    return (
        <div>
            <h2>Community Video Call - Room: {roomId}</h2>
            <div ref={containerRef} className="w-full h-full"></div>
        </div>
    );
}

export default CommunityVideoCall;
