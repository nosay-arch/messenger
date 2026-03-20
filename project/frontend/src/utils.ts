export const escapeHtml = (unsafe: string): string => {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return unsafe.replace(/[&<>"']/g, m => map[m]);
};

export const formatTime = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

export const isMobile = (): boolean => window.innerWidth <= 768;

export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

export const getCsrfToken = (): string => {
    const tokenEl = document.getElementById('csrf-token') as HTMLInputElement;
    return tokenEl ? tokenEl.value : '';
};
