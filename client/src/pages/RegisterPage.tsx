import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { GoogleLogin } from '@react-oauth/google';
import authService from '../services/auth.service';
import { setTokens } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const registerSchema = z
    .object({
        username: z
            .string()
            .min(3, 'Username must be at least 3 characters')
            .max(30, 'Username cannot exceed 30 characters')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
        email: z.string().email('Please enter a valid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RegisterPage() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (values: RegisterFormValues) => {
        setServerError(null);
        try {
            const { username, email, password } = values;
            const response = await authService.register({ username, email, password });
            setTokens(response.accessToken, response.refreshToken);
            setUser(response.user);
            navigate('/feed');
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Registration failed. Please try again.';
            setServerError(message);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
        setServerError(null);
        try {
            if (!credentialResponse.credential) throw new Error('No credential received');
            const response = await authService.googleLogin(credentialResponse.credential);
            setTokens(response.accessToken, response.refreshToken);
            setUser(response.user);
            navigate('/feed');
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Google login failed. Please try again.';
            setServerError(message);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '85vh' }}>
            <Card className="shadow-sm" style={{ width: '100%', maxWidth: 440 }}>
                <Card.Body className="p-4">
                    <h2 className="text-center mb-4 fw-bold">Create Account</h2>

                    {serverError && (
                        <Alert variant="danger" onClose={() => setServerError(null)} dismissible>
                            {serverError}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Username */}
                        <Form.Group className="mb-3" controlId="register-username">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="john_doe"
                                isInvalid={!!errors.username}
                                {...register('username')}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.username?.message}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* Email */}
                        <Form.Group className="mb-3" controlId="register-email">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="you@example.com"
                                isInvalid={!!errors.email}
                                {...register('email')}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.email?.message}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* Password */}
                        <Form.Group className="mb-3" controlId="register-password">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="········"
                                isInvalid={!!errors.password}
                                {...register('password')}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.password?.message}
                            </Form.Control.Feedback>
                        </Form.Group>

                        {/* Confirm Password */}
                        <Form.Group className="mb-4" controlId="register-confirm-password">
                            <Form.Label>Confirm Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="········"
                                isInvalid={!!errors.confirmPassword}
                                {...register('confirmPassword')}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.confirmPassword?.message}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-100 mb-3"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Spinner size="sm" animation="border" /> : 'Create Account'}
                        </Button>
                    </Form>

                    {/* Divider */}
                    <div className="d-flex align-items-center my-3">
                        <hr className="flex-grow-1" />
                        <span className="px-2 text-muted small">or</span>
                        <hr className="flex-grow-1" />
                    </div>

                    {/* Google OAuth */}
                    <div className="d-flex justify-content-center mb-3">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setServerError('Google sign up failed. Please try again.')}
                            useOneTap={false}
                        />
                    </div>

                    <p className="text-center text-muted small mb-0">
                        Already have an account?{' '}
                        <Link to="/login" className="text-decoration-none">
                            Sign in
                        </Link>
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
}
