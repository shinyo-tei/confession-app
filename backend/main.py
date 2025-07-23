# backend/main.py (最終確定版)

import secrets
import random
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from prisma import Prisma
from prisma.models import User # Userモデルを型として使うためにインポート

from typing import List # Listをインポート
from collections import Counter # Counterをインポート
from schemas import AggregatedReactionResponse, UserCreate, UserCreateResponse, UserLoginRequest, UserLoginResponse, ConfessionCreate, ConfessionResponse, BottleResponse, ReactionCreate, ReactionResponse, MyConfessionResponse  
from datetime import datetime, timedelta, timezone # 時間を扱うために追記
from security import get_current_user # 作成した認証関数をインポート

# --- グローバルなPrismaインスタンス ---
# アプリ全体でこのインスタンスを共有する
db = Prisma()

# --- データベース接続を管理するlifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Connecting to the database...")
    await db.connect()
    yield
    print("Disconnecting from the database...")
    await db.disconnect()

app = FastAPI(lifespan=lifespan)

# --- CORS設定 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 依存性注入用の関数 ---
# この関数が、各APIに接続済みのDBインスタンスを提供する
def get_db() -> Prisma:
    return db

# --- ユーティリティ関数 ---
def generate_secure_passphrase():
    words = [
    # Nature
    "sky", "sea", "moon", "star", "sun", "rain", "wind", "fire", "tree", "river",
    "cloud", "snow", "earth", "stone", "mountain", "flower", "grass", "leaf", "sand", "wave",

    # Animals
    "dog", "cat", "bird", "fish", "lion", "tiger", "bear", "horse", "wolf", "fox",

    # Colors
    "red", "blue", "green", "yellow", "black", "white", "orange", "purple", "brown", "gold",

    # Common Objects
    "book", "key", "door", "house", "car", "boat", "chair", "table", "phone", "clock",
    "light", "water", "food", "bread", "apple", "music", "paper", "pen", "ship", "road",

    # Concepts & Feelings
    "love", "hope", "dream", "peace", "time", "life", "happy", "smile", "power", "truth",
    "grace", "honor", "pride", "trust", "story", "sound", "space", "spirit", "world", "valor",

    # Actions
    "run", "walk", "jump", "fly", "swim", "read", "write", "sing", "dance", "play",
    "work", "sleep", "think", "speak", "listen", "watch", "build", "break", "give", "take"
]
    parts = [random.choice(words) for _ in range(3)]
    parts.append(str(secrets.randbelow(1000)))
    random.shuffle(parts)
    return "-".join(parts)

def generate_auth_token():
    return secrets.token_hex(32)

# --- APIエンドポイント ---
@app.get("/")
def read_root():
    return {"message": "Confession App Backend"}

@app.post("/users", response_model=UserCreateResponse)
async def create_user(user_data: UserCreate, db: Prisma = Depends(get_db)):
    # ニックネームが既に使用されているかチェック
    existing_user = await db.user.find_first(where={"nickname": user_data.nickname})
    if existing_user:
        raise HTTPException(status_code=409, detail="このニックネームは既に使用されています。")

    # Prismaを使って新しいユーザーを作成
    new_user = await db.user.create(
        data={
            "nickname": user_data.nickname,
            "avatar_id": user_data.avatar_id,
            "passphrase": generate_secure_passphrase(),
            "auth_token": generate_auth_token(),
        }
    )
    return new_user

# --- ここから追記 ---
@app.post("/login", response_model=UserLoginResponse)
async def login_with_passphrase(login_data: UserLoginRequest, db: Prisma = Depends(get_db)):
    # 合言葉が一致するユーザーを検索
    user = await db.user.find_unique(where={"passphrase": login_data.passphrase})

    if not user:
        raise HTTPException(status_code=404, detail="合言葉が正しくありません。")

    # 新しい認証トークンを生成
    new_auth_token = generate_auth_token()

    # データベースの認証トークンを新しいものに更新
    updated_user = await db.user.update(
        where={"id": user.id},
        data={"auth_token": new_auth_token}
    )

    return updated_user
# --- ここから追記 ---
@app.post("/confessions", response_model=ConfessionResponse)
async def create_confession(
    confession_data: ConfessionCreate,
    current_user: User = Depends(get_current_user), # 認証チェック！
    db: Prisma = Depends(get_db)
):
    # 24時間に1回しか投稿できないようにする制限 (元のコードから流用)
    twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    last_post = await db.confession.find_first(
        where={
            "user_id": current_user.id,
            "created_at": {"gte": twenty_four_hours_ago}
        },
        order={"created_at": "desc"}
    )
    if last_post:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="新しい投稿は24時間に1回までです。"
        )

    # 新しい告白をデータベースに作成
    new_confession = await db.confession.create(
        data={
            "content": confession_data.content,
            "user_id": current_user.id, # ログインユーザーのIDを紐付ける
        }
    )
    return new_confession

# --- ここから追記 ---
@app.get("/bottle", response_model=BottleResponse)
async def get_random_bottle(
    current_user: User = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    # --- 1. 対象を絞るための条件を定義 ---
    where_conditions = {
        "status": "active", # "漂流中"のボトルのみを対象に
        "user_id": {"not": current_user.id},
    }

    # 自分が閲覧済みのIDは除外する
    viewed_histories = await db.viewhistory.find_many(
        where={"user_id": current_user.id}
    )
    if viewed_histories:
        viewed_ids = [history.confession_id for history in viewed_histories]
        where_conditions["NOT"] = {"id": {"in": viewed_ids}}

    # --- 2. 条件に合う投稿の総数を取得 ---
    count = await db.confession.count(where=where_conditions)

    if count == 0:
        raise HTTPException(status_code=404, detail="海は静かなようです…新しいボトルは見つかりませんでした。")

    # --- 3. ランダムな位置の1件だけを取得 ---
    random_offset = random.randint(0, count - 1)
    bottles = await db.confession.find_many(
        where=where_conditions,
        order={"view_count": "asc"},
        skip=random_offset,
        take=1
    )

    # find_manyはリストを返すので、最初の要素を取り出す
    bottle = bottles[0]

    # --- 4. 閲覧履歴の作成と、閲覧数の更新 ---
    await db.viewhistory.create(
        data={"user_id": current_user.id, "confession_id": bottle.id}
    )
    updated_confession = await db.confession.update(
        where={"id": bottle.id},
        data={"view_count": {"increment": 1}},
        include={"reactions": True} # リアクション情報も一緒に取得
    )

    # --- 5. アーカイブ判定 ---
    ARCHIVE_THRESHOLD = 50 # 閲覧回数が50に達したらアーカイブ
    if updated_confession.view_count >= ARCHIVE_THRESHOLD:
        await db.confession.update(
            where={"id": updated_confession.id},
            data={"status": "archived"}
        )
        print(f"Confession {updated_confession.id} has been archived.")

    # --- 6. レスポンスの作成 ---
    user_reaction = await db.reaction.find_unique(
        where={"user_id_confession_id": {"user_id": current_user.id, "confession_id": updated_confession.id}}
    )

    emoji_counts = Counter(r.emoji_content for r in updated_confession.reactions)
    aggregated_reactions = [
        AggregatedReactionResponse(emoji_content=emoji, count=count)
        for emoji, count in emoji_counts.items()
    ]

    return BottleResponse(
        id=updated_confession.id,
        content=updated_confession.content,
        created_at=updated_confession.created_at,
        has_reacted=True if user_reaction else False,
        reactions=aggregated_reactions
    )

# --- ここから追記 ---
@app.post("/confessions/{confession_id}/reactions", response_model=ReactionResponse)
async def create_reaction(
    confession_id: int,
    reaction_data: ReactionCreate,
    current_user: User = Depends(get_current_user), # 認証必須
    db: Prisma = Depends(get_db)
):
    # 既にリアクション済みでないかチェック
    # (schema.prismaの@@unique制約があるので、DBレベルでもエラーにはなるが、
    #  事前にチェックして分かりやすいエラーを返すのが親切)
    existing_reaction = await db.reaction.find_unique(
        where={"user_id_confession_id": {"user_id": current_user.id, "confession_id": confession_id}}
    )
    if existing_reaction:
        raise HTTPException(status_code=409, detail="この投稿には既にリアクション済みです。")

    # 新しいリアクションをデータベースに作成
    new_reaction = await db.reaction.create(
        data={
            "emoji_content": reaction_data.emoji_content,
            "user_id": current_user.id,
            "confession_id": confession_id,
        }
    )
    return new_reaction

# --- ここから追記 ---
@app.get("/users/me/confessions", response_model=List[MyConfessionResponse])
async def get_my_confessions(
    current_user: User = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    # ログインユーザーの投稿を、リアクションとリアクションしたユーザー情報を含めて取得
    my_confessions = await db.confession.find_many(
        where={"user_id": current_user.id},
        order={"created_at": "desc"},
        # skipとtakeを削除
        include={
            "reactions": {
                "include": {
                    "user": True
                }
            }
        }
    )
    return my_confessions