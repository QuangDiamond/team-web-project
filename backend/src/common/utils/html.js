// Escape text inserted into email and checkout HTML, including quoted attributes.
export const escapeHtml = (text) => {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
};
