import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '' });
    const [creating, setCreating] = useState(false);

    // New states for enroll modal
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchCourses(); // Fetch courses when component mounts
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                enrollments (
                    course_id
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setUsers(data);
        }
        setLoading(false);
    };

    const fetchCourses = async () => {
        const { data, error } = await supabase.from('courses').select('id, title');
        if (error) {
            console.error('Error fetching courses:', error);
        } else {
            setCourses(data);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            // Create user in auth.users
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newUser.email,
                password: newUser.password,
                options: {
                    data: {
                        full_name: newUser.full_name,
                        role: 'student' // Default role for new users
                    }
                }
            });

            if (authError) throw authError;

            // If auth user created, a profile should be automatically created via trigger
            // We can optionally update the profile here if needed, but signUp with data usually handles it.

            alert('User created successfully!')
            setShowCreateModal(false)
            setNewUser({ email: '', password: '', full_name: '' })
            fetchUsers() // Refresh list
        } catch (error) {
            alert('Error creating user: ' + error.message)
        } finally {
            setCreating(false)
        }
    }

    const handleRoleChange = async (userId, newRole) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId)

            if (error) throw error

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        } catch (error) {
            alert('Error updating role: ' + error.message)
        }
    }

    const handleEnrollUser = async (e) => {
        e.preventDefault();
        setEnrolling(true);
        try {
            if (!selectedUser || !selectedCourse) {
                alert('Please select a user and a course.');
                return;
            }

            const { error } = await supabase.from('enrollments').insert([
                { user_id: selectedUser.id, course_id: selectedCourse }
            ]);

            if (error) {
                // Check for unique constraint error (user already enrolled in course)
                if (error.code === '23505') { // PostgreSQL unique violation error code
                    alert('User is already enrolled in this course.');
                } else {
                    throw error;
                }
            } else {
                alert(`User ${selectedUser.full_name} enrolled in course successfully!`);
                setShowEnrollModal(false);
                setSelectedUser(null);
                setSelectedCourse('');
                fetchUsers(); // Refresh to show new enrollment
            }
        } catch (error) {
            alert('Error enrolling user: ' + error.message);
        } finally {
            setEnrolling(false);
        }
    };

    // Filter users
    const filteredUsers = users.filter(user =>
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Helper to get course title
    const getCourseTitle = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        return course ? course.title : 'Unknown Course';
    }

    return (
        <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex' }}>
            <AdminSidebar />

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a' }}>User Management</h1>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: '300px' }}
                        />
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                        >
                            + New User
                        </button>
                    </div>
                </div>

                <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>User</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>Enrollments</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>Email</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>Role</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 'bold' }}>
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{user.full_name || 'Unknown'}</span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                                            {user.enrollments && user.enrollments.map((enrollment, idx) => (
                                                <span key={idx} style={{
                                                    fontSize: '0.75rem',
                                                    backgroundColor: '#f1f5f9',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    color: '#475569',
                                                    border: '1px solid #e2e8f0'
                                                }}>
                                                    {getCourseTitle(enrollment.course_id)}
                                                </span>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setShowEnrollModal(true)
                                                }}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    fontSize: '0.8rem',
                                                    backgroundColor: '#e0f2fe',
                                                    color: '#0284c7',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    whiteSpace: 'nowrap',
                                                    marginTop: '0.25rem'
                                                }}
                                            >
                                                + Enroll
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#64748b' }}>{user.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={user.role || 'student'}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            style={{
                                                padding: '0.5rem',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0',
                                                backgroundColor: user.role === 'admin' ? '#eff6ff' : 'white',
                                                color: user.role === 'admin' ? '#1d4ed8' : '#334155',
                                                fontWeight: '600',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <option value="student">Student</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {loading && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading users...</div>}
                </div>
                {/* Create User Modal */}
                {showCreateModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '450px', maxWidth: '90%' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#0f172a' }}>Create New Student</h2>
                            <form onSubmit={handleCreateUser}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#64748b' }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={newUser.full_name}
                                        onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                        required
                                        placeholder="John Doe"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#64748b' }}>Email</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        required
                                        placeholder="student@example.com"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#64748b' }}>Password</label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        required
                                        placeholder="Min. 6 characters"
                                        minLength={6}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '500' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                                    >
                                        {creating ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Enroll User Modal */}
                {showEnrollModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '450px', maxWidth: '90%' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#0f172a' }}>Enroll User</h2>
                            <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>Enrolling <strong>{selectedUser?.full_name}</strong> in:</p>

                            <form onSubmit={handleEnrollUser}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#64748b' }}>Select Course</label>
                                    <select
                                        value={selectedCourse}
                                        onChange={e => setSelectedCourse(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                    >
                                        <option value="">-- Choose a Course --</option>
                                        {courses.map(course => (
                                            <option key={course.id} value={course.id}>{course.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowEnrollModal(false)}
                                        style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '500' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={enrolling}
                                        style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', cursor: enrolling ? 'not-allowed' : 'pointer', fontWeight: '600' }}
                                    >
                                        {enrolling ? 'Enrolling...' : 'Enroll User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main >
        </div >
    )
}

export default AdminUsers
