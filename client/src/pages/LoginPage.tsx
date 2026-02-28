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
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LoginPage() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (values: LoginFormValues) => {
        setServerError(null);
        try {
            const response = await authService.login(values);
            setTokens(response.accessToken, response.refreshToken);
            setUser(response.user);
            navigate('/feed');
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Login failed. Please try again.';
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
                    <h2 className="text-center mb-4 fw-bold">Welcome Back</h2>

                    {serverError && (
                        <Alert variant="danger" onClose={() => setServerError(null)} dismissible>
                            {serverError}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Email */}
                        <Form.Group className="mb-3" controlId="login-email">
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
                        <Form.Group className="mb-4" controlId="login-password">
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

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-100 mb-3"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Spinner size="sm" animation="border" /> : 'Sign In'}
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
                            onError={() => setServerError('Google login failed. Please try again.')}
                            useOneTap={false}
                        />
                    </div>

                    <p className="text-center text-muted small mb-0">
                        Don&apos;t have an account?{' '}
                        <Link to="/register" className="text-decoration-none">
                            Create one
                        </Link>
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
}
