import { useState, useEffect, useRef } from 'react';
import { Alert, Spinner, Container } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import userService from '../services/user.service';
import postService from '../services/post.service';
import { IUser, IPost } from '../types';
import PostCard from '../components/features/PostCard';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const editSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    bio: z.string().max(300, 'Bio must be at most 300 characters').optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(username: string): string {
    return username
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function resolveAvatarUrl(imgUrl?: string): string | undefined {
    if (!imgUrl) return undefined;
    // If the URL is already absolute (http/https/data:) return as-is
    if (/^(https?:\/\/|data:)/.test(imgUrl)) return imgUrl;
    // Relative path from the server (e.g. "/uploads/avatar-xxx.jpg")
    return `${BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ProfilePage() {
    const { user: ctxUser, setUser } = useAuth();

    // Server-fetched profile (authoritative)
    const [profile, setProfile] = useState<IUser | null>(ctxUser ?? null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // UI state
    const [editing, setEditing] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedFileRef = useRef<File | null>(null);

    // User Posts state
    const [userPosts, setUserPosts] = useState<IPost[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [postsError, setPostsError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<EditFormValues>({ resolver: zodResolver(editSchema) });

    // Fetch profile on mount
    useEffect(() => {
        setLoadingProfile(true);
        userService
            .getProfile()
            .then((data) => {
                setProfile(data);
                setUser(data);
            })
            .catch(() => setFetchError('Failed to load profile. Please try again.'))
            .finally(() => setLoadingProfile(false));
    }, []);

    // Fetch user's posts when profile is loaded
    const fetchUserPosts = async () => {
        if (!profile?._id) return;
        setLoadingPosts(true);
        setPostsError(null);
        try {
            const posts = await postService.getUserPosts(profile._id);
            setUserPosts(posts);
        } catch (error) {
            console.error('Failed to load posts', error);
            setPostsError('Failed to load posts.');
        } finally {
            setLoadingPosts(false);
        }
    };

    useEffect(() => {
        if (profile?._id) {
            fetchUserPosts();
        }
    }, [profile?._id]);

    // When entering edit mode, pre-fill the form with current values
    useEffect(() => {
        if (editing && profile) {
            reset({ username: profile.username, bio: profile.bio ?? '' });
            setAvatarPreview(resolveAvatarUrl(profile.imgUrl));
            selectedFileRef.current = null;
        }
    }, [editing, profile]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        selectedFileRef.current = file;
        setAvatarPreview(URL.createObjectURL(file));
    };

    const onSubmit = async (values: EditFormValues) => {
        setServerError(null);
        try {
            let updated: IUser;
            if (selectedFileRef.current) {
                const fd = new FormData();
                fd.append('avatar', selectedFileRef.current);
                fd.append('username', values.username);
                if (values.bio !== undefined) fd.append('bio', values.bio);
                updated = await userService.updateProfile(fd);
            } else {
                updated = await userService.updateProfile({ username: values.username, bio: values.bio });
            }
            setProfile(updated);
            setUser(updated);
            setEditing(false);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            setServerError(msg ?? 'Failed to save changes. Please try again.');
        }
    };

    // -----------------------------------------------------------------------
    // Render states
    // -----------------------------------------------------------------------
    if (loadingProfile) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (fetchError || !profile) {
        return (
            <Container className="mt-5" style={{ maxWidth: '600px' }}>
                <Alert variant="danger">
                    {fetchError ?? 'Profile not found.'}
                    <div className="mt-2">
                        <button className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()}>
                            Retry
                        </button>
                    </div>
                </Alert>
            </Container>
        );
    }

    const avatarUrl = resolveAvatarUrl(profile.imgUrl);

    // -----------------------------------------------------------------------
    // View mode
    // -----------------------------------------------------------------------
    if (!editing) {
        return (
            <Container className="py-5" style={{ maxWidth: '560px' }}>
                <div className="glass-card rounded-5 overflow-hidden border-0 shadow-lg">
                    {/* Header banner */}
                    <div
                        className="w-100"
                        style={{
                            height: 120,
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                            opacity: 0.8
                        }}
                    />

                    {/* Avatar */}
                    <div className="d-flex justify-content-center" style={{ marginTop: -60 }}>
                        <div className="position-relative">
                             {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="avatar"
                                    className="rounded-circle border border-4 border-slate-900 shadow-lg"
                                    style={{ width: 120, height: 120, objectFit: 'cover', background: '#1e293b' }}
                                />
                            ) : (
                                <div
                                    className="rounded-circle border border-4 border-slate-900 shadow-lg d-flex align-items-center justify-content-center fw-bold fs-1 text-white"
                                    style={{
                                        width: 120,
                                        height: 120,
                                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                    }}
                                >
                                    {getInitials(profile.username)}
                                </div>
                            )}
                            <div className="position-absolute bottom-0 end-0 bg-primary rounded-circle border border-3 border-slate-900 p-2" style={{ width: 20, height: 20 }}></div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="card-body text-center pt-3 pb-5 px-4">
                        <h2 className="fw-bold fs-3 mb-1 text-gradient">{profile.username}</h2>
                        <p className="text-muted small mb-4 fw-medium">{profile.email}</p>

                        <div className="d-flex justify-content-center gap-4 mb-4">
                            <div className="text-center">
                                <span className="d-block fw-bold text-white fs-5">{userPosts.length}</span>
                                <span className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Moments</span>
                            </div>
                        </div>

                        {profile.bio ? (
                            <p className="text-white opacity-75 small mb-4 px-3" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                {profile.bio}
                            </p>
                        ) : (
                            <p className="text-muted small mb-4 italic">No bio written yet</p>
                        )}

                        <button
                            id="btn-edit-profile"
                            className="btn btn-premium btn-sm fw-bold px-5"
                            onClick={() => setEditing(true)}
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* User Posts Section */}
                <div className="mt-5 pt-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <h3 className="fw-bold fs-4 mb-0 text-white">Your Moments</h3>
                        <div className="flex-grow-1 border-bottom border-white border-opacity-10"></div>
                    </div>
                    
                    {loadingPosts ? (
                        <div className="d-flex justify-content-center py-5">
                            <Spinner animation="border" variant="primary" size="sm" />
                        </div>
                    ) : postsError ? (
                        <Alert variant="danger" className="bg-danger bg-opacity-10 border-0 text-danger rounded-4">{postsError}</Alert>
                    ) : userPosts.length === 0 ? (
                        <div className="text-center py-5 glass-card rounded-4 border-0">
                            <h5 className="fw-bold text-white mb-2">No moments yet</h5>
                            <p className="text-muted small mb-0">Start sharing your world today!</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-5">
                            {userPosts.map(post => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    onPostDeleted={fetchUserPosts}
                                    onPostUpdated={fetchUserPosts}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Container>
        );
    }

    // -----------------------------------------------------------------------
    // Edit mode
    // -----------------------------------------------------------------------    // Edit mode
    return (
        <Container className="py-5" style={{ maxWidth: '640px' }}>
            <div className="glass-card rounded-5 border-0 p-5 mt-4 overflow-hidden position-relative">
                {/* Decoration */}
                <div className="position-absolute top-0 end-0 p-4 opacity-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 0 0 0-2 2v14a2 0 0 0 2 2h14a2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>

                <div className="d-flex align-items-center gap-4 mb-5">
                    <button 
                        className="btn glass-card border-white border-opacity-10 rounded-circle p-2 text-white transition-all hover-scale"
                        style={{ width: '42px', height: '42px' }}
                        onClick={() => setEditing(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </button>
                    <div>
                        <h2 className="fw-bold fs-2 mb-1 text-white text-gradient">Refine Identity</h2>
                        <p className="text-muted small mb-0">Update your presence in the digital realm</p>
                    </div>
                </div>

                {serverError && (
                    <Alert variant="danger" className="bg-danger bg-opacity-10 border-0 text-danger rounded-4 mb-4" dismissible onClose={() => setServerError(null)}>
                        {serverError}
                    </Alert>
                )}

                {/* Avatar preview */}
                <div className="d-flex flex-column align-items-center mb-5">
                    <div className="position-relative mb-3">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="avatar preview"
                                className="rounded-circle border border-4 border-slate-900 shadow-lg"
                                style={{ width: 120, height: 120, objectFit: 'cover', background: '#1e293b' }}
                            />
                        ) : (
                            <div
                                className="rounded-circle border border-4 border-slate-900 shadow-lg d-flex align-items-center justify-content-center fw-bold fs-1 text-white"
                                style={{
                                    width: 120,
                                    height: 120,
                                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                }}
                            >
                                {getInitials(profile.username)}
                            </div>
                        )}
                        <button
                            type="button"
                            className="position-absolute bottom-0 end-0 bg-primary rounded-circle border border-3 border-slate-900 p-2 d-flex align-items-center justify-content-center shadow-sm transition-all hover-scale"
                            style={{ width: 40, height: 40 }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <span style={{ fontSize: '1.2rem' }}>📸</span>
                        </button>
                    </div>
                    
                    <input
                        id="avatar-file-input"
                        type="file"
                        accept="image/*"
                        className="d-none"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                    />
                    <p className="text-muted small mb-0">Tap to upload a new vibe</p>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="mb-4">
                        <label className="form-label text-white opacity-50 small fw-bold text-uppercase mb-2 ms-2" style={{ letterSpacing: '1px' }} htmlFor="profile-username">
                            Identity
                        </label>
                        <input
                            id="profile-username"
                            type="text"
                            placeholder="Your username"
                            className={`form-control px-4 py-3 shadow-none focus-primary${errors.username ? ' is-invalid' : ''}`}
                            {...register('username')}
                        />
                        {errors.username && <div className="invalid-feedback ms-2">{errors.username.message}</div>}
                    </div>

                    <div className="mb-5">
                        <label className="form-label text-white opacity-50 small fw-bold text-uppercase mb-2 ms-2" style={{ letterSpacing: '1px' }} htmlFor="profile-bio">
                            About Me
                        </label>
                        <textarea
                            id="profile-bio"
                            rows={4}
                            placeholder="Tell the world something about yourself…"
                            className={`form-control px-4 py-3 shadow-none focus-primary${errors.bio ? ' is-invalid' : ''}`}
                            {...register('bio')}
                        />
                        {errors.bio && <div className="invalid-feedback ms-2">{errors.bio.message}</div>}
                    </div>

                    <div className="d-flex gap-3 mt-5">
                        <button
                            type="button"
                            className="btn glass-card border-white border-opacity-10 text-white fw-bold py-3 px-4 rounded-4 flex-grow-1 transition-all hover-bg-light"
                            onClick={() => setEditing(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            id="btn-save-profile"
                            type="submit"
                            className="btn btn-premium py-3 px-5 rounded-4 flex-grow-1 shadow-lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    <Spinner animation="border" size="sm" />
                                    <span>Saving...</span>
                                </div>
                            ) : (
                                'Save Presence'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Container>
    );
}
