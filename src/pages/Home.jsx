import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import logoConecta from '../assets/LOGO-CONECTA.png'
import logoDipaam from '../assets/LOGO DIPAAM RESPLANDOR.png'

const Home = () => {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            const { data: { user } } = await supabase.auth.getUser()
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'admin') {
                navigate('/admin/dashboard')
            } else {
                navigate('/dashboard')
            }
        } catch (error) {
            console.error("Auth error:", error.message)
            // Use a clean alert for now, in a real app we'd use a toast
            alert("Acceso denegado: Por favor verifica tus credenciales")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            backgroundColor: '#ffffff',
            fontFamily: 'var(--font-family)',
            overflow: 'hidden'
        }}>
            {/* Animaciones CSS */}
            <style>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                @keyframes pulse-glow {
                    0% { transform: scale(1); opacity: 0.1; }
                    50% { transform: scale(1.1); opacity: 0.15; }
                    100% { transform: scale(1); opacity: 0.1; }
                }
            `}</style>

            {/* Left Side: Form Panel */}
            <div style={{
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '5rem',
                maxWidth: '650px',
                zIndex: 2,
                backgroundColor: '#ffffff'
            }}>
                <div style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
                    {/* Brand Logos */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5rem',
                        marginBottom: '1rem',
                        animation: 'fadeInDown 0.8s cubic-bezier(0.23, 1, 0.32, 1)'
                    }}>
                        <img src={logoDipaam} alt="DIPAAM" style={{ height: '75px', objectFit: 'contain' }} />
                        <div style={{ width: '1px', height: '60px', background: 'rgba(0,0,0,0.1)' }}></div>
                        <img src={logoConecta} alt="CONECTA" style={{ height: '75px', objectFit: 'contain' }} />
                    </div>

                    {/* Welcome Text */}
                    <div style={{ marginBottom: '3rem', animation: 'fadeInDown 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.1s both' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                            Bienvenido a <span style={{ color: 'var(--accent-color)' }}>SIRA</span>
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '500' }}>
                            Sistema de Información y Recursos Académicos
                        </p>
                    </div>

                    {/* Auth Form */}
                    <form onSubmit={handleAuth} style={{ animation: 'fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.2s both' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.9rem',
                                fontWeight: '700',
                                color: '#334155',
                                marginBottom: '0.75rem',
                            }}>
                                Correo electrónico
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tuemail@gmail.com"
                                required
                                style={{
                                    width: '100%',
                                    padding: '1.1rem 1.25rem',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    backgroundColor: '#f8fafc',
                                    fontSize: '1rem',
                                    fontWeight: '400',
                                    color: '#0f172a',
                                    transition: 'all 0.3s ease',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--accent-color)';
                                    e.target.style.backgroundColor = '#ffffff';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 186, 0.08)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.backgroundColor = '#f8fafc';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.9rem',
                                    fontWeight: '00',
                                    color: '#334155',
                                }}>
                                    Contraseña
                                </label>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '1.1rem 3.5rem 1.1rem 1.25rem',
                                        borderRadius: '16px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#f8fafc',
                                        fontSize: '1rem',
                                        fontWeight: '400',
                                        color: '#0f172a',
                                        transition: 'all 0.3s ease',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--accent-color)';
                                        e.target.style.backgroundColor = '#ffffff';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 186, 0.08)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e2e8f0';
                                        e.target.style.backgroundColor = '#f8fafc';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '1.25rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        color: '#64748b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'color 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '1.2rem',
                                background: 'linear-gradient(135deg, var(--accent-color) 0%, #00225e 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '18px',
                                fontWeight: '600',
                                fontSize: '1.1rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                boxShadow: '0 10px 25px rgba(0, 71, 186, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '1rem'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 71, 186, 0.35)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 71, 186, 0.25)';
                                }
                            }}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    <span>Acceder al Sistema</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div style={{
                        marginTop: '4rem',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: '0.9rem',
                        animation: 'fadeInUp 0.8s ease-out 0.4s both'
                    }}>
                        &copy; {new Date().getFullYear()} DIPAAM | CONECTA ACADEMY LATAM
                    </div>
                </div>
            </div>

            {/* Right Side: Visual & Interactive Branding */}
            <div style={{
                flex: '1.4',
                backgroundColor: '#0f172a', // Matching NotFound feel
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {/* Premium Decorative Glows */}
                <div style={{
                    position: 'absolute', top: '-10%', right: '-10%', width: '1000px', height: '1000px',
                    borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-color) 0%, transparent 40%)',
                    filter: 'blur(10px)', zIndex: 0, opacity: 0.2, animation: 'pulse-glow 12s infinite ease-in-out'
                }}></div>
                <div style={{
                    position: 'absolute', bottom: '-10%', left: '-10%', width: '800px', height: '800px',
                    borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-gold) 0%, transparent 70%)',
                    filter: 'blur(100px)', zIndex: 0, opacity: 0.1, animation: 'pulse-glow 15s infinite ease-in-out reverse'
                }}></div>

                {/* Main Content Card */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '80%',
                    animation: 'slideInRight 1.2s cubic-bezier(0.23, 1, 0.32, 1)'
                }}>
                    {/* Glass Container */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(25px)',
                        padding: '4.5rem',
                        borderRadius: '60px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 50px 100px -20px rgba(0,0,0,0.6)',
                    }}>
                        <div style={{
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: 'var(--accent-gold)',
                            textTransform: 'uppercase',
                            letterSpacing: '4px',
                            marginBottom: '1.5rem',
                            display: 'block'
                        }}>
                            Web Académica - SIRA
                        </div>
                        <h2 style={{
                            fontSize: '4.5rem',
                            fontWeight: '700',
                            color: '#ffffff',
                            lineHeight: '1.1',
                            letterSpacing: '-2px',
                            marginBottom: '2rem'
                        }}>
                            Impulsa tu <br />
                            <span style={{
                                background: 'linear-gradient(135deg, #ffffff 40%, rgba(255,255,255,0.4) 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Crecimiento.</span>
                        </h2>
                        <div style={{ width: '125px', height: '6px', background: 'var(--accent-gold)', borderRadius: '10px', marginBottom: '2rem' }}></div>
                        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', maxWidth: '500px', fontWeight: '500' }}>
                            Plataforma de gestión de recursos académicos y aprendizaje continuo.
                        </p>

                        {/* Stats / Proof points */}
                        <div style={{ display: 'flex', gap: '3rem', marginTop: '4rem' }}>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff' }}>100%</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Seguridad</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff' }}>24/7</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Disponibilidad</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff' }}>∞</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Potencial</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Spinner Animation for loading button */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default Home
