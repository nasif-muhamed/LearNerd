import React from 'react'

const InputField = ({ label, type = "text", placeholder, register, ...props }) => (
    <div className="">
        {label && <label className="block text-sm font-light text-gray-300 mb-2">{label}</label>}
        <input
            type={type}
            placeholder={placeholder}
            {...register}
            {...props}
            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
    </div>
);

export default InputField
