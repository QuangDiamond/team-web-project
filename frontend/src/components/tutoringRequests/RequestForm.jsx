import { toast } from 'sonner';
import { useState } from 'react';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import SchedulePicker from '../common/SchedulePicker';
import { TEACHING_MODES, formatBudget } from '../../constants/requestLabels';
import { useSubjectNames } from '../../hooks/useSubjectNames';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';
import { toSelectOptions } from '../../utils/selectOptions';

const FIELD_ORDER = [
  'title',
  'subject_name',
  'grade_level',
  'budget',
  'schedule',
  'location_address',
  'description',
  'tutor_requirements',
];

const REQUIRED_FIELDS = [
  { name: 'title', label: 'Tiêu đề yêu cầu' },
  { name: 'subject_name', label: 'Môn học' },
  { name: 'grade_level', label: 'Cấp học / Trình độ' },
  { name: 'description', label: 'Mục tiêu học tập' },
];

const SCHEDULE_REQUIRED_MESSAGE = 'Chọn ít nhất một ngày và giờ bắt đầu, kết thúc hợp lệ';

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
  subject_name: '',
  grade_level: '',
  budget: '',
  schedule: '',
  teaching_mode: 'ONLINE',
  location_address: '',
  description: '',
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
  if (!values.schedule.trim()) {
    errors.schedule = SCHEDULE_REQUIRED_MESSAGE;
  }
  Object.keys(MAX_LENGTHS).forEach((name) => {
    if (values[name].trim().length > MAX_LENGTHS[name]) {
      errors[name] = `Tối đa ${MAX_LENGTHS[name]} ký tự`;
    }
  });

  const budget = Number(values.budget);
  if (values.budget === '' || Number.isNaN(budget)) {
    errors.budget = "Vui lòng nhập ngân sách";
  } else if (budget <= 1000) {
    errors.budget = "Ngân sách phải lớn hơn 1.000đ";
  } else if (budget > 100000000) {
    errors.budget = "Ngân sách quá lớn";
  }

  if (values.teaching_mode !== 'ONLINE' && !values.location_address.trim()) {
    errors.location_address = "Vui lòng nhập địa điểm cho hình thức trực tiếp hoặc kết hợp";
  }
  return errors;
};

const toPayload = (values) => {
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
    student_id: null,
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
 * Form tạo / sửa request, cùng bố cục với form tạo bài đăng của gia sư (PostForm).
 * onSubmit(payload) trả về Promise; ném lỗi (có errors theo field) thì form hiện lỗi tại từng ô.
 */
export default function RequestForm({ initialValues, submitLabel, submittingLabel, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const subjects = useSubjectNames();
  const subjectOptions = toSelectOptions(subjects.subjectNames, values.subject_name);
  const gradeOptions = toSelectOptions(subjects.gradeNames, values.grade_level);

  const isOnline = values.teaching_mode === 'ONLINE';

  const handleChange = (event) => {
    const field = event.target.name;
    setValues({ ...values, [field]: event.target.value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleScheduleChange = (schedule) => {
    setValues((previousValues) => ({ ...previousValues, schedule: schedule }));
    if (errors.schedule) {
      setErrors({ ...errors, schedule: '' });
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
        toast.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  let budgetHint;
  if (values.budget !== '' && Number(values.budget) > 0) {
    budgetHint = formatBudget(values.budget);
  }

  let locationLabel = 'Địa điểm học';
  if (isOnline) {
    locationLabel = 'Địa điểm học (không bắt buộc)';
  }

  return (
    <form className="request-form" onSubmit={handleSubmit} noValidate>

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
          id="subject_name"
          label="Môn học"
          value={values.subject_name}
          onChange={handleChange}
          options={subjectOptions}
          placeholder={subjects.loading ? 'Đang tải môn học...' : 'Chọn môn học'}
          error={errors.subject_name}
          hint={subjects.error ? 'Không tải được danh mục môn học/cấp học. Hãy tải lại trang.' : undefined}
          disabled={submitting}
        />
        <FormSelect
          id="grade_level"
          label="Cấp học / Trình độ"
          value={values.grade_level}
          onChange={handleChange}
          options={gradeOptions}
          placeholder="Chọn cấp học / trình độ"
          error={errors.grade_level}
          disabled={submitting}
        />
      </div>
      <div className="form-grid">
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
      <SchedulePicker
        id="schedule"
        label="Lịch học mong muốn"
        value={values.schedule}
        onChange={handleScheduleChange}
        error={errors.schedule}
        disabled={submitting}
      />

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

      <FormInput
        id="location_address"
        label={locationLabel}
        value={values.location_address}
        onChange={handleChange}
        error={errors.location_address}
        placeholder="Ví dụ: Cầu Giấy, Hà Nội"
        disabled={submitting}
      />

      <FormTextarea
        id="description"
        label="Mục tiêu học tập"
        rows={5}
        value={values.description}
        onChange={handleChange}
        error={errors.description}
        placeholder="Mô tả kết quả bạn mong muốn"
        disabled={submitting}
      />
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

      <div className="request-form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
