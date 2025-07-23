// frontend/src/theme/theme.ts
'use client';

import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// アプリのカスタムテーマを定義
const theme = createTheme({
  // パレット（カラーパレット）の設定
  palette: {
    // --- ここを 'light' に変更！ ---
    mode: 'light', 
    primary: {
      main: '#1976d2', // ライトモードに適した、少し濃いめの青
    },
    secondary: {
      main: '#dc004e', // セカンダリカラー
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#f4f6f8', // 背景色を白に近いグレーに
      paper: '#ffffff',   // Paperコンポーネントの背景色を白に
    },
  },

  // シェイプ（形状）の設定はそのまま
  shape: {
    borderRadius: 16,
  },

  // コンポーネントごとの細かい設定もそのまま
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', 
        },
      },
    },
  },
});

export default theme;