export const normalizeString = (str) => {
    if (!str) return 'autre';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const getWeekId = (date) => {
    // Convertir le timestamp Firestore en Date si nécessaire
    const jsDate = date?.toDate ? date.toDate() : new Date(date);
    const d = new Date(Date.UTC(jsDate.getFullYear(), jsDate.getMonth(), jsDate.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
};

export const getMonthId = (date) => {
    // Convertir le timestamp Firestore en Date si nécessaire
    const jsDate = date?.toDate ? date.toDate() : new Date(date);
    return `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, '0')}`;
};