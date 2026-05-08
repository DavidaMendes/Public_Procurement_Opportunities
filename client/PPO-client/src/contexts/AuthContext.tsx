import { login } from "@/services/auth/authService";
import { deleteToken, getToken, saveToken } from "@/services/auth/tokenStorage";
import { LoginRequest } from "@/types/auth";
import { createContext, useEffect, useState } from "react";


type AuthContextData = {
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: (input: LoginRequest) => Promise<void>;
    signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!token;

    useEffect(() => {
        async function loadStoredToken() {
            try {
                const storedToken = await getToken();
                setToken(storedToken);
            } finally {
                setIsLoading(false);
            }
        }
        loadStoredToken();
    }, [])

    const signIn = async (input: LoginRequest) => {
        const response = await login(input);

        await saveToken(response.token);
        setToken(response.token);
    };

    const signOut = async () => {
        await deleteToken();
        setToken(null);
    };


    return (
        <AuthContext.Provider value={{ token, isLoading, isAuthenticated, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};