import { Users } from 'lucide-react';
import formatTimeAgo from '../../../../utils/formatTimeAgo';
import RoundedImage from '../../../ui/RoundedImage';

const ChatItem = ({ selectedDefault, chat, unReadMessages, isSelected, onSelect, isCommunity }) => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    // const isOnline = chat.online_user_ids && chat.online_user_ids.length > 0;
    // const onlineUsersCount = chat.online_user_ids ? chat.online_user_ids.length : 0;
    console.log('selectedDefault:', selectedDefault)
    if (selectedDefault){
        onSelect()
    }

    return (
        <div 
            className={`p-4 flex items-center gap-3 hover:bg-muted/30 cursor-pointer transition-colors ${isSelected ? 'bg-muted/50' : ''}`}
            onClick={onSelect}
        >
            {/* <div className={`w-12 h-12 relative rounded-full ${isCommunity ? 'bg-accent/20' : 'bg-primary/20'} flex items-center justify-center`}>
                {(chat.room_type == "group" && chat.image) || (chat.room_type == "one-to-one" && chat.participants.image) ? (
                    <img src={`${BASE_URL}${chat.room_type == "group" ? chat.image : chat.participants.image}`} alt={chat.room_type == "group" ? chat.name : chat.participants.full_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                    <div >
                        <span className="text-lg font-medium">{chat.room_type == "group" ? chat.name.charAt(0) : chat.participants.full_name.charAt(0)}</span>
                    </div>
                )}
                {unReadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full px-1.5 py-0.5 flex items-center justify-center">
                        {unReadMessages}
                    </span>
                )}


            </div> */}
                {/* to show live online status. Need another WS connection with another route monitoring user's entire chat rooms instead of just one. */}
                {/* {chat.room_type === "one-to-one" && (
                    <div className="absolute bottom-0 right-0">
                        <div className={`w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                )} */}
            <div className='relative'>
                <RoundedImage
                    style={`w-10 h-10 bg-primary/20`}
                    source={chat.image || chat.participants?.image ? `${chat.room_type === "group" ? '' : BASE_URL}${chat.room_type === "group" ? chat.image : chat.participants.image}`: null} 
                    alternative={chat.room_type === "group" ? chat.name : chat.participants.full_name}
                    userName={chat.room_type === "group" ? chat.name : chat.participants.full_name}
                />
                {unReadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full px-1.5 py-0.5 flex items-center justify-center">
                        {unReadMessages}
                    </span>
                )}

            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <h3 className="flex-1 font-medium truncate">{chat.room_type == "group" ? chat.name : chat.participants.full_name}</h3>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(chat.updated_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground truncate">{chat.last_message? chat.last_message.content : "start a new chat"}</p>
                    
                    {isCommunity && chat.room_type == "group" &&(
                        <span className="text-xs bg-muted rounded-full px-2 py-0.5 flex items-center">
                            <Users size={12} className="mr-1" />
                            {chat.participants.length}
                        </span>
                    )}

                    {/* to show live online status. Need another WS connection with another route monitoring user's entire chat rooms instead of just one. */}
                    {/* {chat.room_type === "one-to-one" ? (
                        <span className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-400'} px-2 py-0.5`}>
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xs bg-muted rounded-full px-2 py-0.5 flex items-center">
                                <Users size={12} className="mr-1" />
                                {chat.members}
                            </span>
                            {onlineUsersCount > 0 && (
                                <span className="text-xs text-green-500 px-2 py-0.5">
                                    {onlineUsersCount} online
                                </span>
                            )}
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
};

export default ChatItem;
