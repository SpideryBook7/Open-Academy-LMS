import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Messages = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [selectedChatId, setSelectedChatId] = useState(1)
    const [inputMessage, setInputMessage] = useState('')

    // Mock Data
    const chats = [
        {
            id: 1,
            name: 'Prof. Sarah Connor',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
            lastMessage: "Don't forget the assignment is due Friday.",
            time: '10:30 AM',
            unread: 1,
            status: 'Online'
        },
        {
            id: 2,
            name: 'Team Project 3',
            avatar: 'https://ui-avatars.com/api/?name=Team+Project&background=random',
            lastMessage: 'Meeting notes to meeting your concern about graduates and...',
            time: 'Yesterday',
            unread: 0,
            status: 'Offline'
        },
        {
            id: 3,
            name: 'Alex Proflum (You)',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
            lastMessage: 'Sent file...',
            time: 'Yesterday',
            unread: 0,
            status: 'Online'
        },
        {
            id: 4,
            name: 'Help Desk',
            avatar: 'https://ui-avatars.com/api/?name=Help+Desk&background=random',
            lastMessage: 'Ticket closed in Help Desk complete your. Ticket closed...',
            time: '2 days ago',
            unread: 0,
            status: 'Online'
        },
    ]

    const messages = {
        1: [
            { id: 1, sender: 'Sarah', text: "Don't forget the assignment is due Friday.", time: '10:30 AM', isMe: false },
            { id: 2, sender: 'Me', text: "Thanks, Professor. Working on it now.", time: '10:35 AM', isMe: true },
        ],
        2: [
            { id: 1, sender: 'John', text: "Hey guys, when are we meeting?", time: '9:00 AM', isMe: false },
        ],
        3: [],
        4: [],
    }

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/')
            } else {
                setUser(session.user)
            }
        }
        getUser()
    }, [navigate])

    const activeChat = chats.find(c => c.id === selectedChatId)
    const activeMessages = messages[selectedChatId] || []

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (!inputMessage.trim()) return
        // In a real app, we'd send to DB here
        console.log('Sending:', inputMessage)
        setInputMessage('')
    }

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
            <Sidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>Messages</h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ position: 'relative' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #f8fafc' }}></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img
                                src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                                alt="Profile"
                            />
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}>{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>
                </div>

                {/* Chat Container */}
                <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', overflow: 'hidden' }}>

                    {/* Sidebar: Recent Chats */}
                    <div style={{ width: '320px', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Recent Chats</h2>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {chats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => setSelectedChatId(chat.id)}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        display: 'flex',
                                        gap: '1rem',
                                        cursor: 'pointer',
                                        backgroundColor: selectedChatId === chat.id ? '#f1f5f9' : 'transparent',
                                        borderLeft: selectedChatId === chat.id ? '4px solid #475569' : '4px solid transparent',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <img src={chat.avatar} alt={chat.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                                        {chat.status === 'Online' && (
                                            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', border: '2px solid white' }}></div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>{chat.name}</h3>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{chat.time}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <p style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {chat.lastMessage}
                                            </p>
                                            {chat.unread > 0 && (
                                                <span style={{ backgroundColor: '#3b82f6', color: 'white', fontSize: '0.7rem', fontWeight: '600', padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>
                                                    {chat.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Chat Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>{activeChat.name}</h2>
                                <span style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: '500' }}>({activeChat.status})</span>
                            </div>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                            </button>
                        </div>

                        {/* Messages List */}
                        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#ffffff' }}>
                            {activeMessages.map(msg => (
                                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isMe ? 'flex-end' : 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>{msg.sender}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{msg.time}</span>
                                    </div>
                                    <div style={{
                                        maxWidth: '70%',
                                        padding: '0.875rem 1.25rem',
                                        borderRadius: msg.isMe ? '12px 0 12px 12px' : '0 12px 12px 12px',
                                        backgroundColor: msg.isMe ? '#3b82f6' : '#f1f5f9',
                                        color: msg.isMe ? 'white' : '#334155',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                            <form onSubmit={handleSendMessage} style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Type message"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem 3rem 1rem 1.25rem',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        color: '#0f172a'
                                    }}
                                />
                                <button
                                    type="button"
                                    style={{ position: 'absolute', right: '48px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                </button>
                                <button
                                    type="submit"
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}

export default Messages
