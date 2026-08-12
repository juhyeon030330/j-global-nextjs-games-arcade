"use client";

import { useEffect, useState, use } from "react";
import {
  ChevronRight,
  Play,
  Send,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  UserPlus,
  CornerDownRight,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import Link from "next/link";

const HOUSES = ["A", "B", "C", "D"];

interface Game {
  slug: string;
  name: string;
  name_ja?: string;
  description?: string;
  description_ja?: string;
  code?: string;
}

interface Comment {
  id: string;
  user_nickname: string;
  comment: string;
  created_at: string;
  parent_id?: string | null;
  replies?: Comment[];
}

// Recursively builds nested comment tree from flat DB comments
function buildCommentTree(flatComments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment>();
  const roots: Comment[] = [];

  flatComments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  flatComments.forEach((comment) => {
    const node = commentMap.get(comment.id);
    if (!node) return;

    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// Recursively calculates total nested replies
function countAllReplies(comment: Comment): number {
  if (!comment.replies || comment.replies.length === 0) return 0;
  return comment.replies.reduce(
    (acc, child) => acc + 1 + countAllReplies(child),
    0,
  );
}

// Sub-component for rendering inline reply forms
function SubReplyBox({
  lang,
  parentId,
  gameSlug,
  nickname,
  onSuccess,
  onCancel,
}: {
  lang: "ja" | "en";
  parentId: string;
  gameSlug: string;
  nickname: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !text.trim()) return;

    setSubmitting(true);
    await supabase.from("game_comments").insert({
      game_slug: gameSlug,
      user_nickname: nickname,
      comment: text.trim(),
      parent_id: parentId,
    });

    setSubmitting(false);
    setText("");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={lang === "ja" ? "返信を入力..." : "Write a reply..."}
        rows={2}
        required
        className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-[#1f497c] resize-none"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          {lang === "ja" ? "キャンセル" : "Cancel"}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-[#1f497c] text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-800 disabled:opacity-50"
        >
          <Send className="w-3 h-3" />
          <span>{lang === "ja" ? "返信する" : "Reply"}</span>
        </button>
      </div>
    </form>
  );
}

// Tree Item Component with connectors & collapsible support
function CommentThreadItem({
  comment,
  nickname,
  lang,
  gameSlug,
  depth = 0,
  parentHovered = false,
  initialFolded = false,
  editingCommentId,
  editCommentText,
  setEditCommentText,
  setEditingCommentId,
  handleStartEdit,
  handleSaveEdit,
  handleDeleteComment,
  onRefresh,
}: {
  comment: Comment;
  nickname: string;
  lang: "ja" | "en";
  gameSlug: string;
  depth?: number;
  parentHovered?: boolean;
  initialFolded?: boolean;
  editingCommentId: string | null;
  editCommentText: string;
  setEditCommentText: (val: string) => void;
  setEditingCommentId: (id: string | null) => void;
  handleStartEdit: (c: Comment) => void;
  handleSaveEdit: (commentId: string) => void;
  handleDeleteComment: (commentId: string) => void;
  onRefresh: () => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isFolded, setIsFolded] = useState(initialFolded || depth >= 2);
  const [isLineHovered, setIsLineHovered] = useState(false);

  const isOwner = nickname && comment.user_nickname === nickname;
  const isEditing = editingCommentId === comment.id;
  const subReplies = comment.replies || [];
  const totalNested = countAllReplies(comment);
  const isHighlighted = isLineHovered || parentHovered;

  const handleFold = () => {
    setIsLineHovered(false);
    setIsFolded(true);
  };

  const handleUnfold = () => {
    setIsLineHovered(false);
    setIsFolded(false);
  };

  return (
    <div className="relative pt-1">
      {/* MAIN COMMENT BODY */}
      <div className="relative flex gap-2 items-start">
        {/* Avatar badge */}
        <div className="relative flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-[#1f497c] text-white font-bold text-[10px] uppercase z-10">
          {comment.user_nickname.slice(0, 2)}
        </div>

        {/* PARENT TRUNK LINE */}
        {subReplies.length > 0 && !isFolded && (
          <div
            onClick={handleFold}
            onMouseEnter={() => setIsLineHovered(true)}
            onMouseLeave={() => setIsLineHovered(false)}
            className="absolute left-[12px] top-[12px] bottom-0 w-3 -translate-x-1/2 z-0 cursor-pointer flex justify-center"
            title={lang === "ja" ? "クリックして非表示" : "Click to fold"}
          >
            <div
              className={`h-full transition-all duration-150 ${
                isHighlighted ? "w-1 bg-[#1f497c]" : "w-0.5 bg-slate-300/60"
              }`}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 pt-0.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[#1f497c]">
                {comment.user_nickname}
              </span>
              {isOwner && (
                <span className="bg-sky-100 text-[#1f497c] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Content / Edit Mode */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editCommentText}
                onChange={(e) => setEditCommentText(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-[#1f497c] resize-none"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingCommentId(null)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>{lang === "ja" ? "キャンセル" : "Cancel"}</span>
                </button>
                <button
                  onClick={() => handleSaveEdit(comment.id)}
                  className="bg-[#1f497c] text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-800"
                >
                  <Check className="w-3 h-3" />
                  <span>{lang === "ja" ? "保存" : "Save"}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-700 leading-relaxed mb-2 whitespace-pre-wrap">
                {comment.comment}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                {nickname && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-[#1f497c] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    <span>
                      {isReplying
                        ? lang === "ja"
                          ? "キャンセル"
                          : "Cancel"
                        : lang === "ja"
                          ? "返信"
                          : "Reply"}
                    </span>
                  </button>
                )}

                {isOwner && (
                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      onClick={() => handleStartEdit(comment)}
                      className="text-[11px] text-slate-500 hover:text-[#1f497c] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{lang === "ja" ? "編集" : "Edit"}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{lang === "ja" ? "削除" : "Delete"}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Sub-reply Box */}
          {isReplying && (
            <SubReplyBox
              lang={lang}
              parentId={comment.id}
              gameSlug={gameSlug}
              nickname={nickname}
              onSuccess={() => {
                setIsReplying(false);
                onRefresh();
              }}
              onCancel={() => setIsReplying(false)}
            />
          )}
        </div>
      </div>

      {/* FOLDED STATE DESIGN */}
      {subReplies.length > 0 && isFolded && (
        <div className="mt-2 ml-3 flex items-center gap-2">
          <button
            onClick={handleUnfold}
            className="group/unfold flex items-center gap-2 py-1 px-1.5 rounded-lg text-slate-500 hover:text-[#1f497c] transition-colors cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-slate-100 group-hover/unfold:bg-[#1f497c] group-hover/unfold:text-white flex items-center justify-center transition-all shrink-0">
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-semibold text-slate-600 group-hover/unfold:text-[#1f497c]">
              {totalNested}{" "}
              {lang === "ja"
                ? "件の返信を表示"
                : totalNested === 1
                  ? "more reply"
                  : "more replies"}
            </span>
          </button>
        </div>
      )}

      {/* UNFOLDED CHILD REPLIES */}
      {subReplies.length > 0 && !isFolded && (
        <div className="relative">
          {subReplies.map((child, idx) => {
            const isLast = idx === subReplies.length - 1;

            return (
              <div key={child.id} className="relative pl-6">
                {/* VERTICAL SEGMENT */}
                <div
                  onClick={handleFold}
                  onMouseEnter={() => setIsLineHovered(true)}
                  onMouseLeave={() => setIsLineHovered(false)}
                  className={`absolute left-[12px] top-0 ${
                    isLast
                      ? isHighlighted
                        ? "h-[18px]"
                        : "h-[16px]"
                      : "bottom-0"
                  } w-3 -translate-x-1/2 z-0 cursor-pointer flex justify-center`}
                  title={lang === "ja" ? "クリックして非表示" : "Click to fold"}
                >
                  <div
                    className={`h-full transition-all duration-150 ${
                      isHighlighted
                        ? "w-1 bg-[#1f497c]"
                        : "w-0.5 bg-slate-300/60"
                    }`}
                  />
                </div>

                {/* HORIZONTAL CONNECTOR */}
                <div
                  onClick={handleFold}
                  onMouseEnter={() => setIsLineHovered(true)}
                  onMouseLeave={() => setIsLineHovered(false)}
                  className="absolute left-[12px] top-[16px] w-[12px] h-3 -translate-y-1/2 z-0 cursor-pointer flex items-center"
                  title={lang === "ja" ? "クリックして非表示" : "Click to fold"}
                >
                  <div
                    className={`w-full transition-all duration-150 ${
                      isHighlighted
                        ? "h-1 bg-[#1f497c]"
                        : "h-0.5 bg-slate-300/60"
                    }`}
                  />
                </div>

                <CommentThreadItem
                  comment={child}
                  nickname={nickname}
                  lang={lang}
                  gameSlug={gameSlug}
                  depth={depth + 1}
                  parentHovered={isHighlighted}
                  editingCommentId={editingCommentId}
                  editCommentText={editCommentText}
                  setEditCommentText={setEditCommentText}
                  setEditingCommentId={setEditingCommentId}
                  handleStartEdit={handleStartEdit}
                  handleSaveEdit={handleSaveEdit}
                  handleDeleteComment={handleDeleteComment}
                  onRefresh={onRefresh}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [nickname, setNickname] = useState("");
  const [claimInput, setClaimInput] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  useEffect(() => {
    setNickname(localStorage.getItem("nickname") || "");
    const savedLang = localStorage.getItem("lang") as "ja" | "en";
    if (savedLang) setLang(savedLang);

    fetchGameAndComments();
  }, [slug]);

  async function fetchGameAndComments() {
    // Fetch Game Details
    const { data: gameData } = await supabase
      .from("games")
      .select("*")
      .eq("slug", slug)
      .single();

    if (gameData) setGame(gameData);

    // Fetch Comments
    const { data: commentData } = await supabase
      .from("game_comments")
      .select("*")
      .eq("game_slug", slug)
      .order("created_at", { ascending: true });

    if (commentData) {
      const tree = buildCommentTree(commentData);
      setComments(tree);
    }
  }

  const handleClaimNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = claimInput.trim();
    if (!trimmed) return;

    localStorage.setItem("nickname", trimmed);
    let userHouse = localStorage.getItem("house");

    const { data: lbUser } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("nickname", trimmed)
      .single();

    if (lbUser?.house) {
      userHouse = lbUser.house;
      localStorage.setItem("house", lbUser.house);
    } else if (!userHouse) {
      userHouse = HOUSES[Math.floor(Math.random() * HOUSES.length)];
      localStorage.setItem("house", userHouse);
    }

    if (!lbUser) {
      await supabase.from("leaderboard").insert({
        nickname: trimmed,
        score: 0,
        house: userHouse,
      });
    }

    setNickname(trimmed);
    setClaimInput("");
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !newComment.trim()) return;

    await supabase.from("game_comments").insert({
      game_slug: slug,
      user_nickname: nickname,
      comment: newComment.trim(),
    });

    setNewComment("");
    fetchGameAndComments();
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.comment);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editCommentText.trim()) return;

    await supabase
      .from("game_comments")
      .update({ comment: editCommentText.trim() })
      .eq("id", commentId)
      .eq("user_nickname", nickname);

    setEditingCommentId(null);
    setEditCommentText("");
    fetchGameAndComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (
      !confirm(
        lang === "ja" ? "コメントを削除しますか？" : "Delete this comment?",
      )
    )
      return;

    await supabase
      .from("game_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_nickname", nickname);

    fetchGameAndComments();
  };

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500 font-medium text-sm">
        Loading game details...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar
        lang={lang}
        nickname={nickname}
        onLogout={() => setNickname("")}
      />

      <div className="flex-1 ml-0 md:ml-64 flex flex-col min-w-0 pb-20 md:pb-0 bg-gradient-to-b from-slate-50 to-white">
        <Header
          lang={lang}
          toggleLang={() => setLang(lang === "ja" ? "en" : "ja")}
          nickname={nickname}
          breadcrumbs={
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/" className="hover:underline text-slate-500">
                {lang === "ja" ? "ゲーセン" : "Arcade"}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md font-bold">
                {(lang === "ja" ? game.name_ja : game.name) || game.name}
              </span>
            </>
          }
        />

        <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex-1">
          {/* Game Banner & Overview */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
            <div className="w-full h-64 md:h-80 bg-slate-900 relative flex items-center justify-center overflow-hidden">
              <iframe
                src={`/api/game-proxy/${slug}`}
                className="w-full h-full border-none pointer-events-none opacity-80 scale-105"
                title="Game Preview"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-6 md:p-8">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-md border border-sky-800/50 mb-2 inline-block">
                      {game.code || "ARCADE"}
                    </span>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                      {(lang === "ja" ? game.name_ja : game.name) || game.name}
                    </h1>
                  </div>
                  <Link
                    href={`/click/${slug}`}
                    className="bg-[#1f497c] hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>
                      {lang === "ja" ? "ゲームをプレイ" : "Play Game"}
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                {lang === "ja" ? "ゲームの概要" : "Game Overview"}
              </h2>
              <p className="text-slate-700 leading-relaxed text-sm md:text-base">
                {(lang === "ja" ? game.description_ja : game.description) ||
                  game.description ||
                  (lang === "ja"
                    ? "説明はありません。"
                    : "No description provided for this game.")}
              </p>
            </div>
          </div>

          {/* Comment Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1f497c]" />
              <span>
                {lang === "ja"
                  ? "ディスカッション・コメント"
                  : "Comments & Discussion"}
              </span>
            </h3>

            {nickname ? (
              <form onSubmit={handlePostComment} className="mb-8">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    lang === "ja"
                      ? "このゲームについての感想やハイスコアを書き込もう..."
                      : "Share your high scores or strategy tips for this game..."
                  }
                  rows={3}
                  required
                  className="w-full p-3.5 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-[#1f497c] bg-slate-50/50 mb-3 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#1f497c] text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {lang === "ja" ? "コメントを送信" : "Post Comment"}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleClaimNickname}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 md:p-5 mb-8"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1">
                  <UserPlus className="w-4 h-4 text-[#1f497c]" />
                  <span>
                    {lang === "ja"
                      ? "ニックネームを登録して会話に参加しよう"
                      : "Claim a nickname to post comments"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  {lang === "ja"
                    ? "コメントやスコア記録に使用するニックネームを入力してください。"
                    : "Enter a handle below to identify yourself across comments and leaderboards."}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={claimInput}
                    onChange={(e) => setClaimInput(e.target.value)}
                    placeholder={
                      lang === "ja" ? "例: ゲーマー123" : "e.g. ArcadeHero"
                    }
                    required
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:border-[#1f497c]"
                  />
                  <button
                    type="submit"
                    className="bg-[#1f497c] hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {lang === "ja" ? "ニックネームを決定" : "Claim Name"}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* Tree Structured Comments */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">
                  {lang === "ja"
                    ? "まだコメントはありません。最初のコメントを書き込もう！"
                    : "No comments yet. Be the first to start the conversation!"}
                </p>
              ) : (
                comments.map((rootComment) => (
                  <CommentThreadItem
                    key={rootComment.id}
                    comment={rootComment}
                    nickname={nickname}
                    lang={lang}
                    gameSlug={slug}
                    editingCommentId={editingCommentId}
                    editCommentText={editCommentText}
                    setEditCommentText={setEditCommentText}
                    setEditingCommentId={setEditingCommentId}
                    handleStartEdit={handleStartEdit}
                    handleSaveEdit={handleSaveEdit}
                    handleDeleteComment={handleDeleteComment}
                    onRefresh={fetchGameAndComments}
                  />
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
