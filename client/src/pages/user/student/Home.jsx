import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
    console.log("Home")

    return (
        <div>
            <h1 className='text-center'>Home</h1>
            <Link to="/login"><h4 className='text-center text-blue-600'>login</h4></Link>
        </div>
    )
}

export default Home
