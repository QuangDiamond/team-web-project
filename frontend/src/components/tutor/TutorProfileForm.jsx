import { useState } from 'react';
import Alert from '../common/Alert';
import FormInput from '../common/FormInput';
import FormSelect from '../common/FormSelect';
import FormTextarea from '../common/FormTextarea';
import ProfileListEditor from './ProfileListEditor';
import { AVAILABILITY_OPTIONS } from '../../constants/requestLabels';
import { focusFirstInvalidField, toFieldErrors } from '../../utils/authValidators';

const MAX_ITEMS = 10;
const TOP_LEVEL_FIELDS = ['headline', 'bio', 'address'];

export const EMPTY_PROFILE_VALUES = {
  headline: '',
  bio: '',
  address: '',
  is_address_hidden: false,
  availability_status: 'AVAILABLE',
  experiences: [],
  educations: [],
  achievements: [],
};

const EMPTY_EXPERIENCE = { title: '', company: '', start_date: '', end_date: '' };
const EMPTY_EDUCATION = { school: '', degree: '', graduation_year: '', description: '' };
const EMPTY_ACHIEVEMENT = { title: '', description: '' };

const EXPERIENCE_FIELDS = [
  { name: 'title', label: "Vị trí công việc", type: 'text' },
  { name: 'company', label: "Đơn vị / Trường học", type: 'text' },
  { name: 'start_date', label: "Ngày bắt đầu", type: 'date' },
  { name: 'end_date', label: "Ngày kết thúc", type: 'date', allowNow: true },
];
const EDUCATION_FIELDS = [
  { name: 'school', label: "Trường học", type: 'text' },
  { name: 'degree', label: "Bằng cấp / Chuyên ngành", type: 'text' },
  { name: 'graduation_year', label: "Năm tốt nghiệp", type: 'number' },
  { name: 'description', label: "Chi tiết", type: 'textarea', optional: true },
];
const ACHIEVEMENT_FIELDS = [
  { name: 'title', label: "Thành tích", type: 'text' },
  { name: 'description', label: "Chi tiết", type: 'textarea', optional: true },
];

const TOP_LIMITS = { headline: 120, bio: 2000, address: 255 };
const MAX_BIO_WORDS = 50;
export const countProfileWords = (text) => text.trim() ? text.trim().split(/\s+/u).length : 0;

// Kiểm tra giống tutorProfileSchema ở backend để báo lỗi ngay tại từng ô
export const validateProfileForm = (values) => {
  const errors = { top: {}, experiences: [], educations: [], achievements: [] };

  const requiredLabels = { headline: "Tiêu đề giới thiệu", bio: "Giới thiệu", address: "Địa chỉ" };
  TOP_LEVEL_FIELDS.forEach((name) => {
    const text = values[name].trim();
    if (!text) {
      errors.top[name] = `${requiredLabels[name]} là bắt buộc`;
    } else if (text.length > TOP_LIMITS[name]) {
      errors.top[name] = `Tối đa ${TOP_LIMITS[name]} ký tự`;
    }
  });
  if (countProfileWords(values.bio) > MAX_BIO_WORDS) {
    errors.top.bio = "Phần giới thiệu không được quá 50 từ";
  }

  values.experiences.forEach((item, index) => {
    const itemErrors = {};
    if (!item.title.trim()) {
      itemErrors.title = "Vui lòng nhập vị trí công việc";
    }
    if (!item.company.trim()) itemErrors.company = "Vui lòng nhập đơn vị hoặc trường học";
    if (!item.start_date) itemErrors.start_date = "Vui lòng chọn ngày bắt đầu";
    if (!item.end_date) itemErrors.end_date = "Vui lòng chọn ngày kết thúc hoặc Hiện tại";
    if (item.start_date && item.end_date && item.end_date !== 'NOW' && item.end_date < item.start_date) {
      itemErrors.end_date = "Ngày kết thúc không được trước ngày bắt đầu";
    }
    errors.experiences[index] = itemErrors;
  });

  values.educations.forEach((item, index) => {
    const itemErrors = {};
    if (!item.school.trim()) {
      itemErrors.school = "Vui lòng nhập trường học";
    }
    if (!item.degree.trim()) itemErrors.degree = "Vui lòng nhập bằng cấp hoặc chuyên ngành";
    if (!String(item.graduation_year).trim()) {
      itemErrors.graduation_year = "Vui lòng nhập năm tốt nghiệp";
    } else {
      const year = Number(item.graduation_year);
      if (!Number.isInteger(year) || year < 1950 || year > 2100) {
        itemErrors.graduation_year = "Nhập năm từ 1950 đến 2100";
      }
    }
    errors.educations[index] = itemErrors;
  });

  values.achievements.forEach((item, index) => {
    const itemErrors = {};
    if (!item.title.trim()) {
      itemErrors.title = "Vui lòng nhập thành tích";
    }
    errors.achievements[index] = itemErrors;
  });
  return errors;
};

const hasAnyError = (errors) => {
  const sectionHasError = (list) => list.some((itemErrors) => Object.keys(itemErrors).length > 0);
  return (
    Object.keys(errors.top).length > 0 ||
    sectionHasError(errors.experiences) ||
    sectionHasError(errors.educations) ||
    sectionHasError(errors.achievements)
  );
};

const emptyToNull = (text) => {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  return trimmed;
};

const toPayload = (values) => ({
  headline: values.headline.trim(),
  bio: values.bio.trim(),
  address: values.address.trim(),
  is_address_hidden: values.is_address_hidden,
  availability_status: values.availability_status,
  experiences: values.experiences.map((item) => ({
    title: item.title.trim(),
    company: emptyToNull(item.company),
    start_date: emptyToNull(item.start_date),
    end_date: item.end_date === 'NOW' ? null : emptyToNull(item.end_date),
  })),
  educations: values.educations.map((item) => {
    let graduationYear = null;
    if (item.graduation_year !== '') {
      graduationYear = Number(item.graduation_year);
    }
    return {
      school: item.school.trim(),
      degree: emptyToNull(item.degree),
      graduation_year: graduationYear,
      description: emptyToNull(item.description),
    };
  }),
  achievements: values.achievements.map((item) => ({
    title: item.title.trim(),
    description: emptyToNull(item.description),
  })),
});

// Chuyển hồ sơ từ API (null → chuỗi rỗng) về giá trị form
export const toProfileFormValues = (profile) => ({
  headline: profile.headline || '',
  bio: profile.bio || '',
  address: profile.address || '',
  is_address_hidden: profile.is_address_hidden === true,
  availability_status: profile.availability_status || 'AVAILABLE',
  experiences: profile.experiences.map((item) => ({
    title: item.title || '',
    company: item.company || '',
    start_date: item.start_date || '',
    end_date: item.end_date || 'NOW',
  })),
  educations: profile.educations.map((item) => ({
    school: item.school || '',
    degree: item.degree || '',
    graduation_year: item.graduation_year === null || item.graduation_year === undefined ? '' : String(item.graduation_year),
    description: item.description || '',
  })),
  achievements: profile.achievements.map((item) => ({
    title: item.title || '',
    description: item.description || '',
  })),
});

/*
 * Form hồ sơ gia sư. onSubmit(payload) trả về Promise; ném lỗi (có errors theo field) thì form hiện lỗi tại từng ô.
 */
export default function TutorProfileForm({ initialValues, submitLabel, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({ top: {}, experiences: [], educations: [], achievements: [] });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const field = event.target.name;
    setValues({ ...values, [field]: event.target.value });
    if (errors.top[field]) {
      setErrors({ ...errors, top: { ...errors.top, [field]: '' } });
    }
  };

  const setSection = (section, items) => {
    setValues({ ...values, [section]: items });
    setErrors({ ...errors, [section]: [] });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const foundErrors = validateProfileForm(values);
    setErrors(foundErrors);
    if (hasAnyError(foundErrors)) {
      focusFirstInvalidField(TOP_LEVEL_FIELDS, foundErrors.top);
      for (const section of ['experiences', 'educations', 'achievements']) {
        const index = foundErrors[section].findIndex((item) => Object.keys(item).length > 0);
        if (index >= 0 && Object.keys(foundErrors.top).length === 0) {
          const field = Object.keys(foundErrors[section][index])[0];
          document.getElementById(`${section}-${index}-${field}`)?.focus();
          break;
        }
      }
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(toPayload(values));
    } catch (error) {
      if (error.status === 422 && error.errors) {
        const serverErrors = toFieldErrors(error.errors);
        setErrors({ ...foundErrors, top: serverErrors });
        setFormError(error.message);
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>
      {formError && <Alert type="error">{formError}</Alert>}

      <FormInput
        id="headline"
        label="Tiêu đề giới thiệu"
        required
        value={values.headline}
        onChange={handleChange}
        error={errors.top.headline}
        placeholder="Ví dụ: Gia sư Toán 5 năm kinh nghiệm"
        disabled={submitting}
      />
      <FormTextarea
        id="bio"
        label="Giới thiệu bản thân"
        required
        hint={`${countProfileWords(values.bio)}/${MAX_BIO_WORDS} từ`}
        rows={5}
        value={values.bio}
        onChange={handleChange}
        error={countProfileWords(values.bio) > MAX_BIO_WORDS ? "Phần giới thiệu không được quá 50 từ" : errors.top.bio}
        placeholder="Kinh nghiệm, phương pháp giảng dạy và những gì học sinh có thể đạt được"
        disabled={submitting}
      />
      <div className="form-grid">
        <FormInput
          id="address"
          label="Địa chỉ / Khu vực"
          required
          value={values.address}
          onChange={handleChange}
          error={errors.top.address}
          placeholder="Ví dụ: Cầu Giấy, Hà Nội"
          disabled={submitting}
        />
        <FormSelect
          id="availability_status"
          label="Trạng thái nhận lớp"
          required
          value={values.availability_status}
          onChange={handleChange}
          options={AVAILABILITY_OPTIONS}
          disabled={submitting}
        />
      </div>
      <label className="checkbox profile-checkbox">
        <input
          type="checkbox"
          checked={values.is_address_hidden}
          disabled={submitting}
          onChange={(event) => setValues({ ...values, is_address_hidden: event.target.checked })}
        />
        <span>Ẩn địa chỉ của tôi với người dùng khác</span>
      </label>

      <ProfileListEditor
        sectionId="experiences"
        title="Kinh nghiệm"
        items={values.experiences}
        fields={EXPERIENCE_FIELDS}
        emptyItem={EMPTY_EXPERIENCE}
        maxItems={MAX_ITEMS}
        addLabel="Thêm kinh nghiệm"
        errors={errors.experiences}
        disabled={submitting}
        onChange={(items) => setSection('experiences', items)}
      />
      <ProfileListEditor
        sectionId="educations"
        title="Học vấn"
        items={values.educations}
        fields={EDUCATION_FIELDS}
        emptyItem={EMPTY_EDUCATION}
        maxItems={MAX_ITEMS}
        addLabel="Thêm học vấn"
        errors={errors.educations}
        disabled={submitting}
        onChange={(items) => setSection('educations', items)}
      />
      <ProfileListEditor
        sectionId="achievements"
        title="Thành tích"
        items={values.achievements}
        fields={ACHIEVEMENT_FIELDS}
        emptyItem={EMPTY_ACHIEVEMENT}
        maxItems={MAX_ITEMS}
        addLabel="Thêm thành tích"
        errors={errors.achievements}
        disabled={submitting}
        onChange={(items) => setSection('achievements', items)}
      />

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? "Đang lưu..." : submitLabel}
      </button>
    </form>
  );
}
