import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import authService from '../services/auth.service';
import { setTokens } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

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

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setServerError(null);
            try {
                const res = await authService.googleLogin(tokenResponse.access_token);
                setTokens(res.accessToken, res.refreshToken);
                setUser(res.user);
                navigate('/feed');
            } catch {
                setServerError('Google sign-up failed. Please try again.');
            }
        },
        onError: () => setServerError('Google sign-up failed. Please try again.'),
    });

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 py-5">
            <div className="card shadow-lg border-0 rounded-4 p-4 p-sm-5" style={{ width: '100%', maxWidth: '440px' }}>
                {/* Brand */}
                <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                    <span className="fs-3">📸</span>
                    <span className="fs-5 fw-bold">ShlakshukGram</span>
                </div>

                <h1 className="fs-4 fw-bold text-center mb-1">Create account</h1>
                <p className="text-muted text-center mb-4 small">Join and start sharing your moments</p>

                {serverError && (
                    <div className="alert alert-danger alert-dismissible d-flex align-items-center gap-2 mb-3" role="alert">
                        <span>{serverError}</span>
                        <button
                            type="button"
                            className="btn-close ms-auto"
                            aria-label="Close"
                            onClick={() => setServerError(null)}
                        />
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Username */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold small" htmlFor="reg-username">Username</label>
                        <input
                            id="reg-username"
                            type="text"
                            placeholder="john_doe"
                            className={`form-control${errors.username ? ' is-invalid' : ''}`}
                            {...register('username')}
                        />
                        {errors.username && (
                            <div className="invalid-feedback">{errors.username.message}</div>
                        )}
                    </div>

                    {/* Email */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold small" htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
                            type="email"
                            placeholder="you@example.com"
                            className={`form-control${errors.email ? ' is-invalid' : ''}`}
                            {...register('email')}
                        />
                        {errors.email && (
                            <div className="invalid-feedback">{errors.email.message}</div>
                        )}
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold small" htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            placeholder="········"
                            className={`form-control${errors.password ? ' is-invalid' : ''}`}
                            {...register('password')}
                        />
                        {errors.password && (
                            <div className="invalid-feedback">{errors.password.message}</div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold small" htmlFor="reg-confirm">Confirm Password</label>
                        <input
                            id="reg-confirm"
                            type="password"
                            placeholder="········"
                            className={`form-control${errors.confirmPassword ? ' is-invalid' : ''}`}
                            {...register('confirmPassword')}
                        />
                        {errors.confirmPassword && (
                            <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 mt-2 fw-semibold rounded-3"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                Creating account...
                            </>
                        ) : (
                            'Create Account →'
                        )}
                    </button>
                </form>

                <div className="d-flex align-items-center gap-3 my-4">
                    <hr className="flex-grow-1 m-0" />
                    <span className="text-muted small text-uppercase">or sign up with</span>
                    <hr className="flex-grow-1 m-0" />
                </div>

                <div className="d-flex justify-content-center">
                    <button
                        type="button"
                        className="btn btn-outline-secondary d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold"
                        onClick={() => googleLogin()}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20" style={{ flexShrink: 0 }}>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        <span>Continue with Google</span>
                    </button>
                </div>

                <p className="text-center text-muted small mt-4 mb-0">
                    Already have an account? <Link to="/login" className="fw-semibold text-decoration-none">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
