import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignupSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    timezone: z.string().min(1, 'Timezone is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const VerifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const VerifyResetOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const ResetPasswordSchema = z
  .object({
    email: z.string().email(),
    resetToken: z.string(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const SetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// ─── Workspace Schemas ───────────────────────────────────────────────────────

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'),
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
});

export const BusinessProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(150),
  brandSlug: z.string().optional(),
  industry: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  country: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  defaultLanguage: z.string().optional(),
  brandTone: z.string().optional(),
  targetAudience: z.string().optional(),
  services: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  preferredPlatforms: z.array(z.string()).optional(),
  postingFrequency: z.string().optional(),
  approvalRequired: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
  onboardingCompletedAt: z.string().optional().or(z.null()),
});

export const UpdateBusinessProfileSchema = BusinessProfileSchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined && value !== null && value !== ''),
  { message: 'At least one field is required for update' },
);

export const KeywordSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(120),
  keywordType: z.string().min(1, 'Keyword type is required'),
});

export const ReplaceKeywordsSchema = z.object({
  keywords: z.array(KeywordSchema),
});

export const CompleteOnboardingSchema = z.object({
  confirm: z.boolean(),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
export type BusinessProfileInput = z.infer<typeof BusinessProfileSchema>;
export type UpdateBusinessProfileInput = z.infer<typeof UpdateBusinessProfileSchema>;
export type KeywordInput = z.infer<typeof KeywordSchema>;
export type ReplaceKeywordsInput = z.infer<typeof ReplaceKeywordsSchema>;
export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingSchema>;

// ─── Posts Schemas ───────────────────────────────────────────────────────────

export const CreatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(180),
  captionText: z.string().max(5000).optional().or(z.literal('')),
  publishMode: z.enum(['manualDraft', 'scheduled']).default('manualDraft'),
  sourceTimezone: z.string().min(1, 'Timezone is required').default('UTC'),
  scheduledFor: z.string().datetime().optional().or(z.null()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const UpdatePostSchema = CreatePostSchema.partial().refine(
  (data) =>
    Object.values(data).some((value) => value !== undefined),
  { message: 'At least one field is required for update' },
);

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
