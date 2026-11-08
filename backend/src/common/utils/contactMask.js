/** Replace conventional email addresses, phone numbers and links in public text. */
export const maskContact = (text) => {
  if (typeof text !== 'string') {
    return text ?? null;
  }

  // shortcut: pattern matching cannot detect deliberately obfuscated contacts; upgrade with moderation when needed.
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '***')
    .replace(/\b(?:[a-z][a-z0-9+.-]*:\/\/|mailto:|tel:|www\.)[^\s<>]+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:[/:?#][^\s<>]*)?/gi, '***')
    .replace(/(?<!\w)\+?\d(?:[\s().-]*\d){8,14}(?!\w)/g, '***');
};
