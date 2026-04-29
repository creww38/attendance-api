class Helpers {
  static formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    if (format === 'HH:mm:ss') return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    return `${year}-${month}-${day}`;
  }
  
  static calculateTimeDiff(startTime, endTime) {
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  }
}

module.exports = Helpers;