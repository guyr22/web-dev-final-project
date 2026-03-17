import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import authService from '../services/auth.service';
import { setTokens } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

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

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setServerError(null);
            try {
                const res = await authService.googleLogin(tokenResponse.access_token);
                setTokens(res.accessToken, res.refreshToken);
                setUser(res.user);
                navigate('/feed');
            } catch {
                setServerError('Google sign-in failed. Please try again.');
            }
        },
        onError: () => setServerError('Google sign-in failed. Please try again.'),
    });

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5">
            <div className="glass-card rounded-4 p-4 p-sm-5" style={{ width: '100%', maxWidth: '440px' }}>
                {/* Brand */}
                <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                    <span className="fs-3">✨</span>
                    <span className="fs-5 fw-bold text-gradient">ShlakshukGram</span>
                </div>

                <h1 className="fs-3 fw-bold text-center mb-1 text-white">Welcome back</h1>
                <p className="text-muted text-center mb-4 small">Sign in to continue your journey</p>

                {serverError && (
                    <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger alert-dismissible d-flex align-items-center gap-2 mb-4 rounded-3" role="alert">
                        <span className="small">{serverError}</span>
                        <button
                            type="button"
                            className="btn-close btn-close-white ms-auto small"
                            aria-label="Close"
                            onClick={() => setServerError(null)}
                        />
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Email */}
                    <div className="mb-3">
                        <label className="form-label small" htmlFor="login-email">Email Address</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="name@example.com"
                            className={`form-control${errors.email ? ' is-invalid' : ''}`}
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            {...register('email')}
                        />
                        {errors.email && (
                            <div className="invalid-feedback">{errors.email.message}</div>
                        )}
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                        <label className="form-label small" htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            className={`form-control${errors.password ? ' is-invalid' : ''}`}
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            {...register('password')}
                        />
                        {errors.password && (
                            <div className="invalid-feedback">{errors.password.message}</div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-premium w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <span style={{ fontSize: '1.2rem' }}>→</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="d-flex align-items-center gap-3 my-4">
                    <hr className="flex-grow-1 m-0 text-muted opacity-25" />
                    <span className="text-muted small text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>or</span>
                    <hr className="flex-grow-1 m-0 text-muted opacity-25" />
                </div>

                <div className="d-flex justify-content-center">
                    <button
                        type="button"
                        className="btn w-100 d-flex align-items-center justify-content-center gap-3 px-4 py-2 rounded-3 fw-semibold transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        onClick={() => googleLogin()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <span>Continue with Google</span>
                    </button>
                </div>

                <p className="text-center text-muted small mt-4 mb-0">
                    Don't have an account? <Link to="/register" className="fw-bold text-primary text-decoration-none ms-1">Create one</Link>
                </p>
            </div>
        </div>
    );
}
