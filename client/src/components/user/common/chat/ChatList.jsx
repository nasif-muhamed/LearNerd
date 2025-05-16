import { useEffect, useState } from 'react';
import handleError from '../../../../utils/handleError'
import ChatItem from './ChatItem'
import api from '../../../../services/api/axiosInterceptor';
import { Loader } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { changeMessageCount } from '../../../../redux/features/authSlice';

// const mockPersonalChats = [
//     { id: 1, name: "Sarah Johnson", avatar: null, lastMessage: "Thanks for the help with the project!", time: "10:30 AM", unread: 2 },
//     { id: 2, name: "Michael Chen", avatar: null, lastMessage: "When is the next live session?", time: "Yesterday", unread: 0 },
//     { id: 3, name: "Alex Rodriguez", avatar: null, lastMessage: "I've submitted my assignment", time: "Yesterday", unread: 0 },
//     { id: 4, name: "Emily Williams", avatar: null, lastMessage: "Can you explain the concept again?", time: "Monday", unread: 1 },
// ];
  
// const mockCommunityChats = [
//     { id: 101, name: "Frontend Development", avatar: null, lastMessage: "Any tips for optimizing React performance?", time: "11:45 AM", unread: 5, members: 28 },
//     { id: 102, name: "Python Study Group", avatar: null, lastMessage: "Check out this new Django tutorial", time: "Yesterday", unread: 0, members: 42 },
//     { id: 103, name: "UI/UX Design", avatar: null, lastMessage: "What design tools do you recommend?", time: "Sunday", unread: 3, members: 19 },
// ];
    

const ChatList = ({ activeTab, selectedChat, setSelectedChat, setIsMobileSidebarOpen }) => {
    // const chats = activeTab === 'personal' ? mockPersonalChats : mockCommunityChats;
    const [personalChats, setPersonalChats] = useState([]);
    const [communityChats, setCommunityChats] = useState([]);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(false);
    const unReadMessages = useSelector(state => state.auth.unReadMessages);
    const dispatch = useDispatch();

    const fetchChats = async () => {
        try{
            setLoading(true)
            const response = await api.get(`chats/rooms/`);
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