import React, { FormEvent, useEffect, useState } from 'react';
import { LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabase';

interface AdminAuthGateProps {
    children: React.ReactNode;
}

interface AuthState {
    status: 'loading' | 'signed-out' | 'signed-in';
    isAdmin: boolean;
    email: string;
}

const ADMIN_LOGIN_USERNAME = import.meta.env.VITE_ADMIN_LOGIN_USERNAME || 'admin';
const ADMIN_LOGIN_EMAIL = import.meta.env.VITE_ADMIN_LOGIN_EMAIL || 'admin@example.com';

function resolveLoginEmail(identifier: string): string {
    const normalizedIdentifier = identifier.trim();
    return normalizedIdentifier.toLowerCase() === ADMIN_LOGIN_USERNAME.toLowerCase()
        ? ADMIN_LOGIN_EMAIL
        : normalizedIdentifier;
}

function isAdminUser(user: { app_metadata?: Record<string, unknown> } | null): boolean {
    return user?.app_metadata?.role === 'admin';
}

export default function AdminAuthGate({ children }: AdminAuthGateProps) {
    const [auth, setAuth] = useState<AuthState>({ status: 'loading', isAdmin: false, email: '' });
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setAuth({ status: 'signed-out', isAdmin: false, email: '' });
            return;
        }

        let mounted = true;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;
            setAuth({
                status: session ? 'signed-in' : 'signed-out',
                isAdmin: isAdminUser(session?.user ?? null),
                email: session?.user.email ?? '',
            });
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setAuth({
                status: session ? 'signed-in' : 'signed-out',
                isAdmin: isAdminUser(session?.user ?? null),
                email: session?.user.email ?? '',
            });
            setErrorMessage('');
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isSupabaseConfigured) {
            setErrorMessage('Admin sign-in is unavailable while Supabase is not configured.');
            return;
        }
        setIsSubmitting(true);
        setErrorMessage('');

        const { error } = await supabase.auth.signInWithPassword({
            email: resolveLoginEmail(email),
            password,
        });

        if (error) setErrorMessage(error.message);
        setIsSubmitting(false);
    };

    const handleSignOut = async () => {
        if (isSupabaseConfigured) await supabase.auth.signOut();
    };

    if (auth.status === 'loading') {
        return <div className="p-8 text-center text-xs text-gray-400">Checking admin access…</div>;
    }

    if (auth.status === 'signed-in' && auth.isAdmin) {
        return (
            <>
                {children}
            </>
        );
    }

    if (auth.status === 'signed-in' && !auth.isAdmin) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
                <ShieldCheck className="mx-auto mb-3 text-amber-600" size={28} />
                <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">Admin access required</h2>
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">This account is signed in but is not assigned the admin role.</p>
                <button onClick={handleSignOut} className="mt-4 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700" type="button">Sign out</button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151f32]">
            <div className="mb-5 text-center">
                <LogIn className="mx-auto mb-2 text-blue-600" size={28} />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Admin sign in</h2>
            </div>
            <form onSubmit={handleSignIn} className="space-y-3">
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-300">
                    Username or email
                    <input value={email} onChange={event => setEmail(event.target.value)} type="text" autoComplete="username" required className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </label>
                <label className="block text-xs font-bold text-gray-600 dark:text-slate-300">
                    Password
                    <input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </label>
                {errorMessage && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">{errorMessage}</p>}
                <button disabled={isSubmitting} type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    <LogIn size={14} /> {isSubmitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </div>
    );
}
