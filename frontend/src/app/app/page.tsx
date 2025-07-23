// frontend/src/app/page.tsx (修正後)
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Button, TextField, Typography, CircularProgress, Paper, Alert, Stack, Snackbar, Chip } from '@mui/material';

// APIサーバーのURL
const API_URL = 'http://localhost:8000';

// ボトルの型を定義
interface Bottle {
  id: number;
  content: string;
  created_at: string;
  has_reacted: boolean; // --- この行を追記 ---
}

// 型定義を追加
interface ReactionUser {
    nickname: string;
    avatar_id: number;
}
interface ReactionDetail {
    id: number;
    emoji_content: string;
    created_at: string;
    user: ReactionUser;
}
interface MyConfession {
    id: number;
    content: string;
    view_count: number;
    created_at: string;
    reactions: ReactionDetail[];
}

// 新しい型定義を追加
interface AggregatedReaction {
    emoji_content: string;
    count: number;
}

interface Bottle {
    id: number;
    content: string;
    created_at: string;
    has_reacted: boolean;
    reactions: AggregatedReaction[]; // 型を修正
}

export default function Home() {
  const theme = useTheme();
  // --- 状態管理 ---
  const [appState, setAppState] = useState('loading');
  const [nickname, setNickname] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [postError, setPostError] = useState(''); // これを投稿エラー用に新設
  const [confessionContent, setConfessionContent] = useState('');
  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [hasReacted, setHasReacted] = useState(false); // --- この行を追記 ---
  const [myPosts, setMyPosts] = useState<MyConfession[]>([]); // 投稿リスト用のstate


  const reactionOptions = [
    { emoji: '❤️', label: 'そっとリアクション' },
    { emoji: '🙏', label: 'なんか、わかるよ' },
    { emoji: '💪', label: '応援してる' },
    { emoji: '😊', label: '共感できた' },
    { emoji: '😢', label: '胸が痛い' },
  ];
    // --- ここからSnackbar用のstateを追記 ---
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  // 'success' | 'error' | 'info' | 'warning' のいずれかを指定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // --- 自動ログイン処理 ---
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAppState('main');
    } else {
      setAppState('register');
    }
  }, []);
  
  // --- メイン画面になったら最初のボトルを取得 ---
  useEffect(() => {
    if (appState === 'main') {
        handleGetBottle();
    }
  }, [appState]);

  // --- イベントハンドラ ---
  const handleRegister = async () => {
    if (!nickname.trim()) {
      setError('ニックネームを入力してください。');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname, avatar_id: 1 }),
      });
      if (!response.ok) {
        const errData = await response.json();
        // 422エラーの場合、エラーメッセージはdetail[0].msgに入っている
        if (response.status === 422 && errData.detail && Array.isArray(errData.detail)) {
            // "ニックネームに使用できない文字が含まれています。" を取り出す
            const validationErrorMessage = errData.detail[0].msg.split(', ')[1];
            throw new Error(validationErrorMessage || '入力内容に誤りがあります。');
        }
        // それ以外のエラーの場合
        throw new Error(errData.detail || '登録に失敗しました。');
      }
      const data = await response.json();
      setPassphrase(data.passphrase);
      localStorage.setItem('authToken', data.auth_token);
      setAppState('passphrase');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = async () => {
    if (!passphrase.trim()) {
        setError('合言葉を入力してください。');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passphrase: passphrase }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || '引き継ぎに失敗しました。');
        }
        const data = await response.json();
        localStorage.setItem('authToken', data.auth_token);
        setAppState('main');
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('予期せぬエラーが発生しました。');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handlePostConfession = async () => {
    if (!confessionContent.trim()) {
      setError('告白内容を入力してください。');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('認証トークンが見つかりません。再ログインしてください。');
      const response = await fetch(`${API_URL}/confessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: confessionContent }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || '投稿に失敗しました。');
      }
      setSnackbarMessage('あなたの告白をボトルに詰めて、海に流しました。');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setConfessionContent(''); // 入力欄をクリア
    } catch (err) {
      if (err instanceof Error) setPostError(err.message);
      else setPostError('予期せぬエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostReaction = async (emoji: string) => {
      if (!bottle) return; // ボトルがない場合は何もしない

      // リアクションボタンを即座に無効化するなどのUI更新はここに書ける

      try {
          const token = localStorage.getItem('authToken');
          if (!token) throw new Error('認証トークンが見つかりません。');

          const response = await fetch(`${API_URL}/confessions/${bottle.id}/reactions`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ emoji_content: emoji }),
          });

          if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.detail || 'リアクションに失敗しました。');
          }

          // ここではシンプルにアラートのみ。後でUIをリッチにできる。
          setHasReacted(true); // --- この行を追記 ---
          // --- ↓ここからSnackbar処理 ---
          setSnackbarMessage(`「${emoji}」の想いを届けました。`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
      } catch (err) {
          const message = err instanceof Error ? err.message : '予期せぬエラーが発生しました。';
          setSnackbarMessage(message);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
      }
  };

  const handleGetBottle = async () => {
      setIsLoading(true);
      setError('');
      setBottle(null);
      try {
          const token = localStorage.getItem('authToken');
          if (!token) throw new Error('認証トークンが見つかりません。');

          // ↓ここで 'response' を宣言
          const response = await fetch(`${API_URL}/bottle`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });

          // ↓ここで 'response' を使用
          if (response.status === 404) {
              setError('海は静かなようです…新しいボトルは見つかりませんでした。');
              return;
          }

          // ↓ここで 'response' を使用
          if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.detail || 'ボトルの取得に失敗しました。');
          }
          
          // ↓ここで 'response' を使用
          const data = await response.json();
          setBottle(data);
          setHasReacted(data.has_reacted);

      } catch (err) {
          if (err instanceof Error) setError(err.message);
          else setError('予期せぬエラーが発生しました。');
      } finally {
          setIsLoading(false);
      }
  };

  const handleGetMyPosts = async () => {
      setIsLoading(true);
      setError('');
      try {
          const token = localStorage.getItem('authToken');
          if (!token) throw new Error('認証トークンが見つかりません。');

          const response = await fetch(`${API_URL}/users/me/confessions`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('投稿の取得に失敗しました。');

          const data = await response.json();
          setMyPosts(data);
          setAppState('my-posts'); // データを取得したらページを切り替え
      } catch (err) {
          // Snackbarでエラーを通知する処理を追記
          const message = err instanceof Error ? err.message : '投稿の取得に失敗しました。';
          setSnackbarMessage(message);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          // エラーが起きたらメイン画面に戻る
          setAppState('main');
      } finally {
          setIsLoading(false);
      }
  };

  // --- UIの描画 ---
  if (appState === 'loading') {
    return <CircularProgress />;
  }
  
  if (appState === 'register') {
    return (
        <Box sx={{ maxWidth: 400, margin: 'auto', mt: 8, p: 3, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>新しくはじめる</Typography>
            <TextField
              label="ニックネーム (15文字以内)"
              variant="outlined"
              fullWidth
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              inputProps={{ maxLength: 15 }}
              sx={{ mb: 2 }}
              error={!!error && error.includes('ニックネーム')} // エラーメッセージに「ニックネーム」が含まれていたら赤くする
              helperText={error && error.includes('ニックネーム') ? error : ''} // ヘルパーテキストとしてエラーを表示

            />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'はじめる'}
            </Button>
            <Button sx={{ mt: 2 }} onClick={() => { setAppState('login'); setError(''); }}>
                アカウントを引き継ぐ方はこちら
            </Button>
        </Box>
    );
  }

  if (appState === 'login') {
      return (
          <Box sx={{ maxWidth: 400, margin: 'auto', mt: 8, p: 3, textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom>アカウント引き継ぎ</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  保管した「合言葉」を入力してください
              </Typography>
              <TextField
                  label="合言葉"
                  variant="outlined"
                  fullWidth
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  sx={{ mb: 2 }}
              />
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleLogin}
                  disabled={isLoading}
              >
                  {isLoading ? <CircularProgress size={24} /> : '引き継ぐ'}
              </Button>
              <Button sx={{ mt: 2 }} onClick={() => { setAppState('register'); setError(''); }}>
                  新しくはじめる方はこちら
              </Button>
          </Box>
      );
  }

  if (appState === 'passphrase') {
    return (
      <Box sx={{ maxWidth: 500, margin: 'auto', mt: 8, p: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>アカウントが作成されました！</Typography>
        <Alert severity="warning" sx={{ textAlign: 'left', mb: 3 }}>
          <strong>重要:</strong> この「合言葉」はアカウント引き継ぎに必要です。<strong>再発行はできません。</strong>必ず安全な場所にスクリーンショットやメモで保管してください。
        </Alert>
        <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h5" component="code" color="primary">
            {passphrase}
          </Typography>
        </Paper>
        <Button variant="contained" size="large" onClick={() => setAppState('main')}>
          アプリを始める
        </Button>
      </Box>
    );
  }

  if (appState === 'main') {
    return (
        <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4, p: 2 }}>
            {/* --- ↓ ここにSnackbarを追加 ↓ --- */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000} // 4秒後に自動で閉じる
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // 画面下部中央に表示
            >
                {/* Alertを中に入れると、色付きの綺麗な通知になる */}
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>ボトルを流す</Typography>
                <TextField
                    label="ここに告白を入力... (280文字以内)"
                    multiline
                    rows={4}
                    fullWidth
                    variant="outlined"
                    value={confessionContent}
                    onChange={(e) => setConfessionContent(e.target.value)}
                    inputProps={{ maxLength: 280 }}
                />
                {postError && <Alert severity="error" sx={{ mt: 2 }}>{postError}</Alert>}
                {error && appState !== 'main' && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handlePostConfession}
                    disabled={isLoading && !bottle}
                >
                     {isLoading && !bottle ? <CircularProgress size={24} /> : '海に流す'}
                </Button>
            </Paper>

            <Paper elevation={2} sx={{ p: 3 }}>
                 <Typography variant="h5" gutterBottom>ボトルを拾う</Typography>
                  <Paper variant="outlined" sx={{
                      minHeight: 150,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                  }}>             
                    {isLoading && !bottle && <CircularProgress />}
                    {!isLoading && bottle && (
                        <>
                            <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', width: '100%', textAlign: 'left'}}>{bottle.content}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2, textAlign: 'right', width: '100%' }}>
                                {new Date(bottle.created_at).toLocaleString('ja-JP')}
                            </Typography>
                        </>
                    )}
                    {!isLoading && !bottle && error && <Alert severity="info" sx={{width: '100%'}}>{error}</Alert>}
                 </Paper>
                {/* --- ここから集計リアクション表示部分を追記 --- */}
                {bottle && bottle.reactions.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2, justifyContent: 'center' }}>
                        {bottle.reactions.map((reaction) => (
                            <Chip
                                key={reaction.emoji_content}
                                icon={<Typography sx={{ lineHeight: 1 }}>{reaction.emoji_content}</Typography>}
                                label={reaction.count}
                                size="small"
                            />
                        ))}
                    </Box>
                )}
                {/* --- ここからリアクションボタン部分を追記 --- */}
                {bottle && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                        {reactionOptions.map((reaction) => (
                            <Button
                                key={reaction.label}
                                variant="outlined"
                                startIcon={<Typography sx={{ fontSize: '1.5rem' }}>{reaction.emoji}</Typography>}
                                onClick={() => handlePostReaction(reaction.emoji)}
                                sx={{ justifyContent: 'flex-start', p: 1 }}
                                // hasReactedがtrueなら、全てのボタンを無効化する
                                disabled={hasReacted}
                            >
                                {reaction.label}
                            </Button>
                        ))}
                        {/* --- ここから追記 --- */}
                        {hasReacted && (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                                このボトルにはリアクション済みです。
                            </Typography>
                        )}
                    </Stack>
                )}
                <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ mt: 1 }} // マージンを調整
                    onClick={handleGetBottle}
                    disabled={isLoading}
                >
                    {isLoading ? '探しています…' : '次のボトルを拾う'}
                </Button>
            </Paper>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                <Button variant="text" onClick={handleGetMyPosts}>
                    マイ投稿一覧へ
                </Button>
                <Button onClick={() => {
                    localStorage.removeItem('authToken');
                    window.location.reload();
                }}>
                    ログアウト
                </Button>
            </Stack>
        </Box>
    );
  }

  if (appState === 'my-posts') {
      return (
          <Box sx={{ maxWidth: 700, margin: 'auto', mt: 4, p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4">マイ投稿一覧</Typography>
                  <Button onClick={() => setAppState('main')}>海に戻る</Button>
              </Box>

              {isLoading && <CircularProgress />}

              <Stack spacing={2}>
                  {myPosts.length === 0 && !isLoading && (
                      <Typography>まだ投稿がありません。</Typography>
                  )}
                  {myPosts.map((post) => (
                      <Paper key={post.id} elevation={2} sx={{ p: 2 }}>
                          <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{post.content}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                              {new Date(post.created_at).toLocaleString('ja-JP')} ・ {post.view_count}回閲覧
                          </Typography>
                          <Box sx={{ mt: 1, pl: 1 }}>
                              {post.reactions.length === 0 ? (
                                  <Typography variant="body2" color="text.secondary">まだリアクションはありません。</Typography>
                              ) : (
                                  post.reactions.map((reaction) => (
                                      <Chip 
                                          key={reaction.id}
                                          icon={<Typography>{reaction.emoji_content}</Typography>}
                                          label={reaction.user.nickname}
                                          variant="outlined"
                                          size="small"
                                          sx={{ mr: 0.5, mb: 0.5 }}
                                      />
                                  ))
                              )}
                          </Box>
                      </Paper>
                  ))}
              </Stack>
          </Box>
      );
  }
  
  return null;
}