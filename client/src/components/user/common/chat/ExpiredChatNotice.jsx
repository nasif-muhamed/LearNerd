import { AlertTriangle, Lock } from 'lucide-react';

const ExpiredChatNotice = ({ expiryDate }) => {
    const formattedDate = new Date(expiryDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
  
    return (
        <div className="border-t border-border p-4">
            <div className="glass-effect rounded-lg p-4 mb-1">
                <div className="flex items-center gap-3 mb-2">
                    <div className="transaction-icon bg-warning/20 text-warning">
                        <Lock size={18} />
                    </div>
                    <h3 className="font-medium">This conversation has expired</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                This chat expired on {formattedDate} and is now in read-only mode.
                </p>
                {/* <div className="flex justify-end">
                    <button className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        Report an issue
                    </button>
                </div> */}
            </div>
        </div>
    );
};

export default ExpiredChatNotice