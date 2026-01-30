import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const AdminSidebar = () => {
    const location = useLocation()

    const menuItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></> },
        { name: 'Users', path: '/admin/users', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></> },
        { name: 'Courses', path: '/admin/courses', icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></> },
    ]

    const bottomItems = [
        { name: 'Student View', path: '/dashboard', icon: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></> },
    ]

    return (
        <aside style={{
            width: '260px',
            height: '100vh',
            backgroundColor: '#0f172a', // Dark theme for Admin
            color: 'white',
            borderRight: '1px solid #1e293b',
            padding: '2rem 1.5rem',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3.5rem' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>A</div>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white', letterSpacing: '-0.5px' }}>LUMINA ADMIN</span>
            </div>

            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <li key={item.name} style={{ marginBottom: '0.5rem' }}>
                                <Link
                                    to={item.path}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.875rem 1rem',
                                        borderRadius: '8px',
                                        color: isActive ? 'white' : '#94a3b8',
                                        backgroundColor: isActive ? '#1e293b' : 'transparent',
                                        borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                                        fontWeight: isActive ? '600' : '500',
                                        transition: 'all 0.2s',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isActive ? 1 : 0.7 }}>
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
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {bottomItems.map((item) => (
                        <li key={item.name} style={{ marginBottom: '0.5rem' }}>
                            <Link
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '8px',
                                    color: '#94a3b8',
                                    fontWeight: '500',
                                    transition: 'all 0.2s',
                                    textDecoration: 'none'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                                    {item.icon}
                                </svg>
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    )
}

export default AdminSidebar
