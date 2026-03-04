import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Materials = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [dominantColor, setDominantColor] = useState('rgba(0, 71, 186, 0.5)')
    const [activeTab, setActiveTab] = useState('All Files')

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
                    console.warn("No se pudo extraer el color:", e);
                }
            };
        } catch (error) {
            console.error("Error en extractColor:", error);
        }
    };

    // Mock Data
    const materials = [
        // { id: 1, title: 'Diapositivas de Diseño Web.pdf', type: 'pdf', size: '12 MB', category: 'Documents' },
        // { id: 2, title: 'Metodología Design Thinking.pptx', type: 'pptx', size: '4.5 MB', category: 'Documents' },
        // { id: 3, title: 'Clase Magistral Módulo 1.video', type: 'video', size: 'MP4, 45 min', category: 'Videos' },
        // { id: 4, title: 'Presupuesto del Proyecto Final.xlsx', type: 'xlsx', size: '1.2 MB', category: 'Documents' }, 
        // { id: 5, title: 'Guía de Escritura Creativa.docx', type: 'docx', size: '2.8 MB', category: 'Documents' },
        // { id: 6, title: 'Podcast del Curso - Episodio 1.audio', type: 'audio', size: 'MP3, 20 min', category: 'Audio' },
        // { id: 7, title: 'Resumen Semanal de Notas.xls', type: 'xls', size: '850 KB', category: 'Documents' },
        // { id: 8, title: 'Presentación de Bienvenida.ppt', type: 'ppt', size: '3.2 MB', category: 'Documents' },
        // { id: 9, title: 'Manual de Usuario SIRA.pdf', type: 'pdf', size: '5.4 MB', category: 'Documents' },
        // { id: 10, title: 'Ejercicios de Programación.doc', type: 'doc', size: '1.5 MB', category: 'Documents' },
    ]

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/')
            } else {
                setUser(session.user)

                // Fetch profile data
                const { data } = await supabase
                    .from('profiles')
                    .select('avatar_url, role')
                    .eq('id', session.user.id)
                    .single()

                if (data) {
                    setAvatarUrl(data.avatar_url)
                    setUserRole(data.role)
                    if (data.avatar_url) extractColor(data.avatar_url)
                }
            }
        }
        getUser()
    }, [navigate])

    const filteredMaterials = activeTab === 'All Files'
        ? materials
        : materials.filter(m => m.category === activeTab)

    const getIcon = (type) => {
        const t = type.toLowerCase();
        const iconStyle = {
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        };

        // Mapeo selectivo para react-file-icon
        let extension = t;
        if (t === 'video') extension = 'mp4';
        if (t === 'audio') extension = 'mp3';

        return (
            <div style={iconStyle}>
                <FileIcon
                    extension={extension}
                    {...defaultStyles[extension]}
                    color={
                        t === 'pdf' ? '#ef4444' :
                            (t === 'doc' || t === 'docx') ? '#38bdf8' :
                                (t === 'xls' || t === 'xlsx') ? '#22c55e' :
                                    (t === 'ppt' || t === 'pptx') ? '#f97316' :
                                        t === 'video' ? '#1e40af' :
                                            t === 'audio' ? '#8b5cf6' : '#64748b'
                    }
                />
            </div>
        );
    }

    const MaterialCard = ({ file, index }) => {
        const fileColors = {
            'pdf': '#ef4444',      // Red
            'ppt': '#f97316',      // Orange
            'pptx': '#f97316',     // Orange
            'doc': '#38bdf8',      // Light Blue
            'docx': '#38bdf8',     // Light Blue
            'xls': '#22c55e',      // Green
            'xlsx': '#22c55e',     // Green
            'video': '#1e40af',    // Dark Blue
            'audio': '#8b5cf6',    // Purple
            'default': '#64748b'   // Gray
        };
        const color = fileColors[file.type.toLowerCase()] || fileColors.default;

        return (
            <div
                className="marquee-container"
                style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    padding: '1.25rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    border: '1px solid #f1f5f9',
                    position: 'relative',
                    overflow: 'hidden',
                    width: '100%',
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
                    e.currentTarget.style.boxShadow = `0 30px 60px -15px ${color}55, 0 10px 20px -10px ${color}33`;
                    e.currentTarget.style.borderColor = `${color}66`;
                    const glows = e.currentTarget.querySelectorAll('.card-glow');
                    glows.forEach(glow => glow.style.opacity = '1');
                    const icon = e.currentTarget.querySelector('.icon-container');
                    if (icon) {
                        icon.style.backgroundColor = `${color}25`;
                        icon.style.transform = 'scale(1.1) rotate(-5deg)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                    const glows = e.currentTarget.querySelectorAll('.card-glow');
                    glows.forEach(glow => glow.style.opacity = '0');
                    const icon = e.currentTarget.querySelector('.icon-container');
                    if (icon) {
                        icon.style.backgroundColor = `${color}10`;
                        icon.style.transform = 'scale(1) rotate(0deg)';
                    }
                }}
            >
                {/* Dual Glow System for a striking look */}
                <div className="card-glow" style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '220px',
                    height: '220px',
                    background: `radial-gradient(circle, ${color}88 0%, ${color}22 50%, transparent 70%)`,
                    filter: 'blur(30px)',
                    opacity: '0',
                    transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}></div>
                <div className="card-glow" style={{
                    position: 'absolute',
                    bottom: '-60px',
                    left: '-20px',
                    width: '180px',
                    height: '180px',
                    background: `radial-gradient(circle, ${color}66 0%, transparent 70%)`,
                    filter: 'blur(25px)',
                    opacity: '0',
                    transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}></div>

                {/* Left Side: Icon */}
                <div className="icon-container" style={{
                    position: 'relative',
                    zIndex: 1,
                    flexShrink: 0,
                    width: '64px',
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${color}10`,
                    borderRadius: '18px',
                    color: color,
                    transition: 'all 0.4s ease',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    {getIcon(file.type)}
                </div>

                {/* Center/Right Side: Info */}
                <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ overflow: 'hidden', width: '100%' }}>
                        <h3 className="marquee-text" style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                            {file.title}
                        </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                            fontSize: '0.65rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            color: color,
                            backgroundColor: `${color}15`,
                            padding: '0.3rem 0.8rem',
                            borderRadius: '100px',
                            border: `1px solid ${color}33`,
                            letterSpacing: '0.5px'
                        }}>
                            {file.type}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>
                            {file.size}
                        </span>
                    </div>
                </div>

                {/* Action Arrow */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    flexShrink: 0,
                    border: '1px solid #f1f5f9'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
            </div>
        );
    };

    return (
        <div style={{ backgroundColor: 'var(--background-color)', minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <style>
                {`
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        50% { transform: translateX(-50%); }
                        100% { transform: translateX(0); }
                    }
                    .marquee-container:hover .marquee-text {
                        padding-left: 10%;
                        animation: marquee 5s ease-in-out infinite;
                    }
                    .marquee-text {
                        color: #1e293b;
                        transition: all 0.3s;
                        display: block;
                        white-space: nowrap;
                    }
                    @keyframes fadeInDown {
                        from { opacity: 0; transform: translateY(-30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, backgroundColor: 'transparent' }}>

                {/* Ambient Glow Effects (From Dashboard) */}
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle, ${dominantColor.replace('0.5', '0.15')} 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${dominantColor.replace('0.5', '0.1')} 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>

                <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    {/* Header with Standard Profile Widget */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
                        <div style={{ animation: 'fadeInDown 0.8s ease-out' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
                                Mis <span style={{ color: 'var(--accent-gold)' }}>Materiales</span>
                            </h1>
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', fontWeight: '500' }}>Continúa tu camino hacia el éxito académico.</p>
                        </div>

                        {/* Profile Widget (Identical to Dashboard/Courses) */}
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
                    </div>

                    {/* Tabs and Sort Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255, 255, 255, 0.79)', marginBottom: '2.5rem', animation: 'fadeInUp 0.8s ease-out 0.2s both' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['Todos', 'Documentos', 'Videos', 'Audios'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab === 'Todos' ? 'All Files' : (tab === 'Documentos' ? 'Documents' : (tab === 'Audios' ? 'Audio' : tab)))}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        fontSize: '1rem',
                                        fontWeight: (activeTab === 'All Files' && tab === 'Todos') || (activeTab === 'Documents' && tab === 'Documentos') || (activeTab === 'Audio' && tab === 'Audios') || activeTab === tab ? '700' : '500',
                                        color: (activeTab === 'All Files' && tab === 'Todos') || (activeTab === 'Documents' && tab === 'Documentos') || (activeTab === 'Audio' && tab === 'Audios') || activeTab === tab ? '#ffffff' : '#ffffff91',
                                        cursor: 'pointer',
                                        padding: '0.5rem 0.5rem 1rem',
                                        borderBottom: (activeTab === 'All Files' && tab === 'Todos') || (activeTab === 'Documents' && tab === 'Documentos') || (activeTab === 'Audio' && tab === 'Audios') || activeTab === tab ? `3px solid ${dominantColor.replace('0.5', '0.8')}` : '3px solid transparent',
                                        marginBottom: '-2px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            padding: '0.6rem 1.25rem', backgroundColor: 'white', border: 'none', borderRadius: '10px',
                            color: 'var(--accent-color)', fontSize: '0.85rem', cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontWeight: '700',
                            marginBottom: '0.5rem'
                        }}>
                            Ordenar por: Recientes <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    </div>

                    {/* All Materials Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                        {filteredMaterials.map((file, idx) => (
                            <MaterialCard key={file.id} file={file} index={idx} />
                        ))}
                    </div>

                    {/* Recent Section - Only visible in "All Files" */}
                    {activeTab === 'All Files' && (
                        <div style={{ animation: 'fadeInUp 0.8s ease-out 0.4s both' }}>
                            <div style={{ marginBottom: '2rem', borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#ffffff' }}>Materiales Recientes</h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                                {materials.slice(0, 4).map((file, idx) => (
                                    <MaterialCard key={`recent-${file.id}`} file={file} index={idx} />
                                ))}
                            </div>
                        </div>
                    )}
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
                                SIRA <span style={{ mx: '0.5rem', opacity: 0.3 }}>•</span> Sistema de Información y Recursos Académicos
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
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.25)', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                            &copy; {new Date().getFullYear()} DIPAAM | CONECTA ACADEMY LATAM <span style={{ margin: '0 1rem', opacity: 0.2 }}>|</span> Sistema de Información y Recursos Académicos
                        </p>
                    </div>
                </footer> */}
            </main>
        </div>
    )
}

export default Materials
