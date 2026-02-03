import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Courses = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [courses, setCourses] = useState([])
    const [user, setUser] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState('Active') // Active, Completed
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true)
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    navigate('/')
                    return
                }

                setUser(session.user)

                setUser(session.user)

                // 0. Fetch Profile Avatar
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', session.user.id)
                    .single()

                if (profileData) {
                    setAvatarUrl(profileData.avatar_url)
                }

                // 1. Fetch Enrolled Courses
                // Fetch enrollments first, then courses (avoiding FK issue)
                const { data: enrollmentData, error: enrollmentError } = await supabase
                    .from('enrollments')
                    .select('id, course_id')
                    .eq('user_id', session.user.id)

                if (enrollmentError) {
                    console.warn("Error fetching enrollments:", enrollmentError)
                }

                if (enrollmentData && enrollmentData.length > 0) {
                    const courseIds = enrollmentData.map(e => e.course_id)

                    const { data: coursesData, error: coursesError } = await supabase
                        .from('courses')
                        .select('id, title, description, thumbnail_url')
                        .in('id', courseIds)

                    if (coursesError) console.error("Error fetching course details:", coursesError)

                    const coursesMap = (coursesData || []).reduce((acc, course) => {
                        acc[course.id] = course;
                        return acc;
                    }, {});

                    // Transform data
                    const formattedCourses = enrollmentData.map(enrollment => {
                        const course = coursesMap[enrollment.course_id];
                        if (!course) return null;

                        return {
                            id: course.id,
                            title: course.title,
                            description: course.description,
                            image: course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                            progress: Math.floor(Math.random() * 80) + 10,
                            status: 'Active'
                        }
                    }).filter(Boolean)

                    setCourses(formattedCourses)
                } else {
                    // If no enrollments, maybe fetch all courses (Catalog view) 
                    // or just show empty state/mock data for demonstration
                    const { data: allCourses } = await supabase.from('courses').select('*')

                    if (allCourses && allCourses.length > 0) {
                        // Show all courses as "Active" for demo purposes
                        const formattedCourses = allCourses.map(course => ({
                            id: course.id,
                            title: course.title,
                            description: course.description,
                            image: course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                            progress: 0,
                            status: 'Active'
                        }))
                        setCourses(formattedCourses)
                    } else {
                        // Fallback Mock Data if DB is empty
                        setCourses([
                            { id: 1, title: 'Design Thinking', progress: 45, status: 'Active', image: 'https://images.unsplash.com/photo-1558655146-d09347e0b7a9?auto=format&fit=crop&w=500&q=80' },
                            { id: 2, title: 'Data Science Basics', progress: 32, status: 'Active', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80' },
                            { id: 3, title: 'Creative Writing', progress: 78, status: 'Active', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=500&q=80' },
                            { id: 4, title: 'Marketing Fundamentals', progress: 20, status: 'Active', image: 'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=500&q=80' },
                            { id: 5, title: 'Financial Accounting', progress: 90, status: 'Completed', image: 'https://images.unsplash.com/photo-1554224155-984061941811?auto=format&fit=crop&w=500&q=80' },
                            { id: 6, title: 'Web Development', progress: 10, status: 'Active', image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=500&q=80' },
                        ])
                    }
                }

            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [navigate])

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filter === 'All' || course.status === filter
        return matchesSearch && matchesFilter
    })

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
    }

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>My Courses</h1>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: 'white',
                                    color: '#64748b',
                                    fontSize: '0.9rem',
                                    width: '240px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                            />
                            <svg
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                            >
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>

                        {/* Filter Dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    backgroundColor: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    color: '#0f172a',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                {filter}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            {showFilterDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    backgroundColor: 'white',
                                    border: '1px solid #f1f5f9',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    zIndex: 10,
                                    minWidth: '140px',
                                    overflow: 'hidden'
                                }}>
                                    {['Active', 'Completed'].map((opt) => (
                                        <div
                                            key={opt}
                                            onClick={() => { setFilter(opt); setShowFilterDropdown(false); }}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                color: filter === opt ? '#0f172a' : '#64748b',
                                                backgroundColor: filter === opt ? '#f8fafc' : 'white',
                                                transition: 'background 0.1s',
                                                fontWeight: filter === opt ? '600' : '400',
                                                ':hover': { backgroundColor: '#f8fafc' }
                                            }}
                                        >
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* User Avatar (Mini) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                            <img
                                src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                alt="Profile"
                            />
                            <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{user?.user_metadata?.full_name || 'User'}</p>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Student</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map(course => (
                            <div key={course.id}
                                onClick={() => navigate(`/course/${course.id}`)}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '20px',
                                    padding: '1rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'pointer',
                                    ':hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
                                }}>
                                <div style={{ height: '180px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.25rem', backgroundColor: '#f1f5f9' }}>
                                    <img
                                        src={course.image}
                                        alt={course.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>

                                <div style={{ padding: '0 0.5rem 0.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem', lineHeight: '1.4' }}>
                                        {course.title}
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                                            <span>Progress</span>
                                            <span>{course.progress}%</span>
                                        </div>
                                        <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${course.progress}%`, height: '100%', backgroundColor: '#64748b', borderRadius: '3px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                            <p>No courses found matching your criteria.</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    )
}

export default Courses
