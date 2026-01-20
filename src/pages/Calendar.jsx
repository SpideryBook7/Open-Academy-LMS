import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Calendar = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 19)) // Mock date to match design jan 19 2026
    const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 19))

    // Mock Events Data
    const events = [
        { id: 1, title: 'Design Thinking Quiz', time: '10:00 AM', date: new Date(2026, 0, 19), type: 'quiz', color: '#cbd5e1' },
        { id: 2, title: 'Data Science Workshop', time: '2:00 PM', date: new Date(2026, 0, 19), type: 'workshop', color: '#e2e8f0' },
        { id: 3, title: 'Web Dev Exam', time: '9:00 AM', date: new Date(2026, 0, 28), type: 'exam', color: '#e2e8f0' },
        { id: 4, title: 'Marketing Project Due', time: '11:59 PM', date: new Date(2026, 0, 23), type: 'deadline', color: '#cbd5e1' },
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

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentDate)
        const firstDay = getFirstDayOfMonth(currentDate)
        const days = []

        // Previous month filler
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ height: '100px', backgroundColor: '#fafafa', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}></div>)
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const isToday = day === 19 // Mock today
            const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth()

            const dayEvents = events.filter(e =>
                e.date.getDate() === day &&
                e.date.getMonth() === currentDate.getMonth() &&
                e.date.getFullYear() === currentDate.getFullYear()
            )

            days.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(currentDayDate)}
                    style={{
                        height: '100px',
                        backgroundColor: isSelected ? '#fffcf0' : 'white',
                        borderRight: '1px solid #f1f5f9',
                        borderBottom: '1px solid #f1f5f9',
                        padding: '0.5rem',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                >
                    <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: isToday ? 'white' : '#64748b',
                        backgroundColor: isToday ? '#3b82f6' : 'transparent',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '50%'
                    }}>
                        {day}
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                        {dayEvents.map(event => (
                            <div key={event.id} style={{
                                fontSize: '0.65rem',
                                padding: '2px 4px',
                                backgroundColor: event.color,
                                borderRadius: '4px',
                                color: '#334155',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {event.title}
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

        return days
    }

    const selectedEvents = events.filter(e =>
        e.date.getDate() === selectedDate.getDate() &&
        e.date.getMonth() === selectedDate.getMonth() &&
        e.date.getFullYear() === selectedDate.getFullYear()
    )

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>My Calendar</h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        {/* View Switcher */}
                        <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '8px', padding: '4px', border: '1px solid #e2e8f0' }}>
                            <button style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: 'transparent', color: '#64748b', fontWeight: '500', cursor: 'pointer' }}>Today</button>
                            <button style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: 'transparent', color: '#64748b', fontWeight: '500', cursor: 'pointer' }}>Week</button>
                            <button style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: '#f1f5f9', borderRadius: '6px', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>Month</button>
                            <button style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: 'transparent', color: '#64748b', fontWeight: '500', cursor: 'pointer' }}>List</button>
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
                </div>

                {/* Content Layout */}
                <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>

                    {/* Calendar Grid Container */}
                    <div style={{ flex: 3, backgroundColor: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&lt;</button>
                                <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&gt;</button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.875rem', fontWeight: '600' }}>
                            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9' }}>
                            {renderCalendarGrid()}
                        </div>
                    </div>

                    {/* Sidebar Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Selected Date Card */}
                        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ fontSize: '4rem', fontWeight: '300', color: '#0f172a', lineHeight: 1 }}>{selectedDate.getDate()}</h2>
                            <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '2rem', fontWeight: '500' }}>
                                {selectedDate.toLocaleString('default', { weekday: 'long' })}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, overflowY: 'auto' }}>
                                {selectedEvents.length > 0 ? selectedEvents.map(event => (
                                    <div key={event.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                        <div style={{ width: '4px', height: '40px', backgroundColor: '#64748b', borderRadius: '2px' }}></div>
                                        <div>
                                            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.2rem' }}>{event.title}</h4>
                                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{event.time} • Location</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No events for this day.</p>
                                )}
                            </div>

                            <button style={{
                                marginTop: 'auto',
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: '#94a3b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '600',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}>
                                Create Event
                            </button>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default Calendar
