/**
 * Safe parser for array inputs from multipart/form-data.
 * Handles:
 * 1. Valid JSON array strings: '["a", "b"]' -> ["a", "b"]
 * 2. Plain strings: 'a' -> ["a"]
 * 3. Comma-separated strings: 'a,b' -> ["a", "b"]
 * 4. Already parsed arrays: ["a", "b"] -> ["a", "b"]
 */
export const parseInputArray = (input: any): string[] => {
    if (!input) return [];

    // If it's already an array, return it
    if (Array.isArray(input)) return input;

    // If it's not a string, we can't do much, return empty array or wrap it
    if (typeof input !== 'string') return [String(input)];

    const trimmedInput = input.trim();
    if (!trimmedInput) return [];

    // Check if it's a JSON string
    if (trimmedInput.startsWith('[') && trimmedInput.endsWith(']')) {
        try {
            const parsed = JSON.parse(trimmedInput);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            // Fallback to treating it as a plain string if JSON.parse fails
        }
    }

    // Handle comma-separated strings or single plain strings
    if (trimmedInput.includes(',')) {
        return trimmedInput.split(',').map(item => item.trim()).filter(item => item !== '');
    }

    return [trimmedInput];
};
