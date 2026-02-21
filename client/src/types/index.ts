export interface IOwner {
    _id: string;
    username: string;
    imgUrl?: string;
}

export interface IPost {
    _id?: string;
    title: string;
    content: string;
    owner: IOwner;
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
