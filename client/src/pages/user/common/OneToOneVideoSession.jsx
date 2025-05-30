import { useEffect, useRef, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../services/api/axiosInterceptor';
import useUser from '../../../hooks/useUser'
import handleError from '../../../utils/handleError';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

function VideoCall() {
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const zpRef = useRef(null); // Store Zego instance
  const location = useLocation();
  const user = useUser()
  const navigate = useNavigate();

  const initZego = async () => {
    try {
      const sessionId = new URLSearchParams(location.search).get("session_id");
      if (!sessionId) throw new Error("Session ID not provided");
      const response = await api.post(`courses/video-session/get-session-token/`, {session_id: sessionId});
      const { token, app_id, room_id, user_id } = response.data;
      const user_name = user.first_name + " " + user.last_name
      console.log('token:', token, app_id, room_id, user_id, user_name)
      setRoomId(room_id);

      // Initialize ZEGOCLOUD UIKit
      if (!zpRef.current) {
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction( 
          // we can use generateKitTokenForTest for test only, with backend token generation we have to use the generateKitTokenForProduction
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
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          sharedLinks: [
            {
              name: "Personal link",
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
          maxUsers: 2,
          layout: "Auto",
          showLayoutButton: false,
          showPreJoinView: false,
          // Add callback to handle when user leaves the room
          // onLeaveRoom: () => {
          //   console.log('User left the room, navigating back');
          //   // Clean up before navigating
          //   if (zpRef.current) {
          //     console.log('setTimeout: ', zpRef.current)
          //     zpRef.current.hangUp();
          //     zpRef.current.destroy();
          //     zpRef.current = null;
          //   }
          //   navigate(-1); // Go back to the previous page
          // },
          // // Alternative: You can also handle the hang up action specifically
          // hangUp: () => {
          //   console.log('Call hung up, navigating back');
          //   // Clean up before navigating
          //   setTimeout(() => {
          //     if (zpRef.current) {
          //       console.log('setTimeout: ', zpRef.current)
          //       zpRef.current.hangUp();
          //       zpRef.current.destroy();
          //       zpRef.current = null;
          //     }
          //     navigate(-1); // Go back to the previous page
          //   }, 100); // Small delay to allow cleanup
          // }
        });
      }
    } catch (error) {
      console.error("Error initializing ZEGOCLOUD:", error);
      handleError(error, 'Error fetching session token')
      navigate(-1); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initZego();

    return () => {
      console.log('hang up outside')
      if (zpRef.current) {
        console.log('hang up inside')
        zpRef.current.destroy();
        zpRef.current = null;
        window.location.reload()
      }
    };
  }, [location]);

  if (loading) return <div><LoadingSpinner/></div>;

  return (
    <div>
      <h2>Video Call - Room: {roomId}</h2>
      <div
        ref={containerRef}
        className='w-full h-full'
      >
      </div>
    </div>
  );
}

export default VideoCall;
