import React, { useState, useEffect } from 'react';
import api from '../services/api/axiosInterceptor';

const CategoryAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', image: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await api.get('courses/categories/');
    setCategories(res.data.results);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.patch(`courses/categories/${editingId}/`, form);
    } else {
      await api.post('courses/categories/', form);
    }
    setForm({ title: '', description: '', image: '' });
    setEditingId(null);
    fetchCategories();
  };

  const handleEdit = (category) => {
    setForm({ title: category.title, description: category.description, image: category.image });
    setEditingId(category.slug);
  };

  const handleDelete = async (slug) => {
    await api.delete(`courses/categories/${slug}/`);
    fetchCategories();
  };

  const fetchSingleCategory = async (slugOrId) => {
    const res = await api.get(`courses/categories/${slugOrId}/`);
    alert(`Title: ${res.data.title}\nDescription: ${res.data.description}`);
  };  

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{editingId ? 'Edit Category' : 'Add Category'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          className="border p-2 w-full text-black"
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 w-full text-black"
          required
        />
        <input
          type="url"
          name="image"
          placeholder="Image URL"
          value={form.image}
          onChange={handleChange}
          className="border p-2 w-full text-black"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editingId ? 'Update' : 'Add'}
        </button>
      </form>

      <h2 className="text-2xl font-bold mt-8 mb-4">Categories</h2>
      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat.id} className="flex justify-between items-center border p-2">
            <div>
              <p className="font-semibold">{cat.title}</p>
              <p className="text-sm">{cat.description}</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(cat)} className="text-blue-500">Edit</button>
              <button onClick={() => handleDelete(cat.slug)} className="text-red-500">Delete</button>
              <button onClick={() => fetchSingleCategory(cat.slug)} className="text-green-500">View</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryAdmin;