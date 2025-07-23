# backend/security.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from prisma import Prisma
from prisma.models import User

# "Authorization: Bearer <トークン>" というヘッダーを解釈するための部品
bearer_scheme = HTTPBearer()

# ログイン中のユーザー情報を取得するための依存性注入関数
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    token = credentials.credentials
    db = Prisma()
    await db.connect()

    # 提供されたトークンを持つユーザーをデータベースから探す
    user = await db.user.find_unique(where={"auth_token": token})

    await db.disconnect()

    if not user:
        # ユーザーが見つからなければ、認証エラーを返す
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効な認証トークンです",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user