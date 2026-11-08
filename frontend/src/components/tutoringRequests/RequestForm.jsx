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
  { name: 'title', label: 'Request title' },
  { name: 'subject_name', label: 'Subject' },
  { name: 'grade_level', label: 'Grade level' },
  { name: 'description', label: 'Learning goal' },
  { name: 'schedule', label: 'Preferred schedule' },
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
      errors[field.name] = `${field.label} is required`;
    }
  });
  Object.keys(MAX_LENGTHS).forEach((name) => {
    if (values[name].trim().length > MAX_LENGTHS[name]) {
      errors[name] = `Must be at most ${MAX_LENGTHS[name]} characters`;
    }
  });

  const budget = Number(values.budget);
  if (values.budget === '' || Number.isNaN(budget)) {
    errors.budget = 'Budget is required';
  } else if (budget <= 0) {
    errors.budget = 'Budget must be greater than 0';
  } else if (budget > 100000000) {
    errors.budget = 'Budget is too large';
  }

  if (values.teaching_mode !== 'ONLINE' && !values.location_address.trim()) {
    errors.location_address = 'Location is required for in-person or hybrid sessions';
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
        label="Request title"
        value={values.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="e.g. Tìm gia sư Toán lớp 9 ôn thi vào 10"
        disabled={submitting}
      />

      <div className="form-grid">
        <FormSelect
          id="student_id"
          label="Child / Student"
          optional
          value={values.student_id}
          onChange={handleChange}
          options={studentOptions}
          placeholder="Select learner"
          error={errors.student_id}
          disabled={submitting}
          hint={students.length === 0 ? 'No linked students yet. You can still publish this request.' : undefined}
        />
        <FormInput
          id="subject_name"
          label="Subject"
          value={values.subject_name}
          onChange={handleChange}
          error={errors.subject_name}
          placeholder="e.g. Python"
          disabled={submitting}
        />
      </div>

      <FormTextarea
        id="description"
        label="Learning goal"
        value={values.description}
        onChange={handleChange}
        error={errors.description}
        placeholder="Describe the outcome you want"
        disabled={submitting}
      />

      <div className="form-grid">
        <FormInput
          id="schedule"
          label="Preferred schedule"
          value={values.schedule}
          onChange={handleChange}
          error={errors.schedule}
          placeholder="Weekdays after 4 PM"
          disabled={submitting}
        />
        <FormInput
          id="budget"
          label="Budget (VND / session)"
          type="number"
          value={values.budget}
          onChange={handleChange}
          error={errors.budget}
          placeholder="e.g. 250000"
          disabled={submitting}
          belowControl={budgetHint ? <p className="form-hint-left">{budgetHint}</p> : null}
        />
      </div>

      <div className="form-grid">
        <FormInput
          id="grade_level"
          label="Grade level"
          value={values.grade_level}
          onChange={handleChange}
          error={errors.grade_level}
          placeholder="e.g. Lớp 9"
          disabled={submitting}
        />
        <FormInput
          id="location_address"
          label={isOnline ? 'Location / Address (optional)' : 'Location / Address'}
          value={values.location_address}
          onChange={handleChange}
          error={errors.location_address}
          placeholder="e.g. Cầu Giấy, Hà Nội"
          disabled={submitting}
        />
      </div>

      <div className="form-field">
        <p className="form-label" id="mode-label">Session mode</p>
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
        label="Tutor requirements"
        optional
        rows={3}
        value={values.tutor_requirements}
        onChange={handleChange}
        error={errors.tutor_requirements}
        placeholder="Gender, experience, school… anything tutors should know"
        disabled={submitting}
      />

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
