import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Dashboard = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/')
            } else {
                setUser(session.user)

                // Fetch profile data
                const { data } = await supabase
                    .from('profiles')
                    .select('avatar_url, description')
                    .eq('id', session.user.id)
                    .single()

                if (data) {
                    setAvatarUrl(data.avatar_url)
                    setDescription(data.description)
                }
            }
            setLoading(false)
        }
        checkUser()
    }, [navigate])

    const myCourses = [
        { id: 1, title: 'Design Thinking', progress: 45, color: '#94a3b8', image: 'https://images.unsplash.com/photo-1558655146-d09347e0b7a9?auto=format&fit=crop&w=500&q=80' },
        { id: 2, title: 'Data Science Basics', progress: 32, color: '#64748b', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80' },
        { id: 3, title: 'Creative Writing', progress: 78, color: '#cbd5e1', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=500&q=80' },
    ]

    if (loading) return null

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '2rem 3rem' }}>
                {/* Top Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Alex'}
                        </h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button style={{ position: 'relative', cursor: 'pointer', color: '#64748b' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #f8fafc' }}></span>
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                                src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', objectFit: 'cover' }}
                                alt="Profile"
                            />
                            <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{user?.user_metadata?.full_name || 'Alex Proflum'}</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Student</p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '2rem' }}>

                    {/* Main Column (2fr) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* My Courses Section */}
                        <section>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a' }}>My Courses</h2>
                                <a href="#" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>See all</a>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {myCourses.map(course => (
                                    <div key={course.id} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)' }}>
                                        <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
                                            <img src={course.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Course" />
                                        </div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</h3>
                                        <div style={{ marginBottom: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Progress</span>
                                            </div>
                                            <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px' }}>
                                                <div style={{ width: `${course.progress}%`, height: '100%', backgroundColor: '#64748b', borderRadius: '3px' }}></div>
                                            </div>
                                        </div>
                                        <button style={{ width: '100%', padding: '0.75rem', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.2s', ':hover': { backgroundColor: '#64748b' } }}>
                                            Go to Course
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Recent Materials & Calendar Split */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                            {/* Recent Materials */}
                            <section>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '1.5rem' }}>Recent Materials</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    {[
                                        { type: 'pdf', title: 'Design Slides.pdf', color: '#cbd5e1' },
                                        { type: 'video', title: 'Data Lecture 3.mp4', color: '#e2e8f0' },
                                        { type: 'doc', title: 'Data Lecture 4.doc', color: '#e2e8f0' }
                                    ].map((file, i) => (
                                        <div key={i} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <div style={{ width: '60px', height: '60px', backgroundColor: file.color, borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                {/* Simplified mock icons */}
                                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{file.type.toUpperCase()}</span>
                                            </div>
                                            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>{file.title}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Right Column (1fr) - Banner & Profile Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Profile Card */}
                        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '2rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>My Profile</h3>
                                <span style={{ fontSize: '0.875rem', color: '#64748b', cursor: 'pointer' }}>Edit</span>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <img
                                    src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem', objectFit: 'cover' }}
                                    alt="Avatar"
                                />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem', color: '#0f172a' }}>{user?.user_metadata?.full_name || 'Alex Proflum'}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Student</p>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.5' }}>
                                {description || 'Always learning, always growing. Passionate about Design and Data.'}
                            </p>
                        </div>
                        {/* Calendar Widget (Simplified) */}
                        <section style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Calendar</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ cursor: 'pointer' }}>&lt;</span>
                                    <span style={{ cursor: 'pointer' }}>&gt;</span>
                                </div>
                            </div>
                            {/* Mock Calendar Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', fontSize: '0.75rem', textAlign: 'center', marginBottom: '1rem', color: '#64748b' }}>
                                <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>

                                {[...Array(30)].map((_, i) => {
                                    const day = i + 1;
                                    const isToday = day === 4; // Mock today
                                    return (
                                        <span key={i} style={{
                                            padding: '0.25rem',
                                            backgroundColor: isToday ? '#64748b' : 'transparent',
                                            color: isToday ? 'white' : '#334155',
                                            borderRadius: '6px'
                                        }}>
                                            {day}
                                        </span>
                                    )
                                })}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#94a3b8' }}></div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>Upcoming deadline 1</p>
                                        <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Monday, 20 June</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#94a3b8' }}></div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>Upcoming deadline 2</p>
                                        <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Wednesday, Online</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default Dashboard
