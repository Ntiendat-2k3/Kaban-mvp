/** Chỉ cho phép chuyển hướng nội bộ sau đăng nhập hoặc đăng ký. */
export function safeAuthRedirect(redirect: string | null): string {
  return redirect?.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('\\')
    ? redirect
    : '/boards';
}
