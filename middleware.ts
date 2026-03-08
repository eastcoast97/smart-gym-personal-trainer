import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized({ token }) {
      return !!token;
    },
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/profile/:path*', '/admin/:path*', '/api/((?!auth).*)'],
};
