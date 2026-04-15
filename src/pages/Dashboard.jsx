import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import carouselPicture1 from '../assets/carusel_picture1.jpeg'
import carouselPicture2 from '../assets/carusel_picture2.png'

const carouselSlides = [
    {
        id: 1,
        image: carouselPicture1,
        title: "Nuestra Misión y Visión",
        customContent: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%' }}>
                <div>
                    <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--accent-gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>NUESTRA MISIÓN</p>
                    <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.92)', fontWeight: '400', fontStyle: 'italic', lineHeight: '1.6' }}>
                        "Transformar el bienestar en Latinoamérica, acercando el mejor conocimiento a quienes cuidan de la salud mental y el talento de las personas"
                    </p>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '2rem' }}>
                    <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--accent-gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>NUESTRA VISIÓN</p>
                    <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.92)', fontWeight: '400', fontStyle: 'italic', lineHeight: '1.6' }}>
                        "Convertirnos en el estándar de excelencia para los profesionales que buscan transformar el bienestar humano y organizacional en toda Latinoamérica"
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 2,
        image: carouselPicture2,
        title: "Nuestros Valores",
        customContent: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem', width: '100%', alignItems: 'start' }}>
                <div>
                    <p style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--accent-gold)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>NUESTROS VALORES</p>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '400', lineHeight: '1.6' }}>
                        Creemos que la transformaci&oacute;n comienza desde adentro. Estos valores representan lo que somos, lo que hacemos y el impacto que buscamos generar en cada persona.
                    </p>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1.5rem' }}>
                    {[
                        { name: 'Compartir', desc: 'Impulsamos el acceso al conocimiento' },
                        { name: 'Servicio', desc: 'Experiencias de aprendizaje \u00fatiles y de alta calidad' },
                        { name: 'Respeto', desc: 'Relaciones basadas en confianza mutua' },
                        { name: 'Liderazgo', desc: 'Inspiramos a crecer y generar impacto' },
                        { name: 'Crecimiento', desc: 'Convertimos cada experiencia en evoluci\u00f3n' },
                        { name: 'Bienestar', desc: 'Equilibrio entre desarrollo y salud integral' },
                        { name: 'Humildad', desc: 'Siempre aprendemos y mejoramos' },
                    ].map((v) => (
                        <div key={v.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                            <span style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '0.7rem', marginTop: '2px', flexShrink: 0 }}>✦</span>
                            <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>{v.name}: </span>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: '400' }}>{v.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
]

const Dashboard = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(true)
    const [events, setEvents] = useState([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [myCourses, setMyCourses] = useState([])
    const [currentSlide, setCurrentSlide] = useState(0)
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
        const timer = setInterval(() => {
            if (carouselSlides.length > 0) {
                setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
            }
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    const checkUser = React.useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            navigate('/')
        } else {
            setUser(session.user)

            const { data } = await supabase
                .from('profiles')
                .select('avatar_url, description, role')
                .eq('id', session.user.id)
                .single()

            if (data) {
                setAvatarUrl(convertDriveUrl(data.avatar_url))
                setDescription(data.description)
                setUserRole(data.role)
                if (data.avatar_url) extractColor(convertDriveUrl(data.avatar_url))
            }

            const { data: eventsData } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', session.user.id)

            if (eventsData) {
                setEvents(eventsData.map(e => ({ ...e, date: new Date(e.start_time) })))
            }

            const { data: enrollmentData } = await supabase
                .from('enrollments')
                .select('id, course_id, completed, progress_data')
                .eq('user_id', session.user.id)
                // limit removido para procesar todas las especialidades

            if (enrollmentData && enrollmentData.length > 0) {
                const courseIds = enrollmentData.map(e => e.course_id)
                const { data: coursesData } = await supabase
                    .from('courses')
                    .select('id, title, description, thumbnail_url, instructor_name, instructor_avatar')
                    .in('id', courseIds)
                
                const { data: lessonsData } = await supabase
                    .from('lessons')
                    .select('id, course_id')
                    .in('course_id', courseIds)

                const coursesMap = (coursesData || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {})

                const formattedCourses = enrollmentData.map(enrollment => {
                    const course = coursesMap[enrollment.course_id]
                    if (!course) return null

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
                            // Filtrar para contar solo lecciones que existen actualmente para esta especialidad
                            // Usamos String() para asegurar que la comparación funcione independientemente del tipo (int vs string UUID)
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
                        instructor_name: course.instructor_name || 'Instructor DiPAAm',
                        instructor_avatar: convertDriveUrl(course.instructor_avatar),
                        progress: progress,
                        status: progress === 100 ? 'Completada' : 'Activa'
                    }
                }).filter(Boolean)
                setMyCourses(formattedCourses)
            }
        }
        setLoading(false)
    }, [navigate])

    useEffect(() => {
        checkUser()
    }, [checkUser])

    const handleResetProgress = async (courseId) => {
        if (!confirm('¿Estás seguro de que deseas reiniciar tu progreso en esta especialidad? Esto borrará tus lecciones completadas.')) return;
        
        // 1. Clear LocalStorage
        localStorage.removeItem(`lms_completed_${courseId}`);
        localStorage.removeItem(`lms_completion_shown_${courseId}`);
        localStorage.removeItem(`lms_last_active_lesson_${courseId}`);
        // Remove all dynamically saved lesson times and scores for this course
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith(`lms_score_${courseId}_`) || key.startsWith(`lms_video_time_`))) {
                // For video time, it's keyed by lesson id directly without courseId, which makes it harder to isolate if we don't fetch lessons.
                // It's safer to only remove score which has the courseId explicitly, OR just let video times be. User might want to restart video from 0.
                if (key.startsWith(`lms_score_${courseId}_`)) {
                    keysToRemove.push(key);
                }
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
            // 3. Refresh data
            checkUser();
        } catch (error) {
            console.error("Error resetting progress:", error);
            alert("Error al reiniciar el progreso.");
        }
    };

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1))
    }

    const renderMiniCalendar = () => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
        let startParams = firstDay === 0 ? 6 : firstDay - 1

        const days = []
        for (let i = 0; i < startParams; i++) {
            days.push(<span key={`empty-${i}`}></span>)
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
            const hasEvent = events.some(e =>
                e.date.getDate() === day &&
                e.date.getMonth() === currentDate.getMonth() &&
                e.date.getFullYear() === currentDate.getFullYear()
            )
            const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth()

            days.push(
                <span
                    key={day}
                    onClick={() => setSelectedDate(currentDayDate)}
                    style={{
                        padding: '0.25rem',
                        backgroundColor: isSelected ? '#eff6ff' : (isToday ? 'var(--secondary-color)' : 'transparent'),
                        color: isSelected ? 'var(--primary-color)' : (isToday ? 'white' : '#334155'),
                        border: isSelected ? '1px solid var(--primary-color)' : 'none',
                        borderRadius: '6px',
                        position: 'relative',
                        fontWeight: isToday || isSelected ? 'bold' : 'normal',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                    {day}
                    {hasEvent && !isToday && (
                        <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--secondary-color)' }}></div>
                    )}
                </span>
            )
        }
        return days
    }

    const upcomingEvents = events
        .filter(e => new Date(e.start_time) >= new Date())
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
        .slice(0, 3)

    if (loading) return null

    return (
        <div style={{ backgroundColor: 'var(--background-color)', minHeight: '100vh', display: 'flex', position: 'relative' }}>
            <Sidebar />

            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div style={{ animation: 'fadeInDown 0.8s ease-out' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
                            ¡Hola, <span style={{ color: 'var(--accent-gold)', textShadow: '0 0 20px rgba(207, 170, 3, 0.92)' }}>{user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario'}</span>!
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', fontWeight: '500' }}>Es un gran día para seguir aprendiendo.</p>
                    </div>

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
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            animation: 'fadeInDown 0.8s ease-out'
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
                        <div style={{
                            position: 'relative',
                            width: '52px',
                            height: '52px',
                            borderRadius: '16px',
                            background: `linear-gradient(135deg, ${dominantColor.replace('0.5', '0.9')}, ${dominantColor.replace('0.5', '0.4')})`,
                            padding: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 8px 16px -4px ${dominantColor.replace('0.5', '0.3')}`,
                            transition: 'all 0.4s ease'
                        }}>
                            <img
                                src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '13px',
                                    objectFit: 'cover',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
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

                <div style={{ position: 'relative', marginBottom: '3.5rem' }}>
                    {/* Promotional Banner Carousel */}
                    {carouselSlides.length > 0 && (
                        <div style={{
                            width: '100%',
                            height: '340px',
                            borderRadius: '32px',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            animation: 'fadeInUp 0.8s ease-out 0.3s both',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(0, 0, 0, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.3)';
                        }}>
                            {carouselSlides.map((slide, index) => (
                                <div key={slide.id} style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    opacity: currentSlide === index ? 1 : 0,
                                    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                                    zIndex: currentSlide === index ? 2 : 1
                                }}>
                                    <img src={slide.image} alt={slide.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, rgba(0,0,0,0.7), transparent)', zIndex: 2 }}></div>
                                    <div style={{ position: 'relative', zIndex: 3, padding: '0 4rem', maxWidth: slide.customContent ? '90%' : '600px', width: slide.customContent ? '90%' : 'auto', animation: currentSlide === index ? 'fadeInLeft 0.8s ease-out' : 'none' }}>
                                        {slide.customContent ? (
                                            slide.customContent
                                        ) : (
                                            <>
                                                <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white', marginBottom: '1rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{slide.title}</h2>
                                                <p style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '0', fontWeight: '500' }}>{slide.text}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div style={{ position: 'absolute', bottom: '24px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 10 }}>
                                {carouselSlides.map((_, index) => (
                                    <div key={index} onClick={() => setCurrentSlide(index)} style={{ width: currentSlide === index ? '24px' : '10px', height: '10px', borderRadius: '10px', backgroundColor: currentSlide === index ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.3)', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: '2rem', flex: 1 }}>
                    {/* Main Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <section>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff' }}>Mis Especialidades</h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {myCourses.length > 0 ? (
                                    myCourses.slice(0, 4).map((course, idx) => (
                                        <div key={course.id} style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderRadius: '28px',
                                            padding: '1.25rem',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(255, 255, 255, 0.5)',
                                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                            cursor: 'pointer',
                                            animation: `fadeInUp 0.6s ease-out ${idx * 0.1}s both`,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)'
                                                e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.25), 0 18px 36px -18px rgba(0, 71, 186, 0.35)'
                                                const img = e.currentTarget.querySelector('img')
                                                if (img) img.style.transform = 'scale(1.1)'
                                                const glow = e.currentTarget.querySelector('.card-glow')
                                                if (glow) glow.style.opacity = '1'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                                const img = e.currentTarget.querySelector('img')
                                                if (img) img.style.transform = 'scale(1)'
                                                const glow = e.currentTarget.querySelector('.card-glow')
                                                if (glow) glow.style.opacity = '0'
                                            }}
                                        >
                                            <div className="card-glow" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(0, 71, 186, 0.05) 0%, transparent 70%)', opacity: 0, transition: 'opacity 0.4s ease', pointerEvents: 'none', zIndex: 0 }}></div>
                                            <div style={{ height: '180px', borderRadius: '20px', overflow: 'hidden', marginBottom: '1.1rem', position: 'relative', zIndex: 1 }}>
                                                <img src={course.image} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)' }} alt="Especialidad" />
                                                <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-color)', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{course.status}</div>
                                            </div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', position: 'relative', zIndex: 1 }}>{course.title}</h3>
                                            <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
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
                                                        background: course.progress === 100 ? '#22e710ff' : 'linear-gradient(90deg, var(--accent-color), var(--primary-light))', 
                                                        borderRadius: '10px', 
                                                        transition: 'width 1s ease-in-out' 
                                                    }}></div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', alignItems: 'stretch' }}>
                                                {course.progress === 100 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleResetProgress(course.id);
                                                        }}
                                                        style={{
                                                            width: '56px',
                                                            backgroundColor: '#f59e0b',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '16px',
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
                                                    onClick={() => navigate(`/course/${course.id}`)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '1rem',
                                                        backgroundColor: 'var(--accent-color)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '16px',
                                                        fontWeight: '700',
                                                        fontSize: '0.9rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        boxShadow: '0 4px 12px rgba(0, 71, 186, 0.2)',
                                                        position: 'relative',
                                                        zIndex: 1
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color)'}
                                                >
                                                    Continuar
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '28px', border: '2px dashed rgba(255, 255, 255, 0.2)' }}>
                                        <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: '500' }}>Inscríbete a una especialidad para comenzar.</p>
                                        <button onClick={() => navigate('/courses')} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', backgroundColor: 'white', color: 'var(--accent-color)', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Explorar</button>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeInUp 0.8s ease-out 0.5s both' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffffff' }}>Accesos Directos</h2>
                        </div>

                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '28px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.5)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', cursor: 'default', position: 'relative', overflow: 'hidden' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-10px) scale(1.01)';
                                e.currentTarget.style.boxShadow = `0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 20px ${dominantColor.replace('0.5', '0.2')}`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>Mi Perfil</h3>
                                <button onClick={() => navigate('/profile')} style={{ fontSize: '0.75rem', border: 'none', backgroundColor: 'var(--accent-color)', cursor: 'pointer', color: 'white', borderRadius: '10px', padding: '0.4rem 1rem', fontWeight: '700', transition: 'all 0.3s ease' }}>Editar</button>
                            </div>
                            <img src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'Usuario'}&background=random`} style={{ width: '90px', height: '90px', borderRadius: '24px', marginBottom: '0.5rem', objectFit: 'cover', border: `3px solid ${dominantColor.replace('0.5', '0.6')}`, boxShadow: `0 8px 16px ${dominantColor.replace('0.5', '0.2')}` }} alt="Avatar" />
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.25rem', color: '#0f172a' }}>{user?.user_metadata?.full_name || 'Usuario'}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '700', marginBottom: '1rem', textTransform: 'uppercase' }}>{userRole === 'admin' ? 'Administrador' : 'Estudiante'}</p>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>"{description || 'Explora tus especialidades.'}"</p>
                        </div>

                        <section style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '28px', padding: '1.5rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.5)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', cursor: 'default', position: 'relative', overflow: 'hidden' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-10px) scale(1.01)';
                                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'capitalize', color: '#1e293b' }}>{currentDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        style={{
                                            backgroundColor: '#f1f5f9',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                            color: '#64748b'
                                        }}
                                        onClick={() => changeMonth(-1)}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                    </button>
                                    <button
                                        style={{
                                            backgroundColor: '#f1f5f9',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                            color: '#64748b'
                                        }}
                                        onClick={() => changeMonth(1)}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', fontSize: '0.7rem', textAlign: 'center', marginBottom: '1rem', color: '#808c9cff', fontWeight: '600' }}>
                                <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span><span>Do</span>
                                {renderMiniCalendar()}
                            </div>
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' }}>Próximos Eventos</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                                        <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: event.color || 'var(--accent-color)' }}></div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</p>
                                                <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(event.start_time).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    )) : <p style={{ fontSize: '0.8rem', color: '#57585aff', textAlign: 'center' }}>Sin eventos.</p>}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <style>{`
                    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
                `}</style>

                <footer style={{
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
                                    }}>Grupo DiPAAm</span>
                                    <span style={{ color: 'rgba(255, 255, 255, 0.1)', fontWeight: '300' }}>/</span>
                                    <span style={{
                                        background: 'linear-gradient(90deg, #ff9000 0%, #0077ff 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}>CONECTA ACADEMY LATAM</span>
                                </h3>
                            </div>
                            {/* <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.3)', fontWeight: '600', marginLeft: '1.25rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                CONECTA <span style={{ mx: '0.5rem', opacity: 0.3 }}>•</span> Sistema de Información y Recursos Académicos
                            </p> */}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[
                                { link: 'https://www.facebook.com/DIPAAM.APIZACO/', color: '#1877F2', icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
                                {
                                    link: 'https://www.instagram.com/conectaacademy/', color: '#E4405F', icon: (
                                        <>
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                        </>
                                    )
                                },
                                { link: `https://wa.me/522411982236?text=${encodeURIComponent('Hola\nEstoy interesado en una especialidad\n¿Me podría dar información?')}`, color: '#25D366', icon: <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9 M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" /> }
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
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
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        textDecoration: 'none'
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
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Company Info Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxWidth: '420px' }}>
                            <p style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.2)', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                                CONECTA ACADEMY LATAM Y GRUPO DIPAAM MEXICO SON MARCAS REGISTRADAS.
                            </p>
                            <p style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.2)', fontWeight: '500', letterSpacing: '0.5px', margin: 0 }}>
                                Hidalgo 303, Edificio Torre Apizaco, Ciudad de Apizaco, Tlaxcala, México C.P. 90300
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                <a href="mailto:grupodipaam@gmail.com" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', fontWeight: '500' }}>grupodipaam@gmail.com</a>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: '500' }}>+52 241 167 0560</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/></svg>
                                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: '500' }}>+52 241 163 19 68 &nbsp;|&nbsp; +52 241 198 22 36</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.03)', paddingTop: '1rem' }}>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.25)', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            &copy; {new Date().getFullYear()} DIPAAM | CONECTA ACADEMY LATAM <span style={{ margin: '0 1rem', opacity: 0.2 }}>|</span> Sistema de Información y Recursos Académicos
                        </p>
                    </div>
                </footer>
            </main>
        </div>
    )
}

export default Dashboard
