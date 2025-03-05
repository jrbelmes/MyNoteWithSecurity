import { toast } from 'sonner';

export const sanitizeInput = (input) => {
    if (input === null || input === undefined) {
        return '';
    }

    // Convert to string
    let sanitized = String(input);

    // Remove HTML tags and scripts
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove suspicious patterns but keep spaces
    const suspiciousPatterns = [
        /javascript:/gi,
        /data:/gi,
        /vbscript:/gi,
        /onload=/gi,
        /onerror=/gi,
        /onclick=/gi,
        /onmouseover=/gi,
        /eval\(/gi,
        /expression\(/gi
    ];

    suspiciousPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
    });

    // Remove dangerous special characters but allow spaces, dots, and hyphens
    sanitized = sanitized.replace(/[<>{}()$#@!%^&*+='"\[\]|~`\\]/g, '');

    // Check if significant changes were made (ignoring whitespace changes)
    if (sanitized.trim() !== input.trim()) {
        toast.error('Invalid characters were removed from input.');
    }

    return sanitized;
};

export const validateInput = (input) => {
    if (!input) return true;  // Allow empty input
    
    // Check for dangerous patterns
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /eval\(/i,
        /expression\(/i,
        /\(\)/g,  // Function calls
        /\\/g,    // Backslashes
        /\x00/g,  // Null bytes
        /\x1a/g   // EOF
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
};
