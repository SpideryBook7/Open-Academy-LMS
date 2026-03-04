import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'

const AdminDashboard = () => {
    const navigate = useNavigate()
    const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0 })
    const [loading, setLoading] = useState(true)
    const [courses, setCourses] = useState([])
    const [showCourseSelector, setShowCourseSelector] = useState(false)
    const [targetFormat, setTargetFormat] = useState('')

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Users Count
                const { count: userCount, error: userError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                if (userError) throw userError

                // Fetch Courses Count
                const { count: courseCount, error: courseError } = await supabase
                    .from('courses')
                    .select('*', { count: 'exact', head: true })
                if (courseError) throw courseError

                // Fetch Enrollments Count
                const { count: enrollmentCount, error: enrollmentError } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })
                if (enrollmentError) throw enrollmentError

                setStats({
                    users: userCount || 0,
                    courses: courseCount || 0,
                    enrollments: enrollmentCount || 0
                })

            } catch (error) {
                console.error('Error fetching admin stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()

        const fetchCoursesList = async () => {
            const { data } = await supabase.from('courses').select('id, title')
            if (data) setCourses(data)
        }
        fetchCoursesList()
    }, [])

    const handleQuickContent = (format) => {
        setTargetFormat(format)
        setShowCourseSelector(true)
    }

    const navigateToContent = (courseId) => {
        setShowCourseSelector(false)
        navigate('/admin/courses', {
            state: {
                courseId,
                targetFormat,
                openContentModal: true
            }
        })
    }

    if (loading) {
        return (
            <div style={{ backgroundColor: 'var(--background-color)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>Cargando panel...</p>
            </div>
        )
    }

    return (
        <div style={{ backgroundColor: 'var(--background-color)', minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <AdminSidebar />

            {/* Premium Decorative Glows (Same as Student Dashboard) */}
            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, minHeight: '100vh' }}>
                <style>{`
                    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                `}</style>

                <header style={{ marginBottom: '3.5rem', animation: 'fadeInDown 0.8s ease-out' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
                        Panel del <span style={{ color: 'var(--accent-gold)', textShadow: '0 0 20px rgba(207, 170, 3, 0.92)' }}>Administrador</span>
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', fontWeight: '500' }}>Gestión centralizada de la plataforma SIRA.</p>
                </header>

                <div style={{ flex: 1, animation: 'fadeInUp 0.8s ease-out 0.2s both' }}>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3.5rem' }}>

                        {/* Stat Card 1 - Users */}
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            padding: '1.8rem',
                            borderRadius: '28px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            cursor: 'default'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.8rem', backgroundColor: '#eff6ff', borderRadius: '18px', color: '#3b82f6' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                </div>
                                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>Usuarios totales</span>
                            </div>
                            <p style={{ fontSize: '3rem', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{stats.users}</p>
                        </div>

                        {/* Stat Card 2 - Courses */}
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            padding: '1.8rem',
                            borderRadius: '28px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            cursor: 'default'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.8rem', backgroundColor: '#f0fdf4', borderRadius: '18px', color: '#22c55e' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                                </div>
                                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>Cursos totales</span>
                            </div>
                            <p style={{ fontSize: '3rem', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{stats.courses}</p>
                        </div>

                        {/* Stat Card 3 - Enrollments */}
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            padding: '1.8rem',
                            borderRadius: '28px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            cursor: 'default'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.8rem', backgroundColor: '#fff7ed', borderRadius: '18px', color: '#f97316' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                </div>
                                <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>Cursos activos</span>
                            </div>
                            <p style={{ fontSize: '3rem', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>{stats.enrollments}</p>
                        </div>

                    </div>
                </div>

                {/* Recent Activity Card */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '2rem', flex: 1, animation: 'fadeInUp 0.8s ease-out 0.4s both' }}>
                    {/* Left Column: Activity */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '28px',
                        padding: '2.5rem',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        cursor: 'default'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                        }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>Actividad reciente del sistema</h2>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: '24px', border: '2px dashed rgba(0, 0, 0, 0.05)', minHeight: '300px' }}>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '500', fontStyle: 'italic' }}>Los registros de actividad pronto estarán disponibles...</p>
                        </div>
                    </div>

                    {/* Right Column: Information & Quick Access */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* System status badge */}
                        <div style={{ backgroundColor: 'rgba(16, 185, 121, 0.1)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(16, 185, 121, 0.2)', color: '#ffffffff', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>El sistema opera con normalidad</span>
                        </div>

                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '28px',
                            padding: '2rem',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-10px)';
                                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                            }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem' }}>Accesos Directos</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { label: 'Agregar Usuario', action: () => navigate('/admin/users', { state: { openCreateModal: true } }), icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20 18L17 18M17 18L14 18M17 18V15M17 18V21M11 21H4C4 17.134 7.13401 14 11 14C11.695 14 12.3663 14.1013 13 14.2899M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> },
                                    { label: 'Agregar Curso', action: () => navigate('/admin/courses', { state: { openCreateModal: true } }), icon: <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6M8 3v9l3-3 3 3V3M8 3h6m0 0h4a2 2 0 0 1 2 2v7m-1 4v3m0 3v-3m0 0h3m-3 0h-3"></path></g></svg> },
                                    { label: 'Agregar Clase', action: () => handleQuickContent('video'), icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                                    { label: 'Agregar Material', action: () => handleQuickContent('link'), icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20 10.5V6.8C20 5.11984 20 4.27976 19.673 3.63803C19.3854 3.07354 18.9265 2.6146 18.362 2.32698C17.7202 2 16.8802 2 15.2 2H8.8C7.11984 2 6.27976 2 5.63803 2.32698C5.07354 2.6146 4.6146 3.07354 4.32698 3.63803C4 4.27976 4 5.11984 4 6.8V17.2C4 18.8802 4 19.7202 4.32698 20.362C4.6146 20.9265 5.07354 21.3854 5.63803 21.673C6.27976 22 7.11984 22 8.8 22H12M14 11H8M10 15H8M16 7H8M18 21V15M15 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> },
                                    { label: 'Agregar Examen', action: () => handleQuickContent('quiz'), icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
                                ].map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={item.action}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.8rem',
                                            backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                            border: '1px solid rgba(0, 0, 0, 0.05)',
                                            borderRadius: '20px',
                                            color: '#1e293b',
                                            fontWeight: '700',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            textAlign: 'left'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                                            e.currentTarget.style.color = 'orange';
                                            e.currentTarget.style.transform = 'translateX(8px)';
                                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 71, 186, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
                                            e.currentTarget.style.color = '#1e293b';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{ backgroundColor: 'white', padding: '0.6rem', borderRadius: '12px', display: 'flex', color: 'inherit' }}>
                                            {item.icon}
                                        </div>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Selector Modal for Quick Content */}
                {showCourseSelector && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', width: '500px', maxWidth: '95%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', position: 'relative', overflow: 'hidden', animation: 'scaleIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                                        Selecciona un <span style={{ color: '#3b82f6' }}>Curso</span>
                                    </h3>
                                    <button onClick={() => setShowCourseSelector(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>

                                <p style={{ color: '#64748b', marginBottom: '1.5rem', fontWeight: '500' }}>Para agregar un {targetFormat === 'video' ? 'clase' : targetFormat === 'link' ? 'material' : 'examen'}, primero elige el curso destino:</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem', scrollbarWidth: 'thin' }}>
                                    {courses.length > 0 ? courses.map(course => (
                                        <button
                                            key={course.id}
                                            onClick={() => navigateToContent(course.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '1.25rem',
                                                backgroundColor: '#f8fafc',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '16px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            <span style={{ fontWeight: '700', color: '#1e293b' }}>{course.title}</span>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                        </button>
                                    )) : (
                                        <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>No hay cursos disponibles actualmente.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Section */}
                <footer style={{
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
                                CONECTA <span style={{ mx: '0.5rem', opacity: 0.3 }}>•</span> Sistema de Información y Recursos Académicos
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[
                                { color: '#1877F2', icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
                                {
                                    color: '#E4405F', icon: (
                                        <>
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                        </>
                                    )
                                },
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
                </footer>
            </main>
        </div>
    )
}

export default AdminDashboard
