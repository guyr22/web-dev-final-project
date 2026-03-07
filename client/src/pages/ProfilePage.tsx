import { useState, useEffect, useRef } from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
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
            reset({ bio: profile.bio ?? '' });
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
                if (values.bio !== undefined) fd.append('bio', values.bio);
                updated = await userService.updateProfile(fd);
            } else {
                updated = await userService.updateProfile({ bio: values.bio });
            }
            setProfile(updated);
            setUser(updated);
            setEditing(false);
        } catch {
            setServerError('Failed to save changes. Please try again.');
        }
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setServerError(null);
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
            <Container className="py-5" style={{ maxWidth: '520px' }}>
                <div className="card border-0 shadow rounded-4 overflow-hidden">
                    {/* Header banner */}
                    <div
                        style={{
                            height: 80,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                        }}
                    />

                    {/* Avatar */}
                    <div className="d-flex justify-content-center" style={{ marginTop: -40 }}>
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="avatar"
                                className="rounded-circle border border-4 border-white shadow"
                                style={{ width: 80, height: 80, objectFit: 'cover', background: '#f3f4f6' }}
                            />
                        ) : (
                            <div
                                className="rounded-circle border border-4 border-white shadow d-flex align-items-center justify-content-center fw-bold fs-4 text-white"
                                style={{
                                    width: 80,
                                    height: 80,
                                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                                }}
                            >
                                {getInitials(profile.username)}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="card-body text-center pt-2 pb-3 px-3">
                        <h2 className="fw-bold fs-5 mb-1">{profile.username}</h2>
                        <p className="text-muted small mb-2">{profile.email}</p>

                        {profile.bio ? (
                            <p className="text-secondary small fst-italic mb-3" style={{ whiteSpace: 'pre-wrap' }}>
                                "{profile.bio}"
                            </p>
                        ) : (
                            <p className="text-muted small mb-3">No bio yet.</p>
                        )}

                        <button
                            id="btn-edit-profile"
                            className="btn btn-outline-primary btn-sm fw-semibold rounded-pill px-4"
                            onClick={() => setEditing(true)}
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* User Posts Section */}
                <div className="mt-5">
                    <h3 className="fw-bold fs-4 mb-4" style={{ color: '#1f2937' }}>My Posts</h3>
                    {loadingPosts ? (
                        <div className="d-flex justify-content-center py-4">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : postsError ? (
                        <Alert variant="danger">{postsError}</Alert>
                    ) : userPosts.length === 0 ? (
                        <div className="text-center py-5 bg-white rounded-4 shadow-sm border-0">
                            <h4 className="fw-semibold text-secondary mb-2">No posts yet</h4>
                            <p className="text-muted mb-0">When you share something, it will appear here.</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-4">
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
    // -----------------------------------------------------------------------
    return (
        <Container className="py-5" style={{ maxWidth: '520px' }}>
            <div className="card border-0 shadow rounded-4 p-4 p-sm-5">
                <h2 className="fw-bold fs-5 mb-4 text-center">Edit Profile</h2>

                {serverError && (
                    <Alert variant="danger" dismissible onClose={() => setServerError(null)}>
                        {serverError}
                    </Alert>
                )}

                {/* Avatar preview */}
                <div className="d-flex flex-column align-items-center mb-4">
                    {avatarPreview ? (
                        <img
                            src={avatarPreview}
                            alt="avatar preview"
                            className="rounded-circle border shadow mb-2"
                            style={{ width: 96, height: 96, objectFit: 'cover' }}
                        />
                    ) : (
                        <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-3 text-white mb-2 shadow"
                            style={{
                                width: 96,
                                height: 96,
                                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                            }}
                        >
                            {getInitials(profile.username)}
                        </div>
                    )}
                    <input
                        id="avatar-file-input"
                        type="file"
                        accept="image/*"
                        className="d-none"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Change Photo
                    </button>
                </div>

                {/* Bio field */}
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="mb-4">
                        <label className="form-label fw-semibold small" htmlFor="profile-bio">
                            Bio
                        </label>
                        <textarea
                            id="profile-bio"
                            rows={4}
                            placeholder="Tell the world something about yourself…"
                            className={`form-control rounded-3${errors.bio ? ' is-invalid' : ''}`}
                            {...register('bio')}
                        />
                        {errors.bio && <div className="invalid-feedback">{errors.bio.message}</div>}
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            id="btn-save-profile"
                            type="submit"
                            className="btn btn-primary fw-semibold rounded-3 flex-grow-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Saving…
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary fw-semibold rounded-3"
                            onClick={handleCancelEdit}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </Container>
    );
}
