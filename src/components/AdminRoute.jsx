import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const AdminRoute = () => {
    const [isAdmin, setIsAdmin] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setIsAdmin(false)
                setLoading(false)
                return
            }

            // Check profile role
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            if (data && data.role === 'admin') {
                setIsAdmin(true)
            } else {
                setIsAdmin(false)
            }
            setLoading(false)
        }

        checkAdmin()
    }, [])

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
    }

    return isAdmin ? <Outlet /> : <Navigate to="/dashboard" />
}

export default AdminRoute
