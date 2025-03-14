// CourseCreationPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Component imports
import BasicCourseForm from './components/BasicCourseForm';
import SectionForm from './components/SectionForm';
import SectionItemForm from './components/SectionItemForm';
import ReviewForm from './components/ReviewForm';
import StepProgress from './components/StepProgress';

const CourseCreationPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState({
    category: '',
    title: '',
    description: '',
    thumbnail: null,
    freemium: true,
    subscription: true,
    subscription_amount: '',
    video_session: 1,
    chat_upto: 7,
    safe_period: 14,
    is_available: false,
    objectives: [{ objective: '', order: 0 }],
    requirements: [{ requirement: '', order: 0 }],
  });

  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState(null);
  const [currentSectionItem, setCurrentSectionItem] = useState(null);
  const [categories, setCategories] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories/');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Handle basic course form submission
  const handleBasicCourseSubmit = async (data) => {
    setLoading(true);
    try {
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Append all form data
      Object.keys(data).forEach(key => {
        if (key === 'thumbnail') {
          if (data[key]) formData.append(key, data[key]);
        } else if (key === 'objectives' || key === 'requirements') {
          // Don't append these yet
        } else {
          formData.append(key, data[key]);
        }
      });

      // Save course data
      const response = await axios.post('/api/courses/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update course data with response and ID
      setCourseData({
        ...data,
        id: response.data.id,
      });

      // Save objectives
      await Promise.all(data.objectives.map((obj, index) => 
        axios.post('/api/learning-objectives/', {
          course: response.data.id,
          objective: obj.objective,
          order: index,
        })
      ));

      // Save requirements
      await Promise.all(data.requirements.map((req, index) => 
        axios.post('/api/course-requirements/', {
          course: response.data.id,
          requirement: req.requirement,
          order: index,
        })
      ));

      setCurrentStep(2);
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle section form submission
  const handleSectionSubmit = async (sectionData) => {
    setLoading(true);
    try {
      // If editing an existing section
      if (sectionData.id) {
        await axios.put(`/api/sections/${sectionData.id}/`, {
          course: courseData.id,
          title: sectionData.title,
          order: sectionData.order,
        });
        
        // Update sections state
        setSections(prev => prev.map(section => 
          section.id === sectionData.id ? sectionData : section
        ));
      } else {
        // Create new section
        const response = await axios.post('/api/sections/', {
          course: courseData.id,
          title: sectionData.title,
          order: sections.length,
        });
        
        // Add new section to state
        setSections([...sections, { ...response.data, items: [] }]);
      }
      
      // Move to section items if a section is selected
      if (currentSection) {
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle section item submission
  const handleSectionItemSubmit = async (itemData) => {
    setLoading(true);
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('section', currentSection.id);
      formData.append('title', itemData.title);
      formData.append('order', itemData.order || 0);
      formData.append('item_type', itemData.item_type);

      // Create section item
      const itemResponse = await axios.post('/api/section-items/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const sectionItemId = itemResponse.data.id;

      // Handle video upload
      if (itemData.item_type === 'video') {
        const videoFormData = new FormData();
        videoFormData.append('section_item', sectionItemId);
        if (itemData.video_url) videoFormData.append('video_file', itemData.video_url);
        if (itemData.thumbnail) videoFormData.append('thumbnail_file', itemData.thumbnail);
        videoFormData.append('duration', itemData.duration || 0);

        await axios.post('/api/videos/', videoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Handle assessment creation
      if (itemData.item_type === 'assessment') {
        const assessmentResponse = await axios.post('/api/assessments/', {
          section_item: sectionItemId,
          instructions: itemData.instructions,
          passing_score: itemData.passing_score || 70,
        });

        const assessmentId = assessmentResponse.data.id;

        // Create questions and choices
        await Promise.all(itemData.questions.map(async (question, qIndex) => {
          const questionResponse = await axios.post('/api/questions/', {
            assessment: assessmentId,
            text: question.text,
            order: qIndex,
          });

          await Promise.all(question.choices.map(choice => 
            axios.post('/api/choices/', {
              question: questionResponse.data.id,
              text: choice.text,
              is_correct: choice.is_correct,
            })
          ));
        }));
      }

      // Upload supporting documents if any
      if (itemData.documents && itemData.documents.length > 0) {
        await Promise.all(itemData.documents.map(doc => {
          const docFormData = new FormData();
          docFormData.append('section_item', sectionItemId);
          docFormData.append('title', doc.title);
          docFormData.append('file', doc.file);
          
          return axios.post('/api/supporting-documents/', docFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }));
      }

      // Update sections state
      setSections(prev => {
        return prev.map(section => {
          if (section.id === currentSection.id) {
            return {
              ...section,
              items: [...(section.items || []), itemResponse.data]
            };
          }
          return section;
        });
      });

      // Clear current section item
      setCurrentSectionItem(null);
      
      // Ask if user wants to add another item or move to next section
      if (window.confirm('Item saved! Add another item to this section?')) {
        // Stay on the same step but clear form
        setCurrentSectionItem(null);
      } else {
        // Go back to sections step
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Error saving section item:', error);
      alert('Failed to save section item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Final submit to make course available
  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      await axios.patch(`/api/courses/${courseData.id}/`, {
        is_available: true,
      });
      
      alert('Course has been published successfully!');
      navigate('/instructor/courses');
    } catch (error) {
      console.error('Error publishing course:', error);
      alert('Failed to publish course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicCourseForm 
            initialData={courseData} 
            onSubmit={handleBasicCourseSubmit}
            loading={loading}
            categories={categories}
          />
        );
      case 2:
        return (
          <SectionForm 
            sections={sections} 
            onSubmit={handleSectionSubmit}
            onEditSection={section => setCurrentSection(section)}
            onAddItem={section => {
              setCurrentSection(section);
              setCurrentStep(3);
            }}
            onContinue={() => setCurrentStep(4)}
            loading={loading}
          />
        );
      case 3:
        return (
          <SectionItemForm 
            section={currentSection}
            item={currentSectionItem}
            onSubmit={handleSectionItemSubmit}
            onBack={() => setCurrentStep(2)}
            loading={loading}
          />
        );
      case 4:
        return (
          <ReviewForm 
            courseData={courseData}
            sections={sections}
            onSubmit={handleFinalSubmit}
            onBack={() => setCurrentStep(2)}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-100 sm:text-4xl">
            Create a New Course
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-300">
            Share your knowledge and expertise with your students
          </p>
        </div>

        <StepProgress currentStep={currentStep} />

        <div className="mt-10 bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default CourseCreationPage;

// components/StepProgress.jsx
import React from 'react';

const StepProgress = ({ currentStep }) => {
  const steps = [
    { id: 1, name: 'Course Details' },
    { id: 2, name: 'Sections' },
    { id: 3, name: 'Content' },
    { id: 4, name: 'Review & Publish' },
  ];

  return (
    <div className="py-4">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step circle */}
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
              ${currentStep >= step.id 
                ? 'border-indigo-500 bg-indigo-600 text-white' 
                : 'border-gray-600 bg-gray-700 text-gray-400'
              }`}
            >
              {currentStep > step.id ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                step.id
              )}
            </div>
            
            {/* Step name */}
            <div className={`ml-2 ${index < steps.length - 1 ? 'mr-8' : ''}`}>
              <p 
                className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-indigo-300' : 'text-gray-400'
                }`}
              >
                {step.name}
              </p>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div 
                className={`flex-1 h-0.5 ${
                  currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-700'
                } mx-2`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// components/BasicCourseForm.jsx
import React, { useState } from 'react';

const BasicCourseForm = ({ initialData, onSubmit, loading, categories }) => {
  const [formData, setFormData] = useState(initialData || {
    category: '',
    title: '',
    description: '',
    thumbnail: null,
    freemium: true,
    subscription: true,
    subscription_amount: '',
    video_session: 1,
    chat_upto: 7,
    safe_period: 14,
    objectives: [{ objective: '', order: 0 }],
    requirements: [{ requirement: '', order: 0 }],
  });
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setFormData({
        ...formData,
        [name]: files[0],
      });
      
      // Create preview for thumbnail
      if (name === 'thumbnail' && files[0]) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setThumbnailPreview(reader.result);
        };
        reader.readAsDataURL(files[0]);
      }
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
// components/BasicCourseForm.jsx (continued)
});
} else {
  setFormData({
    ...formData,
    [name]: value,
  });
}

// Update subscription amount field based on subscription toggle
if (name === 'subscription' && !checked) {
  setFormData(prev => ({
    ...prev,
    subscription_amount: '',
  }));
}
};

// Handle objectives and requirements
const handleArrayItemChange = (e, index, arrayName) => {
const { value } = e.target;
const updatedArray = [...formData[arrayName]];
updatedArray[index] = { 
  ...updatedArray[index],
  [arrayName === 'objectives' ? 'objective' : 'requirement']: value 
};

setFormData({
  ...formData,
  [arrayName]: updatedArray,
});
};

const addArrayItem = (arrayName) => {
setFormData({
  ...formData,
  [arrayName]: [
    ...formData[arrayName],
    { 
      [arrayName === 'objectives' ? 'objective' : 'requirement']: '',
      order: formData[arrayName].length
    }
  ],
});
};

const removeArrayItem = (index, arrayName) => {
const updatedArray = [...formData[arrayName]];
updatedArray.splice(index, 1);

// Update orders after removal
const reorderedArray = updatedArray.map((item, idx) => ({
  ...item,
  order: idx,
}));

setFormData({
  ...formData,
  [arrayName]: reorderedArray,
});
};

const handleSubmit = (e) => {
e.preventDefault();
onSubmit(formData);
};

return (
<form onSubmit={handleSubmit} className="p-6 space-y-8">
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-gray-100">Basic Course Information</h2>
    
    {/* Title & Category */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300">
          Course Title*
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g. Complete Web Development Bootcamp"
        />
      </div>
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-300">
          Category*
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
      </div>
    </div>
    
    {/* Description */}
    <div>
      <label htmlFor="description" className="block text-sm font-medium text-gray-300">
        Course Description*
      </label>
      <textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        required
        rows={4}
        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Describe what students will learn in this course..."
      />
    </div>
    
    {/* Thumbnail */}
    <div>
      <label className="block text-sm font-medium text-gray-300">
        Course Thumbnail
      </label>
      <div className="mt-1 flex items-center">
        <div className="flex-shrink-0 h-32 w-40 overflow-hidden rounded-md bg-gray-700 border border-dashed border-gray-600">
          {thumbnailPreview ? (
            <img 
              src={thumbnailPreview} 
              alt="Thumbnail preview" 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              <span>No image</span>
            </div>
          )}
        </div>
        <div className="ml-4">
          <label
            htmlFor="thumbnail"
            className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          >
            Upload
            <input
              id="thumbnail"
              name="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="sr-only"
            />
          </label>
          <p className="mt-2 text-xs text-gray-400">
            Recommended size: 1280x720px (16:9)
          </p>
        </div>
      </div>
    </div>
    
    {/* Pricing */}
    <div className="bg-gray-750 rounded-lg p-4 space-y-4">
      <h3 className="font-medium text-gray-200">Pricing Options</h3>
      
      <div className="flex items-center">
        <input
          id="freemium"
          name="freemium"
          type="checkbox"
          checked={formData.freemium}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded bg-gray-700"
        />
        <label htmlFor="freemium" className="ml-2 block text-sm text-gray-300">
          Free preview available
        </label>
      </div>
      
      <div className="flex items-center">
        <input
          id="subscription"
          name="subscription"
          type="checkbox"
          checked={formData.subscription}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded bg-gray-700"
        />
        <label htmlFor="subscription" className="ml-2 block text-sm text-gray-300">
          Subscription required
        </label>
      </div>
      
      {formData.subscription && (
        <div>
          <label htmlFor="subscription_amount" className="block text-sm font-medium text-gray-300">
            Subscription Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            id="subscription_amount"
            name="subscription_amount"
            value={formData.subscription_amount}
            onChange={handleChange}
            required={formData.subscription}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      )}
    </div>
    
    {/* Course Settings */}
    <div className="bg-gray-750 rounded-lg p-4 space-y-4">
      <h3 className="font-medium text-gray-200">Course Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="video_session" className="block text-sm font-medium text-gray-300">
            Video Sessions
          </label>
          <input
            type="number"
            min="1"
            id="video_session"
            name="video_session"
            value={formData.video_session}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="chat_upto" className="block text-sm font-medium text-gray-300">
            Chat Support (days)
          </label>
          <input
            type="number"
            min="1"
            id="chat_upto"
            name="chat_upto"
            value={formData.chat_upto}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="safe_period" className="block text-sm font-medium text-gray-300">
            Safe Period (days)
          </label>
          <input
            type="number"
            min="1"
            id="safe_period"
            name="safe_period"
            value={formData.safe_period}
            onChange={handleChange}
            required
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  </div>
  
  {/* Learning Objectives */}
  <div>
    <h3 className="text-lg font-medium text-gray-200">Learning Objectives</h3>
    <p className="text-sm text-gray-400 mb-4">What will students learn in this course?</p>
    
    {formData.objectives.map((obj, index) => (
      <div key={index} className="flex items-center mb-3">
        <input
          type="text"
          value={obj.objective}
          onChange={(e) => handleArrayItemChange(e, index, 'objectives')}
          placeholder="e.g. Build responsive websites using HTML, CSS and JavaScript"
          className="flex-grow bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={() => removeArrayItem(index, 'objectives')}
          className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={formData.objectives.length <= 1}
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    ))}
    
    <button
      type="button"
      onClick={() => addArrayItem('objectives')}
      className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-200 bg-indigo-700 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Add Objective
    </button>
  </div>
  
  {/* Requirements */}
  <div>
    <h3 className="text-lg font-medium text-gray-200">Course Requirements</h3>
    <p className="text-sm text-gray-400 mb-4">What prerequisites should students have?</p>
    
    {formData.requirements.map((req, index) => (
      <div key={index} className="flex items-center mb-3">
        <input
          type="text"
          value={req.requirement}
          onChange={(e) => handleArrayItemChange(e, index, 'requirements')}
          placeholder="e.g. Basic understanding of HTML and CSS"
          className="flex-grow bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={() => removeArrayItem(index, 'requirements')}
          className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={formData.requirements.length <= 1}
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    ))}
    
    <button
      type="button"
      onClick={() => addArrayItem('requirements')}
      className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-200 bg-indigo-700 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="current// components/BasicCourseForm.jsx (completion)
          Color">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Requirement
        </button>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end pt-5 border-t border-gray-700">
        <button
          type="submit"
          disabled={loading}
          className="ml-3 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving
            </>
          ) : (
            'Save & Continue'
          )}
        </button>
      </div>
    </form>
  );
};

// components/SectionForm.jsx
import React, { useState } from 'react';

const SectionForm = ({ sections, onSubmit, onEditSection, onAddItem, onContinue, loading }) => {
  const [sectionTitle, setSectionTitle] = useState('');
  const [editingSection, setEditingSection] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingSection) {
      onSubmit({
        ...editingSection,
        title: sectionTitle
      });
    } else {
      onSubmit({
        title: sectionTitle,
        order: sections.length
      });
    }
    
    setSectionTitle('');
    setEditingSection(null);
  };

  const handleEditClick = (section) => {
    setEditingSection(section);
    setSectionTitle(section.title);
    onEditSection(section);
  };

  const handleAddItemClick = (section) => {
    onAddItem(section);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Course Sections</h2>
        <p className="mt-1 text-sm text-gray-400">
          Organize your course content into sections. Each section can contain multiple videos or assessments.
        </p>
      </div>

      {/* Add/Edit Section Form */}
      <form onSubmit={handleSubmit} className="bg-gray-750 rounded-lg p-4">
        <div>
          <label htmlFor="sectionTitle" className="block text-sm font-medium text-gray-300">
            {editingSection ? 'Edit Section Title' : 'New Section Title'}
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="sectionTitle"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              required
              className="flex-grow bg-gray-700 border border-gray-600 rounded-l-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Introduction to React"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Saving...' : editingSection ? 'Update Section' : 'Add Section'}
            </button>
          </div>
        </div>
      </form>

      {/* Sections List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-200">Course Structure</h3>
        
        {sections.length === 0 ? (
          <div className="text-center py-8 bg-gray-800 rounded-lg">
            <p className="text-gray-400">
              No sections added yet. Add your first section above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.id || index} className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-gray-200">
                      Section {index + 1}: {section.title}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {section.items?.length || 0} {(section.items?.length || 0) === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(section)}
                      className="inline-flex items-center p-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItemClick(section)}
                      className="inline-flex items-center p-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {section.items?.length > 0 && (
                  <div className="border-t border-gray-700 px-4 py-2">
                    <ul className="divide-y divide-gray-700">
                      {section.items.map((item, idx) => (
                        <li key={item.id || idx} className="py-2 flex items-center justify-between">
                          <div className="flex items-center">
                            {item.item_type === 'video' ? (
                              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            )}
                            <span className="text-gray-300">{item.title}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-5 border-t border-gray-700">
        <div>
          {sections.length > 0 && (
            <button
              type="button"
              onClick={onContinue}
              className="px-6 py-3 border border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Review & Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

