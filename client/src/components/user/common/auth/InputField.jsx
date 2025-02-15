import React from 'react'

const InputField = ({ label, type = "text", placeholder, register }) => (
    <div className="">
        {label && <label className="block text-gray-300 mb-2">{label}</label>}
        <input
            type={type}
            placeholder={placeholder}
            {...register}
            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
    </div>
);

export default InputField
