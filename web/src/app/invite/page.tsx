'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { AuthLayout } from '@/components/templates/auth-layout';
import { Button } from '@/components/atoms/button';
import { Spinner } from '@/components/atoms/spinner';
import { acceptBoardInvitation, getBoardInvitation } from '@/lib/api/invitations';
import { useAuthStore } from '@/lib/store/use-auth-store';

function InvitationContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useSearchParams().get('token') || '';
  const redirectUrl = `/invite?token=${encodeURIComponent(token)}`;
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
  const registerUrl = `/register?redirect=${encodeURIComponent(redirectUrl)}`;
  const { user, isInitialized, isLoading: authLoading, initAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) void initAuth();
  }, [initAuth, isInitialized]);

  const invitation = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => getBoardInvitation(token),
    enabled: /^[A-Za-z0-9_-]{43}$/.test(token),
    retry: false,
  });
  const accept = useMutation({
    mutationFn: () => acceptBoardInvitation(token),
    onSuccess: ({ boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      router.replace(`/b/${boardId}`);
    },
  });

  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token) || invitation.isError) {
    return <p role="alert" className="text-sm text-destructive">Link mời không hợp lệ hoặc đã hết hạn. Hãy nhờ chủ bảng gửi lại.</p>;
  }
  if (invitation.isLoading || authLoading || !isInitialized) {
    return <div className="flex h-32 items-center justify-center"><Spinner /></div>;
  }
  const info = invitation.data;
  if (!info) return null;
  const sameEmail = user?.email.trim().toLowerCase() === info.email;
  const acceptError = isAxiosError(accept.error)
    ? (accept.error.response?.data as { error?: { message?: string } })?.error?.message
    : undefined;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Lời mời tham gia bảng</h1>
        <p className="text-sm text-muted-foreground">
          Bạn được mời vào bảng <strong className="text-foreground">{info.boardName}</strong> bằng email {info.email}.
        </p>
      </div>

      {!user ? (
        <div className="flex gap-2">
          <Button asChild className="flex-1"><Link href={loginUrl}>Đăng nhập</Link></Button>
          <Button asChild variant="outline" className="flex-1"><Link href={registerUrl}>Đăng ký</Link></Button>
        </div>
      ) : !sameEmail ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-destructive">
            Bạn đang đăng nhập bằng {user.email}. Hãy dùng đúng email {info.email} để tham gia.
          </p>
          <Button variant="outline" onClick={() => { clearAuth(); router.push(loginUrl); }}>
            Đăng nhập tài khoản khác
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Button className="w-full" disabled={accept.isPending} onClick={() => accept.mutate()}>
            {accept.isPending ? <Spinner size="sm" /> : 'Tham gia bảng'}
          </Button>
          {accept.isError && <p role="alert" className="text-sm text-destructive">{acceptError || 'Không thể tham gia bảng. Vui lòng thử lại.'}</p>}
        </div>
      )}
    </div>
  );
}

export default function InvitationPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="flex h-32 items-center justify-center"><Spinner /></div>}>
        <InvitationContent />
      </Suspense>
    </AuthLayout>
  );
}
