import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Materials = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [activeTab, setActiveTab] = useState('All Files')

    // Mock Data
    const materials = [
        { id: 1, title: 'Design Slides', type: 'pdf', size: '12 MB', category: 'Documents', icon: 'pdf' },
        { id: 2, title: 'Design Thinking', type: 'ppt', size: '2.5 MB', category: 'Documents', icon: 'doc' },
        { id: 3, title: 'Module 1 Lecture.mp4', type: 'video', size: 'MP4, 30 min', category: 'Videos', icon: 'video' },
        { id: 4, title: 'Ares Ipeet Ilpot', type: 'pdf', size: '30 min', category: 'Documents', icon: 'doc' }, // Mock nonsense text from image
        { id: 5, title: 'Creative Writing', type: 'doc', size: '5 MB', category: 'Documents', icon: 'doc' },
        { id: 6, title: 'Course Podcast.mp3', type: 'audio', size: 'MP3, 15 min', category: 'Audio', icon: 'audio' },
        { id: 7, title: 'Module 1 Lecture.mp3', type: 'audio', size: 'MP3, 15 min', category: 'Audio', icon: 'audio' },
        { id: 8, title: 'Web Dev Basics.pdf', type: 'pdf', size: '3.2 MB', category: 'Documents', icon: 'pdf' },
    ]

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/')
            } else {
                setUser(session.user)
            }
        }
        getUser()
    }, [navigate])

    const filteredMaterials = activeTab === 'All Files'
        ? materials
        : materials.filter(m => m.category === activeTab)

    const getIcon = (type) => {
        if (type === 'pdf') {
            return (
                <div style={{ width: '50px', height: '60px', backgroundColor: '#e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '2px' }}>PDF</span>
                </div>
            )
        }
        if (type === 'video') {
            return (
                <div style={{ width: '60px', height: '45px', backgroundColor: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M5 3l14 9-14 9V3z" /></svg>
                </div>
            )
        }
        if (type === 'audio') {
            return (
                <div style={{ width: '50px', height: '50px', backgroundColor: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                </div>
            )
        }
        return (
            <div style={{ width: '50px', height: '60px', backgroundColor: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            </div>
        )
    }

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>My Materials</h1>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            {['All Files', 'Documents', 'Videos', 'Audio'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        fontSize: '0.95rem',
                                        fontWeight: activeTab === tab ? '600' : '500',
                                        color: activeTab === tab ? '#0f172a' : '#64748b',
                                        cursor: 'pointer',
                                        padding: '0.5rem 0.5rem 1rem',
                                        borderBottom: activeTab === tab ? '2px solid #0f172a' : '2px solid transparent',
                                        marginBottom: '-0.6rem'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User Avatar (Mini) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #f8fafc' }}></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img
                                src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                                alt="Profile"
                            />
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>
                </div>

                {/* Filter/Sort Header Row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                        color: '#64748b', fontSize: '0.85rem', cursor: 'pointer'
                    }}>
                        Sort By: Date Added <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {filteredMaterials.map(file => (
                        <div key={file.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            ':hover': { transform: 'translateY(-4px)' }
                        }}>
                            <div style={{ marginBottom: '1.5rem', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                                {getIcon(file.type)}
                            </div>

                            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {file.title}
                            </h3>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {file.size}
                            </p>

                            {/* Hover Download Button Visual (Hidden for now or could be shown) */}
                        </div>
                    ))}
                </div>

                {/* Recent Materials Section Header (if needed) */}
                <div style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>Recent Materials</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {/* Just duplicating some for the "Recent" look */}
                    {materials.slice(0, 4).map(file => (
                        <div key={`recent-${file.id}`} style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}>
                            <div style={{ marginBottom: '1rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                                {getIcon(file.type)}
                            </div>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.2rem' }}>{file.title}</h3>
                            <button style={{
                                marginTop: '1rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: '#64748b',
                                color: 'white',
                                fontSize: '0.75rem',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%'
                            }}>Download</button>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    )
}

export default Materials
