import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
    return (
        <div className="container">
            <header style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Welcome to OpenLMS
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                    Master new skills with our premium course platform.
                    Multimedia learning, reimagined.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
                    <Link to="/login" className="btn" style={{ backgroundColor: 'var(--bg-secondary)', color: 'white' }}>Get Started</Link>
                </div>
            </header>

            <section className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '4rem 0' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '0.5rem' }}>Learn at your own pace</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Access high-quality video content anytime, anywhere.</p>
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '0.5rem' }}>Track your progress</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Save your spot and see how much you've achieved.</p>
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '0.5rem' }}>Community Driven</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Join a community of learners and share your journey.</p>
                </div>
            </section>
        </div>
    )
}

export default Home
