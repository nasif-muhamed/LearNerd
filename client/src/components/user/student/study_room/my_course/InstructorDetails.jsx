import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import handleError from "../../../../../utils/handleError"
import api from "../../../../../services/api/axiosInterceptor"
import { Loader } from 'lucide-react';

const InstructorDetails = ({course, purchase_type}) => {
    const [chatButtonLoading, setChatButtonLoading] = useState(false);
    const navigate = useNavigate();

    const handleChatClick = async () => {
        try {
            setChatButtonLoading(true)
            const response = await api.get(`chats/one-one-room/${course?.instructor_details?.id}/`)
            console.log('chat with tutor res:', response)
            navigate('/chats', {
                state: { roomId: response.data.room_id },
            });


        } catch (err) {
            console.log('chat with tutor err:', err)
            handleError(err, 'error fetching chat room')
        } finally {
            setChatButtonLoading(false)
        }
    }

    return (
        <div className="bg-card rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
                Instructor
            </h2>
            <div className="flex items-center mb-4">
                <div className="w-16 h-16 mr-4 rounded-full overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all">
                    <img
                        src={course?.instructor_details?.image}
                        alt={course?.instructor_details?.email}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <p className="font-bold">
                        {course?.instructor_details?.first_name + " " + course?.instructor_details?.last_name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                        {course?.instructor_details?.email}
                    </p>
                </div>
            </div>
            <p className="text-sm mb-4">
                {course?.instructor_details?.biography}                         
            </p>
            <div className="flex gap-2">
                <Link to={`/student/tutors/${course?.instructor}`} className="btn-outline w-full text-center">
                    View Profile
                </Link>

                {purchase_type === 'subscription' &&
                   ( chatButtonLoading ? (
                        <button className="btn-primary w-full text-center flex gap-2 items-center justify-center">
                            <Loader className="animate-spin"/> Chat
                        </button>
                    ) : (

                        <button onClick={handleChatClick} className="btn-primary w-full text-center">
                            Chat
                        </button>
                    ))
                }
            </div>
        </div>
    )
}

export default InstructorDetails