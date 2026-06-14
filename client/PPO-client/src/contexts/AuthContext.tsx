import { login, logout } from "@/services/auth/authService";
import { setUnauthorizedHandler } from "@/services/api/client";
import { deleteToken, getToken, saveToken } from "@/services/auth/tokenStorage";
import { LoginRequest } from "@/types/auth";
import { createContext, useCallback, useEffect, useRef, useState } from "react";


type AuthContextData = {
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: (input: LoginRequest) => Promise<void>;
    signOut: () => Promise<void>;
    clearSession: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!token;

    const tokenRef = useRef<string | null>(null);
    tokenRef.current = token;

    const clearSession = useCallback(async () => {
        await deleteToken();
        setToken(null);
    }, []);

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

    useEffect(() => {
        setUnauthorizedHandler(() => {
            clearSession();
        });

        return () => setUnauthorizedHandler(null);
    }, [clearSession]);

    const signIn = async (input: LoginRequest) => {
        const response = await login(input);

        await saveToken(response.token);
        setToken(response.token);
    };

    const signOut = useCallback(async () => {
        const currentToken = tokenRef.current;

        if (currentToken) {
            try {
                await logout(currentToken);
            } catch {
            }
        }

        await clearSession();
    }, [clearSession]);


    return (
        <AuthContext.Provider
            value={{ token, isLoading, isAuthenticated, signIn, signOut, clearSession }}
        >
            {children}
        </AuthContext.Provider>
    );
};