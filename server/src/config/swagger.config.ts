import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'University Social App API',
            version: '1.0.0',
            description: 'Instagram Clone - Social Media API for university project',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token'
                }
            },
            schemas: {
                RegisterRequest: {
                    type: 'object',
                    required: ['username', 'email', 'password'],
                    properties: {
                        username: {
                            type: 'string',
                            minLength: 3,
                            example: 'johndoe'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john@example.com'
                        },
                        password: {
                            type: 'string',
                            minLength: 6,
                            example: 'password123'
                        }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john@example.com'
                        },
                        password: {
                            type: 'string',
                            example: 'password123'
                        }
                    }
                },
                RefreshRequest: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        }
                    }
                },
                LogoutRequest: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        }
                    }
                },
                GoogleLoginRequest: {
                    type: 'object',
                    required: ['idToken'],
                    properties: {
                        idToken: {
                            type: 'string',
                            description: 'Google ID token obtained from Google Sign-In',
                            example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU0NTBhZGE3YzRhN2RhZjJkZGZjNjg0YmY4YzlhYjI2Nzk4MjUiLCJ0eXAiOiJKV1QifQ...'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        username: {
                            type: 'string',
                            example: 'johndoe'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john@example.com'
                        },
                        imgUrl: {
                            type: 'string',
                            example: '/uploads/profile.jpg'
                        }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        accessToken: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        },
                        refreshToken: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        },
                        user: {
                            $ref: '#/components/schemas/User'
                        }
                    }
                },
                AccessTokenResponse: {
                    type: 'object',
                    properties: {
                        accessToken: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        }
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Operation completed successfully'
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'Error description'
                        }
                    }
                },
                Post: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '60d0fe4f5311236168a109ca'
                        },
                        title: {
                            type: 'string',
                            example: 'My First Post'
                        },
                        content: {
                            type: 'string',
                            example: 'This is the content of my first post.'
                        },
                        owner: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        imgUrl: {
                            type: 'string',
                            example: '/uploads/image-123.jpg'
                        },
                        likes: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            example: []
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                UserProfile: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        username: {
                            type: 'string',
                            example: 'johndoe'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john@example.com'
                        },
                        imgUrl: {
                            type: 'string',
                            example: '/uploads/avatar-123.jpg'
                        },
                        bio: {
                            type: 'string',
                            example: 'Computer Science student 🎓'
                        }
                    }
                },
                UpdateProfileRequest: {
                    type: 'object',
                    properties: {
                        imgUrl: {
                            type: 'string',
                            description: 'Direct URL for avatar (used with application/json)',
                            example: 'https://example.com/avatar.jpg'
                        },
                        bio: {
                            type: 'string',
                            description: 'Short bio / description',
                            example: 'Computer Science student 🎓'
                        },
                        avatar: {
                            type: 'string',
                            format: 'binary',
                            description: 'Avatar image file (used with multipart/form-data)'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and authorization endpoints'
            },
            {
                name: 'User',
                description: 'User profile management endpoints'
            }
        ]
    },
    apis: ['./src/routes/*.ts'] // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
