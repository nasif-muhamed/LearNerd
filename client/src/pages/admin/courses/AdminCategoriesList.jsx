import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpenText, BadgeCheck, ShieldCheck, ShieldBan, Plus, X, AlertTriangle } from "lucide-react";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import api from "../../../services/api/axiosInterceptor";



const CategoryList = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [prevPage, setPrevPage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const pageSize = 3; // Matches your backend response (3 items per page)

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [statusChangeAction, setStatusChangeAction] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`courses/categories`, {
                params: {
                    page: currentPage,
                    page_size: pageSize,
                    search: searchQuery,
                },
            });
            console.log(response);
            setCategories(response.data.results);
            setTotalCount(response.data.count);
            setNextPage(response.data.next);
            setPrevPage(response.data.previous);
        } catch (err) {
            console.log("err:", err);
            setError("Failed to fetch categories.");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery]);

    // Handle search input
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    // Open edit modal for a category
    const handleCategoryClick = (category) => {
        setCurrentCategory(category);
        setShowEditModal(true);
    };

    // Handle add new category button click
    const handleAddCategory = () => {
        setShowAddModal(true);
    };

    // Handle status change with confirmation
    const handleStatusChange = (category, newStatus) => {
        setCurrentCategory(category);
        setStatusChangeAction(newStatus);
        setShowConfirmModal(true);
    };

    // Create a new category
    const createCategory = async (categoryData) => {
        setLoading(true);
        try {
            await api.post('courses/categories/', categoryData);
            fetchCategories();
            setShowAddModal(false);
        } catch (err) {
            console.error("Failed to create category:", err);
            setError("Failed to create category");
        } finally {
            setLoading(false);
        }
    };

    // Update existing category
    const updateCategory = async (categoryData) => {
        setLoading(true);
        try {
            await api.put(`courses/categories/${categoryData.id}/`, categoryData);
            fetchCategories();
            setShowEditModal(false);
        } catch (err) {
            console.error("Failed to update category:", err);
            setError("Failed to update category");
        } finally {
            setLoading(false);
        }
    };

    // Confirm and process status change
    const confirmStatusChange = async () => {
        if (!currentCategory || statusChangeAction === null) return;
        
        setLoading(true);
        try {
            await api.patch(`courses/categories/${currentCategory.id}/`, {
                is_active: statusChangeAction
            });
            fetchCategories();
            setShowConfirmModal(false);
        } catch (err) {
            console.error("Failed to update status:", err);
            setError("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return (
        <div className="bg-gray-900 text-white min-h-screen p-6">
            {loading && <LoadingSpinner/>}

            <div className="max-w-6xl mx-auto">
                {/* Search and Add Button */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-2 px-4 pl-10"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        <svg
                            className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            ></path>
                        </svg>
                    </div>
                    
                    <button 
                        className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300 text-white px-4 py-2 rounded-lg flex items-center"
                        onClick={handleAddCategory}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Category
                    </button>
                </div>

                {/* Categories Grid */}
                {error ? (
                    <div className="text-red-500 text-center">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className="flex items-center hover:bg-gray-800 rounded-lg p-4 cursor-pointer overflow-hidden transition-all duration-300 border border-gray-700"
                                onClick={() => handleCategoryClick(cat)}
                            >
                                <div className="w-16 h-16 overflow-hidden mr-4 bg-slate-800 border-2 border-slate-700 rounded-md">
                                    {cat.image ? (
                                        <img
                                            src={cat.image}
                                            alt={cat.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpenText className="w-full h-full p-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex h-full flex-col items-start">
                                    <h3 className="font-bold text-lg flex items-center mt-0">
                                        {cat.title}  
                                            
                                        <span className="ml-2">
                                        {cat.is_active ?
                                            <ShieldCheck className="text-green-700 w-4 h-4" />
                                            :
                                            <ShieldBan className="text-red-700 w-4 h-4" />
                                        }
                                        </span>
                                        
                                    </h3>
                                    <p className="text-sm text-gray-400 truncate text-wrap line-clamp-2">
                                        {cat.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                        <div className="flex items-center gap-2 transition-all duration-300 ease-in-out">
                            {totalPages > 3 && (
                                <button
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    disabled={!prevPage}
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15 19l-7-7 7-7"
                                        ></path>
                                    </svg>
                                </button>
                            )}

                            <div className="flex gap-2">
                                {(() => {
                                    const getPageNumbers = () => {
                                        if (totalPages <= 3) {
                                            return Array.from(
                                                { length: totalPages },
                                                (_, i) => i + 1
                                            );
                                        }
                                        let startPage = Math.max(
                                            1,
                                            currentPage - 1
                                        );
                                        let endPage = Math.min(
                                            totalPages,
                                            currentPage + 1
                                        );
                                        if (currentPage === 1) {
                                            endPage = 3;
                                        } else if (currentPage === totalPages) {
                                            startPage = totalPages - 2;
                                        }
                                        return Array.from(
                                            { length: endPage - startPage + 1 },
                                            (_, i) => startPage + i
                                        );
                                    };
                                    return getPageNumbers().map((page) => (
                                        <button
                                            key={page}
                                            onClick={() =>
                                                handlePageChange(page)
                                            }
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${
                                                currentPage === page
                                                    ? "bg-blue-600 text-white scale-110"
                                                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:scale-105"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ));
                                })()}
                            </div>

                            {totalPages > 3 && (
                                <button
                                    className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50"
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
                                    disabled={!nextPage}
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 5l7 7-7 7"
                                        ></path>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Category Modal */}
            {showAddModal && (
                <CategoryModal 
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSubmit={createCategory}
                    title="Add New Category"
                    buttonText="Create Category"
                    initialData={{ title: "", description: "", image: "", is_active: true }}
                    isEdit={false}
                />
            )}

            {/* Edit Category Modal */}
            {showEditModal && currentCategory && (
                <CategoryModal 
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSubmit={updateCategory}
                    title="Edit Category"
                    buttonText="Update Category"
                    initialData={currentCategory}
                    isEdit={true}
                    onStatusChange={(newStatus) => handleStatusChange(currentCategory, newStatus)}
                />
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && currentCategory && (
                <ConfirmationModal 
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmStatusChange}
                    title={`${statusChangeAction ? 'Activate' : 'Deactivate'} Category`}
                    message={`Are you sure you want to ${statusChangeAction ? 'activate' : 'deactivate'} "${currentCategory.title}" category?`}
                    confirmButtonText={statusChangeAction ? 'Activate' : 'Deactivate'}
                    confirmButtonClass={statusChangeAction ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                />
            )}
        </div>
    );
};

export default CategoryList;




const CategoryModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  buttonText, 
  initialData, 
  isEdit,
  onStatusChange 
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Reset form data when modal opens or initial data changes
    setFormData(initialData);
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleStatusToggle = () => {
    if (isEdit && onStatusChange) {
      // For edit mode, we use the confirmation modal flow
      onStatusChange(!formData.is_active);
    } else {
      // For add mode, we just toggle the value
      setFormData({
        ...formData,
        is_active: !formData.is_active
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-xl font-bold mb-6 text-white">{title}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full bg-gray-700 text-white border ${
                errors.title ? 'border-red-500' : 'border-gray-600'
              } rounded-lg p-2`}
              placeholder="Category title"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`w-full bg-gray-700 text-white border ${
                errors.description ? 'border-red-500' : 'border-gray-600'
              } rounded-lg p-2 min-h-24`}
              placeholder="Category description"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Image URL</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-gray-400 text-xs mt-1">Leave empty for default icon</p>
          </div>
          
          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={isEdit ? null : handleChange}
                  onClick={isEdit ? handleStatusToggle : null}
                />
                <div className={`block w-14 h-8 rounded-full ${formData.is_active ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${formData.is_active ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <div className="ml-3 text-gray-300">
                {formData.is_active ? 'Active' : 'Inactive'}
              </div>
            </label>
            {isEdit && (
              <p className="text-gray-400 text-xs mt-1">
                Click to {formData.is_active ? 'deactivate' : 'activate'} this category
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from "react";

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmButtonText = "Confirm",
  confirmButtonClass = "bg-red-600 hover:bg-red-700" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center mb-4 text-amber-500">
          <AlertTriangle className="w-8 h-8 mr-3" />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 ${confirmButtonClass} text-white rounded-lg transition-colors`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

