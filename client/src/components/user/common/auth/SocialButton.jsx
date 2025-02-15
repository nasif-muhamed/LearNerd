import React from 'react'

const SocialButton = ({ icon: Icon, bgColor }) => (
    <button className={`p-2 rounded-full ${bgColor} text-white hover:opacity-90 transition-opacity`}>
        <Icon size={24} />
    </button>
);


export default SocialButton