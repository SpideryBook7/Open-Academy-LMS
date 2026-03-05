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

    // User Materials State
    const [materials, setMaterials] = useState([])
    const [loadingMaterials, setLoadingMaterials] = useState(true)

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

                // Fetch User Materials from Supabase
                const fetchUserMaterials = async () => {
                    try {
                        const { data: materialsData, error } = await supabase
                            .from('user_materials')
                            .select('*')
                            .eq('user_id', session.user.id)
                            .order('created_at', { ascending: false });

                        if (error) {
                            console.error('Error al cargar materiales:', error);
                        } else {
                            setMaterials(materialsData || []);
                        }
                    } catch (err) {
                        console.error('Exception fetching materials:', err);
                    } finally {
                        setLoadingMaterials(false);
                    }
                };

                fetchUserMaterials();
            }
        }
        getUser()
    }, [navigate])

    const filteredMaterials = materials; // All materials are now considered general "Materiales extras"

    const getIcon = () => {
        // Enlaces generales de Drive o Internet usan un estilo predeterminado azul/verde
        const color = '#34a853'; // Google Drive green
        const iconStyle = {
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color
        };

        return (
            <div style={iconStyle}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
        );
    }

    const MaterialCard = ({ file, index }) => {
        const color = '#34a853'; // Google Drive green

        return (
            <div
                className="marquee-container"
                onClick={() => window.open(file.url, '_blank')}
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
                    {getIcon()}
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
                            Drive Doc
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                            {file.url}
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

                    {/* Section Title */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255, 255, 255, 0.79)', marginBottom: '2.5rem', animation: 'fadeInUp 0.8s ease-out 0.2s both', paddingBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>Documentos Extras</h2>
                    </div>

                    {/* All Materials Grid */}
                    {loadingMaterials ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#ffffff' }}>
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Cargando materiales...</p>
                        </div>
                    ) : filteredMaterials.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#ffffff99' }}>
                            <p style={{ fontSize: '1.2rem' }}>No tienes materiales en esta categoría.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                            {filteredMaterials.map((file, idx) => (
                                <MaterialCard key={file.id} file={file} index={idx} />
                            ))}
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
