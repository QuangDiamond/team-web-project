import { z } from 'zod';
import { ENUMS } from '../../models/enums.js';

const requiredText = (label, max) =>
  z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (label, max) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .nullish()
    .transform((value) => (value ? value : null));

// Required date string, accepted in YYYY-MM-DD or ISO format.
const requiredDate = (label) =>
  z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), `${label} is not a valid date`)
    .transform((value) => new Date(value));

const experienceSchema = z
  .strictObject({
    title: requiredText('Experience title', 100),
    company: requiredText('Company', 100),
    start_date: requiredDate('Start date'),
    end_date: requiredDate('End date').nullable(),
  })
  .refine((item) => !item.start_date || !item.end_date || item.end_date >= item.start_date, {
    path: ['end_date'],
    message: 'End date must not be before start date',
  });

const educationSchema = z.strictObject({
  school: requiredText('School', 150),
  degree: requiredText('Degree', 100),
  graduation_year: z.coerce
    .number('Graduation year must be a number')
    .int('Graduation year must be an integer')
    .min(1950, 'Graduation year is too early')
    .max(2100, 'Graduation year is too late'),
  description: optionalText('Education description', 500),
});

const achievementSchema = z.strictObject({
  title: requiredText('Achievement title', 150),
  description: optionalText('Achievement description', 500),
});

const MAX_ITEMS = 10;

// Body lưu hồ sơ gia sư (UC hồ sơ). strictObject chặn user_id, is_complete, average_rating, avatar_url...
export const tutorProfileBodySchema = z.strictObject({
  headline: requiredText('Headline', 120),
  bio: requiredText('About you', 2000).refine((value) => value.split(/\s+/u).length <= 50, 'About you must be at most 50 words'),
  address: requiredText('Address', 255),
  is_address_hidden: z.boolean('Address visibility must be true or false').default(false),
  availability_status: z
    .enum(Object.values(ENUMS.TutorProfilesAvailabilityStatus), 'Availability must be AVAILABLE or NOT_AVAILABLE')
    .default(ENUMS.TutorProfilesAvailabilityStatus.AVAILABLE),
  experiences: z.array(experienceSchema).max(MAX_ITEMS, `At most ${MAX_ITEMS} experiences`).default([]),
  educations: z.array(educationSchema).max(MAX_ITEMS, `At most ${MAX_ITEMS} educations`).default([]),
  achievements: z.array(achievementSchema).max(MAX_ITEMS, `At most ${MAX_ITEMS} achievements`).default([]),
});
