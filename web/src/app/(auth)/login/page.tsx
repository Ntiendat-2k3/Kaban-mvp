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
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { apiClient } from '@/lib/api/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/boards';

  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setGlobalError(null);
    try {
      const response = await apiClient.post('/auth/login', values);
      const data = response.data;

      // Lưu token vào localStorage theo đúng SRS §4
      if (data?.token) {
        localStorage.setItem('trello.token', data.token);
      }

      // Chuyển hướng tới URL dự định hoặc mặc định /boards
      router.push(redirectUrl);
    } catch (err: any) {
      // Theo BR-03: Sai email hoặc sai mật khẩu chỉ hiện một thông báo chung duy nhất
      setGlobalError('Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Đăng nhập tài khoản</h1>
        <p className="text-sm text-muted-foreground">
          Nhập email và mật khẩu của bạn để truy cập không gian làm việc
        </p>
      </div>

      {globalError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="login-email"
          label="Email"
          type="email"
          placeholder="user@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <FormField
          id="login-password"
          label="Mật khẩu"
          type="password"
          placeholder="••••••••"
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
            'Đăng nhập'
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex h-40 items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
