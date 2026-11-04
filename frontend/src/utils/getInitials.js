// Tối đa 2 chữ cái đầu của tên để làm avatar
export const getInitials = (fullName) => {
  const words = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 'U';
  }
  return words.map((word) => word[0]).join('').slice(0, 2).toUpperCase();
};
