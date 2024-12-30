// @ts-nocheck
export const formatTime = (time) => {
  if (!time) return 'N/A';
  try {
    // Time format is 'HH:mm'
    const [hours, minutes] = time.split(':').map(Number);
    
    // Format using 12-hour clock
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minuteStr = minutes.toString().padStart(2, '0');
    
    return `${hour12}:${minuteStr} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error, time);
    return 'Invalid Time';
  }
};

export const formatSchedule = (day, startTime, endTime) => {
  if (!day) return 'N/A';
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (start === 'Invalid Time' || end === 'Invalid Time') return 'N/A';
  return `${day} ${start} - ${end}`;
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
}; 