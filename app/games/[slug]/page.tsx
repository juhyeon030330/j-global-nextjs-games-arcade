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
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import Link from "next/link";

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
}

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [nickname, setNickname] = useState("");
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
      .order("created_at", { ascending: false });

    if (commentData) setComments(commentData);
  }

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
      .eq("user_nickname", nickname); // Ensure ownership

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
      .eq("user_nickname", nickname); // Ensure ownership

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
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 text-center text-xs text-slate-500 mb-8">
                {lang === "ja"
                  ? "コメントを投稿するには、ハウスカップページ等でニックネームを登録してください。"
                  : "Claim a nickname on the Leaderboard page to join the discussion."}
              </div>
            )}

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">
                  {lang === "ja"
                    ? "まだコメントはありません。最初のコメントを書き込もう！"
                    : "No comments yet. Be the first to start the conversation!"}
                </p>
              ) : (
                comments.map((c) => {
                  const isOwner = nickname && c.user_nickname === nickname;
                  const isEditing = editingCommentId === c.id;

                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#1f497c]">
                            {c.user_nickname}
                          </span>
                          {isOwner && (
                            <span className="bg-sky-100 text-[#1f497c] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>

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
                              <span>
                                {lang === "ja" ? "キャンセル" : "Cancel"}
                              </span>
                            </button>
                            <button
                              onClick={() => handleSaveEdit(c.id)}
                              className="bg-[#1f497c] text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-800"
                            >
                              <Check className="w-3 h-3" />
                              <span>{lang === "ja" ? "保存" : "Save"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-slate-700 leading-relaxed mb-3">
                            {c.comment}
                          </p>

                          {isOwner && (
                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200/60">
                              <button
                                onClick={() => handleStartEdit(c)}
                                className="text-[11px] text-slate-500 hover:text-[#1f497c] font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>{lang === "ja" ? "編集" : "Edit"}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{lang === "ja" ? "削除" : "Delete"}</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
