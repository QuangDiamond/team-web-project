// Đổi danh sách chuỗi thành options cho FormSelect. Giá trị đang có mà không nằm trong danh sách
// (dữ liệu cũ nhập tay, ví dụ "Python") được thêm vào đầu để khi sửa không bị mất
export const toSelectOptions = (names, currentValue) => {
  const options = names.map((name) => ({ value: name, label: name }));
  if (currentValue && !names.includes(currentValue)) {
    options.unshift({ value: currentValue, label: currentValue });
  }
  return options;
};
