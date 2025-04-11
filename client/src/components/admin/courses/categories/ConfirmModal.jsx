import { ShieldCheck, ShieldBan, X, AlertTriangle } from "lucide-react";

const ConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-yellow-500 flex items-center">
                    <AlertTriangle size={24} className="mr-2" />
                    Confirm Status Change
                </h2>
                <button onClick={() => setIsConfirmModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>
            
            <div className="mb-6">
                <p className="text-gray-300">
                    {formData.is_active 
                        ? `Are you sure you want to activate "${selectedCategory?.title}"? This will make it visible to users.` 
                        : `Are you sure you want to deactivate "${selectedCategory?.title}"? This will hide it from users.`
                    }
                </p>
            </div>
            
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="bg-gray-700 text-white py-2 px-4 rounded-lg mr-2 hover:bg-gray-600"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSubmitEdit}
                    className={`text-white py-2 px-4 rounded-lg flex items-center ${
                        formData.is_active ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                    {formData.is_active ? <ShieldCheck size={18} className="mr-1" /> : <ShieldBan size={18} className="mr-1" />}
                    Confirm
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmModal;