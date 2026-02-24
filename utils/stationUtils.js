export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const isStationOpen = (station) => {
  const openingHours = station.opening_hours || station.open_hours;
  
  // Handle special cases
  if (openingHours === "24/7") return true;
  if (openingHours === "closed") return false;
  if (!openingHours) return null; // Unknown
  
  // Handle structured array format
  if (Array.isArray(openingHours)) {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
    
    // Map JS day numbers to our day codes
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayCode = dayMap[currentDay];
    
    // Filter schedules relevant to today
    const relevantSchedules = openingHours.filter(schedule => {
      // Check if this schedule applies to current month (if months specified)
      if (schedule.months && schedule.months.length > 0) {
        if (!schedule.months.includes(currentMonth)) return false;
      }
      
      // Check if this schedule applies to today
      return schedule.days.includes(todayCode);
    });
    
    // Check if any relevant schedule covers the current time
    for (const schedule of relevantSchedules) {
      for (const timeSlot of schedule.times) {
        const [fromHour, fromMin] = timeSlot.from.split(':').map(Number);
        const [toHour, toMin] = timeSlot.to.split(':').map(Number);
        const fromTime = fromHour * 60 + fromMin;
        // "00:00" as end time means midnight (end of day) → treat as 24:00
        const toTime = (toHour === 0 && toMin === 0) ? 24 * 60 : toHour * 60 + toMin;
        if (currentTime >= fromTime && currentTime <= toTime) {
          return true;
        }
      }
    }
    
    return false; // No matching schedule found
  }
  
  return null; // Unknown format
};
