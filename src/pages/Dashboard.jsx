import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Dashboard = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(true)
    const [events, setEvents] = useState([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())

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
                    .select('avatar_url, description, role')
                    .eq('id', session.user.id)
                    .single()

                if (data) {
                    setAvatarUrl(data.avatar_url)
                    setDescription(data.description)
                    setUserRole(data.role)
                }

                // Fetch events for mini calendar
                const { data: eventsData } = await supabase
                    .from('calendar_events')
                    .select('*')
                    .eq('user_id', session.user.id)

                if (eventsData) {
                    setEvents(eventsData.map(e => ({ ...e, date: new Date(e.start_time) })))
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

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1))
    }

    const renderMiniCalendar = () => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
        let startParams = firstDay === 0 ? 6 : firstDay - 1

        const days = []
        for (let i = 0; i < startParams; i++) {
            days.push(<span key={`empty-${i}`}></span>)
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()

            // Check for event
            const hasEvent = events.some(e =>
                e.date.getDate() === day &&
                e.date.getMonth() === currentDate.getMonth() &&
                e.date.getFullYear() === currentDate.getFullYear()
            )

            const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth()

            days.push(
                <span
                    key={day}
                    onClick={() => setSelectedDate(currentDayDate)}
                    style={{
                        padding: '0.25rem',
                        backgroundColor: isSelected ? '#fffcf0' : (isToday ? '#64748b' : 'transparent'),
                        color: isSelected ? '#334155' : (isToday ? 'white' : '#334155'),
                        border: isSelected ? '1px solid #e2e8f0' : 'none',
                        borderRadius: '6px',
                        position: 'relative',
                        fontWeight: isToday || isSelected ? 'bold' : 'normal',
                        cursor: 'pointer'
                    }}>
                    {day}
                    {hasEvent && !isToday && (
                        <div style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6'
                        }}></div>
                    )}
                </span>
            )
        }
        return days
    }

    const upcomingEvents = events
        .filter(e => new Date(e.start_time) >= new Date())
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .slice(0, 3)

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                                src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', objectFit: 'cover' }}
                                alt="Profile"
                            />
                            <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{user?.user_metadata?.full_name || 'Alex Proflum'}</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{userRole === 'admin' ? 'Administrator' : 'Student'}</p>
                            </div>
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
                                <button onClick={() => navigate('/profile')} style={{ fontSize: '0.875rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>Edit</button>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <img
                                    src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem', objectFit: 'cover' }}
                                    alt="Avatar"
                                />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem', color: '#0f172a' }}>{user?.user_metadata?.full_name || 'Alex Proflum'}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{userRole === 'admin' ? 'Administrator' : 'Student'} (Role: {userRole || 'Loading...'})</p>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.5' }}>
                                {description || 'Always learning, always growing. Passionate about Design and Data.'}
                            </p>
                        </div>
                        {/* Calendar Widget (Simplified) */}
                        <section style={{ backgroundColor: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ cursor: 'pointer' }} onClick={() => changeMonth(-1)}>&lt;</span>
                                    <span style={{ cursor: 'pointer' }} onClick={() => changeMonth(1)}>&gt;</span>
                                </div>
                            </div>
                            {/* Dynamic Calendar Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', fontSize: '0.75rem', textAlign: 'center', marginBottom: '1rem', color: '#64748b' }}>
                                <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
                                {renderMiniCalendar()}
                            </div>

                            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: '#0f172a' }}>Upcoming Events</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                                    <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: event.color }}></div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <p style={{ fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</p>
                                            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                {new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No upcoming events.</p>
                                )}
                            </div>
                        </section>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default Dashboard
