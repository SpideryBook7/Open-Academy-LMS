import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import logoConecta from '../assets/LOGO-CONECTA.png'
import logoDipaam from '../assets/LOGO DIPAAM RESPLANDOR.png'

const Sidebar = () => {
    const location = useLocation()
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const checkRole = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()

                if (data?.role === 'admin') {
                    setIsAdmin(true)
                }
            }
        }
        checkRole()
    }, [])

    const menuItems = [
        { name: 'Inicio', path: '/dashboard', icon: <><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></> },
        { name: 'Cursos', path: '/courses', icon: <><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></> },
        { name: 'Materiales', path: '/materials', icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></> },
        { name: 'Calendario', path: '/calendar', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></> },
    ]

    const bottomItems = [
        ...(isAdmin ? [{ name: 'Panel de Admin', path: '/admin/dashboard', icon: <><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></> }] : []),
        { name: 'Perfil', path: '/profile', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></> },
        { name: 'Cerrar sesión', path: '/', icon: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></> },
    ]

    return (
        <aside style={{
            width: '260px',
            height: '100vh',
            backgroundColor: 'var(--background-sidebar)',
            borderRight: 'none',
            padding: '2rem 1.5rem',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <style>{`
                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.875rem 1rem;
                    borderRadius: 8px;
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }

                .sidebar-link:hover {
                    background-color: #0023bec0 !important;
                    color: white !important;
                }

                .sidebar-link:hover svg {
                    color: white !important;
                    opacity: 1 !important;
                }
            `}</style>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.7rem', marginBottom: '3.5rem' }}>
                <img
                    src={logoDipaam}
                    alt="Logo de DIPAAM"
                    style={{
                        height: '3.9rem',
                        objectFit: 'contain',
                        backgroundColor: 'white',
                        borderRadius: '10px',
                        padding: '0.1rem',
                        transition: 'all 0.3s ease',
                        cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                    }}
                />
                <div style={{ width: '1px', height: '80px', background: '#e2e2e2ff' }}></div>
                <img
                    src={logoConecta}
                    alt="Logo de CONECTA"
                    style={{
                        height: '3.9rem',
                        objectFit: 'contain',
                        backgroundColor: 'white',
                        borderRadius: '10px',
                        padding: '0.1rem',
                        transition: 'all 0.3s ease',
                        cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                    }}
                />
            </div>

            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none' }}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <li key={item.name} style={{ marginBottom: '0.5rem' }}>
                                <Link
                                    to={item.path}
                                    className="sidebar-link"
                                    style={{
                                        color: isActive ? 'var(--primary-color)' : '#ffffff',
                                        backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                                        borderLeft: isActive ? '3px solid rgba(0, 36, 197, 1)' : '3px solid transparent',
                                        fontWeight: isActive ? '600' : '400',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isActive ? 1 : 0.7, transition: 'all 0.3s' }}>
                                        {item.icon}
                                    </svg>
                                    {item.name}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <ul style={{ listStyle: 'none' }}>
                    {bottomItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <li key={item.name} style={{ marginBottom: '0.5rem' }}>
                                <Link
                                    to={item.path}
                                    className="sidebar-link"
                                    style={{
                                        color: isActive ? 'var(--primary-color)' : '#ffffff',
                                        backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                                        borderLeft: isActive ? '3px solid #2300e7e8' : '3px solid transparent',
                                        fontWeight: isActive ? '600' : '400',
                                        borderRadius: '8px',
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isActive ? 1 : 0.7, transition: 'all 0.3s' }}>
                                        {item.icon}
                                    </svg>
                                    {item.name}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </aside>
    )
}

export default Sidebar
