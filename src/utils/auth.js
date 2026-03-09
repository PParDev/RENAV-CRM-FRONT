// Este archivo sirve como utilidad para manejar la autenticación JWT en el frontend.
// En un entorno real, estos tokens vendrían de tu backend (ej. Node.js, Python, etc.)

// Nombre de la key usada en localStorage
const TOKEN_KEY = 'renav_jwt_token';

/**
 * Guarda el token en localStorage
 * @param {string} token - El JWT a guardar
 */
export const setToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Obtiene el token desde localStorage
 * @returns {string|null} El JWT o null si no existe
 */
export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Elimina el token de localStorage (para deslogearse)
 */
export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

/**
 * Verifica de forma sencilla si hay un token guardado.
 * OJO: Esta verificación no comprueba si el token expiró o es válido criptográficamente 
 * contra el backend, solo si existe en el frontend. Si se agregase jwt-decode, se podría 
 * comprobar su expiración aquí antes de retornar true.
 * @returns {boolean}
 */
export const isAuthenticatedFunc = () => {
    const token = getToken();
    if (!token) return false;

    // Aquí puedes usar jwt-decode para verificar expiración si se requiere más adelante
    return true;
};
