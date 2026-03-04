import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Profile = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Profile State
    const [fullName, setFullName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [description, setDescription] = useState('')
    const [email, setEmail] = useState('')
    const [dominantColor, setDominantColor] = useState('rgba(0, 71, 186, 0.1)') // Default brand color

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
        const getProfile = async () => {
            try {
                setLoading(true)
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    navigate('/')
                    return
                }

                setEmail(session.user.email)

                // Fetch profile from 'profiles' table
                const { data, error } = await supabase
                    .from('profiles')
                    .select(`full_name, avatar_url, description`)
                    .eq('id', session.user.id)
                    .single()

                if (error && error.code !== 'PGRST116') {
                    console.warn(error)
                }

                if (data) {
                    setFullName(data.full_name || '')
                    setAvatarUrl(data.avatar_url || '')
                    setDescription(data.description || '')
                    if (data.avatar_url) extractColor(data.avatar_url);
                } else {
                    setFullName(session.user.user_metadata.full_name || '')
                }
            } catch (error) {
                alert(error.message)
            } finally {
                setLoading(false)
            }
        }

        getProfile()
    }, [navigate])

    const uploadAvatar = async (event) => {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Debes seleccionar una imagen para subir.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(data.publicUrl)
            extractColor(data.publicUrl)
        } catch (error) {
            alert(error.message)
        } finally {
            setUploading(false)
        }
    }

    const updateProfile = async (e) => {
        e.preventDefault()
        try {
            setSaving(true)
            const { data: { session } } = await supabase.auth.getSession()

            const updates = {
                id: session.user.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                description: description,
            }

            const { error } = await supabase.from('profiles').upsert(updates)

            if (error) throw error

            // Also update auth metadata for consistency
            await supabase.auth.updateUser({
                data: { full_name: fullName }
            })

            alert('¡Perfil actualizado!')
        } catch (error) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            navigate('/')
        } catch (error) {
            alert(error.message)
        }
    }

    if (loading) {
        return <div style={{ backgroundColor: 'var(--background-color)', color: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Cargando perfil...</p></div>
    }

    return (
        <div style={{ backgroundColor: 'var(--background-color)', minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1, backgroundColor: 'transparent' }}>
                <style>{`
                    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `}</style>

                <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                    {/* Ambient Glow Effects (Sincronizados con Dashboard) */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '1000px', height: '1000px', borderRadius: '50%', background: `radial-gradient(circle, ${dominantColor.replace('0.5', '0.15')} 0%, transparent 70%)`, filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }}></div>
                    <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${dominantColor.replace('0.5', '0.1')} 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>

                    <div style={{ position: 'relative', zIndex: 1, animation: 'fadeInDown 0.8s ease-out' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginBottom: '2.5rem', letterSpacing: '-0.5px' }}>
                            Mi <span style={{ color: 'var(--accent-gold)' }}>Perfil</span>
                        </h1>
                    </div>

                    <div
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            borderRadius: '40px',
                            padding: '3.5rem',
                            maxWidth: '1050px',
                            width: '100%',
                            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.7)',
                            position: 'relative',
                            zIndex: 10,
                            backdropFilter: 'blur(20px)',
                            transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                            animation: 'fadeInUp 1s ease-out 0.2s both',
                            display: 'grid',
                            gridTemplateColumns: 'minmax(280px, 1fr) 2.2fr',
                            gap: '4rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.15), 0 0 50px rgba(0, 71, 186, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 40px rgba(0, 0, 0, 0.02)';
                        }}
                    >
                        {/* Panel de Identidad Visual (Izquierda) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', borderRight: '1px solid #f1f5f9', paddingRight: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '45px',
                                    overflow: 'hidden',
                                    border: `5px solid white`,
                                    boxShadow: `0 25px 50px -12px ${dominantColor.replace('0.5', '0.4')}, 0 0 0 1px rgba(0,0,0,0.05)`,
                                    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    position: 'relative'
                                }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05) rotate(2deg)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
                                >
                                    <img
                                        src={avatarUrl || `https://ui-avatars.com/api/?name=${fullName || 'Usuario'}&background=random`}
                                        alt="Profile"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>{fullName || 'Usuario'}</h2>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500', opacity: 0.8 }}>{email}</p>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f8fafc', borderRadius: '24px', padding: '1.75rem', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Presentación</h3>
                                <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.6', fontStyle: description ? 'normal' : 'italic' }}>
                                    {description || "Actualiza tu biografía para que otros puedan conocerte mejor..."}
                                </p>
                            </div>
                        </div>

                        {/* Panel de Edición de Datos (Derecha) */}
                        <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '8px', height: '24px', backgroundColor: 'var(--accent-color)', borderRadius: '4px' }}></div>
                                    Datos Personales
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '0.6rem', marginLeft: '0.5rem' }}>Nombre Completo</label>
                                        <div style={{ position: 'relative' }}>
                                            <svg style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '1.1rem 1.25rem 1.1rem 3.5rem',
                                                    borderRadius: '18px',
                                                    border: '1.5px solid #f1f5f9',
                                                    backgroundColor: '#f8fafc',
                                                    fontSize: '1rem',
                                                    color: '#1e293b',
                                                    transition: 'all 0.3s ease',
                                                    outline: 'none',
                                                    fontWeight: '500'
                                                }}
                                                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 10px 20px -5px rgba(0, 71, 186, 0.1)'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '8px', height: '24px', backgroundColor: 'var(--accent-gold)', borderRadius: '4px' }}></div>
                                    Personalización
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '0.6rem', marginLeft: '0.5rem' }}>Biografía (Máx. 100 caracteres)</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            maxLength={100}
                                            rows="3"
                                            style={{
                                                width: '100%',
                                                padding: '1.1rem 1.25rem',
                                                borderRadius: '18px',
                                                border: '1.5px solid #f1f5f9',
                                                backgroundColor: '#f8fafc',
                                                fontSize: '1rem',
                                                color: '#1e293b',
                                                fontFamily: 'inherit',
                                                resize: 'none',
                                                transition: 'all 0.3s ease',
                                                outline: 'none',
                                                fontWeight: '500',
                                                lineHeight: '1.5'
                                            }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 10px 20px -5px rgba(0, 71, 186, 0.1)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '0.6rem', marginLeft: '0.5rem' }}>URL del Avatar</label>
                                            <input
                                                type="text"
                                                value={avatarUrl}
                                                onChange={(e) => { setAvatarUrl(e.target.value); if (e.target.value.startsWith('http')) extractColor(e.target.value); }}
                                                style={{
                                                    width: '100%',
                                                    padding: '1rem 1.25rem',
                                                    borderRadius: '16px',
                                                    border: '1.5px solid #f1f5f9',
                                                    backgroundColor: '#f8fafc',
                                                    fontSize: '0.9rem',
                                                    outline: 'none',
                                                    fontWeight: '500'
                                                }}
                                                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.backgroundColor = 'white'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <label style={{
                                                backgroundColor: '#1e293b',
                                                color: 'white',
                                                padding: '0 1.5rem',
                                                height: '52px',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                fontWeight: '700',
                                                cursor: uploading ? 'wait' : 'pointer',
                                                transition: 'all 0.3s ease',
                                                fontSize: '0.85rem'
                                            }}
                                                onMouseEnter={(e) => { e.target.style.backgroundColor = '#0f172a'; e.target.style.transform = 'translateY(-2px)'; }}
                                                onMouseLeave={(e) => { e.target.style.backgroundColor = '#1e293b'; e.target.style.transform = 'translateY(0)'; }}
                                            >
                                                {uploading ? '...' : 'Subir'}
                                                <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} style={{ display: 'none' }} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: 'auto' }}>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        flex: 2,
                                        height: '60px',
                                        backgroundColor: 'var(--accent-color)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '20px',
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        cursor: saving ? 'wait' : 'pointer',
                                        boxShadow: '0 15px 30px -8px rgba(0, 71, 186, 0.4)',
                                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 20px 40px -10px rgba(0, 71, 186, 0.5)'; }}
                                    onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 15px 30px -8px rgba(0, 71, 186, 0.4)'; }}
                                >
                                    {saving ? 'Guardando cambios...' : 'Actualizar perfil'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    style={{
                                        flex: 1,
                                        height: '60px',
                                        backgroundColor: '#fff5f5',
                                        color: '#ef4444',
                                        border: '2px solid #fee2e2',
                                        borderRadius: '20px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#fee2e2'; e.target.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={(e) => { e.target.style.backgroundColor = '#fff5f5'; e.target.style.transform = 'translateY(0)'; }}
                                >
                                    Salir
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Profile
