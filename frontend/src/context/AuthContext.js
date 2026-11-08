import { createContext } from 'react';

// Keep context identity stable when Vite refreshes the provider and hook module.
export const AuthContext = createContext(null);
