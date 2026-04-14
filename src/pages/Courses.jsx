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
    const [userRole, setUserRole] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState('Todos') // Todos, Activa, Completada
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [dominantColor, setDominantColor] = useState('rgba(0, 71, 186, 0.1)') // Default brand color

    // Helper: Convert Google Drive Link to direct image link
    const convertDriveUrl = (url) => {
        if (!url || (!url.includes('drive.google.com') && !url.includes('docs.google.com'))) return url;
        const driveRegex = /(?:\/d\/|id=)([\w-]+)/;
        const match = url.match(driveRegex);
        if (match && match[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        }
        return url;
    };

    // Function to extract dominant color from image
    const extractColor = (url) => {
        if (!url) return;
        try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 10;
                    canvas.height = 10;
                    ctx.drawImage(img, 0, 0, 10, 10);
                    const data = ctx.getImageData(0, 0, 10, 10).data;

                    let r = 0, g = 0, b = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                    }
                    const count = data.length / 4;
                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);

                    const color = `rgba(${r}, ${g}, ${b}, 0.5)`;
                    setDominantColor(color);
                } catch (e) {
                    console.warn("No se pudo extraer el color (posible problema de CORS):", e);
                }
            };
            img.onerror = () => {
                console.warn("Error al cargar la imagen para colorimetría.");
            };
        } catch (error) {
            console.error("Error en extractColor:", error);
        }
    };

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
                    .select('avatar_url, role')
                    .eq('id', session.user.id)
                    .single()

                if (profileData) {
                    setAvatarUrl(convertDriveUrl(profileData.avatar_url))
                    setUserRole(profileData.role)
                    if (profileData.avatar_url) extractColor(convertDriveUrl(profileData.avatar_url))
                }

                // 1. Fetch Enrolled Courses
                // Fetch enrollments first, then courses (avoiding FK issue)
                const { data: enrollmentData, error: enrollmentError } = await supabase
                    .from('enrollments')
                    .select('id, course_id, completed, progress_data')
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

                    const { data: lessonsData } = await supabase
                        .from('lessons')
                        .select('id, course_id')
                        .in('course_id', courseIds)

                    const coursesMap = (coursesData || []).reduce((acc, course) => {
                        acc[course.id] = course;
                        return acc;
                    }, {});

                    // Transform data
                    const formattedCourses = enrollmentData.map(enrollment => {
                        const course = coursesMap[enrollment.course_id];
                        if (!course) return null;

                        let progress = 0;
                        const courseLessons = (lessonsData || []).filter(l => l.course_id === course.id);
                        const totalLessons = courseLessons.length;
                        
                        if (totalLessons > 0) {
                            // Sincronización de progreso por inscripción (reinicio al re-inscribir)
                            const storedEnrollmentId = localStorage.getItem(`lms_enrollment_id_${course.id}`);
                            if (storedEnrollmentId && storedEnrollmentId !== String(enrollment.id)) {
                                localStorage.removeItem(`lms_last_active_lesson_${course.id}`);
                            }
                            localStorage.setItem(`lms_enrollment_id_${course.id}`, String(enrollment.id));

                            // Sincronizar desde la nube (si existe) al cliente
                            if (enrollment.progress_data && Array.isArray(enrollment.progress_data)) {
                                localStorage.setItem(`lms_completed_${course.id}`, JSON.stringify(enrollment.progress_data));
                            }

                            const completedText = localStorage.getItem(`lms_completed_${course.id}`) || '[]';
                            try {
                                const completed = JSON.parse(completedText);
                                const courseLessonIds = new Set(courseLessons.map(l => String(l.id)));
                                const actualCompletedCount = completed.filter(id => courseLessonIds.has(String(id))).length;
                                progress = Math.min(100, Math.round((actualCompletedCount / totalLessons) * 100));

                                // Sincronizar con la base de datos si llegó al 100% y no estaba marcada
                                if (progress === 100 && !enrollment.completed) {
                                    supabase
                                        .from('enrollments')
                                        .update({ completed: true })
                                        .eq('id', enrollment.id)
                                        .then(({error}) => {
                                            if (error) console.error("Error auto-completing specialty:", error);
                                        });
                                }
                            } catch (error) {
                                console.error('Error parsing progress:', error);
                                progress = 0;
                            }
                        }

                        return {
                            id: course.id,
                            title: course.title,
                            description: course.description,
                            image: convertDriveUrl(course.thumbnail_url) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                            progress: progress,
                            status: progress === 100 ? 'Completada' : 'Activa'
                        }
                    }).filter(Boolean)

                    setCourses(formattedCourses)
                } else {
                    // No enrollments = no courses to show
                    setCourses([])
                }

            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [navigate])

    const handleResetProgress = async (courseId) => {
        if (!confirm('¿Estás seguro de que deseas reiniciar tu progreso en esta especialidad? Esto borrará tus lecciones completadas.')) return;
        
        // 1. Clear LocalStorage
        localStorage.removeItem(`lms_completed_${courseId}`);
        localStorage.removeItem(`lms_completion_shown_${courseId}`);
        localStorage.removeItem(`lms_last_active_lesson_${courseId}`);
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`lms_score_${courseId}_`)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        
        // 2. Update Database enrollment completed flag
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase
                    .from('enrollments')
                    .update({ completed: false })
                    .eq('course_id', courseId)
                    .eq('user_id', session.user.id);
            }
            // Reload page to reflect changes properly
            window.location.reload();
        } catch (error) {
            console.error("Error resetting progress:", error);
            alert("Error al reiniciar el progreso.");
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filter === 'Todos' || course.status === filter
        return matchesSearch && matchesFilter
    })

    if (loading) {
        return <div style={{ backgroundColor: 'var(--background-color)', color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Cargando especialidades...</p></div>
    }

    return (
        <div style={{ backgroundColor: 'var(--background-color)', minHeight: '100vh', display: 'flex', position: 'relative' }}>
            <Sidebar />

            {/* Premium Decorative Glows */}
            <div style={{ position: 'absolute', top: '-5%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${dominantColor.replace('0.5', '0.1')} 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0, transition: 'all 0.8s ease' }}></div>
            <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle, ${dominantColor.replace('0.5', '0.08')} 0%, transparent 70%)`, filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0, transition: 'all 0.8s ease' }}></div>

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

                {/* Header Section: Title & Profile */}
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2.5rem',
                    animation: 'fadeInDown 0.8s ease-out'
                }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
                            Mis <span style={{ color: 'var(--accent-gold)' }}>Especialidades</span>
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', fontWeight: '500' }}>Continúa tu camino hacia el éxito académico.</p>
                    </div>

                    {/* Profile Widget (Identical to Dashboard) */}
                    <div
                        onClick={() => navigate('/profile')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            padding: '0.8rem 1.4rem',
                            borderRadius: '22px',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                            e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.15)';
                        }}
                    >
                        <div style={{ position: 'relative' }}>
                            <img
                                src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '14px',
                                    border: `2px solid ${dominantColor.replace('0.5', '0.8')}`,
                                    boxShadow: `0 4px 12px ${dominantColor.replace('0.5', '0.3')}`,
                                    objectFit: 'cover'
                                }}
                                alt="Perfil"
                            />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginBottom: '0px' }}>{user?.user_metadata?.full_name || 'Usuario'}</p>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {userRole === 'admin' ? 'Administrador' : 'Estudiante'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Search & Actions Bar: Ergonomic Layout */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4rem',
                    padding: '1.25rem 2rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.25)',
                    animation: 'fadeInUp 0.8s ease-out 0.2s both',
                    position: 'relative',
                    zIndex: 20
                }}>
                    {/* Search Bar (Expanded for better ergonomics) */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar especialidad..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem 0.875rem 3.5rem',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                fontWeight: '500'
                            }}
                            onFocus={(e) => {
                                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                e.target.style.borderColor = 'var(--accent-gold)';
                                e.target.style.boxShadow = '0 0 15px rgba(255, 193, 7, 0.2)';
                            }}
                            onBlur={(e) => {
                                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        <svg
                            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'white', opacity: 0.8 }}
                        >
                            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>

                    {/* Filter Control */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.875rem 1.75rem',
                                backgroundColor: showFilterDropdown ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.18)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '16px',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.35)'}
                            onMouseLeave={(e) => { if (!showFilterDropdown) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)' }}
                        >
                            <span style={{ opacity: 0.6, fontWeight: '500' }}>Estado:</span> {filter}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s', transform: showFilterDropdown ? 'rotate(180deg)' : 'rotate(0)' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {showFilterDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 12px)',
                                right: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                backdropFilter: 'blur(25px)',
                                borderRadius: '20px',
                                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
                                zIndex: 100,
                                minWidth: '200px',
                                padding: '0.6rem',
                                animation: 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {['Todos', 'Activa', 'Completada'].map((opt) => (
                                    <div
                                        key={opt}
                                        onClick={() => { setFilter(opt); setShowFilterDropdown(false); }}
                                        style={{
                                            padding: '0.9rem 1.25rem',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            color: filter === opt ? 'var(--accent-color)' : 'white',
                                            backgroundColor: filter === opt ? 'rgba(255,255,255,0.1)' : 'transparent',
                                            borderRadius: '14px',
                                            transition: 'all 0.2s ease',
                                            fontWeight: filter === opt ? '800' : '600',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0000001e'}
                                        onMouseLeave={(e) => { if (filter !== opt) e.currentTarget.style.backgroundColor = 'transparent' }}
                                    >
                                        {opt}
                                        {filter === opt && (
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <style>{`
                    .search-input::placeholder {
                        color: rgba(255, 255, 255, 0.6);
                    }
                    @keyframes fadeInDown {
                        from { opacity: 0; transform: translateY(-30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .course-card:hover .course-image {
                        transform: scale(1.1);
                    }
                    .course-card {
                        position: relative;
                        overflow: hidden;
                    }
                    .course-card::after {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        border-radius: 32px;
                        background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 70%);
                        pointer-events: none;
                        opacity: 0;
                        transition: opacity 0.4s ease;
                    }
                    .course-card:hover::after {
                        opacity: 1;
                    }
                `}</style>

                {/* Course Grid */}
                <div style={{ flex: 1, animation: 'fadeInUp 1s ease-out' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((course, idx) => (
                                <div key={course.id}
                                    onClick={() => navigate(`/course/${course.id}`)}
                                    className="course-card"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                        borderRadius: '32px',
                                        padding: '1.25rem',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255, 255, 255, 0.6)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer',
                                        animation: `fadeInUp 0.6s ease-out ${idx * 0.1}s both`,
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-15px)';
                                        e.currentTarget.style.boxShadow = `0 30px 60px -12px rgba(0, 0, 0, 0.25), 0 0 20px ${dominantColor.replace('0.5', '0.15')}`;
                                        e.currentTarget.style.borderColor = dominantColor.replace('0.5', '0.3');
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                                    }}
                                >
                                    <div style={{ height: '220px', borderRadius: '24px', overflow: 'hidden', marginBottom: '1.5rem', position: 'relative' }}>
                                        <img
                                            src={course.image}
                                            alt={course.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                            className="course-image"
                                        />
                                        <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '8px 16px', borderRadius: '16px', fontSize: '0.7rem', fontWeight: '900', color: 'var(--accent-color)', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', zIndex: 2, border: '1px solid rgba(255,255,255,0.5)' }}>
                                            {course.status}
                                        </div>
                                    </div>

                                    <div style={{ padding: '0 0.5rem 0.75rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.25rem', lineHeight: '1.3' }}>
                                            {course.title}
                                        </h3>

                                        <div style={{ marginBottom: '0', position: 'relative', zIndex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: course.progress === 100 ? '#3bc029ff' : '#64748b', fontWeight: '700' }}>
                                                    {course.progress === 100 ? 'Especialidad Completada' : 'Progreso'}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: course.progress === 100 ? '#3bc029ff' : 'var(--accent-color)', fontWeight: '800' }}>{course.progress}%</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    width: `${course.progress}%`, 
                                                    height: '100%', 
                                                    background: course.progress === 100 ? '#22e710ff' : 'linear-gradient(90deg, var(--accent-color), var(--primary-light, #00d2ff))', 
                                                    borderRadius: '10px', 
                                                    transition: 'width 1s ease-in-out' 
                                                }}></div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', width: '100%', alignItems: 'stretch' }}>
                                            {course.progress === 100 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleResetProgress(course.id);
                                                    }}
                                                    style={{
                                                        width: '58px',
                                                        backgroundColor: '#f59e0b',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '18px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
                                                        flexShrink: 0
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d97706'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f59e0b'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                    title="Reiniciar Especialidad"
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                                                </button>
                                            )}
                                            <button
                                                style={{
                                                    flex: 1,
                                                    padding: '1.1rem',
                                                    backgroundColor: '#0047ba',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '18px',
                                                    fontWeight: '700',
                                                    fontSize: '1rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    boxShadow: '0 6px 15px rgba(0, 71, 186, 0.2)',
                                                    letterSpacing: '0.5px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#00338d';
                                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                                    e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 71, 186, 0.4)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#0047ba';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 71, 186, 0.2)';
                                                }}
                                            >
                                                Continuar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '6rem 2rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '32px', border: '2px dashed rgba(255, 255, 255, 0.2)' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>📚</div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>No se encontraron especialidades</h3>
                                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>No hemos podido encontrar especialidades que coincidan con tu búsqueda o filtros actuales.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* <footer style={{ 
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
                                { color: '#E4405F', icon: (
                                    <>
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                    </>
                                )},
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
                </footer> */}
            </main>
        </div>
    )
}

export default Courses
