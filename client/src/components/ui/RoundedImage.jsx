import { UserRound } from 'lucide-react'

const RoundedImage = ({style, source, alternative, userIcon, userName}) => {
    return (
        <div className={`${style} rounded-full flex items-center justify-center`}>
            {(source && alternative) ? (
                <img src={source} alt={alternative} className="w-full h-full rounded-full object-cover" />
            ) : (
                <>
                    {
                        userIcon ? (
                            <UserRound />
                        ) : userName && (
                            <div >
                                <span className="text-lg font-medium">{userName.charAt(0)}</span>
                            </div>
                        )
                    }
                </>
            )}
        </div>
    )
}

export default RoundedImage