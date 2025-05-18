import { Users, MoreVertical } from 'lucide-react';
import formatExpiryMessage from '../../../../utils/dateExpiresWithin'
import RoundedImage from '../../../ui/RoundedImage';

const ChatHeader = ({ selectedChat, activeTab }) => {
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    console.log('selectedChat:', selectedChat)
    const onlineUsersCount = selectedChat.online_user_count ? (selectedChat.online_user_count) - 1 : 0;

    return (
        <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
                {/* {(selectedChat.room_type === "group" && selectedChat.image) || (selectedChat.room_type === "one-to-one" && selectedChat.participants.image) ? (
                    <img src={`${BASE_URL}${selectedChat.room_type === "group" ? selectedChat.image : selectedChat.participants.image}`} alt={selectedChat.room_type === "group" ? selectedChat.name : selectedChat.participants.full_name} className="w-10 h-10 rounded-full" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-md font-medium">{selectedChat.room_type === "group" ? selectedChat.name.charAt(0) : selectedChat.participants.full_name.charAt(0)}</span>
                    </div>
                )} */}

                <RoundedImage 
                    style={`w-10 h-10 bg-primary/20`}
                    source={`${selectedChat.room_type === "group" ? '' : BASE_URL}${selectedChat.room_type === "group" ? selectedChat.image : selectedChat.participants.image}`} 
                    alternative={selectedChat.room_type === "group" ? selectedChat.name : selectedChat.participants.full_name}
                    userName={selectedChat.room_type === "group" ? selectedChat.name : selectedChat.participants.full_name}
                />

                <div>
                    <h3 className="font-medium">{selectedChat.room_type === "group" ? selectedChat.name : selectedChat.participants.full_name}</h3>
                    {/* {activeTab === 'community' && selectedChat.room_type === "group" && (
                        <p className="text-xs text-muted-foreground flex items-center">
                            <Users size={12} className="mr-1" />
                            {selectedChat.members} members
                        </p>
                    )} */}

                    {selectedChat.room_type === "one-to-one" && (
                        <p className={`text-xs ${onlineUsersCount > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                            {onlineUsersCount > 0 ? 'Online' : 'Offline'}
                        </p>
                    )}

                    
                    {/* Display member count and online count for group chats */}
                    {selectedChat.room_type === "group" && (
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground flex items-center">
                                <Users size={12} className="mr-1" />
                                {selectedChat.participants.length} members
                            </p>
                            {onlineUsersCount > 0 && (
                                <p className="text-xs text-green-500">
                                    • {onlineUsersCount} online
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* <button className="p-2 rounded-full hover:bg-muted">
                <MoreVertical size={20} />
            </button> */}

            {selectedChat.room_type === "one-to-one" && (<div>
                <p className="text-xs text-destrutive">
                    {formatExpiryMessage(selectedChat.expires_at)}
                </p>
            </div>)}
        </div>
    );
  };
  
export default ChatHeader;