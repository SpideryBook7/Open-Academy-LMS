import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Profile = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [user, setUser] = useState(null)

    // Profile State
    const [fullName, setFullName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [description, setDescription] = useState('')
    const [email, setEmail] = useState('')

    useEffect(() => {
        getProfile()
    }, [])

    const getProfile = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                navigate('/')
                return
            }

            setUser(session.user)
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
            } else {
                setFullName(session.user.user_metadata.full_name || '')
            }
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const uploadAvatar = async (event) => {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
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

            // Get Public URL
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(data.publicUrl)
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

            alert('Profile updated!')
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
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
    }

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '2rem' }}>
                    Account Settings
                </h1>

                <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '800px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

                        {/* Avatar Preview */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #f1f5f9' }}>
                                <img
                                    src={avatarUrl || `https://ui-avatars.com/api/?name=${fullName || 'User'}&background=random`}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Profile Picture</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={updateProfile} style={{ flex: 1 }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#f1f5f9',
                                        color: '#94a3b8',
                                        cursor: 'not-allowed'
                                    }}
                                />
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Email cannot be changed.</p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '1rem',
                                        color: '#0f172a'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>Avatar Image</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <label className="btn" style={{
                                        backgroundColor: '#f1f5f9',
                                        color: '#475569',
                                        border: '1px solid #e2e8f0',
                                        cursor: uploading ? 'wait' : 'pointer',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem'
                                    }}>
                                        {uploading ? 'Uploading...' : 'Upload New Photo'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={uploadAvatar}
                                            disabled={uploading}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <input
                                        type="text"
                                        value={avatarUrl}
                                        disabled
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '0.875rem',
                                            color: '#94a3b8',
                                            backgroundColor: '#f8fafc'
                                        }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Select an image to upload. It will be stored securely.</p>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#64748b', marginBottom: '0.5rem' }}>Bio / Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell us a little about yourself (max 100 chars)..."
                                    maxLength={100}
                                    rows="3"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.875rem',
                                        color: '#0f172a',
                                        fontFamily: 'inherit',
                                        resize: 'none'
                                    }}
                                />
                                <p style={{ textAlign: 'right', fontSize: '0.75rem', color: description.length >= 100 ? '#ef4444' : '#94a3b8', marginTop: '0.25rem' }}>
                                    {description.length}/100
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        padding: '0.75rem 2rem',
                                        backgroundColor: '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: saving ? 'wait' : 'pointer',
                                        opacity: saving ? 0.7 : 1
                                    }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    style={{
                                        padding: '0.75rem 2rem',
                                        backgroundColor: '#fee2e2',
                                        color: '#ef4444',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    Sign Out
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
