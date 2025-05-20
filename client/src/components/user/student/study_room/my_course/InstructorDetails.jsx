import { Link } from "react-router-dom"

const InstructorDetails = ({course}) => {

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
            <Link to={`/student/tutors/${course?.instructor}`} className="btn-outline w-full">
                View Profile
            </Link>
        </div>
    )
}

export default InstructorDetails