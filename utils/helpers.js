// Helper functions
function cleanNisn(nisn) {
    return String(nisn || '').trim();
}

function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    if (format === 'HH:MM:SS') return `${hours}:${minutes}:${seconds}`;
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function isTerlambat(jam, batasTerlambat = '07:30:00') {
    return jam > batasTerlambat;
}

module.exports = {
    cleanNisn,
    formatDate,
    isTerlambat
};
