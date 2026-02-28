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

const registerSchema = z
    .object({
        username: z
            .string()
            .min(3, 'Username must be at least 3 characters')
            .max(30, 'Username cannot exceed 30 characters')
            .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
        email: z.string().email('Please enter a valid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (values: RegisterFormValues) => {
        setServerError(null);
        try {
            const { username, email, password } = values;
            const res = await authService.register({ username, email, password });
            setTokens(res.accessToken, res.refreshToken);
            setUser(res.user);
            navigate('/feed');
        } catch {
            setServerError('Registration failed. The email or username may already be taken.');
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
            setServerError('Google sign-up failed. Please try again.');
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

                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Join and start sharing your moments</p>

                {serverError && (
                    <div className="auth-alert">
                        <span>{serverError}</span>
                        <button className="auth-alert-close" onClick={() => setServerError(null)}>✕</button>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Username */}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="reg-username">Username</label>
                        <input
                            id="reg-username"
                            type="text"
                            placeholder="john_doe"
                            className={`auth-input${errors.username ? ' is-invalid' : ''}`}
                            {...register('username')}
                        />
                        {errors.username && (
                            <p className="auth-error-msg">⚠ {errors.username.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
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
                        <label className="auth-label" htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            placeholder="········"
                            className={`auth-input${errors.password ? ' is-invalid' : ''}`}
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="auth-error-msg">⚠ {errors.password.message}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
                        <input
                            id="reg-confirm"
                            type="password"
                            placeholder="········"
                            className={`auth-input${errors.confirmPassword ? ' is-invalid' : ''}`}
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && (
                            <p className="auth-error-msg">⚠ {errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button type="submit" className="auth-btn" disabled={isSubmitting}>
                        {isSubmitting ? <span className="auth-spinner" /> : 'Create Account →'}
                    </button>
                </form>

                <div className="auth-divider">
                    <hr /><span>or sign up with</span><hr />
                </div>

                <div className="auth-google-wrap">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setServerError('Google sign-up failed. Please try again.')}
                        useOneTap={false}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                    />
                </div>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
