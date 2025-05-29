import { useEffect, useState } from 'react';
import handleError from '../../../../utils/handleError'
import ChatItem from './ChatItem'
import api from '../../../../services/api/axiosInterceptor';
import adminUserApi from '../../../../services/api/adminUserAxiosInterceptor';
import { Loader } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { changeMessageCount } from '../../../../redux/features/authSlice';
import { useLocation, useNavigate } from 'react-router-dom';
import useRole from '../../../../hooks/useRole';



const ChatList = ({ activeTab, selectedChat, setSelectedChat, setIsMobileSidebarOpen }) => {
    const role = useRole()
    const [personalChats, setPersonalChats] = useState([]);
    const [communityChats, setCommunityChats] = useState([]);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(false);
    const unReadMessages = useSelector(state => state.auth.unReadMessages);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [currentRoomId, setCurrentRoomId] = useState(null);
    console.log('location.state:', location.state)

    useEffect(() => {
        if (location.state?.roomId) {
            setCurrentRoomId(location.state.roomId);
            // Clear the state after assigning
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, navigate, location.pathname]);

    const fetchChats = async () => {
        try{
            setLoading(true)
            const urlEnd = `chats/rooms/`

            let response;
            if (role === 'admin') response = await adminUserApi.get(urlEnd);
            else response = await api.get(urlEnd);
            const result = response.data;

            // dispatch redux slice for updating unreaded message count
            const unReadMessages = result.one_to_one.reduce((acc, chat) => {
                if (chat.un_read_messages > 0) {
                    acc[chat.id] = chat.un_read_messages;
                }
                return acc;
            }, {})
            console.log('unReadMessages:', unReadMessages)
            dispatch(changeMessageCount({actionType: 'add', unReadMessages}))

            setPersonalChats(result.one_to_one)
            setCommunityChats(result.group)
            console.log('chat list resp:', response)
        }catch (error){
            console.log('error fetching chat list:', error)
            handleError(error)
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchChats();
    }, [])

    useEffect(() => {
        if (activeTab === 'personal') {
            setChats(personalChats);
        } else if (activeTab === 'community') {
            setChats(communityChats);
        }
    }, [activeTab, personalChats, communityChats]);

    const onChatSelection = (chat) => {
        setSelectedChat(chat);
        setIsMobileSidebarOpen(false);
        dispatch(changeMessageCount({actionType: 'reset', roomId: chat.id}))
    }

    return (
        <>
            {loading ?
                (
                    <div className='w-full h-full flex items-center justify-center'>
                        <Loader className="w-8 h-8 animate-spin text-accent" />
                    </div>
                )
                :
                (
                    <div className="flex-1 overflow-y-auto">
                        {chats.map(chat => (
                            <ChatItem 
                                key={chat.id}
                                selectedDefault={(currentRoomId && chat.id === currentRoomId)}
                                unReadMessages = {unReadMessages[chat.id] || undefined}
                                chat={chat}
                                isSelected={selectedChat && selectedChat.id === chat.id}
                                onSelect={() => onChatSelection(chat)}
                                isCommunity={activeTab === 'community'}
                            />
                        ))}
                    </div>
                )
            }
        </>
    );
};

export default ChatList;