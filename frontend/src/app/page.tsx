// frontend/src/app/page.tsx (新しいトップページ)
'use client';
import { Box, Button, Typography, Paper } from '@mui/material';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 8, p: 3, textAlign: 'center' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          匿名告白Webアプリ「Confession Bottle」
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          このアプリケーションは、生成AIとの協業によって構築されたポートフォリオです。
          以下のボタンより、アプリ本体へお進みください。
        </Typography>
        <Button component={Link} href="/app" variant="contained" size="large">
          アプリケーションを開始する
        </Button>
      </Paper>
    </Box>
  );
}