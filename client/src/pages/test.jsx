import React, { useState } from 'react';

const ImageModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  // Handle file upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        setIsOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsOpen(false);
    setImageSrc(null);
  };

  return (
    <div className="p-4">
      {/* File Input Button */}
      <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
        Upload Image
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Image Preview</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Image Container */}
            <div className="w-56 h-56 flex items-center justify-center overflow-hidden">
              <img
                src={imageSrc}
                alt="Uploaded"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Modal Footer */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageModal;