import { X, Save } from "lucide-react";


const EditCategoryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Category</h2>
                <button onClick={closeModals} className="text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>
            
            <form onSubmit={openConfirmModal}>
                <div className="mb-4">
                    <label className="block text-gray-400 mb-1">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-4"
                        required
                    />
                </div>
                
                <div className="mb-4">
                    <label className="block text-gray-400 mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-4 min-h-20"
                    />
                </div>
                
                <div className="mb-4">
                    <label className="block text-gray-400 mb-1">Image URL</label>
                    <input
                        type="text"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-4"
                    />
                </div>
                
                <div className="mb-6">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            className="mr-2"
                        />
                        <span className="text-gray-400">Active</span>
                    </label>
                </div>
                
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={closeModals}
                        className="bg-gray-700 text-white py-2 px-4 rounded-lg mr-2 hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center hover:bg-blue-700"
                        disabled={loading}
                    >
                        <Save size={18} className="mr-1" />
                        Update
                    </button>
                </div>
            </form>
        </div>
    </div>
);

export default EditCategoryModal;
