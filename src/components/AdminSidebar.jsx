import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logoConecta from '../assets/LOGO-CONECTA.png'
import logoDipaam from '../assets/LOGO DIPAAM RESPLANDOR.png'
import manualEstudiante from '../assets/Manual_Estudiante_SIRA_20260317_v1.0.pdf'
import manualAdmin from '../assets/Manual_Administrador_SIRA_20260319_v1.1.pdf'
const AdminSidebar = () => {
    const location = useLocation()
    const [isManualOpen, setIsManualOpen] = useState(false)

    const menuItems = [
        { name: 'Inicio', path: '/admin/dashboard', icon: <><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></> },
        { name: 'Usuarios', path: '/admin/users', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></> },
        { name: 'Especialidades', path: '/admin/courses', icon: <><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></> },
        // { name: 'Materiales', path: '/admin/materials', icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></> },
    ]

    const bottomItems = [
        { name: 'Vista de Estudiante', path: '/dashboard', icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></> },
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
            flexDirection: 'column',
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

                .sidebar-link-sub {
                    transition: all 0.3s ease;
                }
                .sidebar-link-sub:hover {
                    background-color: rgba(255, 255, 255, 0.1) !important;
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
                <ul style={{ listStyle: 'none', padding: 0 }}>
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

                    {/* Manuales Dropdown */}
                    <li style={{ marginBottom: '0.5rem' }}>
                        <div
                            onClick={() => setIsManualOpen(!isManualOpen)}
                            className="sidebar-link"
                            style={{
                                color: '#ffffff',
                                backgroundColor: 'transparent',
                                borderLeft: '3px solid transparent',
                                fontWeight: '400',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, transition: 'all 0.3s' }}>
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                </svg>
                                Manuales
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isManualOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                        
                        {/* Dropdown Options */}
                        <div style={{
                            maxHeight: isManualOpen ? '200px' : '0',
                            overflow: 'hidden',
                            transition: 'max-height 0.3s ease-in-out',
                            paddingLeft: '2.8rem',
                            marginTop: isManualOpen ? '0.2rem' : '0'
                        }}>
                            <a
                                href={manualEstudiante}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sidebar-link-sub"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    padding: '0.6rem 1rem',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    opacity: 0.8,
                                    fontSize: '0.9rem',
                                    marginBottom: '0.2rem',
                                    borderRadius: '6px',
                                    backgroundColor: 'transparent',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                </svg>
                                Estudiante
                            </a>
                            <a
                                href={manualAdmin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sidebar-link-sub"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    padding: '0.6rem 1rem',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    opacity: 0.8,
                                    fontSize: '0.9rem',
                                    borderRadius: '6px',
                                    backgroundColor: 'transparent',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                Administrador
                            </a>
                        </div>
                    </li>
                </ul>
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <ul style={{ listStyle: 'none', padding: 0 }}>
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
            </div>
        </aside>
    )
}

export default AdminSidebar
