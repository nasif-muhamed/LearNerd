import ChatList from './ChatList'
import { Search, Users, UserCircle, ChevronLeft } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, selectedChat, setSelectedChat, isMobileSidebarOpen, setIsMobileSidebarOpen }) => {
  
    return (
        <div className={`${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0 transition-transform duration-300 w-full md:w-80 lg:w-96 
            border-r border-border bg-sidebar-background flex flex-col h-full 
            fixed md:relative z-20`}>

            <div className="flex items-center md:hidden justify-between p-4 border-b border-border">
                <h2 className="text-xl font-bold">Messages</h2>
                <button 
                className=" p-2 rounded-full hover:bg-muted"
                onClick={() => setIsMobileSidebarOpen(false)}
                >
                    <ChevronLeft size={20} />
                </button>
            </div>

            <div className="flex border-b border-border">
                <button 
                className={`flex-1 py-3 font-medium ${activeTab === 'personal' ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('personal')}
                >
                <UserCircle size={18} className="inline mr-2" />
                Personal
                </button>
                <button 
                className={`flex-1 py-3 font-medium ${activeTab === 'community' ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('community')}
                >
                <Users size={18} className="inline mr-2" />
                Community
                </button>
            </div>

            {/* <div className="p-4">
                <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search chats..." 
                    className="w-full bg-muted rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-accent"
                />
                </div>
            </div> */}

            <ChatList
                activeTab={activeTab} 
                selectedChat={selectedChat} 
                setSelectedChat={setSelectedChat} 
                setIsMobileSidebarOpen={setIsMobileSidebarOpen} 
            />
        </div>
    );
};

export default Sidebar;