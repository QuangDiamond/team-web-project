import FormSelect from '../common/FormSelect';

// Chọn người con cần xem tiến độ (bước 1 của UC35). children: danh sách con đã liên kết
export default function ChildSelector({ childList, selectedChildId, onChange }) {
  const options = childList.map((child) => ({ value: child._id, label: child.full_name }));

  return (
    <div className="child-selector">
      <FormSelect
        id="child"
        label="Học sinh"
        value={selectedChildId}
        onChange={(event) => onChange(event.target.value)}
        options={options}
      />
    </div>
  );
}
