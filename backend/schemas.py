# backend/schemas.py

import re # 正規表現モジュールをインポート

from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import List # Listをインポート

# --- ここから追記 ---
def validate_nickname(v: str) -> str:
    # 絵文字や特殊文字を許可しない正規表現
    if not re.fullmatch(r'[a-zA-Z0-9_ぁ-んァ-ヶ一-龠々ー\sＡ-Ｚａ-ｚ]*', v):
        raise ValueError('ニックネームに絵文字などの使用できない文字が含まれています。')
    return v
# --- ここまで追記 ---

# ユーザー作成時のリクエストボディ
class UserCreate(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=15)
    avatar_id: int
    # --- ここから追記 ---
    _validate_nickname = validator('nickname', allow_reuse=True)(validate_nickname)
    # --- ここまで追記 ---

# ユーザー作成後のレスポンスボディ
class UserCreateResponse(BaseModel):
    nickname: str
    avatar_id: int
    passphrase: str
    auth_token: str

# --- ここから追記 ---

# ログイン時のリクエストボディ
class UserLoginRequest(BaseModel):
    passphrase: str

# ログイン成功時のレスポンスボディ
class UserLoginResponse(BaseModel):
    nickname: str
    avatar_id: int
    auth_token: str # 新しい認証トークンを返す

# backend/schemas.py

# ... (既存のコード)

# --- ここから追記 ---

# 告白作成時のリクエストボディ
class ConfessionCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=280)

# 告白作成後のレスポンス (参考情報としてConfessionモデル全体を返す)
class ConfessionResponse(BaseModel):
    id: int
    content: str
    view_count: int
    status: str
    created_at: datetime
    user_id: int

# ボトル取得時のレスポ-ンスボディ
class BottleResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    # リアクションの情報も将来的にはここに追加する
    has_reacted: bool # --- この行を追記 ---

# --- ここから追記 ---

# リアクション作成時のリクエストボディ
class ReactionCreate(BaseModel):
    emoji_content: str

# リアクション作成後のレスポンス (参考)
class ReactionResponse(BaseModel):
    id: int
    emoji_content: str
    user_id: int
    confession_id: int


# --- ここから追記 ---

# リアクションしたユーザーの簡易情報
class ReactionUserResponse(BaseModel):
    nickname: str
    avatar_id: int

# 詳細なリアクション情報（誰が、いつ、どの絵文字で）
class ReactionDetailResponse(BaseModel):
    id: int
    emoji_content: str
    created_at: datetime
    user: ReactionUserResponse # ネストした構造

# マイ投稿一覧で使う、投稿ごとのレスポンスモデル
class MyConfessionResponse(BaseModel):
    id: int
    content: str
    view_count: int
    created_at: datetime
    reactions: List[ReactionDetailResponse] # リアクションのリスト
# --- ここから追記 ---

# 集計済みリアクションのレスポンスモデル
class AggregatedReactionResponse(BaseModel):
    emoji_content: str
    count: int

# ボトル取得時のレスポンスボディを修正
class BottleResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    has_reacted: bool
    reactions: List[AggregatedReactionResponse] # --- この行を追記 ---