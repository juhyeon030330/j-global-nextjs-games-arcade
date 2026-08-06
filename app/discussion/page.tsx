"use client";

import { useEffect, useState } from "react";
import { Send, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

interface Reply {
  user: string;
  text: string;
  created_at: string;
}

interface Thread {
  id: string;
  user: string;
  game: string;
  text: string;
  replies?: Reply[];
}

export default function DiscussionPage() {
  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [nickname, setNickname] = useState("");
  const [inputNickname, setInputNickname] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [postText, setPostText] = useState("");
  const [selectedGame, setSelectedGame] = useState("General Lounge");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedName = localStorage.getItem("nickname") || "";
    setNickname(savedName);
    const savedLang = localStorage.getItem("lang") as "ja" | "en";
    if (savedLang) setLang(savedLang);
    fetchThreads();
  }, []);

  async function fetchThreads() {
    const { data } = await supabase
      .from("threads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setThreads(data);
  }

  const handleClaimNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNickname.trim()) return;
    const name = inputNickname.trim().slice(0, 20);
    localStorage.setItem("nickname", name);
    setNickname(name);
  };

  const handlePostThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !postText.trim()) return;

    await supabase.from("threads").insert({
      user: nickname,
      game: selectedGame,
      text: postText.trim(),
      time: "Just now",
      replies: [],
    });

    setPostText("");
    fetchThreads();
  };

  const handleReply = async (threadId: string) => {
    const text = replyTexts[threadId];
    if (!nickname || !text?.trim()) return;

    const thread = threads.find((t) => t.id === threadId);
    const existingReplies = thread?.replies || [];
    const updatedReplies = [
      ...existingReplies,
      {
        user: nickname,
        text: text.trim(),
        created_at: new Date().toISOString(),
      },
    ];

    await supabase
      .from("threads")
      .update({ replies: updatedReplies })
      .eq("id", threadId);

    setReplyTexts({ ...replyTexts, [threadId]: "" });
    fetchThreads();
  };

  const handleDeleteThread = async (threadId: string) => {
    if (
      !confirm(
        lang === "ja"
          ? "この投稿を削除しますか？"
          : "Do you want to delete this post?",
      )
    )
      return;
    await supabase.from("threads").delete().eq("id", threadId);
    fetchThreads();
  };

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
              <span className="text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md font-bold">
                {lang === "ja" ? "掲示板" : "Discussion Board"}
              </span>
            </>
          }
        />

        <main className="p-4 md:p-8 max-w-2xl w-full mx-auto flex-1">
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {lang === "ja" ? "アーケードラウンジ" : "Arcade Lounge"}
            </h1>
            <p className="text-sm text-slate-500">
              {lang === "ja"
                ? "ヒントを共有したり、質問したり、他の学習者と交流しましょう！"
                : "Share tips, ask questions, and chat with fellow learners!"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8">
            {nickname ? (
              <form onSubmit={handlePostThread}>
                <div className="text-xs font-bold text-slate-500 mb-2">
                  {lang === "ja" ? "投稿者:" : "Posting as:"}{" "}
                  <span className="text-[#1f497c]">{nickname}</span>
                </div>
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="w-full h-24 border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#1f497c] resize-none bg-slate-50/50 mb-3"
                  placeholder={
                    lang === "ja"
                      ? "ヒントを共有したり、メッセージを書き込む..."
                      : "Share a tip or write a post..."
                  }
                  required
                />
                <div className="flex items-center justify-between gap-4">
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700 focus:outline-none focus:border-[#1f497c]"
                  >
                    <option value="General Lounge">
                      {lang === "ja" ? "総合ラウンジ" : "General Lounge"}
                    </option>
                  </select>
                  <button
                    type="submit"
                    className="bg-[#1f497c] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />{" "}
                    {lang === "ja" ? "投稿する" : "Post Message"}
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleClaimNickname}
                className="flex items-center justify-center gap-3 flex-wrap py-2"
              >
                <label className="font-semibold text-slate-700 text-sm">
                  {lang === "ja"
                    ? "投稿するにはニックネームを登録してください:"
                    : "Claim an Arcade Nickname to Post:"}
                </label>
                <input
                  type="text"
                  value={inputNickname}
                  onChange={(e) => setInputNickname(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#1f497c] w-48 bg-white"
                  maxLength={20}
                  required
                  placeholder={lang === "ja" ? "お名前..." : "Your name..."}
                />
                <button
                  type="submit"
                  className="bg-[#1f497c] text-white font-semibold px-4 py-1.5 rounded-lg text-sm hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {lang === "ja" ? "参加する" : "Join Board"}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-4">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500 mb-3">
                  <span>
                    {lang === "ja" ? "投稿者:" : "By:"}{" "}
                    <strong className="text-slate-800 font-bold">
                      {thread.user}
                    </strong>
                  </span>
                  <span className="bg-sky-50 text-[#1f497c] text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    {thread.game}
                  </span>
                </div>

                <div className="text-slate-800 text-sm leading-relaxed mb-4">
                  {thread.text}
                </div>

                {thread.replies && thread.replies.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 mb-3 space-y-2">
                    {thread.replies.map((reply, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border-l-2 border-[#1f497c] rounded-r-lg p-2.5 text-xs"
                      >
                        <span className="font-bold text-slate-700">
                          {reply.user}:
                        </span>{" "}
                        {reply.text}
                      </div>
                    ))}
                  </div>
                )}

                {nickname ? (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={replyTexts[thread.id] || ""}
                      onChange={(e) =>
                        setReplyTexts({
                          ...replyTexts,
                          [thread.id]: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#1f497c]"
                      placeholder={
                        lang === "ja"
                          ? `${thread.user} に返信する...`
                          : `Reply to ${thread.user}...`
                      }
                    />
                    <button
                      onClick={() => handleReply(thread.id)}
                      className="bg-[#1f497c] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                    >
                      {lang === "ja" ? "返信" : "Reply"}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 text-slate-400 rounded-lg p-2 text-center text-[11px] mt-2">
                    {lang === "ja"
                      ? "返信するには上でニックネームを登録してください！"
                      : "Claim a nickname above to write a reply!"}
                  </div>
                )}

                <div className="flex justify-end pt-3 mt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleDeleteThread(thread.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    {lang === "ja" ? "削除" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
