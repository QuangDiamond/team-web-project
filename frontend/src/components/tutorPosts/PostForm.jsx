import { useState } from 'react';
import Alert from '../common/Alert';
import FormInput from '../common/FormInput';
import FormTextarea from '../common/FormTextarea';
import { TEACHING_MODES, formatBudget } from '../../constants/requestLabels';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';

const FIELD_ORDER = ['title', 'subject_name', 'grade_level', 'price', 'schedule', 'description'];
const REQUIRED_FIELDS = [
  { name: 'title', label: "Tiêu đề" },
  { name: 'subject_name', label: "Môn học" },
  { name: 'grade_level', label: "Khối lớp" },
  { name: 'schedule', label: "Lịch có thể dạy" },
  { name: 'description', label: "Mô tả" },
];
const MAX_LENGTHS = { title: 150, subject_name: 100, grade_level: 50, schedule: 300, description: 2000 };

export const EMPTY_POST_VALUES = {
  title: '',
  subject_name: '',
  grade_level: '',
  teaching_mode: 'ONLINE',
  price: '',
  schedule: '',
  description: '',
};

// Kiểm tra giống tutorPostSchema ở backend để báo lỗi ngay tại từng ô
const validate = (values) => {
  const errors = {};
  REQUIRED_FIELDS.forEach((field) => {
    if (!values[field.name].trim()) {
      errors[field.name] = `${field.label} là bắt buộc`;
    }
  });
  Object.keys(MAX_LENGTHS).forEach((name) => {
    if (values[name].trim().length > MAX_LENGTHS[name]) {
      errors[name] = `Tối đa ${MAX_LENGTHS[name]} ký tự`;
    }
  });

  const price = Number(values.price);
  if (values.price === '' || Number.isNaN(price)) {
    errors.price = "Vui lòng nhập học phí";
  } else if (price <= 0) {
    errors.price = "Học phí phải lớn hơn 0";
  } else if (price > 100000000) {
    errors.price = "Học phí quá lớn";
  }
  return errors;
};

const toPayload = (values) => ({
  title: values.title.trim(),
  subject_name: values.subject_name.trim(),
  grade_level: values.grade_level.trim(),
  teaching_mode: values.teaching_mode,
  price: Number(values.price),
  schedule: values.schedule.trim(),
  description: values.description.trim(),
});

export const toPostFormValues = (post) => ({
  title: post.title || '',
  subject_name: post.subject_name || '',
  grade_level: post.grade_level || '',
  teaching_mode: post.teaching_mode || 'ONLINE',
  price: post.price === null || post.price === undefined ? '' : String(post.price),
  schedule: post.schedule || '',
  description: post.description || '',
});

/*
 * Form tạo / sửa bài đăng. Tạo mới có hai nút: lưu nháp (DRAFT) và đăng ngay (PUBLISHED).
 * onSubmit(payload, status) trả về Promise; status chỉ có khi tạo mới. Ném lỗi (có errors theo field) thì hiện lỗi tại từng ô.
 */
export default function PostForm({ initialValues, isEdit, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const field = event.target.name;
    setValues({ ...values, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const submitWithStatus = async (status) => {
    setFormError('');
    const foundErrors = validate(values);
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) {
      focusFirstInvalidField(FIELD_ORDER, foundErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(toPayload(values), status);
    } catch (error) {
      if (error.status === 422 && error.errors) {
        const serverErrors = toFieldErrors(error.errors);
        setErrors(serverErrors);
        focusFirstInvalidField(FIELD_ORDER, serverErrors);
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Sửa bài: không đổi trạng thái. Nhấn Enter khi tạo mới = lưu nháp
    submitWithStatus('DRAFT');
  };

  let priceHint;
  if (values.price !== '' && Number(values.price) > 0) {
    priceHint = formatBudget(values.price);
  }

  return (
    <form className="post-form" onSubmit={handleSubmit} noValidate>
      {formError && <Alert type="error">{formError}</Alert>}

      <FormInput
        id="title"
        label="Tiêu đề"
        value={values.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="Ví dụ: Gia sư Toán lớp 9 ôn thi vào 10"
        disabled={submitting}
      />
      <div className="form-grid">
        <FormInput id="subject_name" label="Môn học" value={values.subject_name} onChange={handleChange} error={errors.subject_name} placeholder="Ví dụ: Toán" disabled={submitting} />
        <FormInput id="grade_level" label="Khối lớp" value={values.grade_level} onChange={handleChange} error={errors.grade_level} placeholder="Ví dụ: Lớp 9" disabled={submitting} />
      </div>
      <div className="form-grid">
        <FormInput
          id="price"
          label="Học phí (VND / buổi)"
          type="number"
          value={values.price}
          onChange={handleChange}
          error={errors.price}
          placeholder="Ví dụ: 150000"
          disabled={submitting}
          belowControl={priceHint ? <p className="form-hint-left">{priceHint}</p> : null}
        />
        <FormInput id="schedule" label="Lịch có thể dạy" value={values.schedule} onChange={handleChange} error={errors.schedule} placeholder="Ví dụ: Tối thứ 3, thứ 5" disabled={submitting} />
      </div>

      <div className="form-field">
        <p className="form-label" id="post-mode-label">Hình thức học</p>
        <div className="mode-toggle" role="group" aria-labelledby="post-mode-label">
          {TEACHING_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={values.teaching_mode === mode.value ? 'mode-toggle-option is-selected' : 'mode-toggle-option'}
              aria-pressed={values.teaching_mode === mode.value}
              disabled={submitting}
              onClick={() => setValues({ ...values, teaching_mode: mode.value })}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <FormTextarea
        id="description"
        label="Mô tả"
        rows={5}
        value={values.description}
        onChange={handleChange}
        error={errors.description}
        placeholder="Mô tả phương pháp giảng dạy và nội dung học sinh sẽ được học"
        disabled={submitting}
      />

      <div className="post-form-actions">
        {isEdit ? (
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-outline" disabled={submitting} onClick={() => submitWithStatus('DRAFT')}>
              Lưu bản nháp
            </button>
            <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => submitWithStatus('PUBLISHED')}>
              {submitting ? "Đang lưu..." : "Đăng bài"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
