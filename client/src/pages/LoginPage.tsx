import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import authService from '../services/auth.service';
import { setTokens } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (values: LoginFormValues) => {
        setServerError(null);
        try {
            const res = await authService.login(values);
            setTokens(res.accessToken, res.refreshToken);
            setUser(res.user);
            navigate('/feed');
        } catch {
            setServerError('Invalid email or password. Please try again.');
        }
    };

    const handleGoogleSuccess = async (cr: { credential?: string }) => {
        setServerError(null);
        try {
            if (!cr.credential) throw new Error();
            const res = await authService.googleLogin(cr.credential);
            setTokens(res.accessToken, res.refreshToken);
            setUser(res.user);
            navigate('/feed');
        } catch {
            setServerError('Google sign-in failed. Please try again.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-blob auth-blob-1" />
            <div className="auth-blob auth-blob-2" />

            <div className="auth-card">
                {/* Brand */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">📸</div>
                    <span className="auth-logo-name">ShlakshukGram</span>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to continue your journey</p>

                {serverError && (
                    <div className="auth-alert">
                        <span>{serverError}</span>
                        <button className="auth-alert-close" onClick={() => setServerError(null)}>✕</button>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Email */}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            className={`auth-input${errors.email ? ' is-invalid' : ''}`}
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="auth-error-msg">⚠ {errors.email.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="········"
                            className={`auth-input${errors.password ? ' is-invalid' : ''}`}
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="auth-error-msg">⚠ {errors.password.message}</p>
                        )}
                    </div>

                    <button type="submit" className="auth-btn" disabled={isSubmitting}>
                        {isSubmitting ? <span className="auth-spinner" /> : 'Sign In →'}
                    </button>
                </form>

                <div className="auth-divider">
                    <hr /><span>or continue with</span><hr />
                </div>

                <div className="auth-google-wrap">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setServerError('Google sign-in failed. Please try again.')}
                        useOneTap={false}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                    />
                </div>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
}
