import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import postService from '../../services/post.service';

const createPostSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long" }),
  content: z.string().min(1, { message: "Content is required" }),
  file: z.custom<FileList>()
    .refine((files) => files && files.length > 0, { message: "An image file is required" })
    .refine((files) => files?.[0]?.type.startsWith('image/'), { message: "Only image files are allowed" }),
});

type CreatePostFormValues = z.infer<typeof createPostSchema>;

interface CreatePostProps {
    onPostCreated?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<CreatePostFormValues>({
        resolver: zodResolver(createPostSchema),
    });

    const fileInput = watch('file');

    useEffect(() => {
        if (fileInput && fileInput.length > 0) {
            const file = fileInput[0];
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);

                return () => URL.revokeObjectURL(url); // Cleanup
            } else {
                 setPreviewUrl(null);
            }
        } else {
            setPreviewUrl(null);
        }
    }, [fileInput]);

    const onSubmit = async (data: CreatePostFormValues) => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            const formData = new FormData();
            formData.append('title', data.title);
            if (data.content) {
                formData.append('content', data.content);
            }
            if (data.file && data.file.length > 0) {
                formData.append('image', data.file[0]); // backend expects 'image' based on common conventions, maybe change to 'file' if different
            }

            await postService.createPost(formData);
            
            setSubmitSuccess(true);
            reset(); // Reset form on success
            setPreviewUrl(null);
            
            if (onPostCreated) {
                onPostCreated();
            }
        } catch (err: any) {
            setSubmitError(err.response?.data?.message || 'Failed to create post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass-card rounded-4 border-0 shadow-lg overflow-hidden mb-4">
            <div className="p-4 p-sm-5">
                <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div>
                        <h4 className="fw-bold mb-0 text-white">Create Moment</h4>
                        <p className="text-muted small mb-0">Share something special with the community</p>
                    </div>
                </div>

                {submitSuccess && (
                     <div className="alert alert-success border-0 bg-success bg-opacity-10 text-success alert-dismissible d-flex align-items-center gap-2 mb-4 rounded-3" role="alert">
                        <span className="small">Post created successfully!</span>
                        <button type="button" className="btn-close btn-close-white ms-auto small" onClick={() => setSubmitSuccess(false)} aria-label="Close"></button>
                    </div>
                )}
                
                {submitError && (
                    <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger alert-dismissible d-flex align-items-center gap-2 mb-4 rounded-3" role="alert">
                        <span className="small">{submitError}</span>
                        <button type="button" className="btn-close btn-close-white ms-auto small" onClick={() => setSubmitError(null)} aria-label="Close"></button>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <div className="mb-4">
                        <label htmlFor="title" className="form-label">Moment Title</label>
                        <input
                            type="text"
                            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                            id="title"
                            placeholder="An amazing title..."
                            {...register('title')}
                        />
                        {errors.title && <div className="invalid-feedback small mt-1">{errors.title.message}</div>}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="content" className="form-label">Description</label>
                        <textarea
                            className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                            id="content"
                            rows={4}
                            placeholder="Tell the story behind this moment..."
                            {...register('content')}
                        ></textarea>
                        {errors.content && <div className="invalid-feedback small mt-1">{errors.content.message}</div>}
                    </div>

                    <div className="mb-4">
                        <label className="form-label">Cover Image</label>
                        <div 
                            className="position-relative glass-card rounded-3 d-flex flex-column align-items-center justify-content-center border-dashed"
                            style={{ 
                                minHeight: '160px', 
                                border: '2px dashed rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                overflow: 'hidden'
                            }}
                            onClick={() => document.getElementById('image')?.click()}
                        >
                            <input
                                type="file"
                                className="d-none"
                                id="image"
                                accept="image/*"
                                {...register('file')}
                            />
                            
                            {previewUrl ? (
                                <div className="w-100 h-100 position-absolute top-0 start-0">
                                    <img 
                                        src={previewUrl} 
                                        alt="Preview" 
                                        className="w-100 h-100"
                                        style={{ objectFit: 'cover' }} 
                                    />
                                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-40 d-flex align-items-center justify-content-center opacity-0 hover-opacity-100 transition-all">
                                        <span className="text-white small fw-bold">Change Image</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-4">
                                    <div className="text-primary mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                    </div>
                                    <p className="text-white small fw-bold mb-1">Click to upload image</p>
                                    <p className="text-muted small mb-0">High-res JPG, PNG or GIF</p>
                                </div>
                            )}
                        </div>
                        {errors.file && <div className="text-danger small mt-2">{errors.file.message}</div>}
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-premium w-100 fw-bold d-flex align-items-center justify-content-center gap-2 mt-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                <span>Publishing...</span>
                            </>
                        ) : (
                            <>
                                <span>Publish Moment</span>
                                <span style={{ fontSize: '1.2rem' }}>✨</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePost;
