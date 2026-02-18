export interface IUser {
    _id?: string;
    username: string;
    email: string;
    password?: string;
    imgUrl?: string;
    refreshTokens?: string[];
}

export interface IComment {
    userId: string;
    content: string;
    createdAt: Date;
}

export interface IPost {
    _id?: string;
    title: string;
    content: string;
    owner: string; // User ID
    imgUrl?: string;
    likes?: string[]; // Array of User IDs
    tags?: string[];
    comments?: IComment[];
    createdAt?: Date;
}

export interface IAuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        _id: string;
        username: string;
        email: string;
        imgUrl?: string;
    };
}
