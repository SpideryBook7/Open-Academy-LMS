import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactPlayer from 'react-player'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'

const CourseViewer = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [course, setCourse] = useState(null)
    const [lessons, setLessons] = useState([])
    const [activeLesson, setActiveLesson] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(true)

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                // 1. Fetch Course Info
                const { data: courseData, error: courseError } = await supabase
                    .from('courses')
                    .select('*, instructor:instructor_id(full_name)')
                    .eq('id', id)
                    .single()

                if (courseError) throw courseError
                setCourse(courseData)

                // 2. Fetch Lessons
                const { data: lessonsData, error: lessonsError } = await supabase
                    .from('lessons')
                    .select('*')
                    .eq('course_id', id)
                    .order('order', { ascending: true })

                if (lessonsError) throw lessonsError
                setLessons(lessonsData)

                if (lessonsData && lessonsData.length > 0) {
                    setActiveLesson(lessonsData[0])
                }

            } catch (error) {
                console.error('Error fetching course:', error)
                navigate('/courses')
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchCourseDetails()
        }
    }, [id, navigate])

    const handleLessonClick = (lesson) => {
        setActiveLesson(lesson)
    }

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#64748b' }}>Loading Course...</div>

    if (!course) return null

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* Header / Nav */}
                <div style={{ padding: '1rem 2rem', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <button onClick={() => navigate('/courses')} style={{ border: 'none', background: 'none', color: '#64748b', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                            &larr; Back to Courses
                        </button>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{course.title}</h1>
                    </div>
                    {/* Toggle Playlist Button (Mobile/Immersive view) could go here */}
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Main Content Area (Player) */}
                    <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                        {activeLesson ? (
                            <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
                                <div style={{
                                    aspectRatio: '16/9',
                                    backgroundColor: 'black',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                    marginBottom: '2rem'
                                }}>
                                    {activeLesson.content_type === 'link' ? (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', gap: '1rem' }}>
                                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                            </svg>
                                            <p style={{ fontSize: '1.2rem' }}>External Resource</p>
                                            <a
                                                href={activeLesson.video_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    padding: '0.75rem 1.5rem',
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    textDecoration: 'none',
                                                    borderRadius: '8px',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Open Link
                                            </a>
                                        </div>
                                    ) : (
                                        <ReactPlayer
                                            url={activeLesson.video_url}
                                            width="100%"
                                            height="100%"
                                            controls
                                            playing={false}
                                        />
                                    )}
                                </div>

                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>{activeLesson.title}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                        <span>Instructor: {course.instructor?.full_name || 'Staff'}</span>
                                        {/* Future: Add 'Complete' button here */}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
                                Select a lesson to start
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar (Playlist) */}
                    <div style={{ width: '350px', backgroundColor: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>Course Content</h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{lessons.length} items</p>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {lessons.map((lesson, index) => (
                                <div
                                    key={lesson.id}
                                    onClick={() => handleLessonClick(lesson)}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        backgroundColor: activeLesson?.id === lesson.id ? '#f0f9ff' : 'white',
                                        borderLeft: activeLesson?.id === lesson.id ? '4px solid #3b82f6' : '4px solid transparent',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: activeLesson?.id === lesson.id ? '#0f172a' : '#334155', marginBottom: '0.25rem' }}>
                                        {index + 1}. {lesson.title}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {lesson.content_type === 'link' ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                🔗 Link
                                            </span>
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                🎥 Video
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default CourseViewer
