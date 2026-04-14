import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'
import confetti from 'canvas-confetti'

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

// Basic Quiz Component
const QuizPlayer = ({ lessonData, courseId, dominantColor, onNextLesson, hasNextLesson }) => {
    const questions = useMemo(() => {
        if (lessonData?.video_url) {
            try {
                const parsed = JSON.parse(lessonData.video_url)
                return Array.isArray(parsed) ? parsed : []
            } catch (e) {
                console.error("Invalid Quiz JSON", e)
                return []
            }
        }
        return []
    }, [lessonData])

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState(null)
    const [score, setScore] = useState(0)
    const [showResult, setShowResult] = useState(false)
    const [finishing, setFinishing] = useState(false)

    useEffect(() => {
        if (courseId && lessonData?.id) {
            const completedKey = `lms_completed_${courseId}`;
            const completedText = localStorage.getItem(completedKey) || '[]';
            const completed = JSON.parse(completedText);

            if (completed.includes(lessonData.id)) {
                // Read score from localStorage or fallback
                const scoreDataText = localStorage.getItem(`lms_score_${courseId}_${lessonData.id}`);
                if (scoreDataText) {
                    try {
                        const scoreData = JSON.parse(scoreDataText);
                        setScore(scoreData.score);
                    } catch {
                        setScore(questions.length);
                    }
                } else {
                    setScore(questions.length);
                }
                setShowResult(true);
            }
        }
    }, [courseId, lessonData, questions.length]);

    const handleAnswer = (optionIndex) => {
        setSelectedOption(optionIndex)
    }

    const handleNext = async () => {
        let newScore = score
        if (selectedOption === questions[currentQuestionIndex].correctAnswer) {
            newScore = score + 1
            setScore(newScore)
        }

        const nextQuestion = currentQuestionIndex + 1
        if (nextQuestion < questions.length) {
            setCurrentQuestionIndex(nextQuestion)
            setSelectedOption(null)
        } else {
            setShowResult(true)
            const passed = newScore >= questions.length * 0.6
            if (passed && courseId) {
                try {
                    // Save score
                    localStorage.setItem(`lms_score_${courseId}_${lessonData.id}`, JSON.stringify({ score: newScore, total: questions.length }));

                    // Mark lesson as completed in localStorage to unlock next lesson
                    const completedKey = `lms_completed_${courseId}`;
                    const completedText = localStorage.getItem(completedKey) || '[]';
                    const completed = JSON.parse(completedText);

                    if (!completed.includes(lessonData.id)) {
                        completed.push(lessonData.id);
                        localStorage.setItem(completedKey, JSON.stringify(completed));
                        // Dispatch event so parent can re-check locks
                        window.dispatchEvent(new Event('lesson_completed'));
                    }
                    // NOTA: Ya no actualizamos la base de datos automáticamente aquí.
                    // Ahora se actualiza solo si es la última lección y le da a 'Finalizar'.
                } catch (error) {
                    console.error("Error updating completion localStorage:", error)
                }
            }
        }
    }

    const handleFinishCourse = async () => {
        setFinishing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                await supabase
                    .from('enrollments')
                    .update({ completed: true })
                    .eq('course_id', courseId)
                    .eq('user_id', session.user.id)
            }
            alert('¡Especialidad finalizada correctamente!');
        } catch (error) {
            console.error("Error updating completion:", error)
            alert('Hubo un error al guardar tu progreso.');
        } finally {
            setFinishing(false);
        }
    }

    if (!questions || questions.length === 0) {
        return (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '32px', color: 'white' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                <h3>Cuestionario en preparación</h3>
                <p style={{ opacity: 0.7 }}>Este cuestionario aún no tiene preguntas configuradas.</p>
            </div>
        )
    }

    if (showResult) {
        const passed = score >= questions.length * 0.6
        const isFinal = passed && !hasNextLesson;
        return (
            <div style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '32px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)',
                animation: 'fadeInUp 0.6s ease-out'
            }}>
                <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>{passed ? '🏆' : '📚'}</div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '1rem', color: '#1e293b' }}>
                    {isFinal ? '¡Felicidades, terminaste la especialidad!' : (passed ? '¡Excelente trabajo!' : 'Casi lo logras')}
                </h2>
                <div style={{ fontSize: '3.5rem', fontWeight: '900', color: passed ? '#10b981' : '#f59e0b', marginBottom: '1rem' }}>
                    {score} / {questions.length}
                </div>
                <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                    {isFinal ? 'Has completado todos los materiales y evaluaciones de esta especialidad con éxito.' :
                        (passed ? 'Has completado este cuestionario con éxito y estas un paso más cerca de tu meta.' : 'Repasa un poco más el contenido y vuelve a intentarlo cuando estés listo.')}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={() => {
                            setCurrentQuestionIndex(0)
                            setScore(0)
                            setShowResult(false)
                            setSelectedOption(null)
                        }}
                        style={{
                            padding: '1.1rem 2.5rem',
                            backgroundColor: passed ? 'rgba(0, 71, 186, 0.1)' : '#0047ba',
                            color: passed ? '#0047ba' : 'white',
                            border: passed ? '2px solid rgba(0, 71, 186, 0.2)' : 'none',
                            borderRadius: '18px',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            boxShadow: passed ? 'none' : '0 8px 20px rgba(0, 71, 186, 0.25)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; if (!passed) e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 71, 186, 0.35)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; if (!passed) e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 71, 186, 0.25)'; }}
                    >
                        {passed ? 'Reiniciar Evaluación' : 'Reintentar Evaluación'}
                    </button>

                    {passed && hasNextLesson && (
                        <button
                            onClick={onNextLesson}
                            style={{
                                padding: '1.1rem 2.5rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '18px',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(16, 185, 129, 0.35)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.25)'; }}
                        >
                            Siguiente Lección
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                    )}

                    {isFinal && (
                        <button
                            onClick={handleFinishCourse}
                            disabled={finishing}
                            style={{
                                padding: '1.1rem 2.5rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '18px',
                                cursor: finishing ? 'not-allowed' : 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                opacity: finishing ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => { if (!finishing) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(16, 185, 129, 0.35)'; } }}
                            onMouseLeave={(e) => { if (!finishing) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.25)'; } }}
                        >
                            {finishing ? 'Procesando...' : 'Finalizar Especialidad'}
                            {!finishing && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg>}
                        </button>
                    )}
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]

    return (
        <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderRadius: '32px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeInUp 0.5s ease-out'
        }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-color)', letterSpacing: '1px' }}>Progreso</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>Pregunta {currentQuestionIndex + 1} de {questions.length}</h3>
                </div>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: `4px solid ${dominantColor.replace('0.5', '0.1')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>{Math.round((currentQuestionIndex / questions.length) * 100)}%</span>
                </div>
            </div>

            <p style={{ fontSize: '1.35rem', marginBottom: '2.5rem', color: '#334155', fontWeight: '700', lineHeight: '1.4' }}>
                {currentQuestion?.question}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
                {currentQuestion?.options?.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        style={{
                            padding: '1.25rem 1.75rem',
                            textAlign: 'left',
                            backgroundColor: selectedOption === index ? '#f0f7ff' : '#f8fafc',
                            border: selectedOption === index ? `2px solid #0047ba` : '2px solid transparent',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '1.05rem',
                            fontWeight: '500',
                            color: selectedOption === index ? '#0047ba' : '#64748b',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            boxShadow: selectedOption === index ? '0 10px 20px rgba(0, 71, 186, 0.1)' : 'none'
                        }}
                    >
                        <div style={{
                            width: '28px',
                            height: '28px',
                            flexShrink: 0,
                            borderRadius: '50%',
                            border: `2px solid ${selectedOption === index ? '#0047ba' : '#cbd5e1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: selectedOption === index ? '#0047ba' : 'transparent',
                            transition: 'all 0.3s'
                        }}>
                            {selectedOption === index && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'white' }}></div>}
                        </div>
                        {option}
                    </button>
                ))}
            </div>

            <button
                disabled={selectedOption === null}
                onClick={handleNext}
                style={{
                    width: '100%',
                    padding: '1.25rem',
                    backgroundColor: selectedOption === null ? '#e2e8f0' : '#0047ba',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: selectedOption === null ? 'not-allowed' : 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: selectedOption === null ? 'none' : '0 10px 25px rgba(0, 71, 186, 0.3)'
                }}
                onMouseEnter={(e) => { if (selectedOption !== null) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 71, 186, 0.4)'; } }}
                onMouseLeave={(e) => { if (selectedOption !== null) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 71, 186, 0.3)'; } }}
            >
                {currentQuestionIndex + 1 === questions.length ? 'Finalizar cuestionario' : 'Siguiente Pregunta'}
            </button>
        </div>
    )
}

const CourseViewer = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [course, setCourse] = useState(null)
    const [lessons, setLessons] = useState([]) // All content
    const [activeLesson, setActiveLesson] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('lessons') // 'lessons' (videos/quizzes) or 'materials' (links)
    const [avatarUrl, setAvatarUrl] = useState('')
    const [userRole, setUserRole] = useState(null)
    const [userName, setUserName] = useState('Usuario')
    const [dominantColor, setDominantColor] = useState('rgba(0, 71, 186, 0.1)') // User profile color
    const [courseColor, setCourseColor] = useState('rgba(0, 71, 186, 0.5)') // Course theme color
    const [completedLessons, setCompletedLessons] = useState([]);
    const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);

    // Check completed lessons
    const updateCompletedLessons = useCallback(() => {
        if (id) {
            const completedKey = `lms_completed_${id}`;
            const completedText = localStorage.getItem(completedKey) || '[]';
            try {
                setCompletedLessons(JSON.parse(completedText));
            } catch (error) {
                console.error('Error parsing completed lessons:', error);
                setCompletedLessons([]);
            }
        }
    }, [id]);

    useEffect(() => {
        updateCompletedLessons();
        window.addEventListener('lesson_completed', updateCompletedLessons);
        return () => window.removeEventListener('lesson_completed', updateCompletedLessons);
    }, [updateCompletedLessons]);

    // Function to extract dominant color from image
    const extractColor = useCallback((url, isProfile = false) => {
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
                    if (isProfile) {
                        setDominantColor(color);
                    } else {
                        setCourseColor(color);
                    }
                } catch (e) {
                    console.warn("No se pudo extraer el color:", e);
                }
            };
        } catch (error) {
            console.error("Error en extractColor:", error);
        }
    }, []);

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    navigate('/')
                    return
                }

                // 0. Fetch User Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('avatar_url, role')
                    .eq('id', session.user.id)
                    .single()

                if (profileData) {
                    setAvatarUrl(convertDriveUrl(profileData.avatar_url))
                    setUserRole(profileData.role)
                    setUserName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuario')
                    if (profileData.avatar_url) extractColor(convertDriveUrl(profileData.avatar_url), true)
                }

                // 1. Fetch Course Info
                const { data: courseData, error: courseError } = await supabase
                    .from('courses')
                    .select('*, instructor:instructor_id(full_name)')
                    .eq('id', id)
                    .single()

                if (courseError) throw courseError
                const formattedCourse = {
                    ...courseData,
                    thumbnail_url: convertDriveUrl(courseData.thumbnail_url),
                    instructor_avatar: convertDriveUrl(courseData.instructor_avatar)
                }
                setCourse(formattedCourse)
                if (formattedCourse.thumbnail_url) extractColor(formattedCourse.thumbnail_url, false)

                // 1.5 Fetch Enrollment to sync progress (Check if it's a new enrollment to reset local progress)
                const { data: enrollmentData } = await supabase
                    .from('enrollments')
                    .select('id')
                    .eq('course_id', id)
                    .eq('user_id', session.user.id)
                    .single();

                if (enrollmentData) {
                    const storedEnrollmentId = localStorage.getItem(`lms_enrollment_id_${id}`);
                    if (storedEnrollmentId && storedEnrollmentId !== String(enrollmentData.id)) {
                        localStorage.removeItem(`lms_completed_${id}`);
                        localStorage.removeItem(`lms_last_active_lesson_${id}`);
                    }
                    localStorage.setItem(`lms_enrollment_id_${id}`, String(enrollmentData.id));
                }

                // 2. Fetch Lessons
                const { data: lessonsData, error: lessonsError } = await supabase
                    .from('lessons')
                    .select('*')
                    .eq('course_id', id)
                    .order('order', { ascending: true })

                if (lessonsError) throw lessonsError
                setLessons(lessonsData || [])

                // Set first content as active if available, but check for a saved lesson first
                if (lessonsData && lessonsData.length > 0) {
                    const savedLessonId = localStorage.getItem(`lms_last_active_lesson_${id}`);
                    const savedLesson = savedLessonId ? lessonsData.find(l => String(l.id) === String(savedLessonId)) : null;

                    if (savedLesson) {
                        setActiveLesson(savedLesson);
                    } else {
                        const firstContent = lessonsData.find(l => l.content_type === 'video' || l.content_type === 'quiz' || !l.content_type);
                        if (firstContent) setActiveLesson(firstContent);
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
    }, [id, navigate, extractColor, updateCompletedLessons])

    const markLessonAsCompleted = React.useCallback((lessonId) => {
        if (!course?.id) return;
        const completedKey = `lms_completed_${course.id}`;
        const completedText = localStorage.getItem(completedKey) || '[]';
        try {
            const completed = JSON.parse(completedText);
            if (!completed.includes(lessonId)) {
                completed.push(lessonId);
                localStorage.setItem(completedKey, JSON.stringify(completed));
                window.dispatchEvent(new Event('lesson_completed'));
                updateCompletedLessons();
            }
        } catch (e) {
            console.error("Error saving progress", e)
        }
    }, [course?.id, updateCompletedLessons])

    const handleLessonClick = (lesson) => {
        setActiveLesson(lesson)
        if (id && lesson?.id) {
            localStorage.setItem(`lms_last_active_lesson_${id}`, lesson.id);
        }
        // Only auto-mark as completed if it's NOT a quiz and NOT a video (like materials/links)
        // Videos are now handled by YouTube API below
        if (lesson.content_type === 'link') {
            markLessonAsCompleted(lesson.id);
        }
    }

    // Helper to get YouTube ID
    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    const videoId = activeLesson ? getYouTubeId(activeLesson.video_url) : null;

    // Filter content
    const videoLessons = lessons.filter(l => l.content_type === 'video' || l.content_type === 'quiz' || !l.content_type)
    const materialResources = lessons.filter(l => l.content_type === 'link')

    const playerRef = React.useRef(null);
    const trackingRef = React.useRef(null);

    useEffect(() => {
        // Only run this if we have a video and we are NOT in a quiz
        if (!videoId || activeLesson?.content_type === 'quiz') {
            // If we switch to a quiz, we MUST destroy the player because the container will be unmounted
            if (playerRef.current) {
                try {
                    if (typeof playerRef.current.destroy === 'function') playerRef.current.destroy();
                } catch (e) { console.warn("Error destroying player:", e); }
                playerRef.current = null;
            }
            return;
        }

        // Load YouTube API script if missing
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        }

        const onPlayerStateChange = (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) startTracking();
            else stopTracking();
        };

        const startTracking = () => {
            stopTracking();
            trackingRef.current = setInterval(() => {
                const player = playerRef.current;
                if (player && typeof player.getCurrentTime === 'function') {
                    const currentTime = player.getCurrentTime();
                    const duration = player.getDuration();

                    if (currentTime > 0) {
                        localStorage.setItem(`lms_video_time_${activeLesson.id}`, currentTime.toString());
                    }

                    if (duration > 0 && (currentTime / duration) >= 0.8) {
                        markLessonAsCompleted(activeLesson.id);
                        stopTracking();
                    }
                }
            }, 3000);
        };

        const stopTracking = () => {
            if (trackingRef.current) clearInterval(trackingRef.current);
        };

        const initPlayer = () => {
            const startTime = Math.floor(parseFloat(localStorage.getItem(`lms_video_time_${activeLesson.id}`) || '0'));
            const container = document.getElementById('youtube-player');

            if (!container) return; // Wait for next tick/render

            if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
                playerRef.current.loadVideoById({
                    videoId: videoId,
                    startSeconds: startTime
                });
            } else {
                playerRef.current = new window.YT.Player('youtube-player', {
                    videoId: videoId,
                    playerVars: { 'autoplay': 0, 'rel': 0, 'modestbranding': 1, 'start': startTime, 'enablejsapi': 1 },
                    events: { 'onStateChange': onPlayerStateChange }
                });
            }
        };

        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            const prevOnReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (prevOnReady) prevOnReady();
                initPlayer();
            };
        }

        return () => {
            stopTracking();
            // Important: we destroy it if the video changes to avoid conflicts with React's DOM management
            if (playerRef.current) {
                try {
                    if (typeof playerRef.current.destroy === 'function') playerRef.current.destroy();
                } catch (e) {
                    console.warn("YouTube player destroy error:", e);
                }
                playerRef.current = null;
            }
        };
    }, [videoId, activeLesson?.id, activeLesson?.content_type, markLessonAsCompleted]);

    const getQuizScoreStatus = useCallback((lesson) => {
        if (!completedLessons.includes(lesson.id) || lesson.content_type !== 'quiz') return null;
        try {
            const scoreDataText = localStorage.getItem(`lms_score_${course?.id}_${lesson.id}`);
            if (scoreDataText) {
                const scoreData = JSON.parse(scoreDataText);
                return `✓ Aprobado con ${scoreData.score}/${scoreData.total}`;
            }
            // Fallback si no está guardado el score en localStorage
            const questions = JSON.parse(lesson.content || '[]');
            if (questions && questions.length > 0) {
                // Asumimos score completo si lo pasó antes de esta actualización
                return `✓ Aprobado con ${questions.length}/${questions.length}`;
            }
        } catch (e) { console.warn("Could not parse score", e); }
        return '✓ Aprobado';
    }, [completedLessons, course?.id]);

    useEffect(() => {
        if (loading || lessons.length === 0 || completedLessons.length === 0) return;

        const allLessonsCompleted = lessons.every(l => completedLessons.includes(l.id));
        const hasOverlayBeenShown = localStorage.getItem(`lms_completion_shown_${id}`);

        if (allLessonsCompleted && !hasOverlayBeenShown) {
            setShowCompletionOverlay(true);
            localStorage.setItem(`lms_completion_shown_${id}`, 'true');
            // Shoot confetti
            const duration = 5 * 1000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5, angle: 60, spread: 55, origin: { x: 0 },
                    colors: ['#2478ffff', '#2ef01dff', '#ff7b00ff', '#ff0000ff', '#ff00d4ff'],
                    zIndex: 10000
                });
                confetti({
                    particleCount: 5, angle: 120, spread: 55, origin: { x: 1 },
                    colors: ['#2478ffff', '#2ef01dff', '#ff7b00ff', '#ff0000ff', '#ff00d4ff'],
                    zIndex: 10000
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [completedLessons, lessons, loading, id]);


    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', color: '#64748b' }}>Cargando contenido...</div>

    if (!course) return null;
    if (!activeLesson) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Cargando lección...</div>

    return (
        <div style={{ backgroundColor: 'var(--background-color)', minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <Sidebar />

            {showCompletionOverlay && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.98)', padding: '4rem 3rem', borderRadius: '32px', maxWidth: '600px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉🎈</div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem' }}>¡Felicidades! <br />¡Concluiste la Especialidad de {course.title}!</h2>
                        <p style={{ fontSize: '1rem', color: '#475569', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            ¡Felicidades por tu dedicación! Has completado exitosamente todas las lecciones y evaluaciones de esta especialidad.
                        </p>
                        <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '20px', border: '1px solid #bfdbfe', marginBottom: '2.5rem' }}>
                            <p style={{ color: '#1d4ed8', fontWeight: '600', fontSize: '1rem', margin: 0 }}>
                                🎓 En unos días, la constancia de tu especialidad estará disponible en la sección de Materiales.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setShowCompletionOverlay(false)} style={{ padding: '1rem 2rem', backgroundColor: 'transparent', border: '2px solid #cbd5e1', borderRadius: '18px', color: '#2e2e2eff', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 47, 47, 0.34)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>Cerrar</button>
                            <button onClick={() => { setShowCompletionOverlay(false); navigate('/materials'); }} style={{ padding: '1rem 2rem', backgroundColor: '#10b948ff', border: 'none', borderRadius: '18px', color: 'white', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 38, 0.3)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}>Ir a Materiales</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Decorative Glows */}
            <div style={{ position: 'absolute', top: '-5%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${dominantColor.replace('0.5', '0.12')} 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0, transition: 'all 0.8s ease' }}></div>
            <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${dominantColor.replace('0.5', '0.1')} 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0, transition: 'all 0.8s ease' }}></div>

            <main style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, height: '100vh', overflow: 'hidden' }}>

                {/* Header: Dynamic & Consistent */}
                <header style={{
                    padding: '1rem 3rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    animation: 'fadeInDown 0.8s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button
                            onClick={() => navigate('/courses')}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'translateX(-5px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Volver
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', margin: 0, letterSpacing: '-0.5px' }}>{course.title}</h1>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Viendo: {activeLesson?.title || 'Contenido'}</span>
                        </div>
                    </div>

                    {/* Profile Widget (Identical to Dashboard) */}
                    <div
                        onClick={() => navigate('/profile')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            padding: '0.3rem 1.4rem',
                            borderRadius: '15px',
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
                                src={avatarUrl || `https://ui-avatars.com/api/?name=${userName || 'Usuario'}&background=random`}
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
                            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginBottom: '0px' }}>{userName}</p>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {userRole === 'admin' ? 'Administrador' : 'Estudiante'}
                            </span>
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Left Side: Interaction Area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 3rem', display: 'flex', flexDirection: 'column' }}>

                        {activeLesson ? (
                            <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', animation: 'fadeInUp 0.8s ease-out' }}>

                                {/* Video/Quiz Display Area */}
                                <div style={{
                                    backgroundColor: activeLesson.content_type === 'quiz' ? 'transparent' : '#000',
                                    borderRadius: '32px',
                                    overflow: 'hidden',
                                    boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)',
                                    marginBottom: '2.5rem',
                                    position: 'relative',
                                    aspectRatio: activeLesson.content_type === 'quiz' ? 'auto' : '16/9',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {activeLesson.content_type === 'quiz' ? (
                                        <QuizPlayer
                                            key={activeLesson.id}
                                            lessonData={activeLesson}
                                            courseId={course.id}
                                            dominantColor={courseColor}
                                            hasNextLesson={videoLessons.findIndex(l => l.id === activeLesson.id) < videoLessons.length - 1}
                                            onNextLesson={() => {
                                                const currentIndex = videoLessons.findIndex(l => l.id === activeLesson.id);
                                                if (currentIndex < videoLessons.length - 1) {
                                                    handleLessonClick(videoLessons[currentIndex + 1]);
                                                }
                                            }}
                                        />
                                    ) : (
                                        videoId ? (
                                            <div key={`video-${activeLesson.id}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                                                <div id="youtube-player" style={{ width: '100%', height: '100%' }}></div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', gap: '1rem' }}>
                                                <div style={{ fontSize: '3rem' }}>🚫</div>
                                                <p style={{ fontWeight: '600', opacity: 0.7 }}>Contenido no disponible</p>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Content Details: Solid Background */}
                                {activeLesson.content_type !== 'quiz' && (
                                    <div style={{
                                        backgroundColor: '#111827',
                                        borderRadius: '28px',
                                        padding: '2.5rem',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        marginBottom: '5rem',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                    }}>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#ffffff', marginBottom: '1.25rem' }}>{activeLesson.title}</h2>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', width: 'fit-content' }}>
                                            <img
                                                src={course.instructor_avatar || `https://ui-avatars.com/api/?name=${course.instructor_name || course.instructor?.full_name || 'A'}&background=random`}
                                                alt="Instructor"
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${courseColor.replace('0.5', '0.8')}` }}
                                            />
                                            <div>
                                                <p style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>{course.instructor_name || course.instructor?.full_name || 'Staff Conecta'}</p>
                                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '600' }}>Instructor Certificado</p>
                                            </div>
                                        </div>

                                        <h4 style={{ color: 'var(--accent-gold)', fontSize: '1rem', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Sobre esta lección</h4>
                                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.8', fontSize: '1.05rem', fontWeight: '500' }}>
                                            {activeLesson.description || 'Esta lección no cuenta con una descripción detallada, pero el contenido audiovisual te guiará durante todo el proceso de aprendizaje.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0.5 }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎬</div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Selecciona un contenido de la lista</h2>
                            </div>
                        )}

                    </div>

                    {/* Right Side: Playlist / Navigation */}
                    <div style={{
                        width: '400px',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(20px)',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 10
                    }}>

                        {/* Tabs Navigation: More color */}
                        <div style={{ display: 'flex', padding: '1.5rem 1.5rem 0', gap: '0.75rem' }}>
                            {(() => {
                                const hasPendingLessons = videoLessons.some(l => !completedLessons.includes(l.id));
                                const hasPendingMaterials = materialResources.some(l => !completedLessons.includes(l.id));
                                return (
                                    <>
                                        <button
                                            onClick={() => setActiveTab('lessons')}
                                            style={{
                                                flex: 1,
                                                padding: '1rem 0.5rem',
                                                borderRadius: '16px',
                                                backgroundColor: activeTab === 'lessons' ? courseColor.replace('0.5', '0.25') : 'rgba(255, 255, 255, 0.03)',
                                                color: activeTab === 'lessons' ? 'white' : 'rgba(255, 255, 255, 0.4)',
                                                fontWeight: '500',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                letterSpacing: '1px',
                                                border: activeTab === 'lessons' ? `1px solid ${courseColor.replace('0.5', '0.6')}` : '1px solid transparent',
                                                boxShadow: activeTab === 'lessons' ? `0 4px 15px ${courseColor.replace('0.5', '0.2')}` : 'none',
                                                position: 'relative'
                                            }}
                                        >
                                            Sesiones ({videoLessons.length})
                                            {hasPendingLessons && (
                                                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></div>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('materials')}
                                            style={{
                                                flex: 1,
                                                padding: '1rem 0.5rem',
                                                borderRadius: '16px',
                                                backgroundColor: activeTab === 'materials' ? courseColor.replace('0.5', '0.25') : 'rgba(255, 255, 255, 0.03)',
                                                color: activeTab === 'materials' ? 'white' : 'rgba(255, 255, 255, 0.4)',
                                                fontWeight: '500',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                letterSpacing: '1px',
                                                border: activeTab === 'materials' ? `1px solid ${courseColor.replace('0.5', '0.6')}` : '1px solid transparent',
                                                boxShadow: activeTab === 'materials' ? `0 4px 15px ${courseColor.replace('0.5', '0.2')}` : 'none',
                                                position: 'relative'
                                            }}
                                        >
                                            Recursos ({materialResources.length})
                                            {hasPendingMaterials && (
                                                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></div>
                                            )}
                                        </button>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Playlist Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
                            {activeTab === 'lessons' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {videoLessons.map((lesson, index) => {
                                        // A lesson is locked if ANY previous lesson was a quiz AND that quiz is not in completedLessons
                                        let isLocked = false;
                                        for (let i = 0; i < index; i++) {
                                            const prevLesson = videoLessons[i];
                                            if (prevLesson.content_type === 'quiz' && !completedLessons.includes(prevLesson.id)) {
                                                isLocked = true;
                                                break;
                                            }
                                        }

                                        return (
                                            <div
                                                key={lesson.id}
                                                onClick={() => {
                                                    if (!isLocked) handleLessonClick(lesson);
                                                }}
                                                style={{
                                                    padding: '1.25rem',
                                                    borderRadius: '20px',
                                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                                    backgroundColor: activeLesson?.id === lesson.id ? courseColor.replace('0.5', '0.15') : 'rgba(255, 255, 255, 0.02)',
                                                    border: activeLesson?.id === lesson.id ? `1px solid ${courseColor.replace('0.5', '0.5')}` : '1px solid rgba(255, 255, 255, 0.05)',
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    display: 'flex',
                                                    gap: '1rem',
                                                    alignItems: 'center',
                                                    boxShadow: activeLesson?.id === lesson.id ? `0 8px 20px rgba(0,0,0,0.2)` : 'none',
                                                    opacity: isLocked ? 0.4 : 1
                                                }}
                                                onMouseEnter={(e) => { if (!isLocked && activeLesson?.id !== lesson.id) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'; }}
                                                onMouseLeave={(e) => { if (!isLocked && activeLesson?.id !== lesson.id) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'; }}
                                            >
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    backgroundColor: isLocked ? 'rgba(255, 255, 255, 0.05)' : activeLesson?.id === lesson.id ? courseColor.replace('0.5', '0.8') : 'rgba(255, 255, 255, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '900',
                                                    color: isLocked ? 'rgba(255, 255, 255, 0.3)' : 'white'
                                                }}>
                                                    {isLocked ? (
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                    ) : (
                                                        index + 1
                                                    )}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: activeLesson?.id === lesson.id ? 'white' : 'rgba(255, 255, 255, 0.8)', marginBottom: '0.2rem' }}>
                                                        {lesson.title}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.65rem', color: activeLesson?.id === lesson.id ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.4)', fontWeight: '700' }}>
                                                            {lesson.content_type === 'quiz' ? '📝 Cuestionario' : '🎥 Sesión Video'}
                                                        </span>
                                                        {completedLessons.includes(lesson.id) && lesson.content_type === 'quiz' && (
                                                            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: '800' }}>{getQuizScoreStatus(lesson)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: '10px', height: '10px', borderRadius: '50%',
                                                    backgroundColor: completedLessons.includes(lesson.id) ? '#10b981' : 'var(--accent-gold)',
                                                    boxShadow: completedLessons.includes(lesson.id) ? '0 0 10px #10b981' : '0 0 10px var(--accent-gold)'
                                                }}></div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {materialResources.map((resource) => (
                                        <div
                                            key={resource.id}
                                            style={{
                                                padding: '1.5rem',
                                                borderRadius: '24px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: completedLessons.includes(resource.id) ? '#10b981' : 'var(--accent-gold)', boxShadow: completedLessons.includes(resource.id) ? '0 0 10px #10b981' : '0 0 10px var(--accent-gold)' }}></div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'white', paddingRight: '1.5rem' }}>{resource.title}</div>
                                            <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.66)', margin: 0, lineHeight: '1.5' }}>{resource.description || 'Recurso adicional para complementar tu aprendizaje.'}</p>
                                            <a
                                                href={resource.video_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => markLessonAsCompleted(resource.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.8rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                    color: 'white',
                                                    textDecoration: 'none',
                                                    borderRadius: '14px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '700',
                                                    transition: 'all 0.3s ease',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                            >
                                                🔗 Acceder al Recurso
                                            </a>
                                        </div>
                                    ))}
                                    {materialResources.length === 0 && (
                                        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.9rem', fontWeight: '600' }}>
                                            No se han compartido recursos por el momento.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes fadeInDown {
                        from { opacity: 0; transform: translateY(-30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    *::-webkit-scrollbar {
                        width: 8px;
                    }
                    *::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.02);
                    }
                    *::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                    }
                    *::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                `}</style>
            </main>
        </div>
    )
}

export default CourseViewer
