// frontend/src/app/layout.tsx

import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme/theme'; // 先ほど作成したテーマをインポート

export const metadata: Metadata = {
  title: 'Confession Bottle',
  description: '匿名告白Webアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {/* Next.js用のMUI設定 */}
        <AppRouterCacheProvider>
          {/* 作成したテーマをアプリ全体に適用 */}
          <ThemeProvider theme={theme}>
            {/* MUIの基本的なスタイルをリセット・適用 */}
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}