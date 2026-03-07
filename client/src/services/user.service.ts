import api from './api';
import { IUser } from '../types';

const userService = {
    /**
     * Fetch the authenticated user's profile.
     */
    async getProfile(): Promise<IUser> {
        const { data } = await api.get<IUser>('/user/profile');
        return data;
    },

    /**
     * Update the authenticated user's profile.
     * Pass a FormData when uploading a new avatar image;
     * pass a plain object when only updating bio / imgUrl text.
     */
    async updateProfile(payload: FormData | { bio?: string; imgUrl?: string }): Promise<IUser> {
        const isFormData = payload instanceof FormData;
        const { data } = await api.put<IUser>('/user/profile', payload, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
        });
        return data;
    },
};

export default userService;
