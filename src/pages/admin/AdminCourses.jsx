import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'

const AdminCourses = () => {
    // Course State
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newCourse, setNewCourse] = useState({ title: '', description: '', thumbnail_url: '', instructor_name: '', instructor_avatar: '' })

    // Content/Lesson State
    const [showContentModal, setShowContentModal] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState(null)
    const [lessons, setLessons] = useState([])
    const [loadingLessons, setLoadingLessons] = useState(false)
    const [newLesson, setNewLesson] = useState({ title: '', type: 'video', url: '', description: '' })

    const fetchCourses = async () => {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select(`
                    *,
                    instructor:instructor_id (full_name)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setCourses(data)
        } catch (error) {
            console.error('Error fetching courses:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCourses()
    }, [])

    // --- Course Operations ---

    const handleCreateCourse = async (e) => {
        e.preventDefault()
        try {
            const { data: { session } } = await supabase.auth.getSession()

            const { data, error } = await supabase
                .from('courses')
                .insert([
                    {
                        title: newCourse.title,
                        description: newCourse.description,
                        thumbnail_url: newCourse.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                        instructor_id: session.user.id,
                        instructor_name: newCourse.instructor_name,
                        instructor_avatar: newCourse.instructor_avatar
                    }
                ])
                .select()

            if (error) throw error

            setCourses([data[0], ...courses]) // Add to UI
            setShowCreateModal(false)
            setNewCourse({ title: '', description: '', thumbnail_url: '', instructor_name: '', instructor_avatar: '' })
        } catch (error) {
            alert('Error creating course: ' + error.message)
        }
    }

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('Are you sure you want to delete this course?')) return

        try {
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId)

            if (error) throw error

            setCourses(courses.filter(c => c.id !== courseId))
        } catch (error) {
            alert('Error deleting course: ' + error.message)
        }
    }

    // --- Content/Lesson Operations ---

    const openContentModal = async (course) => {
        setSelectedCourse(course)
        setShowContentModal(true)
        setLessons([])
        await fetchLessons(course.id)
    }

    const fetchLessons = async (courseId) => {
        setLoadingLessons(true)
        try {
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('course_id', courseId)
                .order('order', { ascending: true })

            if (error) throw error
            setLessons(data || [])
        } catch (error) {
            console.error('Error fetching lessons:', error)
            alert('Error fetching course content.')
        } finally {
            setLoadingLessons(false)
        }
    }

    const handleAddLesson = async (e) => {
        e.preventDefault()
        if (!selectedCourse) return

        // Basic validation for URL
        if (newLesson.type === 'video') {
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
            if (!youtubeRegex.test(newLesson.url)) {
                alert('Please enter a valid YouTube URL.')
                return
            }
        }

        try {
            const lessonData = {
                course_id: selectedCourse.id,
                title: newLesson.title,
                video_url: newLesson.url,
                content_type: newLesson.type,
                description: newLesson.description,
                order: lessons.length + 1
            }

            const { data, error } = await supabase
                .from('lessons')
                .insert([lessonData])
                .select()

            if (error) throw error

            setLessons([...lessons, data[0]])
            setNewLesson({ title: '', type: 'video', url: '', description: '' })
        } catch (error) {
            alert('Error adding content: ' + error.message)
        }
    }

    const handleDeleteLesson = async (lessonId) => {
        if (!confirm('Remove this item?')) return
        try {
            const { error } = await supabase
                .from('lessons')
                .delete()
                .eq('id', lessonId)

            if (error) throw error
            setLessons(lessons.filter(l => l.id !== lessonId))
        } catch (error) {
            alert('Error deleting item: ' + error.message)
        }
    }

    return (
        <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex' }}>
            <AdminSidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>Course Management</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        + New Course
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {courses.map(course => (
                        <div key={course.id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
                            <div style={{ height: '160px', backgroundColor: '#e2e8f0' }}>
                                <img src={course.thumbnail_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>{course.title}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {course.description}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
                                    <span>Instructor: {course.instructor_name || course.instructor?.full_name || 'Admin'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => openContentModal(course)}
                                        style={{ flex: 1, padding: '0.5rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        Manage Content
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCourse(course.id)}
                                        style={{ padding: '0.5rem 1rem', backgroundColor: '#fee2e2', border: 'none', borderRadius: '6px', color: '#ef4444', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Course Modal */}
                {showCreateModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '500px', maxWidth: '90%' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Create New Course</h2>
                            <form onSubmit={handleCreateCourse}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Title</label>
                                    <input
                                        type="text"
                                        value={newCourse.title}
                                        onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                                    <textarea
                                        value={newCourse.description}
                                        onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                                        required
                                        rows="3"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Thumbnail URL</label>
                                    <input
                                        type="text"
                                        value={newCourse.thumbnail_url}
                                        onChange={e => setNewCourse({ ...newCourse, thumbnail_url: e.target.value })}
                                        placeholder="https://..."
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Instructor Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={newCourse.instructor_name}
                                        onChange={e => setNewCourse({ ...newCourse, instructor_name: e.target.value })}
                                        placeholder="e.g. Dr. Jane Doe"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Instructor Avatar URL (Optional)</label>
                                    <input
                                        type="text"
                                        value={newCourse.instructor_avatar}
                                        onChange={e => setNewCourse({ ...newCourse, instructor_avatar: e.target.value })}
                                        placeholder="https://..."
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>Create Course</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Manage Content Modal */}
                {showContentModal && selectedCourse && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '700px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Manage Content: {selectedCourse.title}</h2>
                                <button onClick={() => setShowContentModal(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                            </div>

                            {/* Add New Lesson Form */}
                            <form onSubmit={handleAddLesson} style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Add New Content</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#64748b' }}>Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={newLesson.title}
                                            onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#64748b' }}>Type</label>
                                        <select
                                            value={newLesson.type}
                                            onChange={e => setNewLesson({ ...newLesson, type: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                        >
                                            <option value="video">Video (YouTube)</option>
                                            <option value="link">External Link</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#64748b' }}>URL</label>
                                    <input
                                        type="url"
                                        required
                                        value={newLesson.url}
                                        onChange={e => setNewLesson({ ...newLesson, url: e.target.value })}
                                        placeholder="https://..."
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#64748b' }}>Description</label>
                                    <textarea
                                        value={newLesson.description}
                                        onChange={e => setNewLesson({ ...newLesson, description: e.target.value })}
                                        rows="2"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <button type="submit" style={{ backgroundColor: '#0f172a', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                                    Add Content
                                </button>
                            </form>

                            {/* Existing Lessons List */}
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Current Content</h3>
                                {loadingLessons ? (
                                    <p>Loading...</p>
                                ) : lessons.length === 0 ? (
                                    <p style={{ color: '#94a3b8' }}>No content added yet.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {lessons.map((lesson, index) => (
                                            <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                                <div style={{ marginRight: '1rem', color: '#cbd5e1', fontWeight: '600' }}>{index + 1}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600', color: '#334155' }}>{lesson.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', marginRight: '0.5rem' }}>
                                                            {lesson.content_type || 'video'}
                                                        </span>
                                                        <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', marginRight: '0.5rem' }}>
                                                            {lesson.video_url}
                                                        </a>
                                                        {lesson.description && <span style={{ color: '#94a3b8' }}>- {lesson.description.substring(0, 30)}...</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default AdminCourses
