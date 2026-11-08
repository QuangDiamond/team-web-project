import { Check } from 'lucide-react';

const STEPS = ['Your Info', 'Confirm'];

// Thanh tiến trình 2 bước của màn đăng ký: currentStep = 1 | 2
export default function RegisterStepper({ currentStep }) {
  return (
    <ol className="register-stepper" aria-label="Registration progress">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        let className = 'stepper-item';
        if (isDone) {
          className = 'stepper-item is-done';
        } else if (isCurrent) {
          className = 'stepper-item is-current';
        }

        return (
          <li key={label} className={className} aria-current={isCurrent ? 'step' : undefined}>
            <span className="stepper-circle">
              {isDone ? <Check size={14} aria-hidden="true" /> : stepNumber}
            </span>
            <span className="stepper-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
