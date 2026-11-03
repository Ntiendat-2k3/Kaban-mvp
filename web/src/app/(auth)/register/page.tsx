'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/templates/auth-layout';
import { FormField } from '@/components/molecules/form-field';
import { Button } from '@/components/atoms/button';
import { Spinner } from '@/components/atoms/spinner';
import { registerSchema, type RegisterFormValues } from '@/lib/validations/auth';
import { apiClient } from '@/lib/api/client';
import { safeAuthRedirect } from '@/lib/auth-redirect';
import { useAuthStore } from '@/lib/store/use-auth-store';

function RegisterForm() {
  const router = useRouter();
  const redirectUrl = safeAuthRedirect(useSearchParams().get('redirect'));
  const setAuth = useAuthStore((state) => state.setAuth);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setGlobalError(null);
    try {
      const response = await apiClient.post('/auth/register', values);
      const data = response.data;

      if (data?.token && data?.user) setAuth(data.user, data.token);

      // Trở lại link mời sau đăng ký nếu người dùng đi từ lời mời.
      router.push(redirectUrl);
    } catch (err: any) {
      const responseError = err.response?.data?.error;
      if (responseError?.code === 'EMAIL_TAKEN' || err.response?.status === 409) {
        // Gán lỗi đúng tại trường email theo BR-02
        setError('email', {
          type: 'manual',
          message: 'Email đã được sử dụng',
        });
      } else {
        setGlobalError(responseError?.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Tạo tài khoản mới</h1>
          <p className="text-sm text-muted-foreground">Bắt đầu quản lý công việc cùng Kaban Flow</p>
        </div>

        {globalError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            label="Họ và tên"
            type="text"
            placeholder="Nguyễn Văn A"
            error={errors.name?.message}
            {...register('name')}
          />

          <FormField
            label="Email"
            type="email"
            placeholder="email@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <FormField
            label="Mật khẩu"
            type="password"
            placeholder="Tối thiểu 8 ký tự (chứa chữ và số)"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <Spinner size="sm" />
                <span>Đang xử lý...</span>
              </span>
            ) : (
              'Đăng ký'
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthLayout><div className="flex h-40 items-center justify-center"><Spinner /></div></AuthLayout>}>
      <RegisterForm />
    </Suspense>
  );
}
