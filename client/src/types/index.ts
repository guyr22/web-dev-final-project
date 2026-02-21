export interface IPost {
    _id?: string;
    title: string;
    content: string;
    owner: string; // User ID
    imgUrl?: string;
    likes?: string[];
    tags?: string[];
    comments?: {
        userId: string;
        content: string;
        createdAt?: string | Date;
    }[];
}
