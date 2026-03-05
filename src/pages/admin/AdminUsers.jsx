import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import AdminSidebar from '../../components/AdminSidebar'

const ExpandableEnrollments = ({ enrollments, getCourseTitle, onEnrollClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Fallback safety
    const safeEnrollments = enrollments || [];
    const hasMoreThanTwo = safeEnrollments.length > 2;
    const visibleEnrollments = isExpanded ? safeEnrollments : safeEnrollments.slice(0, 2);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {visibleEnrollments.map((enrollment, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f8fafc', padding: '0.3rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '600' }}>
                            {getCourseTitle(enrollment.course_id)}
                        </span>
                        {enrollment.completed && <span title="Completado" style={{ fontSize: '0.8rem' }}>✅</span>}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                <button
                    onClick={onEnrollClick}
                    style={{
                        padding: '0.4rem 1rem',
                        fontSize: '0.8rem',
                        backgroundColor: 'rgba(0, 71, 186, 0.08)',
                        color: 'var(--accent-color)',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-color)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 71, 186, 0.08)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Inscribir
                </button>

                {hasMoreThanTwo && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'transparent',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                        title={isExpanded ? "Ver menos" : `Ver ${safeEnrollments.length - 2} más`}
                    >
                        {isExpanded ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        )}
                        {isExpanded ? 'Menos' : `+${safeEnrollments.length - 2}`}
                    </button>
                )}
            </div>
        </div>
    );
};

function AdminUsers() {
    const location = useLocation();
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

    // States for Material assign modal
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [newMaterial, setNewMaterial] = useState({ title: '', url: '' });
    const [assigningMaterial, setAssigningMaterial] = useState(false);
    const [userMaterials, setUserMaterials] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchCourses(); // Fetch courses when component mounts

        // Auto-open modal if requested via navigation state
        if (location.state?.openCreateModal) {
            setShowCreateModal(true);
            // Clear state from history so it doesn't reopen on refresh
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                enrollments (
                    course_id,
                    completed
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
            // Create user with autoConfirm (requires email confirmation disabled in Supabase)
            const { error: authError } = await supabase.auth.signUp({
                email: newUser.email,
                password: newUser.password,
                options: {
                    data: {
                        full_name: newUser.full_name,
                        role: 'student'
                    },
                    emailRedirectTo: undefined // Skip confirmation email
                }
            });

            if (authError) throw authError;

            alert('Usuario creado exitosamente!')
            setShowCreateModal(false)
            setNewUser({ email: '', password: '', full_name: '' })
            fetchUsers() // Refresh list
        } catch (error) {
            alert('Error al crear usuario: ' + error.message)
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
            alert('Error al actualizar el rol: ' + error.message)
        }
    }

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${userName}?\n\nEsto eliminará su perfil y todas sus inscripciones, retirando su acceso a la plataforma.`)) {
            return;
        }

        try {
            // Llama a la función RPC para eliminar al usuario completamente (incluyendo de auth.users)
            // Nota: Esta función debe ser creada corriendo el script delete_user.sql en el SQL Editor de Supabase
            const { data, error: rpcError } = await supabase.rpc('delete_user', { target_user_id: userId });

            if (rpcError) throw rpcError;

            // Revisar si la función de base de datos devolvió un error manejado (ej. RLS o permisos)
            if (data && data.success === false) {
                throw new Error(data.message || 'Error desconocido retornado por Supabase');
            }

            alert(`Usuario ${userName} eliminado exitosamente.`);
            setUsers(users.filter(u => u.id !== userId));

        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert('Error al eliminar usuario: ' + (error.message || 'Error desconocido'));
        }
    };

    const handleEnrollUser = async (e) => {
        e.preventDefault();
        setEnrolling(true);
        try {
            if (!selectedUser || !selectedCourse) {
                alert('Por favor, seleccione un usuario y un curso.');
                return;
            }

            // Verificación en frontend si ya está inscrito
            const isAlreadyEnrolled = selectedUser.enrollments?.some(
                (enrollment) => enrollment.course_id === selectedCourse
            );

            if (isAlreadyEnrolled) {
                alert('El usuario ya está inscrito en este curso.');
                return;
            }

            const { error } = await supabase.from('enrollments').insert([
                { user_id: selectedUser.id, course_id: selectedCourse }
            ]);

            if (error) {
                // Check for unique constraint error (user already enrolled in course)
                if (error.code === '23505') { // PostgreSQL unique violation error code
                    alert('El usuario ya está inscrito en este curso.');
                } else {
                    throw error;
                }
            } else {
                alert(`El usuario ${selectedUser.full_name} se inscribió en el curso exitosamente!`);
                setShowEnrollModal(false);
                setSelectedUser(null);
                setSelectedCourse('');
                fetchUsers(); // Refresh to show new enrollment
            }
        } catch (error) {
            alert('Error al inscribir usuario: ' + error.message);
        } finally {
            setEnrolling(false);
        }
    };

    const handleOpenMaterialModal = async (user) => {
        setSelectedUser(user);
        setShowMaterialModal(true);
        setNewMaterial({ title: '', url: '' });
        fetchUserMaterials(user.id);
    };

    const fetchUserMaterials = async (userId) => {
        setLoadingMaterials(true);
        try {
            const { data, error } = await supabase
                .from('user_materials')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUserMaterials(data || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoadingMaterials(false);
        }
    };

    const handleAssignMaterial = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        setAssigningMaterial(true);
        try {
            const { error } = await supabase.from('user_materials').insert([
                {
                    user_id: selectedUser.id,
                    title: newMaterial.title,
                    category: 'Materiales extras',
                    url: newMaterial.url
                }
            ]);

            if (error) throw error;

            alert('Material asignado exitosamente');
            setNewMaterial({ title: '', url: '' });
            fetchUserMaterials(selectedUser.id);
        } catch (error) {
            alert('Error al asignar material: ' + error.message);
        } finally {
            setAssigningMaterial(false);
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        if (!window.confirm('¿Seguro que quieres eliminar este material?')) return;
        try {
            const { error } = await supabase.from('user_materials').delete().eq('id', materialId);
            if (error) throw error;
            fetchUserMaterials(selectedUser.id);
        } catch (error) {
            alert('Error al eliminar material: ' + error.message);
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
        return course ? course.title : 'Curso desconocido';
    }

    return (
        <div style={{ backgroundColor: 'var(--background-color)', minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <AdminSidebar />

            {/* Premium Decorative Glows */}
            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }}></div>

            <main style={{ marginLeft: '260px', flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, minHeight: '100vh' }}>
                <style>{`
                    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                `}</style>

                <div style={{ flex: 1 }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem', animation: 'fadeInDown 0.8s ease-out' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
                                Gestión de <span style={{ color: 'var(--accent-gold)', textShadow: '0 0 20px rgba(207, 170, 3, 0.92)' }}>Usuarios</span>
                            </h1>
                            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', fontWeight: '500' }}>Administra y controla el acceso a la plataforma SIRA.</p>
                        </div>

                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Buscar usuarios..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        padding: '0.8rem 1.2rem 0.8rem 2.8rem',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: '#ffffff',
                                        width: '320px',
                                        backdropFilter: 'blur(10px)',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        transition: 'all 0.3s'
                                    }}
                                    onFocus={(e) => { e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; e.target.style.borderColor = 'var(--accent-gold)'; }}
                                    onBlur={(e) => { e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
                                />
                                <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.5)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                style={{
                                    padding: '0.8rem 1.6rem',
                                    backgroundColor: 'var(--accent-color, #3b82f6)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)'; }}
                            >
                                + Nuevo Usuario
                            </button>
                        </div>
                    </header>

                    <div
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '28px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            overflow: 'hidden',
                            animation: 'fadeInUp 0.8s ease-out 0.2s both',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'default',
                            width: '100%'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        {/* Wrapper para el scroll horizontal */}
                        <div style={{ width: '100%', overflowX: 'auto' }} className="premium-scrollbar">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                                <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    <tr>
                                        <th style={{ padding: '1.25rem', fontSize: '0.9rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuario</th>
                                        <th style={{ padding: '1.25rem', fontSize: '0.9rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inscripciones</th>
                                        <th style={{ padding: '1.25rem', fontSize: '0.9rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Correo</th>
                                        <th style={{ padding: '1.25rem', fontSize: '0.9rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol</th>
                                        <th style={{ padding: '1.25rem', fontSize: '0.9rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registro</th>
                                        <th style={{ padding: '1.25rem', fontSize: '0.9rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr
                                            key={user.id}
                                            style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', transition: 'all 0.2s ease' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '45px', height: '45px', minWidth: '45px', borderRadius: '15px', backgroundColor: '#eff6ff', overflow: 'hidden', border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: '800', fontSize: '1.1rem' }}>
                                                            {user.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                </div>
                                                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem', whiteSpace: 'nowrap' }}>{user.full_name || 'Desconocido'}</span>
                                            </td>
                                            <td style={{ padding: '1.25rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-start' }}>
                                                    <ExpandableEnrollments
                                                        enrollments={user.enrollments || []}
                                                        getCourseTitle={getCourseTitle}
                                                        onEnrollClick={() => {
                                                            setSelectedUser(user)
                                                            setShowEnrollModal(true)
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem', color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>{user.email}</td>
                                            <td style={{ padding: '1.25rem' }}>
                                                <select
                                                    value={user.role || 'student'}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        borderRadius: '12px',
                                                        border: '1.5px solid transparent',
                                                        backgroundColor: user.role === 'admin' ? '#fff7ed' : '#f8fafc',
                                                        color: user.role === 'admin' ? '#c2410c' : '#475569',
                                                        fontWeight: '700',
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer',
                                                        outline: 'none',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onFocus={(e) => e.target.style.borderColor = user.role === 'admin' ? '#fed7aa' : '#3b82f6'}
                                                    onBlur={(e) => e.target.style.borderColor = 'transparent'}
                                                >
                                                    <option value="student">Estudiante</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '1.25rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleOpenMaterialModal(user)}
                                                        style={{
                                                            backgroundColor: '#eff6ff',
                                                            color: '#3b82f6',
                                                            border: '1px solid #bfdbfe',
                                                            borderRadius: '10px',
                                                            padding: '0.5rem',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; e.currentTarget.style.color = '#2563eb'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; }}
                                                        title="Asignar material"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id, user.full_name || user.email)}
                                                        style={{
                                                            backgroundColor: '#fee2e2',
                                                            color: '#ef4444',
                                                            border: '1px solid #fecaca',
                                                            borderRadius: '10px',
                                                            padding: '0.5rem',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fca5a5'; e.currentTarget.style.color = '#7f1d1d'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                                                        title="Eliminar usuario"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {loading && (
                                <div style={{ padding: '4rem', textAlign: 'center' }}>
                                    <p style={{ color: '#64748b', fontWeight: '600', fontSize: '1.1rem' }}>Cargando directorio de usuarios...</p>
                                </div>
                            )}
                            {!loading && filteredUsers.length === 0 && (
                                <div style={{ padding: '4rem', textAlign: 'center' }}>
                                    <p style={{ color: '#94a3b8', fontWeight: '500' }}>No se encontraron usuarios que coincidan con la búsqueda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Create User Modal - Premium Redesign */}
                {showCreateModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', width: '450px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(255, 255, 255, 0.8)', position: 'relative', overflow: 'hidden', animation: 'scaleIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
                            {/* Decorative Glow inside Modal */}
                            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(0, 71, 186, 0.05) 0%, transparent 70%)', zIndex: 0 }}></div>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>Nuevo Usuario</h3>
                                </div>
                                <form onSubmit={handleCreateUser}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Nombre completo</label>
                                        <input
                                            type="text"
                                            value={newUser.full_name}
                                            onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                            required
                                            placeholder="John Doe"
                                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', transition: 'all 0.2s ease', outline: 'none' }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 186, 0.1)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Correo electrónico</label>
                                        <input
                                            type="email"
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            required
                                            placeholder="correo@gmail.com"
                                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', transition: 'all 0.2s ease', outline: 'none' }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 186, 0.1)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Contraseña</label>
                                        <input
                                            type="password"
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                            required
                                            placeholder="Mín. 6 caracteres"
                                            minLength={6}
                                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', transition: 'all 0.2s ease', outline: 'none' }}
                                            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.backgroundColor = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 186, 0.1)'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            style={{ flex: 1, padding: '1rem', borderRadius: '16px', border: '1.5px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fee2e2'; }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creating}
                                            style={{ flex: 2, padding: '1rem', borderRadius: '16px', border: 'none', background: 'var(--accent-color)', color: 'white', fontWeight: '600', cursor: creating ? 'not-allowed' : 'pointer', boxShadow: '0 8px 15px rgba(30, 64, 175, 0.2)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                                            onMouseEnter={(e) => { if (!creating) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(30, 64, 175, 0.3)'; } }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 15px rgba(30, 64, 175, 0.2)'; }}
                                        >
                                            {creating ? 'Creando...' : 'Crear usuario'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enroll User Modal - Premium Redesign */}
                {showEnrollModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', width: '450px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(255, 255, 255, 0.8)', position: 'relative', overflow: 'hidden', animation: 'scaleIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
                            <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.05) 0%, transparent 70%)', zIndex: 0 }}></div>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>Inscribir Usuario</h3>
                                </div>

                                <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '1rem', fontWeight: '500' }}>
                                    Inscribiendo a <strong style={{ color: '#1e293b' }}>{selectedUser?.full_name}</strong>
                                </p>

                                <form onSubmit={handleEnrollUser}>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>Seleccionar curso</label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={selectedCourse}
                                                onChange={e => setSelectedCourse(e.target.value)}
                                                required
                                                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '14px', border: '1.5px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.95rem', color: '#334155', appearance: 'none', cursor: 'pointer', outline: 'none' }}
                                                onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.backgroundColor = 'white'; }}
                                                onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                            >
                                                <option value="">-- Elige un curso --</option>
                                                {courses
                                                    .filter(course => !selectedUser?.enrollments?.some(e => e.course_id === course.id))
                                                    .map(course => (
                                                        <option key={course.id} value={course.id}>{course.title}</option>
                                                    ))}
                                                {courses.filter(course => !selectedUser?.enrollments?.some(e => e.course_id === course.id)).length === 0 && (
                                                    <option value="" disabled>El usuario ya está inscrito en todos los cursos</option>
                                                )}
                                            </select>
                                            <svg style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowEnrollModal(false)}
                                            style={{ flex: 1, padding: '1rem', borderRadius: '16px', border: '1.5px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fee2e2'; }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={enrolling}
                                            style={{ flex: 2, padding: '1rem', borderRadius: '16px', border: 'none', background: '#f97316', color: 'white', fontWeight: '600', cursor: enrolling ? 'not-allowed' : 'pointer', boxShadow: '0 8px 15px rgba(249, 115, 22, 0.2)', transition: 'all 0.3s' }}
                                            onMouseEnter={(e) => { if (!enrolling) e.currentTarget.style.transform = 'translateY(-2px)' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                                        >
                                            {enrolling ? 'Inscribiendo...' : 'Inscribir al curso'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assign Material Modal */}
                {showMaterialModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, animation: 'fadeIn 0.4s ease-out' }}>
                        <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', width: '550px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(255, 255, 255, 0.8)', position: 'relative', animation: 'scaleIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>Materiales</h3>
                                </div>
                                <button onClick={() => setShowMaterialModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>

                            <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '1rem', fontWeight: '500' }}>
                                Asignando a <strong style={{ color: '#1e293b' }}>{selectedUser?.full_name}</strong>
                            </p>

                            <form onSubmit={handleAssignMaterial} style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Título del material</label>
                                        <input type="text" value={newMaterial.title} onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })} required placeholder="Ej. Presentación Módulo 1" style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Enlace del documento (Drive)</label>
                                        <input type="url" value={newMaterial.url} onChange={e => setNewMaterial({ ...newMaterial, url: e.target.value })} required placeholder="https://drive.google.com/..." style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none' }} />
                                    </div>
                                </div>
                                <button type="submit" disabled={assigningMaterial} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '600', cursor: assigningMaterial ? 'not-allowed' : 'pointer' }}>
                                    {assigningMaterial ? 'Asignando...' : '+ Asignar Material'}
                                </button>
                            </form>

                            <div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' }}>Materiales Asignados</h4>
                                {loadingMaterials ? (
                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Cargando materiales...</p>
                                ) : userMaterials.length === 0 ? (
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>Este usuario aún no tiene materiales asignados.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        {userMaterials.map(mat => (
                                            <div key={mat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>{mat.title}</p>
                                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>Enlace a Drive</p>
                                                </div>
                                                <button onClick={() => handleDeleteMaterial(mat.id)} style={{ padding: '0.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default AdminUsers
