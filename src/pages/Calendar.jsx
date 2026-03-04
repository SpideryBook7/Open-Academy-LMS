import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Calendar = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [dominantColor, setDominantColor] = useState('rgba(0, 71, 186, 0.5)')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())

    const [events, setEvents] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [newEvent, setNewEvent] = useState({ title: '', time: '12:00', type: 'event' })

    // Function to extract dominant color from image
    const extractColor = (url) => {
        if (!url) return;
        try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 10;
                    canvas.height = 10;
                    ctx.drawImage(img, 0, 0, 10, 10);
                    const data = ctx.getImageData(0, 0, 10, 10).data;

                    let r = 0, g = 0, b = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                    }
                    const count = data.length / 4;
                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);

                    const color = `rgba(${r}, ${g}, ${b}, 0.5)`;
                    setDominantColor(color);
                } catch (e) {
                    console.warn("No se pudo extraer el color:", e);
                }
            };
        } catch (error) {
            console.error("Error en extractColor:", error);
        }
    };

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

            const pastelColors = {
                event: '#bae6fd',    // Azul claro
                deadline: '#fef08a', // Amarillo
                exam: '#fecaca',     // Rojo
                meeting: '#bbf7d0',  // Verde
                class: '#fed7aa'     // Naranja
            };

            const { data, error } = await supabase
                .from('calendar_events')
                .insert([
                    {
                        user_id: user.id,
                        title: newEvent.title,
                        start_time: startDateTime.toISOString(),
                        type: newEvent.type,
                        color: pastelColors[newEvent.type] || '#bae6fd'
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
            alert('Error al crear el evento: ' + error.message)
        }
    }

    const handleDeleteEvent = async (eventId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return

        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', eventId)

            if (error) throw error

            setEvents(events.filter(e => e.id !== eventId))
        } catch (error) {
            alert('Error al eliminar el evento: ' + error.message)
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
                    .select('avatar_url, role')
                    .eq('id', session.user.id)
                    .single()

                if (data) {
                    setAvatarUrl(data.avatar_url)
                    setUserRole(data.role)
                    if (data.avatar_url) extractColor(data.avatar_url)
                }

                fetchEvents(session.user.id)
            }
        }
        getUser()
    }, [navigate])

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1))
    }

    // Eliminar funciones no utilizadas ya que el calendario se calcula dentro de renderCalendarGrid

    const renderCalendarGrid = () => {
        const days = []
        const today = new Date()
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
        const startingDay = firstDayOfMonth.getDay()

        // Previous month filler days
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ height: '72px', backgroundColor: '#fdfdfd', border: '1px solid #f8fafc' }}></div>)
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
            const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth()

            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.start_time)
                return eventDate.getDate() === day &&
                    eventDate.getMonth() === currentDate.getMonth() &&
                    eventDate.getFullYear() === currentDate.getFullYear()
            }).map(event => {
                // Modern Pastel Color Palette
                const pastelColors = {
                    event: '#bae6fd',    // Azul claro
                    deadline: '#fef08a', // Amarillo
                    exam: '#fecaca',     // Rojo
                    meeting: '#bbf7d0',  // Verde
                    class: '#fed7aa',    // Naranja
                    workshop: '#f472b6',
                    lab: '#22d3ee'
                };
                return { ...event, color: pastelColors[event.type] || '#94a3b8' };
            });

            days.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(currentDayDate)}
                    style={{
                        height: '72px',
                        backgroundColor: isSelected ? 'var(--surface-brand)' : 'white',
                        border: '1px solid #f1f5f9',
                        outline: 'none',
                        margin: '-0.5px', // Merge borders
                        padding: '0.35rem',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.zIndex = '2';
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 12px 25px -5px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected ? 'var(--surface-brand)' : 'white';
                        e.currentTarget.style.borderColor = '#f1f5f9';
                        e.currentTarget.style.zIndex = '1';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: isToday ? 'white' : (isSelected ? 'var(--accent-color)' : '#1e293b'),
                            backgroundColor: isToday ? 'var(--accent-color)' : 'transparent',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: '6px',
                            transition: 'all 0.3s'
                        }}>
                            {day}
                        </span>

                        {dayEvents.length > 2 && (
                            <div style={{
                                fontSize: '0.55rem',
                                color: '#0047ba',
                                fontWeight: '800',
                                backgroundColor: 'rgba(0, 71, 186, 0.1)',
                                padding: '1px 3px',
                                borderRadius: '3px'
                            }}>
                                +{dayEvents.length - 2}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5px', marginTop: '2px', overflowY: 'hidden' }}>
                        {dayEvents.slice(0, 2).map(event => (
                            <div
                                key={event.id}
                                className="calendar-event-container"
                                style={{
                                    fontSize: '0.52rem',
                                    fontWeight: '500',
                                    padding: '1px 4px',
                                    backgroundColor: `${event.color}20`,
                                    borderLeft: `2.5px solid ${event.color}`,
                                    borderRadius: '3px',
                                    color: '#1e293b',
                                    lineHeight: '1.2'
                                }}
                            >
                                <span className="calendar-event-marquee">
                                    {event.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

        return days
    }

    return (
        <div style={{ backgroundColor: 'var(--background-color)', minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', minHeight: '100vh', overflow: 'hidden', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, backgroundColor: 'transparent' }}>

                {/* Ambient Glow Effects (From Dashboard) */}
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '1000px', height: '1000px', borderRadius: '50%', background: `radial-gradient(circle, ${dominantColor.replace('0.5', '0.15')} 0%, transparent 70%)`, filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${dominantColor.replace('0.5', '0.1')} 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>

                <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                        <div style={{ animation: 'fadeInDown 0.8s ease-out' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
                                Mi <span style={{ color: 'var(--accent-gold)' }}>Calendario</span>
                            </h1>
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', fontWeight: '500' }}>Organiza tu tiempo para el éxito.</p>
                        </div>

                        {/* Profile Widget (Identical to Dashboard/Courses) */}
                        <div
                            onClick={() => navigate('/profile')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                padding: '0.8rem 1.4rem',
                                borderRadius: '22px',
                                backdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                animation: 'fadeInDown 0.8s ease-out'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
                                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                                e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.15)';
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '14px',
                                        border: `2px solid ${dominantColor.replace('0.5', '0.8')}`,
                                        boxShadow: `0 4px 12px ${dominantColor.replace('0.5', '0.3')}`,
                                        objectFit: 'cover'
                                    }}
                                    alt="Perfil"
                                />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginBottom: '0px' }}>{user?.user_metadata?.full_name || 'Usuario'}</p>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {userRole === 'admin' ? 'Administrador' : 'Estudiante'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content Layout - Constrained height to enable internal scrolling */}
                    <div style={{ display: 'flex', gap: '2rem', flex: 1, height: 'calc(100vh - 220px)', minHeight: '500px' }}>

                        {/* Calendar Grid Container - Premium Upgrade */}
                        <div
                            style={{
                                flex: 1.8,
                                minWidth: 0,
                                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                borderRadius: '28px',
                                padding: '1.5rem',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.6)',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                                cursor: 'default',
                                animation: 'fadeInUp 0.8s ease-out 0.2s both',
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.08)';
                                e.currentTarget.style.borderColor = 'var(--accent-color)';
                                const glow = e.currentTarget.querySelector('.panel-glow');
                                if (glow) glow.style.opacity = '0.6';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)';
                                e.currentTarget.style.borderColor = '#f1f5f9';
                                const glow = e.currentTarget.querySelector('.panel-glow');
                                if (glow) glow.style.opacity = '0';
                            }}
                        >
                            {/* Panel Glow Effect - More visible */}
                            <div className="panel-glow" style={{
                                position: 'absolute',
                                top: '-150px',
                                right: '-150px',
                                width: '450px',
                                height: '450px',
                                background: 'radial-gradient(circle, rgba(0, 71, 186, 0.2) 0%, transparent 70%)',
                                filter: 'blur(50px)',
                                opacity: '0',
                                transition: 'opacity 0.6s ease',
                                pointerEvents: 'none',
                                zIndex: 0
                            }}></div>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--surface-brand)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        </div>
                                        <h2 style={{ textTransform: 'capitalize', fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>
                                            {currentDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
                                        </h2>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.4rem', borderRadius: '12px' }}>
                                        <button
                                            onClick={() => changeMonth(-1)}
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                backgroundColor: 'white', border: '1px solid #e2e8f0',
                                                color: '#64748b', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                                                e.currentTarget.style.color = 'white';
                                                e.currentTarget.style.transform = 'translateX(-2px)';
                                                e.currentTarget.style.borderColor = 'var(--accent-color)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.backgroundColor = 'white';
                                                e.currentTarget.style.color = '#64748b';
                                                e.currentTarget.style.transform = 'translateX(0)';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                        </button>
                                        <button
                                            onClick={() => changeMonth(1)}
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                backgroundColor: 'white', border: '1px solid #e2e8f0',
                                                color: '#64748b', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                                                e.currentTarget.style.color = 'white';
                                                e.currentTarget.style.transform = 'translateX(2px)';
                                                e.currentTarget.style.borderColor = 'var(--accent-color)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.backgroundColor = 'white';
                                                e.currentTarget.style.color = '#64748b';
                                                e.currentTarget.style.transform = 'translateX(0)';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', textAlign: 'center', marginBottom: '1rem', color: '#6b6666ff', fontSize: '0.8rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                    {renderCalendarGrid()}
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0 }}>
                            {/* Selected Date Card */}
                            <div
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                    borderRadius: '28px',
                                    padding: '1.75rem',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: '1px solid rgba(255, 255, 255, 0.6)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                                    animation: 'fadeInUp 0.8s ease-out 0.4s both',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.08)';
                                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                                    const glow = e.currentTarget.querySelector('.sidebar-glow');
                                    if (glow) glow.style.opacity = '0.6';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)';
                                    e.currentTarget.style.borderColor = '#f1f5f9';
                                    const glow = e.currentTarget.querySelector('.sidebar-glow');
                                    if (glow) glow.style.opacity = '0';
                                }}
                            >
                                {/* Sidebar Glow Effect - More visible */}
                                <div className="sidebar-glow" style={{
                                    position: 'absolute',
                                    bottom: '-120px',
                                    right: '-120px',
                                    width: '400px',
                                    height: '400px',
                                    background: 'radial-gradient(circle, rgba(0, 71, 186, 0.2) 0%, transparent 70%)',
                                    filter: 'blur(45px)',
                                    opacity: '0',
                                    transition: 'opacity 0.6s ease',
                                    pointerEvents: 'none',
                                    zIndex: 0
                                }}></div>

                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                            <div style={{ width: '8px', height: '20px', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }}></div>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>Mi Agenda</h2>
                                        </div>
                                        <p style={{ textTransform: 'capitalize', fontSize: '0.9rem', color: '#94a3b8', fontWeight: '600' }}>
                                            {selectedDate.toLocaleDateString('es-MX', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>

                                    <div
                                        className="premium-scrollbar scrollbar-left"
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                            flex: 1,
                                            overflowY: 'auto',
                                            overflowX: 'hidden',
                                            paddingLeft: '12px', // Space for the left scrollbar
                                            paddingRight: '4px'
                                        }}
                                    >
                                        {events.length > 0 ? (
                                            (() => {
                                                const sortedEvents = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
                                                let lastDate = null;

                                                return sortedEvents.map(event => {
                                                    const eventDateObj = new Date(event.start_time);
                                                    const dateStr = eventDateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
                                                    const showSeparator = dateStr !== lastDate;
                                                    lastDate = dateStr;

                                                    const pastelColors = {
                                                        event: '#bae6fd',
                                                        deadline: '#fef08a',
                                                        exam: '#fecaca',
                                                        meeting: '#bbf7d0',
                                                        class: '#fed7aa'
                                                    };
                                                    const eventColor = pastelColors[event.type] || event.color || '#bae6fd';

                                                    return (
                                                        <React.Fragment key={event.id}>
                                                            {showSeparator && (
                                                                <div style={{
                                                                    padding: '0.2rem 0.1rem',
                                                                    marginTop: '0.15rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '1rem'
                                                                }}>
                                                                    <span style={{
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: '500',
                                                                        color: '#000000ff',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '1px',
                                                                        whiteSpace: 'nowrap'
                                                                    }}>
                                                                        {dateStr}
                                                                    </span>
                                                                    <div style={{ flex: 1, height: '1px', backgroundColor: '#dbdbdbff' }}></div>
                                                                </div>
                                                            )}
                                                            <div style={{
                                                                display: 'flex',
                                                                gap: '1rem',
                                                                alignItems: 'center',
                                                                width: '100%',
                                                                padding: '1rem',
                                                                backgroundColor: '#f8fafc',
                                                                borderRadius: '16px',
                                                                border: '1px solid transparent',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.backgroundColor = 'white';
                                                                    e.currentTarget.style.borderColor = `${eventColor}cc`;
                                                                    e.currentTarget.style.transform = 'translateX(5px)';
                                                                    e.currentTarget.style.boxShadow = `0 10px 20px -5px ${eventColor}aa`;
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                                                    e.currentTarget.style.borderColor = 'transparent';
                                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                }}>
                                                                <div style={{
                                                                    width: '5px',
                                                                    height: '35px',
                                                                    backgroundColor: eventColor,
                                                                    borderRadius: '10px',
                                                                    boxShadow: `0 0 10px ${eventColor}66`
                                                                }}></div>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div className="calendar-event-container">
                                                                        <h4 className="calendar-event-marquee" style={{ textTransform: 'capitalize', fontSize: '0.95rem', fontWeight: '600', color: '#334155', marginBottom: '0.1rem' }}>
                                                                            {event.title}
                                                                        </h4>
                                                                    </div>
                                                                    <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                                                                        {eventDateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} • {event.type}
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
                                                                        opacity: 0.7
                                                                    }}
                                                                    onMouseEnter={(e) => e.target.style.opacity = 1}
                                                                    onMouseLeave={(e) => e.target.style.opacity = 0.7}
                                                                    title="Delete Event"
                                                                >
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                                </button>
                                                            </div>
                                                        </React.Fragment>
                                                    );
                                                });
                                            })()
                                        ) : (
                                            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin eventos programados.</p>
                                        )}
                                    </div>



                                    <button
                                        onClick={() => setShowModal(true)}
                                        style={{
                                            marginTop: '2rem',
                                            width: '100%',
                                            padding: '1.25rem',
                                            backgroundColor: 'var(--accent-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '16px',
                                            fontWeight: '800',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            boxShadow: '0 10px 15px -3px rgba(30, 64, 175, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.75rem'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(30, 64, 175, 0.4)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(30, 64, 175, 0.3)';
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        Nuevo Evento
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Create Event Modal - Premium Redesign */}
                    {
                        showModal && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 100,
                                animation: 'fadeIn 0.3s ease'
                            }}>
                                <div style={{
                                    backgroundColor: 'white',
                                    padding: '2.5rem',
                                    borderRadius: '32px',
                                    width: '450px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(0, 0, 0, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.8)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Decorative Glow inside Modal */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '-100px',
                                        right: '-100px',
                                        width: '200px',
                                        height: '200px',
                                        background: 'radial-gradient(circle, rgba(0, 71, 186, 0.05) 0%, transparent 70%)',
                                        zIndex: 0
                                    }}></div>

                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                            </div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>Nuevo Evento</h3>
                                        </div>

                                        <form onSubmit={handleCreateEvent}>
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Título del evento</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Clase de Matemáticas"
                                                    value={newEvent.title}
                                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                                    required
                                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', transition: 'all 0.2s ease', outline: 'none' }}
                                                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 186, 0.1)'; }}
                                                    onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Hora</label>
                                                    <input
                                                        type="time"
                                                        value={newEvent.time}
                                                        onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                                        required
                                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', outline: 'none' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Categoría</label>
                                                    <select
                                                        value={newEvent.type}
                                                        onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                                        style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', appearance: 'none', cursor: 'pointer', outline: 'none' }}
                                                    >
                                                        <option value="event">Evento general</option>
                                                        <option value="deadline">Entrega</option>
                                                        <option value="exam">Examen</option>
                                                        <option value="meeting">Reunión</option>
                                                        <option value="class">Clase</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowModal(false)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.9rem',
                                                        borderRadius: '14px',
                                                        border: 'none',
                                                        backgroundColor: '#fef2f2',
                                                        color: '#ef4444',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.backgroundColor = '#fee2e2';
                                                        e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.backgroundColor = '#fef2f2';
                                                        e.target.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    style={{ flex: 2, padding: '0.9rem', borderRadius: '14px', border: 'none', backgroundColor: 'var(--accent-color)', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0, 71, 186, 0.3)', transition: 'all 0.2s ease' }}
                                                    onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 15px 20px -5px rgba(0, 71, 186, 0.4)'; }}
                                                    onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 71, 186, 0.3)'; }}
                                                >
                                                    Guardar Evento
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>

                <style>{`
                    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    
                    .premium-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .premium-scrollbar::-webkit-scrollbar-track {
                        background: rgba(0, 0, 0, 0.02);
                        border-radius: 10px;
                    }
                    .premium-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(0, 0, 0, 0.1);
                        border-radius: 10px;
                    }
                    .premium-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: var(--accent-color);
                    }
                    
                    .calendar-event-marquee {
                        display: inline-block;
                        white-space: nowrap;
                    }
                `}</style>

                {/* Footer Section */}
                {/* <footer style={{ 
                    marginTop: '4rem', 
                    padding: '1.25rem 5rem', 
                    marginLeft: '-3rem',
                    marginRight: '-3rem',
                    marginBottom: '-3.5rem',
                    backgroundColor: '#050505',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '4px', height: '16px', backgroundColor: '#ff5e00', borderRadius: '4px' }}></div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '1.2px', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                                    <span style={{ 
                                        background: 'linear-gradient(90deg, #ff1f1f 0%, #00d2ff 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}>DiPAAm</span>
                                    <span style={{ color: 'rgba(255, 255, 255, 0.1)', fontWeight: '300' }}>/</span>
                                    <span style={{ 
                                        background: 'linear-gradient(90deg, #ff9000 0%, #0077ff 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}>CONECTA ACADEMY LATAM</span>
                                </h3>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.3)', fontWeight: '600', marginLeft: '1.25rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                SIRA <span style={{ mx: '0.5rem', opacity: 0.3 }}>•</span> Sistema de Información y Recursos Académicos
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[
                                { color: '#1877F2', icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
                                { color: '#E4405F', icon: (
                                    <>
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                    </>
                                )},
                                { color: '#25D366', icon: <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9 M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" /> }
                            ].map((social, i) => (
                                <div 
                                    key={i} 
                                    style={{ 
                                        width: '38px', 
                                        height: '38px', 
                                        borderRadius: '10px', 
                                        backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: 'pointer', 
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }} 
                                    onMouseEnter={(e) => { 
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; 
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = social.color;
                                        e.currentTarget.querySelector('svg').style.stroke = social.color;
                                    }} 
                                    onMouseLeave={(e) => { 
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'; 
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                        e.currentTarget.querySelector('svg').style.stroke = 'white';
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.3s ease' }}>
                                        {social.icon}
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.03)', paddingTop: '1rem' }}>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.25)', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            &copy; {new Date().getFullYear()} DIPAAM | CONECTA ACADEMY LATAM <span style={{ margin: '0 1rem', opacity: 0.2 }}>|</span> Sistema de Información y Recursos Académicos
                        </p>
                    </div>
                </footer> */}
            </main>
        </div>
    )
}

export default Calendar
