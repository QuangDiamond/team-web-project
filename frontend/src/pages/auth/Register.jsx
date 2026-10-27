import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getGoogleLoginUrl } from '../../services/authService';
import AuthLayout from '../../components/layout/AuthLayout';
import RegisterStepper from '../../components/common/RegisterStepper';
import RegisterConfirmStep from '../../components/common/RegisterConfirmStep';
import RegisterInfoStep from '../../components/register/RegisterInfoStep';
import Alert from '../../components/common/Alert';
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRole,
  validateAgreeTerms,
  focusFirstInvalidField,
  toFieldErrors,
} from '../../utils/authValidators';
import '../../styles/register.css';

const INFO_FIELDS = ['full_name', 'email', 'password', 'confirm_password'];

// Validate 1 ô của bước 1
const validateInfoField = (field, values) => {
  if (field === 'full_name') {
    return validateFullName(values.full_name);
  }
  if (field === 'email') {
    return validateEmail(values.email);
  }
  if (field === 'password') {
    return validatePassword(values.password);
  }
  return validateConfirmPassword(values.password, values.confirm_password);
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [values, setValues] = useState({ full_name: '', email: '', password: '', confirm_password: '' });
  const [role, setRole] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setValues({ ...values, [field]: value });
    // Đang có lỗi thì kiểm tra lại ngay khi sửa để lỗi biến mất
    if (errors[field]) {
      const newValues = { ...values, [field]: value };
      setErrors({ ...errors, [field]: validateInfoField(field, newValues) });
    }
  };

  const handleBlur = (field) => {
    setErrors({ ...errors, [field]: validateInfoField(field, values) });
  };

  const handleNext = () => {
    const newErrors = {};
    INFO_FIELDS.forEach((field) => {
      newErrors[field] = validateInfoField(field, values);
    });
    setErrors(newErrors);

    const hasError = INFO_FIELDS.some((field) => newErrors[field]);
    if (hasError) {
      focusFirstInvalidField(INFO_FIELDS, newErrors);
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setFormError('');
    setEmailTaken(false);
    setStep(1);
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrors({ ...errors, role: '' });
  };

  const handleAgreeTermsChange = (checked) => {
    setAgreeTerms(checked);
    setErrors({ ...errors, agree_terms: '' });
  };

  const handleSubmit = async () => {
    setFormError('');
    setEmailTaken(false);

    const newErrors = {
      role: validateRole(role),
      agree_terms: validateAgreeTerms(agreeTerms),
    };
    setErrors(newErrors);
    if (newErrors.role || newErrors.agree_terms) {
      return;
    }

    setSubmitting(true);
    const result = await register({ ...values, role: role, agree_terms: agreeTerms });
    setSubmitting(false);

    if (result.success) {
      navigate('/register/success', { state: { email: values.email.trim() } });
      return;
    }

    const error = result.error;
    // E2: email đã được đăng ký
    if (error.status === 409) {
      setEmailTaken(true);
      return;
    }
    // E1: backend báo lỗi field, nếu lỗi nằm ở bước 1 thì quay lại bước 1
    if (error.status === 422 && error.errors) {
      const backendErrors = toFieldErrors(error.errors);
      setErrors(backendErrors);
      const hasInfoError = INFO_FIELDS.some((field) => backendErrors[field]);
      if (hasInfoError) {
        setStep(1);
        return;
      }
    }
    setFormError(error.message);
  };

  let alert = null;
  if (emailTaken) {
    alert = (
      <Alert type="error">
        This email is already registered.{' '}
        <Link to="/login" className="link">Login</Link>
        {' or '}
        {/* TODO: đổi "#" thành trang Forgot password khi có */}
        <a href="#" className="link">Forgot password</a>?
      </Alert>
    );
  } else if (formError) {
    alert = <Alert type="error">{formError}</Alert>;
  }

  return (
    <AuthLayout activeStep={step}>
      <RegisterStepper currentStep={step} />

      {step === 1 && (
        <RegisterInfoStep
          values={values}
          errors={errors}
          onChange={handleChange}
          onBlur={handleBlur}
          onNext={handleNext}
          googleHref={getGoogleLoginUrl()}
        />
      )}

      {step === 2 && (
        <RegisterConfirmStep
          fullName={values.full_name.trim()}
          email={values.email.trim()}
          role={role}
          onRoleChange={handleRoleChange}
          agreeTerms={agreeTerms}
          onAgreeTermsChange={handleAgreeTermsChange}
          errors={errors}
          submitting={submitting}
          onSubmit={handleSubmit}
          onBack={handleBack}
          alert={alert}
        />
      )}
    </AuthLayout>
  );
}
