const parseOpenHours = (str) => {
  if (!str || typeof str !== 'string') return null;

  let text = str.trim();

  // Normalize text: replace "do" with "-" for time ranges, and commas with colons/dots in time formats
  text = text.replace(/(\d{1,2})[,.:](\d{2})\s+do\s+(\d{1,2})[,.:](\d{2})/gi, '$1:$2-$3:$4');
  text = text.replace(/(\d{1,2})[,.](\d{2})/g, '$1:$2'); // Replace commas/dots with colons in times

  // Handle simple, absolute cases first
  if (/non-stop|24\/7|0-24|neprenehoma|24 ur/i.test(text)) return '24/7';
  if (/zaprto/i.test(text)) return 'closed';

  const monthMap = {
    "januar": 1, "februar": 2, "marec": 3, "april": 4, "maj": 5, "junij": 6,
    "julij": 7, "avgust": 8, "september": 9, "oktober": 10, "november": 11, "december": 12,
  };

  const dayMap = {
    "ponedeljek": "mon", "torek": "tue", "sreda": "wed", "četrtek": "thu", "petek": "fri",
    "sobota": "sat", "nedelja": "sun", "praznik": "holiday", "prazniki": "holiday",
    "pon": "mon", "tor": "tue", "sre": "wed", "čet": "thu", "pet": "fri", "sob": "sat", "ned": "sun",
    "delavnik": ["mon", "tue", "wed", "thu", "fri"], "vsak delavnik": ["mon", "tue", "wed", "thu", "fri"],
    "sobote": ["sat"], "nedelje": ["sun"],
    "vsak dan": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  };

  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  const schedule = [];

  // This parser will process the text line by line or in chunks, trying different strategies.
  // Given the complexity, a state-machine-like approach is best.
  let currentMonths = [];
  
  for (const line of lines) {
    let processed = false;
    
    // Check for month declarations
    const monthsFound = Object.keys(monthMap).filter(m => new RegExp(`\\b${m}\\b`, 'i').test(line));
    if (monthsFound.length > 0) {
      currentMonths = monthsFound.map(m => monthMap[m.toLowerCase()]);
      processed = true;
    }

    // Check for day and time declarations
    const dayTimeRegex = /((?:(?:vsak dan|ponedeljek|torek|sreda|četrtek|petek|sobota|nedelja|praznik|pon|tor|sre|čet|pet|sob|ned)[\s,-]*)+)?(.*)/i;
    const match = line.match(dayTimeRegex);

    if (match) {
        let daysRaw = match[1] || '';
        let timeRaw = match[2] || (processed ? '' : line);

        const days = new Set();
        Object.keys(dayMap).forEach(d => {
            if (new RegExp(`\\b${d}\\b`, 'i').test(daysRaw)) {
                const dayVal = dayMap[d.toLowerCase()];
                if (Array.isArray(dayVal)) dayVal.forEach(dv => days.add(dv));
                else days.add(dayVal);
            }
        });

        const timeRegex = /(\d{1,2}[:.]?\d{0,2})\s*-\s*(\d{1,2}[:.]?\d{0,2})/g;
        let timeMatch;
        const times = [];
        while((timeMatch = timeRegex.exec(timeRaw)) !== null) {
            times.push({ 
                from: timeMatch[1].replace('.', ':').padStart(5, '0'), 
                to: timeMatch[2].replace('.', ':').padStart(5, '0') 
            });
        }

        if (days.size > 0 && times.length > 0) {
            const entry = {
                days: [...days],
                times: times
            };
            if (currentMonths.length > 0) {
                entry.months = [...currentMonths];
            }
            schedule.push(entry);
            if (processed) currentMonths = []; // Reset months if they were on the same line
        } else if (times.length > 0 && !processed) {
             // Handle cases where only time is specified (e.g., "06:00-22:00")
             schedule.push({
                 days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                 times: times,
                 ...(currentMonths.length > 0 && { months: [...currentMonths] })
             });
             currentMonths = [];
        }
    }
  }

  // Fallback for formats like "vsak delavnik 06:00-20:00" that might not be multiline
  if (schedule.length === 0 && lines.length === 1) {
      const parts = text.split(/\s+/);
      // This is a simplified regex, real implementation would be more robust
      const timeMatch = text.match(/(\d{1,2}[:.]\d{2})\s*-\s*(\d{1,2}[:.]\d{2})/);
      if (timeMatch) {
          const days = new Set();
           Object.keys(dayMap).forEach(d => {
            if (new RegExp(`\\b${d}\\b`, 'i').test(text)) {
                const dayVal = dayMap[d.toLowerCase()];
                if (Array.isArray(dayVal)) dayVal.forEach(dv => days.add(dv));
                else days.add(dayVal);
            }
        });
        if(days.size === 0) {
            days.add("mon").add("tue").add("wed").add("thu").add("fri").add("sat").add("sun");
        }
         schedule.push({
            days: [...days],
            times: [{ from: timeMatch[1], to: timeMatch[2] }]
        });
      }
  }


  return schedule.length > 0 ? schedule : null;
};

module.exports = { parseOpenHours };
