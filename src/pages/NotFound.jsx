import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            textAlign: 'center'
        }}>
            <h1 style={{ fontSize: '6rem', fontWeight: '900', color: '#4f46e5', margin: 0 }}>404</h1>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page Not Found</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>The page you are looking for might have been removed or is temporarily unavailable.</p>
            <Link to="/" className="btn-primary" style={{ padding: '0.75rem 2rem', textDecoration: 'none', maxWidth: '200px' }}>
                Go to Home
            </Link>
        </div>
    )
}

export default NotFound
