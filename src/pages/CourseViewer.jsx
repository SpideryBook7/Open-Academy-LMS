import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactPlayer from 'react-player'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'

const CourseViewer = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [course, setCourse] = useState(null)
    const [lessons, setLessons] = useState([]) // All content
    const [activeLesson, setActiveLesson] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('lessons') // 'lessons' (videos) or 'materials' (links)

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
                setLessons(lessonsData || [])

                // Set first video as active if available
                if (lessonsData && lessonsData.length > 0) {
                    const firstVideo = lessonsData.find(l => l.content_type === 'video' || !l.content_type)
                    if (firstVideo) {
                        setActiveLesson(firstVideo)
                    }
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

    // Filter content
    const videoLessons = lessons.filter(l => l.content_type === 'video' || !l.content_type)
    const materialResources = lessons.filter(l => l.content_type === 'link')

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
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Main Content Area (Player) */}
                    <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                        {activeLesson ? (
                            <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
                                {/* Video Player */}
                                <div style={{
                                    aspectRatio: '16/9',
                                    backgroundColor: 'black',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                    marginBottom: '2rem'
                                }}>
                                    <ReactPlayer
                                        url={activeLesson.video_url}
                                        width="100%"
                                        height="100%"
                                        controls={true}
                                        playing={true} // Auto-play when switched
                                        config={{
                                            youtube: {
                                                playerVars: { showinfo: 1 }
                                            }
                                        }}
                                    />
                                </div>

                                {/* Title & Instructor */}
                                <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>{activeLesson.title}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                        <span>Instructor: {course.instructor?.full_name || 'Staff'}</span>
                                    </div>
                                </div>

                                {/* Description Box (Yellow area requested) */}
                                <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#334155' }}>Description</h3>
                                    <p style={{ color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                        {activeLesson.description || 'No description available for this lesson.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
                                {videoLessons.length > 0 ? 'Select a video to start.' : 'No videos available in this course.'}
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar (Tabs & Playlist) */}
                    <div style={{ width: '350px', backgroundColor: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                            <button
                                onClick={() => setActiveTab('lessons')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    border: 'none',
                                    backgroundColor: activeTab === 'lessons' ? 'white' : '#f8fafc',
                                    borderBottom: activeTab === 'lessons' ? '3px solid #3b82f6' : '3px solid transparent',
                                    color: activeTab === 'lessons' ? '#0f172a' : '#64748b',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Lessons ({videoLessons.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('materials')}
                                style={{
                                    flex: 1,
                                    padding: '1rem',
                                    border: 'none',
                                    backgroundColor: activeTab === 'materials' ? 'white' : '#f8fafc',
                                    borderBottom: activeTab === 'materials' ? '3px solid #3b82f6' : '3px solid transparent',
                                    color: activeTab === 'materials' ? '#0f172a' : '#64748b',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Materials ({materialResources.length})
                            </button>
                        </div>

                        {/* List Content */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {activeTab === 'lessons' ? (
                                <div>
                                    {videoLessons.map((lesson, index) => (
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
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🎥 Video</span>
                                            </div>
                                        </div>
                                    ))}
                                    {videoLessons.length === 0 && (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            No video lessons found.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {materialResources.map((resource, index) => (
                                        <div
                                            key={resource.id}
                                            style={{
                                                padding: '1rem 1.5rem',
                                                borderBottom: '1px solid #f1f5f9',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                                                {resource.title}
                                            </div>
                                            {resource.description && (
                                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                                    {resource.description}
                                                </p>
                                            )}
                                            <a
                                                href={resource.video_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.5rem 1rem',
                                                    backgroundColor: '#f1f5f9',
                                                    color: '#3b82f6',
                                                    textDecoration: 'none',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                🔗 Open Link
                                            </a>
                                        </div>
                                    ))}
                                    {materialResources.length === 0 && (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            No materials found.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default CourseViewer
