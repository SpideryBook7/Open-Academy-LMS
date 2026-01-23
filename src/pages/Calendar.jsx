import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Calendar = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())

    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [newEvent, setNewEvent] = useState({ title: '', time: '12:00', type: 'event' })

    const fetchEvents = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', userId)

            if (error) throw error

            if (data) {
                const formattedEvents = data.map(e => ({
                    ...e,
                    date: new Date(e.start_time)
                }))
                setEvents(formattedEvents)
            }
        } catch (error) {
            console.error('Error fetching events:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateEvent = async (e) => {
        e.preventDefault()
        if (!user) return

        try {
            // Combine selectedDate and time
            const [hours, minutes] = newEvent.time.split(':')
            const startDateTime = new Date(selectedDate)
            startDateTime.setHours(parseInt(hours), parseInt(minutes))

            const { data, error } = await supabase
                .from('calendar_events')
                .insert([
                    {
                        user_id: user.id,
                        title: newEvent.title,
                        start_time: startDateTime.toISOString(),
                        type: newEvent.type,
                        color: newEvent.type === 'exam' ? '#fca5a5' : newEvent.type === 'deadline' ? '#fcd34d' : '#bfdbfe'
                    }
                ])
                .select()

            if (error) throw error

            if (data) {
                setEvents([...events, { ...data[0], date: new Date(data[0].start_time) }])
                setShowModal(false)
                setNewEvent({ title: '', time: '12:00', type: 'event' })
            }
        } catch (error) {
            alert('Error creating event: ' + error.message)
        }
    }

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Are you sure you want to delete this event?')) return

        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', eventId)

            if (error) throw error

            setEvents(events.filter(e => e.id !== eventId))
        } catch (error) {
            alert('Error deleting event: ' + error.message)
        }
    }

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/')
            } else {
                setUser(session.user)

                // Fetch profile data
                const { data } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', session.user.id)
                    .single()

                if (data) {
                    setAvatarUrl(data.avatar_url)
                }

                fetchEvents(session.user.id)
            }
        }
        getUser()
    }, [navigate])

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1))
    }

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
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
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

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>My Calendar</h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        {/* User Avatar (Mini) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                                src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', objectFit: 'cover' }}
                                alt="Profile"
                            />
                            <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{user?.user_metadata?.full_name || 'User'}</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Student</p>
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
                                <button onClick={() => changeMonth(-1)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&lt;</button>
                                <button onClick={() => changeMonth(1)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&gt;</button>
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
                            <div style={{ marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>My Schedule</h2>
                                <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                    Selected: {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                                {events.length > 0 ? (
                                    events
                                        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                                        .map(event => (
                                            <div key={event.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', width: '100%', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ width: '4px', height: '40px', backgroundColor: event.color, borderRadius: '2px' }}></div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.2rem' }}>{event.title}</h4>
                                                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        {new Date(event.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#ef4444',
                                                        padding: '4px',
                                                        opacity: 0.7,
                                                        ':hover': { opacity: 1 }
                                                    }}
                                                    title="Delete Event"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        ))) : (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No scheduled events.</p>
                                )}
                            </div>



                            <button
                                onClick={() => setShowModal(true)}
                                style={{
                                    marginTop: 'auto',
                                    width: '100%',
                                    padding: '1rem',
                                    backgroundColor: '#0f172a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                Create Event
                            </button>
                        </div>
                    </div >
                </div >

                {/* Create Event Modal */}
                {
                    showModal && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 100
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                padding: '2rem',
                                borderRadius: '16px',
                                width: '400px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                            }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#0f172a' }}>Add New Event</h3>
                                <form onSubmit={handleCreateEvent}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Title</label>
                                        <input
                                            type="text"
                                            value={newEvent.title}
                                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Time</label>
                                        <input
                                            type="time"
                                            value={newEvent.time}
                                            onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Type</label>
                                        <select
                                            value={newEvent.type}
                                            onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                        >
                                            <option value="event">General Event</option>
                                            <option value="deadline">Deadline</option>
                                            <option value="exam">Exam</option>
                                            <option value="meeting">Meeting</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                                        >
                                            Save Event
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    )
}

export default Calendar
