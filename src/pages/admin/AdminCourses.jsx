import React, { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'

const AdminCourses = () => {
    const location = useLocation()
    // Course State
    const [courses, setCourses] = useState([])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newCourse, setNewCourse] = useState({ title: '', description: '', thumbnail_url: '', instructor_name: '', instructor_avatar: '' })

    // Content/Lesson State
    const [showContentModal, setShowContentModal] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState(null)
    const [lessons, setLessons] = useState([])
    const [loadingLessons, setLoadingLessons] = useState(false)
    const [newLesson, setNewLesson] = useState({ title: '', type: 'video', url: '', description: '' })
    const [quizQuestions, setQuizQuestions] = useState([{ question: '', options: ['', ''], correctAnswer: 0 }])
    const [searchTerm, setSearchTerm] = useState('')

    // Quiz Handlers
    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...quizQuestions];
        newQuestions[index][field] = value;
        setQuizQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...quizQuestions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuizQuestions(newQuestions);
    };

    const addOption = (qIndex) => {
        const newQuestions = [...quizQuestions];
        newQuestions[qIndex].options.push('');
        setQuizQuestions(newQuestions);
    };

    const removeOption = (qIndex, oIndex) => {
        const newQuestions = [...quizQuestions];
        if (newQuestions[qIndex].options.length > 2) {
            newQuestions[qIndex].options.splice(oIndex, 1);
            if (newQuestions[qIndex].correctAnswer >= newQuestions[qIndex].options.length) {
                newQuestions[qIndex].correctAnswer = newQuestions[qIndex].options.length - 1;
            } else if (newQuestions[qIndex].correctAnswer === oIndex) {
                newQuestions[qIndex].correctAnswer = 0;
            }
            setQuizQuestions(newQuestions);
        }
    };

    const addQuestion = () => {
        setQuizQuestions([...quizQuestions, { question: '', options: ['', ''], correctAnswer: 0 }]);
    };

    const removeQuestion = (qIndex) => {
        if (quizQuestions.length > 1) {
            const newQuestions = [...quizQuestions];
            newQuestions.splice(qIndex, 1);
            setQuizQuestions(newQuestions);
        }
    };

    const fetchCourses = useCallback(async () => {
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
            console.error('Error al cargar los cursos:', error)
        }
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
            alert('Error al crear el curso: ' + error.message)
        }
    }

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este curso y todo su contenido (lecciones, inscripciones)?\n\nEsta acción no se puede deshacer.')) return

        try {
            // Eliminar inscripciones asociadas para no dejar "Cursos desconocidos" en los usuarios
            const { error: enrollmentsError } = await supabase
                .from('enrollments')
                .delete()
                .eq('course_id', courseId)

            if (enrollmentsError) console.error("Error deleting enrollments:", enrollmentsError);

            // Eliminar lecciones del curso
            const { error: lessonsError } = await supabase
                .from('lessons')
                .delete()
                .eq('course_id', courseId)

            if (lessonsError) console.error("Error deleting lessons:", lessonsError);

            // Finalmente, eliminar el curso
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId)

            if (error) throw error

            setCourses(courses.filter(c => c.id !== courseId))
        } catch (error) {
            alert('Error al eliminar el curso: ' + error.message)
        }
    }

    // --- Content/Lesson Operations ---

    const fetchLessons = useCallback(async (courseId) => {
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
            console.error('Error al cargar el contenido del curso:', error)
            alert('Error al cargar el contenido del curso.')
        } finally {
            setLoadingLessons(false)
        }
    }, [])

    const openContentModal = useCallback(async (course) => {
        setSelectedCourse(course)
        setShowContentModal(true)
        setLessons([])
        setQuizQuestions([{ question: '', options: ['', ''], correctAnswer: 0 }])
        await fetchLessons(course.id)
    }, [fetchLessons])

    useEffect(() => {
        fetchCourses()

        const handleQuickAccess = async () => {
            if (location.state?.openCreateModal && !location.state?.courseId) {
                setShowCreateModal(true)
                window.history.replaceState({}, '')
                return
            }

            if (location.state?.openContentModal && location.state?.courseId) {
                const courseId = location.state.courseId
                const format = location.state.targetFormat

                const { data: courseData } = await supabase
                    .from('courses')
                    .select('*, instructor:instructor_id (full_name)')
                    .eq('id', courseId)
                    .single()

                if (courseData) {
                    openContentModal(courseData)
                    if (format) {
                        setNewLesson(prev => ({
                            ...prev,
                            type: format,
                            url: ''
                        }))
                    }
                }
                window.history.replaceState({}, '')
            }
        }

        handleQuickAccess()
    }, [location.state, openContentModal, fetchLessons, fetchCourses])

    const handleAddLesson = async (e) => {
        e.preventDefault()
        if (!selectedCourse) return

        let finalUrl = newLesson.url;

        // Basic validation
        if (newLesson.type === 'video') {
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
            if (!youtubeRegex.test(newLesson.url)) {
                alert('Por favor, introduce una URL de YouTube válida.')
                return
            }
        } else if (newLesson.type === 'quiz') {
            if (quizQuestions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) {
                alert('Por favor completa todas las preguntas y opciones del cuestionario.')
                return
            }
            finalUrl = JSON.stringify(quizQuestions)
        }

        try {
            const lessonData = {
                course_id: selectedCourse.id,
                title: newLesson.title,
                video_url: finalUrl,
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
            setQuizQuestions([{ question: '', options: ['', ''], correctAnswer: 0 }])
        } catch (error) {
            alert('Error al agregar contenido: ' + error.message)
        }
    }

    const handleDeleteLesson = async (lessonId) => {
        if (!confirm('¿Eliminar este elemento?')) return
        try {
            const { error } = await supabase
                .from('lessons')
                .delete()
                .eq('id', lessonId)

            if (error) throw error
            setLessons(lessons.filter(l => l.id !== lessonId))
        } catch (error) {
            alert('Error al eliminar el elemento: ' + error.message)
        }
    }

    return (
        <div style={{ backgroundColor: 'var(--background-color)', minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <AdminSidebar />

            {/* Premium Decorative Glows */}
            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, minHeight: '100vh' }}>
                <style>{`
                    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                `}</style>

                <div style={{ flex: 1 }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem', animation: 'fadeInDown 0.8s ease-out' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
                                Gestión de <span style={{ color: 'var(--accent-gold)', textShadow: '0 0 20px rgba(207, 170, 3, 0.92)' }}>Cursos</span>
                            </h1>
                            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', fontWeight: '500' }}>Crea y administra el catálogo educativo de la academia.</p>
                        </div>

                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Buscar cursos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        padding: '0.8rem 1.2rem 0.8rem 2.8rem',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: '#ffffff',
                                        width: '320px',
                                        backdropFilter: 'blur(10px)',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        transition: 'all 0.3s'
                                    }}
                                    onFocus={(e) => { e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'var(--accent-gold)'; }}
                                    onBlur={(e) => { e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                                />
                                <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.5)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                style={{
                                    padding: '0.8rem 1.6rem',
                                    backgroundColor: 'var(--accent-color, #3b82f6)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)'; }}
                            >
                                + Nuevo Curso
                            </button>
                        </div>
                    </header>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem', animation: 'fadeInUp 0.8s ease-out 0.2s both' }}>
                        {courses.filter(course =>
                            course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.description?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length > 0 ? (
                            courses.filter(course =>
                                course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                course.description?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map(course => (
                                <div
                                    key={course.id}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.94)',
                                        borderRadius: '32px',
                                        overflow: 'hidden',
                                        boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.07)',
                                        backdropFilter: 'blur(25px)',
                                        border: '1px solid rgba(255, 255, 255, 0.8)',
                                        transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        animation: 'fadeInUp 0.6s ease-out'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-12px)';
                                        e.currentTarget.style.boxShadow = '0 35px 70px -15px rgba(0, 0, 0, 0.15)';
                                        e.currentTarget.style.borderColor = 'rgba(207, 162, 3, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(0, 0, 0, 0.07)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                                    }}
                                >
                                    <div style={{ height: '200px', backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                                        <img src={course.thumbnail_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                        />
                                        <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', padding: '0.4rem 0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '14px', fontSize: '0.75rem', fontWeight: '800', color: '#f97316', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', letterSpacing: '0.5px' }}>
                                            CURSO
                                        </div>
                                    </div>
                                    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.8rem', lineHeight: '1.3' }}>{course.title}</h3>
                                        <p style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '1.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: '500', lineHeight: '1.6', flex: 1 }}>
                                            {course.description}
                                        </p>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.8rem', padding: '0.8rem', backgroundColor: 'rgba(248, 250, 252, 0.8)', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
                                            <img
                                                src={course.instructor_avatar || 'https://ui-avatars.com/api/?name=' + (course.instructor_name || 'A')}
                                                alt="Instructor"
                                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DOCENTE</span>
                                                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '700' }}>{course.instructor_name || course.instructor?.full_name || 'Academia'}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button
                                                onClick={() => openContentModal(course)}
                                                style={{ flex: 1, padding: '0.9rem', backgroundColor: '#3b82f6', border: 'none', borderRadius: '16px', color: 'white', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 6px 15px rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                                Contenido
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCourse(course.id)}
                                                style={{ padding: '0.9rem', backgroundColor: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: '16px', color: '#ef4444', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fee2e2'; e.currentTarget.style.transform = 'scale(1)'; }}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                gridColumn: '1 / -1',
                                padding: '6rem 2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '32px',
                                border: '2px dashed rgba(255, 255, 255, 0.15)',
                                animation: 'fadeInUp 0.6s ease-out'
                            }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '30px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '2rem',
                                    color: 'rgba(255, 255, 255, 0.3)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="12"></line><line x1="11" y1="14" x2="11.01" y2="14"></line></svg>
                                </div>
                                <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>No se encontraron cursos</h3>
                                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.1rem', textAlign: 'center', maxWidth: '450px', lineHeight: '1.6' }}>
                                    No pudimos encontrar ningún resultado para "<span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{searchTerm}</span>".
                                    <br />Intenta verificar la ortografía o usa términos más generales.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Course Modal - Premium Redesign */}
                {showCreateModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', width: '550px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(255, 255, 255, 0.8)', position: 'relative', overflow: 'hidden', animation: 'scaleIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
                            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.05) 0%, transparent 70%)', zIndex: 0 }}></div>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>Nuevo Curso</h2>
                                </div>
                                <form onSubmit={handleCreateCourse}>
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Título del curso</label>
                                        <input
                                            type="text"
                                            value={newCourse.title}
                                            onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                                            required
                                            placeholder="Psicología"
                                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', transition: 'all 0.2s ease', outline: 'none' }}
                                            onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.1)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Descripción del curso</label>
                                        <textarea
                                            value={newCourse.description}
                                            onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                                            required
                                            rows="3"
                                            placeholder="Psicología es el estudio científico de la mente y el comportamiento humano. Este curso hablará de..."
                                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', resize: 'none', transition: 'all 0.2s ease', outline: 'none' }}
                                            onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.1)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Imagen del instructor (URL)</label>
                                            <input
                                                type="text"
                                                value={newCourse.instructor_avatar}
                                                onChange={e => setNewCourse({ ...newCourse, instructor_avatar: e.target.value })}
                                                placeholder="https://..."
                                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', outline: 'none' }}
                                                onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.backgroundColor = 'white'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Nombre del instructor</label>
                                            <input
                                                type="text"
                                                value={newCourse.instructor_name}
                                                onChange={e => setNewCourse({ ...newCourse, instructor_name: e.target.value })}
                                                placeholder="John Doe"
                                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', outline: 'none' }}
                                                onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.backgroundColor = 'white'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Imagen del video (URL)</label>
                                        <input
                                            type="text"
                                            value={newCourse.thumbnail_url}
                                            onChange={e => setNewCourse({ ...newCourse, thumbnail_url: e.target.value })}
                                            placeholder="https://images..."
                                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', outline: 'none' }}
                                            onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.backgroundColor = 'white'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            style={{ flex: 1, padding: '1rem', borderRadius: '16px', border: '1.5px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fee2e2'; }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            style={{ flex: 2, padding: '1rem', borderRadius: '16px', border: 'none', background: '#f97316', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 8px 15px rgba(249, 115, 22, 0.2)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(249, 115, 22, 0.3)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 15px rgba(249, 115, 22, 0.2)'; }}
                                        >
                                            Crear curso
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manage Content Modal - Dual Panel Premium Redesign */}
                {showContentModal && selectedCourse && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '40px', width: '1200px', maxWidth: '95%', height: '85vh', maxHeight: '900px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(255, 255, 255, 0.8)', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'scaleIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>

                            {/* Decorative Background Elements */}
                            <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)', zIndex: 0 }}></div>
                            <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.04) 0%, transparent 70%)', zIndex: 0 }}></div>

                            {/* Header Section (Fixed at top) */}
                            <div style={{ padding: '2rem 2.5rem', borderBottom: '1.5px solid #f1f5f9', position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.1)' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.1, letterSpacing: '-0.5px' }}>Administrar Contenido</h2>
                                        <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600', marginTop: '0.3rem' }}>Curso: <span style={{ color: '#3b82f6', fontWeight: '700' }}>{selectedCourse.title}</span></p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowContentModal(false)}
                                    style={{ background: '#fef2f2', color: '#ef4444', width: '38px', height: '38px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', border: '1px solid #fee2e2', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.05)' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#ef4444';
                                        const svg = e.currentTarget.querySelector('svg');
                                        if (svg) svg.style.stroke = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#fef2f2';
                                        const svg = e.currentTarget.querySelector('svg');
                                        if (svg) svg.style.stroke = '#ef4444';
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s ease' }}>
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            {/* Main Content Area (Dual Panel) */}
                            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 5 }}>

                                {/* LEFT PANEL: Nueva Lección */}
                                <div style={{ flex: 1, borderRight: '1.5px solid #f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <div style={{ padding: '2rem 2.5rem', overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                                        <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#f97316', boxShadow: '0 0 10px rgba(249, 115, 22, 0.3)' }}></div>
                                                Nueva Lección
                                            </h3>

                                            <form onSubmit={handleAddLesson} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.3px' }}>Título de la lección</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="¿Qué es la inteligencia artificial?"
                                                        value={newLesson.title}
                                                        onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                                                        style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '16px', border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#1e293b', fontWeight: '500', outline: 'none', transition: 'all 0.2s' }}
                                                        onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.08)'; }}
                                                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                                    />
                                                </div>

                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.3px' }}>Formato de entrega</label>
                                                    <div style={{ position: 'relative' }}>
                                                        <select
                                                            value={newLesson.type}
                                                            onChange={e => {
                                                                const type = e.target.value;
                                                                setNewLesson({
                                                                    ...newLesson,
                                                                    type,
                                                                    url: type === 'quiz' ? '[{"question": "¿Escriba la pregunta aquí?", "options": ["Agregue opciones aquí", "A", "B"], "correctAnswer": 0, 1, 2, N}]' : ''
                                                                });
                                                            }}
                                                            style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '16px', border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#1e293b', fontWeight: '600', outline: 'none', appearance: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                                                            onFocus={(e) => e.target.style.borderColor = '#f97316'}
                                                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                                        >
                                                            <option value="video">🎥 Video de clase</option>
                                                            <option value="link">🔗 Material de clase</option>
                                                            <option value="quiz">📝 Evaluación</option>
                                                        </select>
                                                        <svg style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                    </div>
                                                </div>

                                                {newLesson.type === 'quiz' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <label style={{ display: 'block', margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', letterSpacing: '0.3px' }}>Preguntas del Cuestionario</label>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f97316', backgroundColor: '#fff7ed', padding: '0.3rem 0.8rem', borderRadius: '10px' }}>{quizQuestions.length} PREGUNTA{quizQuestions.length !== 1 ? 'S' : ''}</span>
                                                        </div>

                                                        {quizQuestions.map((q, qIndex) => (
                                                            <div key={qIndex} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Pregunta {qIndex + 1}</div>
                                                                    {quizQuestions.length > 1 && (
                                                                        <button type="button" onClick={() => removeQuestion(qIndex)} style={{ padding: '0.3rem 0.6rem', backgroundColor: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                                                                            Eliminar
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <input
                                                                    type="text"
                                                                    required
                                                                    placeholder="Ej: ¿Qué es el DOM en el contexto de la web?"
                                                                    value={q.question}
                                                                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                                                                    style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.9rem', color: '#1e293b', fontWeight: '600', outline: 'none' }}
                                                                    onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.backgroundColor = 'white'; }}
                                                                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                                                                />

                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Opciones (Selecciona la correcta)</div>
                                                                    {q.options.map((option, oIndex) => (
                                                                        <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                            <input
                                                                                type="radio"
                                                                                name={`correct-${qIndex}`}
                                                                                checked={q.correctAnswer === oIndex}
                                                                                onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                                                                style={{ width: '18px', height: '18px', accentColor: '#f97316', cursor: 'pointer' }}
                                                                            />
                                                                            <input
                                                                                type="text"
                                                                                required
                                                                                placeholder={`Opción ${oIndex + 1}`}
                                                                                value={option}
                                                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                                                style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: `1.5px solid ${q.correctAnswer === oIndex ? '#fed7aa' : '#e2e8f0'}`, backgroundColor: q.correctAnswer === oIndex ? '#fff7ed' : 'white', fontSize: '0.85rem', color: '#1e293b', outline: 'none' }}
                                                                                onFocus={(e) => { e.target.style.borderColor = '#f97316'; }}
                                                                                onBlur={(e) => { e.target.style.borderColor = q.correctAnswer === oIndex ? '#fed7aa' : '#e2e8f0'; }}
                                                                            />
                                                                            {q.options.length > 2 && (
                                                                                <button type="button" onClick={() => removeOption(qIndex, oIndex)} style={{ padding: '0.5rem', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {q.options.length < 5 && (
                                                                        <button type="button" onClick={() => addOption(qIndex)} style={{ alignSelf: 'flex-start', padding: '0.5rem 0.8rem', backgroundColor: 'transparent', color: '#3b82f6', border: '1.5px dashed #93c5fd', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', marginTop: '0.25rem' }}>
                                                                            + Añadir Opción
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <button type="button" onClick={addQuestion} style={{ width: '100%', padding: '1rem', backgroundColor: 'white', color: '#1e293b', border: '2px dashed #cbd5e1', borderRadius: '16px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.backgroundColor = '#f1f5f9'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = 'white'; }}>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                            Añadir Nueva Pregunta
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.3px' }}>Enlace URL</label>
                                                        <input
                                                            type="url"
                                                            required
                                                            placeholder="https://..."
                                                            value={newLesson.url}
                                                            onChange={e => setNewLesson({ ...newLesson, url: e.target.value })}
                                                            style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '16px', border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#1e293b', outline: 'none', transition: 'all 0.2s' }}
                                                            onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.backgroundColor = 'white'; }}
                                                            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                                                        />
                                                    </div>
                                                )}

                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.3px' }}>Objetivo del módulo</label>
                                                    <textarea
                                                        value={newLesson.description}
                                                        onChange={e => setNewLesson({ ...newLesson, description: e.target.value })}
                                                        rows="3"
                                                        placeholder="Describe brevemente lo que el estudiante aprenderá con esta sección..."
                                                        style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '16px', border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#1e293b', outline: 'none', resize: 'none', transition: 'all 0.2s' }}
                                                        onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.backgroundColor = 'white'; }}
                                                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    style={{ width: '100%', backgroundColor: '#f97316', color: 'white', padding: '1.1rem', borderRadius: '17px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', boxShadow: '0 10px 25px rgba(249, 115, 22, 0.25)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ea580c'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(249, 115, 22, 0.35)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f97316'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(249, 115, 22, 0.25)'; }}
                                                >
                                                    Publicar Contenido
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT PANEL: Contenido actual del curso */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fcfdfe', overflow: 'hidden' }}>
                                    <div style={{ padding: '2rem 2.5rem', overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#3b82f6', boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)' }}></div>
                                                Contenido actual del curso
                                            </h3>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3b82f6', backgroundColor: '#eff6ff', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid #dbeafe' }}>{lessons.length} MÓDULOS ACTIVOS</span>
                                        </div>

                                        {loadingLessons ? (
                                            <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                                                <div style={{ width: '45px', height: '45px', border: '4px solid #f1f5f9', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                                                <p style={{ color: '#64748b', fontWeight: '700', fontSize: '1rem', letterSpacing: '0.5px' }}>Cargando contenido...</p>
                                            </div>
                                        ) : lessons.length === 0 ? (
                                            <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '32px', border: '2.5px dashed #e2e8f0', margin: '1rem' }}>
                                                <div style={{ width: '70px', height: '70px', backgroundColor: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', boxShadow: '0 10px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                                                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ff7300ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                </div>
                                                <p style={{ color: '#646b74ff', fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Sin contenido registrado</p>
                                                <p style={{ color: '#acb1b8ff', fontWeight: '600', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>Comienza a estructurar tu curso usando el panel de la izquierda.</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                {lessons.map((lesson, index) => (
                                                    <div
                                                        key={lesson.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '1.5rem',
                                                            backgroundColor: 'white',
                                                            border: '1.5px solid #f1f5f9',
                                                            borderRadius: '28px',
                                                            boxShadow: '0 6px 15px rgba(0,0,0,0.02)',
                                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = '#dbeafe'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                                    >
                                                        <div style={{ width: '45px', height: '45px', borderRadius: '15px', backgroundColor: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1.5rem', color: 'white', fontWeight: '700', fontSize: '1rem', cursor: 'default', boxShadow: '0 6px 15px rgba(249, 115, 22, 0.25)', flexShrink: 0 }}>
                                                            {index + 1}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '0.4rem', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                                <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', backgroundColor: lesson.content_type === 'quiz' ? '#fff1f2' : lesson.content_type === 'video' ? '#eff6ff' : '#f0fdf4', color: lesson.content_type === 'quiz' ? '#e11d48' : lesson.content_type === 'video' ? '#2563eb' : '#16a34a', padding: '5px 14px', borderRadius: '12px', fontWeight: '800', letterSpacing: '0.8px', border: '1px solid currentColor', borderOpacity: 0.1 }}>
                                                                    {lesson.content_type === 'quiz' ? 'EXAMEN' : lesson.content_type === 'video' ? 'VIDEO' : 'MATERIAL'}
                                                                </span>
                                                                {/* Oculto temporalmente para uso futuro
                                                                <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.color = '#3b82f6'; e.target.style.transform = 'translateX(3px)'; }} onMouseLeave={(e) => { e.target.style.color = '#94a3b8'; e.target.style.transform = 'translateX(0)'; }}>
                                                                    <svg width="12" height="12" viewBox="0 0 28 28" fill="currentColor">
                                                                        <path d="M336,957 C336,958.087 335.087,959 334,959 L313.935,959.033 C312.848,959.033 311.967,958.152 311.967,957.065 L312,937 C312,935.913 312.913,935 314,935 L325,935 L325,933 L314,933 C311.827,933 310,935.221 310,937.394 L310,957.065 C310,959.238 311.762,961 313.935,961 L333.606,961 C335.779,961 338,959.173 338,957 L338,946 L336,946 L336,957 L336,957 Z M336.979,933 L330,933 C329.433,933.001 329.001,933.459 329,934 C328.999,934.541 329.433,935.001 330,935 L334.395,934.968 L319.308,949.357 C318.908,949.738 318.908,950.355 319.308,950.736 C319.706,951.117 320.354,951.117 320.753,950.736 L335.971,936.222 L336,941 C335.999,941.541 336.433,942.001 337,942 C337.567,941.999 337.999,941.541 338,941 L338,933.975 C338.001,933.434 337.546,932.999 336.979,933 L336.979,933 Z" transform="translate(-310.000000, -933.000000)" />
                                                                    </svg>
                                                                    Acceder
                                                                </a>
                                                                */}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteLesson(lesson.id)}
                                                            style={{ width: '42px', height: '42px', backgroundColor: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: '14px', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', flexShrink: 0, marginLeft: '1rem' }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                        >
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            </main>
        </div>
    )
}

export default AdminCourses
