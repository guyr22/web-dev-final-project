export interface IPost {
    _id?: string;
    title: string;
    content: string;
    owner: any; // User ID string or populated owner object from backend
    imgUrl?: string;
    likes?: string[];
    tags?: string[];
    comments?: {
        userId: string;
        content: string;
        createdAt?: string | Date;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}
