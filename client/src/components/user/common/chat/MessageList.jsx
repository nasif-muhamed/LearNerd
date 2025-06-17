import { useEffect, useRef } from 'react';
import { Check, CheckCheck, Loader } from 'lucide-react';
import useUser from '../../../../hooks/useUser'
import chatTime from '../../../../utils/chatTime';
import TypingIndicator from '../../../ui/TypingIndicator';
import RoundedImage from '../../../ui/RoundedImage';

const MessageList = ({ messages, loading, activeTyper, activeTab }) => {
    const messageEndRef = useRef(null);
    const user = useUser()
    const userId = user?.id
    const BASE_URL = import.meta.env.VITE_BASE_URL;
    console.log('activeTyper +++++++++:', activeTyper)
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <>
            {loading ? (
                <div className='w-full h-full flex items-center justify-center'>
                    <Loader className="animate-spin" />
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div 
                            key={msg.id} 
                            className={`flex ${msg.sender?.user_id == userId? 'justify-end' : 'justify-start'}`}
                        >
                            {activeTab === 'community' && msg.sender?.user_id !== user?.id &&
                                (
                                    <div className='mr-2'>
                                        <RoundedImage
                                            style={`w-10 h-10 bg-primary/20`}
                                            source={`${BASE_URL}${msg.sender?.image}`} 
                                            alternative={msg.sender?.full_name}
                                            userName={msg.sender?.full_name}
                                        />
                                    </div>
                                )
                            }
                            <div className={`max-w-[75%] ${msg.sender?.user_id == userId ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'} rounded-2xl px-4 py-2`}>
                            {!msg.sender?.user_id == userId && (
                                <div className="font-medium text-xs mb-1">{msg.sender.full_name}</div>
                            )}
                                <p>{msg.content}</p>
                                <div className="text-xs opacity-70 text-right mt-1 flex items-center justify-end gap-1">
                                    {chatTime(msg.timestamp)}
                                    {activeTab !== 'community' && msg.sender?.user_id === userId && (
                                        msg.is_read === 'no' ? 
                                            <Check size={14} /> 
                                            : <CheckCheck size={14} />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {activeTyper && activeTyper.is_typing && activeTyper.user.user_id !== user?.id && (
                        <div className='flex'>
                            {activeTab === 'community' && activeTyper.user?.user_id !== user?.id &&
                                (
                                    <div className='mr-2'>
                                        <RoundedImage
                                            style={`w-10 h-10 bg-primary/20`}
                                            source={`${BASE_URL}${activeTyper.user?.image}`} 
                                            alternative={activeTyper.user?.full_name}
                                            userName={activeTyper.user?.full_name}
                                        />
                                    </div>
                                )
                            }

                            <TypingIndicator />
                        </div>
                    )}

                    <div ref={messageEndRef} />
                </div>
            )}
        </>
    );
};

export default MessageList;