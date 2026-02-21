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
        <div className="card border-0 shadow rounded-4 overflow-hidden mb-4">
            <div className="card-header bg-white border-bottom px-4 py-3">
                <h5 className="fw-bold mb-0">Create new post</h5>
            </div>
            <div className="card-body px-4">
                {submitSuccess && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        Post created successfully!
                        <button type="button" className="btn-close" onClick={() => setSubmitSuccess(false)} aria-label="Close"></button>
                    </div>
                )}
                
                {submitError && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        {submitError}
                        <button type="button" className="btn-close" onClick={() => setSubmitError(null)} aria-label="Close"></button>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-3">
                        <label htmlFor="title" className="form-label">Title <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                            id="title"
                            placeholder="Give your post a title"
                            {...register('title')}
                        />
                        {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="content" className="form-label">Content <span className="text-danger">*</span></label>
                        <textarea
                            className={`form-control ${errors.content ? 'is-invalid' : ''}`}
                            id="content"
                            rows={3}
                            placeholder="What's on your mind?"
                            {...register('content')}
                        ></textarea>
                        {errors.content && <div className="invalid-feedback">{errors.content.message}</div>}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="image" className="form-label">Image <span className="text-danger">*</span></label>
                        <input
                            type="file"
                            className={`form-control ${errors.file ? 'is-invalid' : ''}`}
                            id="image"
                            accept="image/*"
                            {...register('file')}
                        />
                        {errors.file && <div className="invalid-feedback">{errors.file.message}</div>}
                    </div>

                    {previewUrl && (
                        <div className="mb-3 position-relative d-inline-block">
                            <span className="d-block mb-1 text-muted small">Image Preview:</span>
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="img-thumbnail rounded"
                                style={{ maxHeight: '200px', objectFit: 'cover' }} 
                            />
                        </div>
                    )}

                    <div className="d-grid mt-4">
                        <button 
                            type="submit" 
                            className="btn btn-dark w-100 fw-bold rounded-3"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Posting...
                                </>
                            ) : (
                                'Post'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePost;
