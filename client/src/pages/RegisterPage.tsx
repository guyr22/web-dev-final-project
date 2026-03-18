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
        bio: z.string().max(160, 'Bio cannot exceed 160 characters').optional(),
        image: z.custom<FileList>().optional(),
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
            const formData = new FormData();
            formData.append('username', values.username);
            formData.append('email', values.email);
            formData.append('password', values.password);
            
            if (values.bio) {
                formData.append('bio', values.bio);
            }

            if (values.image && values.image.length > 0) {
                formData.append('image', values.image[0]);
            }

            const res = await authService.register(formData);
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
        <div className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5">
            <div className="glass-card rounded-4 p-4 p-sm-5" style={{ width: '100%', maxWidth: '520px' }}>
                {/* Brand */}
                <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                    <span className="fs-3">✨</span>
                    <span className="fs-5 fw-bold text-gradient">ShlakshukGram</span>
                </div>

                <h1 className="fs-3 fw-bold text-center mb-1 text-white">Create account</h1>
                <p className="text-muted text-center mb-4 small">Join and start sharing your Posts</p>

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
                    {/* Username */}
                    <div className="mb-3">
                        <label className="form-label small" htmlFor="reg-username">Username</label>
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
                        <label className="form-label small" htmlFor="reg-email">Email Address</label>
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
                    <div className="row g-2 mb-3">
                        <div className="col-6">
                            <label className="form-label small" htmlFor="reg-password">Password</label>
                            <input
                                id="reg-password"
                                type="password"
                                placeholder="••••••••"
                                className={`form-control${errors.password ? ' is-invalid' : ''}`}
                                {...register('password')}
                            />
                        </div>
                        <div className="col-6">
                            <label className="form-label small" htmlFor="reg-confirm">Confirm</label>
                            <input
                                id="reg-confirm"
                                type="password"
                                placeholder="••••••••"
                                className={`form-control${errors.confirmPassword ? ' is-invalid' : ''}`}
                                {...register('confirmPassword')}
                            />
                        </div>
                        {(errors.password || errors.confirmPassword) && (
                            <div className="col-12 mt-1">
                                <div className="text-danger small" style={{ fontSize: '0.75rem' }}>
                                    {errors.password?.message || errors.confirmPassword?.message}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Bio */}
                    <div className="mb-3">
                        <label className="form-label small" htmlFor="reg-bio">Bio (Optional)</label>
                        <textarea
                            id="reg-bio"
                            placeholder="Tell us about yourself..."
                            className={`form-control${errors.bio ? ' is-invalid' : ''}`}
                            rows={3}
                            {...register('bio')}
                        />
                        {errors.bio && (
                            <div className="invalid-feedback">{errors.bio.message}</div>
                        )}
                        <div className="form-text small opacity-50" style={{ fontSize: '0.7rem' }}>
                            Brief description for your profile. max 160 characters.
                        </div>
                    </div>

                    {/* Profile Image (Optional) */}
                    <div className="mb-4">
                        <label className="form-label small">Profile Image (Optional)</label>
                        <div 
                            className="glass-card rounded-3 p-3 d-flex align-items-center gap-3 border-dashed"
                            style={{ border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer' }}
                            onClick={() => document.getElementById('reg-image')?.click()}
                        >
                            <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            </div>
                            <div className="flex-grow-1">
                                <p className="text-white small fw-bold mb-0">Choose Profile Picture</p>
                                <p className="text-muted small mb-0" style={{ fontSize: '0.7rem' }}>JPG, PNG or GIF</p>
                            </div>
                            <input
                                id="reg-image"
                                type="file"
                                accept="image/*"
                                className="d-none"
                                {...register('image')}
                            />
                        </div>
                        {errors.image && <div className="text-danger small mt-2">{errors.image.message}</div>}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-premium w-100 fw-bold d-flex align-items-center justify-content-center gap-2 mb-3"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <span>Join Now</span>
                                <span style={{ fontSize: '1.2rem' }}>✨</span>
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
                        className="btn w-100 d-flex align-items-center justify-content-center gap-3 px-4 py-2 rounded-3 fw-semibold"
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
                    Already have an account? <Link to="/login" className="fw-bold text-primary text-decoration-none ms-1">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
