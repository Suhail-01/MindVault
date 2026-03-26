import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/auth';
import { ModalProvider } from '@/lib/modals';
import { FirebaseConnectionTest } from '@/components/FirebaseConnectionTest';
import { LoadingWrapper } from '@/components/LoadingWrapper';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'MindVault - Your Second Brain',
  description: 'A Personal Knowledge Management app powered by AI.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-white font-sans text-gray-900">
        <AuthProvider>
          <LoadingWrapper>
            <ModalProvider>
              <FirebaseConnectionTest />
              {children}
            </ModalProvider>
          </LoadingWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
