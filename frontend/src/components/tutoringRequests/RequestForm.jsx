import { useState } from 'react';
import Alert from '../common/Alert';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import { TEACHING_MODES, formatBudget } from '../../constants/requestLabels';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';

const FIELD_ORDER = [
  'title',
  'student_id',
  'subject_name',
  'grade_level',
  'description',
  'schedule',
  'budget',
  'location_address',
  'tutor_requirements',
];

const REQUIRED_FIELDS = [
  { name: 'title', label: "Tiêu đề yêu cầu" },
  { name: 'subject_name', label: "Môn học" },
  { name: 'grade_level', label: "Khối lớp" },
  { name: 'description', label: "Mục tiêu học tập" },
  { name: 'schedule', label: "Lịch học mong muốn" },
];

const MAX_LENGTHS = {
  title: 150,
  subject_name: 100,
  grade_level: 50,
  description: 2000,
  schedule: 300,
  location_address: 255,
  tutor_requirements: 1000,
};

export const EMPTY_REQUEST_VALUES = {
  title: '',
  student_id: '',
  subject_name: '',
  grade_level: '',
  description: '',
  schedule: '',
  budget: '',
  teaching_mode: 'ONLINE',
  location_address: '',
  tutor_requirements: '',
};

// Kiểm tra giống parentRequestSchema ở backend để báo lỗi ngay tại từng ô
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

  const budget = Number(values.budget);
  if (values.budget === '' || Number.isNaN(budget)) {
    errors.budget = "Vui lòng nhập ngân sách";
  } else if (budget <= 0) {
    errors.budget = "Ngân sách phải lớn hơn 0";
  } else if (budget > 100000000) {
    errors.budget = "Ngân sách quá lớn";
  }

  if (values.teaching_mode !== 'ONLINE' && !values.location_address.trim()) {
    errors.location_address = "Vui lòng nhập địa điểm cho hình thức trực tiếp hoặc kết hợp";
  }
  return errors;
};

const toPayload = (values) => {
  let studentId = null;
  if (values.student_id) {
    studentId = values.student_id;
  }
  let locationAddress = null;
  if (values.location_address.trim()) {
    locationAddress = values.location_address.trim();
  }
  let tutorRequirements = null;
  if (values.tutor_requirements.trim()) {
    tutorRequirements = values.tutor_requirements.trim();
  }
  return {
    title: values.title.trim(),
    student_id: studentId,
    subject_name: values.subject_name.trim(),
    grade_level: values.grade_level.trim(),
    description: values.description.trim(),
    schedule: values.schedule.trim(),
    budget: Number(values.budget),
    teaching_mode: values.teaching_mode,
    location_address: locationAddress,
    tutor_requirements: tutorRequirements,
  };
};

/*
 * Form tạo / sửa request (Figma: RequestForm). students: con đã liên kết để chọn.
 * onSubmit(payload) trả về Promise; ném lỗi (có errors theo field) thì form hiện lỗi tại từng ô.
 */
export default function RequestForm({ initialValues, students, submitLabel, submittingLabel, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOnline = values.teaching_mode === 'ONLINE';

  const handleChange = (event) => {
    const field = event.target.name;
    setValues({ ...values, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleModeChange = (mode) => {
    setValues({ ...values, teaching_mode: mode });
    if (errors.location_address) {
      setErrors({ ...errors, location_address: '' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const foundErrors = validate(values);
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) {
      focusFirstInvalidField(FIELD_ORDER, foundErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(toPayload(values));
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

  const studentOptions = students.map((student) => ({ value: student._id, label: student.full_name }));

  let budgetHint;
  if (values.budget !== '' && Number(values.budget) > 0) {
    budgetHint = formatBudget(values.budget);
  }

  return (
    <form className="request-form" onSubmit={handleSubmit} noValidate>
      {formError && <Alert type="error">{formError}</Alert>}

      <FormInput
        id="title"
        label="Tiêu đề yêu cầu"
        value={values.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="Ví dụ: Tìm gia sư Toán lớp 9 ôn thi vào 10"
        disabled={submitting}
      />

      <div className="form-grid">
        <FormSelect
          id="student_id"
          label="Con / Học sinh"
          optional
          value={values.student_id}
          onChange={handleChange}
          options={studentOptions}
          placeholder="Chọn học sinh"
          error={errors.student_id}
          disabled={submitting}
          hint={students.length === 0 ? "Chưa liên kết học sinh. Bạn vẫn có thể đăng yêu cầu này." : undefined}
        />
        <FormInput
          id="subject_name"
          label="Môn học"
          value={values.subject_name}
          onChange={handleChange}
          error={errors.subject_name}
          placeholder="Ví dụ: Lập trình Python"
          disabled={submitting}
        />
      </div>

      <FormTextarea
        id="description"
        label="Mục tiêu học tập"
        value={values.description}
        onChange={handleChange}
        error={errors.description}
        placeholder="Mô tả kết quả học tập mong muốn"
        disabled={submitting}
      />

      <div className="form-grid">
        <FormInput
          id="schedule"
          label="Lịch học mong muốn"
          value={values.schedule}
          onChange={handleChange}
          error={errors.schedule}
          placeholder="Các ngày trong tuần sau 16 giờ"
          disabled={submitting}
        />
        <FormInput
          id="budget"
          label="Ngân sách (VND / buổi)"
          type="number"
          value={values.budget}
          onChange={handleChange}
          error={errors.budget}
          placeholder="Ví dụ: 250000"
          disabled={submitting}
          belowControl={budgetHint ? <p className="form-hint-left">{budgetHint}</p> : null}
        />
      </div>

      <div className="form-grid">
        <FormInput
          id="grade_level"
          label="Khối lớp"
          value={values.grade_level}
          onChange={handleChange}
          error={errors.grade_level}
          placeholder="Ví dụ: Lớp 9"
          disabled={submitting}
        />
        <FormInput
          id="location_address"
          label={isOnline ? "Địa điểm / Địa chỉ (không bắt buộc)" : "Địa điểm / Địa chỉ"}
          value={values.location_address}
          onChange={handleChange}
          error={errors.location_address}
          placeholder="Ví dụ: Cầu Giấy, Hà Nội"
          disabled={submitting}
        />
      </div>

      <div className="form-field">
        <p className="form-label" id="mode-label">Hình thức học</p>
        <div className="mode-toggle" role="group" aria-labelledby="mode-label">
          {TEACHING_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={values.teaching_mode === mode.value ? 'mode-toggle-option is-selected' : 'mode-toggle-option'}
              aria-pressed={values.teaching_mode === mode.value}
              disabled={submitting}
              onClick={() => handleModeChange(mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <FormTextarea
        id="tutor_requirements"
        label="Yêu cầu đối với gia sư"
        optional
        rows={3}
        value={values.tutor_requirements}
        onChange={handleChange}
        error={errors.tutor_requirements}
        placeholder="Giới tính, kinh nghiệm, trường học… hoặc yêu cầu khác dành cho gia sư"
        disabled={submitting}
      />

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
