import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'

const AdminDashboard = () => {
    const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Users Count
                const { count: userCount, error: userError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })

                // Fetch Courses Count
                const { count: courseCount, error: courseError } = await supabase
                    .from('courses')
                    .select('*', { count: 'exact', head: true })

                // Fetch Enrollments Count
                const { count: enrollmentCount, error: enrollmentError } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })

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
    }, [])

    return (
        <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex' }}>
            <AdminSidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginBottom: '2rem' }}>Admin Dashboard</h1>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>

                    {/* Stat Card 1 */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '12px', color: '#3b82f6' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Total Users</span>
                        </div>
                        <p style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>{stats.users}</p>
                    </div>

                    {/* Stat Card 2 */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '12px', color: '#22c55e' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Total Courses</span>
                        </div>
                        <p style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>{stats.courses}</p>
                    </div>

                    {/* Stat Card 3 */}
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: '#fff7ed', borderRadius: '12px', color: '#f97316' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Active Enrollments</span>
                        </div>
                        <p style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>{stats.enrollments}</p>
                    </div>

                </div>

                {/* Recent Activity (Placeholder) */}
                <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>Recent System Activity</h2>
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>Activity logs coming soon...</p>
                </div>

            </main>
        </div>
    )
}

export default AdminDashboard
