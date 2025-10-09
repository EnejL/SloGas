const parseOpenHours = (str) => {
  if (!str || typeof str !== 'string') return null;

  let text = str.trim();

  // Normalize text: replace "do" with "-" for time ranges, and commas with colons/dots in time formats
  text = text.replace(/(\d{1,2})[,.:](\d{2})\s+do\s+(\d{1,2})[,.:](\d{2})/gi, '$1:$2-$3:$4');
  text = text.replace(/(\d{1,2})[,.](\d{2})/g, '$1:$2'); // Replace commas/dots with colons in times
  // Normalize various separators and suffixes
  text = text.replace(/[hH]\b/g, ''); // remove trailing h in 6-22h
  text = text.replace(/\s+ure\b/gi, '');
  text = text.replace(/\s+od\s+(?=\d)/gi, ' '); // remove 'od' before times
  text = text.replace(/–|—/g, '-'); // normalize dashes
  text = text.replace(/\s*to\s*/gi, '-'); // English 'to'
  text = text.replace(/\s*do\s*/gi, '-'); // Slovenian 'do' (fallback)

  // Handle simple, absolute cases first
  if (/non[-\s]?stop|24\/7|0-24|neprenehoma|24\s*ur|24\s*h/i.test(text)) return '24/7';
  if (/zaprto/i.test(text)) return 'closed';

  const monthMap = {
    "januar": 1, "februar": 2, "marec": 3, "april": 4, "maj": 5, "junij": 6,
    "julij": 7, "avgust": 8, "september": 9, "oktober": 10, "november": 11, "december": 12,
  };

  const dayMap = {
    "ponedeljek": "mon", "torek": "tue", "sreda": "wed", "četrtek": "thu", "petek": "fri",
    "sobota": "sat", "nedelja": "sun", "praznik": "holiday", "prazniki": "holiday",
    "pon": "mon", "tor": "tue", "sre": "wed", "čet": "thu", "pet": "fri", "sob": "sat", "ned": "sun",
    // English support
    "monday": "mon", "tuesday": "tue", "wednesday": "wed", "thursday": "thu", "friday": "fri",
    "saturday": "sat", "sunday": "sun", "mon": "mon", "tue": "tue", "wed": "wed", "thu": "thu", "fri": "fri", "sat": "sat", "sun": "sun",
    // Groups
    "delavnik": ["mon", "tue", "wed", "thu", "fri"], "vsak delavnik": ["mon", "tue", "wed", "thu", "fri"],
    "sobote": ["sat"], "nedelje": ["sun"],
    "vsak dan": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    "vikend": ["sat", "sun"],
    "weekend": ["sat", "sun"],
  };

  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);
  const schedule = [];

  // This parser will process the text line by line or in chunks, trying different strategies.
  // Given the complexity, a state-machine-like approach is best.
  let currentMonths = [];
  const allDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const dayOrder = ['mon','tue','wed','thu','fri','sat','sun'];
  const nextDayOf = (code) => dayOrder[(dayOrder.indexOf(code) + 1) % dayOrder.length];
  
  for (const line of lines) {
    let processed = false;
    
    // Check for month declarations
    const monthsFound = Object.keys(monthMap).filter(m => new RegExp(`\\b${m}\\b`, 'i').test(line));
    if (monthsFound.length > 0) {
      currentMonths = monthsFound.map(m => monthMap[m.toLowerCase()]);
      processed = true;
    }

    // Check for day and time declarations
    const dayTimeRegex = /((?:(?:vsak dan|delavnik|vikend|weekend|ponedeljek|torek|sreda|četrtek|petek|sobota|nedelja|praznik|pon|tor|sre|čet|pet|sob|ned|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[\s,;&-]*)+)?(.*)/i;
    const match = line.match(dayTimeRegex);

    if (match) {
        let daysRaw = match[1] || '';
        let timeRaw = match[2] || (processed ? '' : line);

        // Remove noise words around time
        timeRaw = timeRaw.replace(/\b(od|do|to)\b/gi, ' ');
        timeRaw = timeRaw.replace(/[hH]\b/g, '');

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
                days: [...allDays],
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
            allDays.forEach(d => days.add(d));
        }
         schedule.push({
            days: [...days],
            times: [{ from: timeMatch[1], to: timeMatch[2] }]
        });
      }
  }

  // Normalize overnight ranges by splitting across midnight
  const normalized = [];
  for (const entry of schedule) {
    const baseMonths = entry.months ? [...entry.months] : undefined;
    for (const timeSlot of entry.times) {
      const [fh, fm] = timeSlot.from.split(':').map(Number);
      const [th, tm] = timeSlot.to.split(':').map(Number);
      const fromMin = fh * 60 + fm;
      const toMin = th * 60 + tm;
      if (toMin >= fromMin) {
        normalized.push({ days: [...entry.days], times: [{ from: timeSlot.from, to: timeSlot.to }], ...(baseMonths ? { months: baseMonths } : {}) });
      } else {
        // Overnight: split into two entries
        // Part 1: current day from 'from' to 23:59
        normalized.push({ days: [...entry.days], times: [{ from: timeSlot.from, to: '23:59' }], ...(baseMonths ? { months: baseMonths } : {}) });
        // Part 2: next day from 00:00 to 'to'
        const nextDays = Array.from(new Set(entry.days.map(d => nextDayOf(d))));
        normalized.push({ days: nextDays, times: [{ from: '00:00', to: timeSlot.to }], ...(baseMonths ? { months: baseMonths } : {}) });
      }
    }
  }

  // Merge entries with identical times by combining day sets
  const mergedByTimes = new Map();
  for (const entry of normalized) {
    const key = `${entry.times.map(t => `${t.from}-${t.to}`).join(',')}|${(entry.months || []).join(',')}`;
    const existing = mergedByTimes.get(key);
    if (!existing) {
      mergedByTimes.set(key, { times: entry.times, months: entry.months, days: new Set(entry.days) });
    } else {
      entry.days.forEach(d => existing.days.add(d));
    }
  }
  let merged = Array.from(mergedByTimes.values()).map(v => ({ times: v.times, days: Array.from(v.days), ...(v.months ? { months: v.months } : {}) }));

  // Heuristic: if there are two all-days entries with different times, split into Mon-Sat and Sun/Holiday
  const allDayEntries = merged.filter(e => e.days.length === 7 && (!e.months || e.months.length === 0));
  if (allDayEntries.length >= 2) {
    // Sort by starting time
    allDayEntries.sort((a, b) => a.times[0].from.localeCompare(b.times[0].from));
    // Remove them from merged
    merged = merged.filter(e => !(e.days.length === 7 && (!e.months || e.months.length === 0)));
    // Add heuristic split
    merged.push({ days: ["mon","tue","wed","thu","fri","sat"], times: allDayEntries[0].times });
    merged.push({ days: ["sun","holiday"], times: allDayEntries[1].times });
  }

  return merged.length > 0 ? merged : null;
};

module.exports = { parseOpenHours };
