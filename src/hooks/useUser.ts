"use client";

import { useState } from 'react';

export const useUser = () => {
    const [user, setUser] = useState<any>({
        firstName: 'Alex',
        lastName: 'Rivers',
        email: 'alex@socialai.com',
        avatar: ''
    });

    const updateUser = (newUserData: any) => {
        setUser(newUserData);
    };

    return { user, updateUser };
};
