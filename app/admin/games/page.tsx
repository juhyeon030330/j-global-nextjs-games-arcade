"use client";

import { useState, useEffect, DragEvent, ChangeEvent, FormEvent } from "react";
import {
  Lock,
  UploadCloud,
  Sliders,
  Upload,
  Pencil,
  Trash2,
  ChevronRight,
  Edit,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

interface Game {
  id: string;
  slug: string;
  name: string;
  name_ja?: string;
  description?: string;
  description_ja?: string;
  code?: string;
  clicks: number;
}

export default function AdminGamesPage() {
  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [nickname, setNickname] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [msg, setMsg] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  // Upload Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const [titleEn, setTitleEn] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descJa, setDescJa] = useState("");
  const [moduleCode, setModuleCode] = useState("");

  // Edit Modal state
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);

  useEffect(() => {
    setNickname(localStorage.getItem("nickname") || "");
    const savedLang = localStorage.getItem("lang") as "ja" | "en";
    if (savedLang) setLang(savedLang);
    fetchGames();
  }, []);

  async function fetchGames() {
    const { data } = await supabase
      .from("games")
      .select("*")
      .order("name", { ascending: true });
    if (data) setGames(data);
  }

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    if (password === "1414") {
      setAuthorized(true);
      setMsg(null);
    } else {
      setMsg({
        text: lang === "ja" ? "パスワードが違います！" : "Incorrect password!",
        type: "error",
      });
    }
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-");

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.toLowerCase().endsWith(".html")) {
      setMsg({
        text:
          lang === "ja"
            ? "HTMLファイルのみアップロード可能です"
            : "Only .html files permitted!",
        type: "error",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMsg({
        text:
          lang === "ja"
            ? "ファイルサイズが2MBを超えています"
            : "File exceeds 2MB limit!",
        type: "error",
      });
      return;
    }
    setSelectedFile(file);
    if (!titleEn) {
      const autoName = file.name
        .replace(/\.html$/i, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setTitleEn(autoName);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMsg({
        text:
          lang === "ja"
            ? "HTMLファイルを選択してください"
            : "Please select an HTML file!",
        type: "error",
      });
      return;
    }

    const name = titleEn.trim() || selectedFile.name.replace(/\.html$/i, "");
    const slug = slugify(name);
    const filename = `${slug}.html`;

    try {
      const { error: storageError } = await supabase.storage
        .from("games")
        .upload(filename, selectedFile, {
          contentType: "text/html",
          upsert: true,
        });

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from("games")
        .getPublicUrl(filename);
      const target_url = publicUrlData.publicUrl;

      const payload = {
        slug,
        name,
        name_ja: titleJa.trim() || name,
        description: descEn.trim(),
        description_ja: descJa.trim() || descEn.trim(),
        target_url,
        code: moduleCode.trim(),
      };

      const { data: existing } = await supabase
        .from("games")
        .select("id")
        .eq("slug", slug);

      if (existing && existing.length > 0) {
        await supabase.from("games").update(payload).eq("slug", slug);
        setMsg({
          text: `Game '${name}' updated successfully!`,
          type: "success",
        });
      } else {
        await supabase.from("games").insert({ ...payload, clicks: 0 });
        setMsg({
          text: `Game '${name}' published successfully!`,
          type: "success",
        });
      }

      setSelectedFile(null);
      setTitleEn("");
      setTitleJa("");
      setDescEn("");
      setDescJa("");
      setModuleCode("");
      fetchGames();
    } catch (err: any) {
      setMsg({ text: err.message || "Upload failed", type: "error" });
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    let target_url = undefined;

    if (editFile) {
      const filename = `${editingGame.slug}.html`;
      const { error } = await supabase.storage
        .from("games")
        .upload(filename, editFile, { contentType: "text/html", upsert: true });
      if (!error) {
        target_url = supabase.storage.from("games").getPublicUrl(filename)
          .data.publicUrl;
      }
    }

    const payload: any = {
      name: editingGame.name,
      name_ja: editingGame.name_ja || editingGame.name,
      description: editingGame.description,
      description_ja: editingGame.description_ja || editingGame.description,
      code: editingGame.code,
    };

    if (target_url) payload.target_url = target_url;

    await supabase.from("games").update(payload).eq("slug", editingGame.slug);
    setEditingGame(null);
    setEditFile(null);
    setMsg({
      text: `Updated details for '${editingGame.name}'!`,
      type: "success",
    });
    fetchGames();
  };

  const handleDelete = async (slug: string, name: string) => {
    if (
      !confirm(
        lang === "ja" ? "このゲームを削除しますか？" : "Delete this game?",
      )
    )
      return;

    try {
      await supabase.storage.from("games").remove([`${slug}.html`]);
    } catch (e) {
      console.error(e);
    }

    await supabase.from("games").delete().eq("slug", slug);
    setMsg({ text: `Game '${name}' deleted successfully.`, type: "success" });
    fetchGames();
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
                {lang === "ja" ? "ゲーム管理" : "Manage Games"}
              </span>
            </>
          }
        />

        <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex-1">
          {msg && (
            <div
              className={`p-4 mb-6 rounded-xl text-sm font-semibold ${msg.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}
            >
              {msg.text}
            </div>
          )}

          {!authorized ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 text-center max-w-md mx-auto my-12">
              <div className="w-12 h-12 bg-sky-50 text-[#1f497c] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {lang === "ja" ? "管理者アクセス" : "Admin Access Required"}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                {lang === "ja"
                  ? "管理パスワードを入力してください"
                  : "Enter password to manage games"}
              </p>
              <form onSubmit={handleUnlock} className="space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center text-lg font-bold tracking-widest bg-slate-50 focus:outline-none focus:border-[#1f497c]"
                />
                <button
                  type="submit"
                  className="w-full bg-[#1f497c] text-white font-bold py-2 rounded-xl hover:bg-slate-800 text-sm cursor-pointer"
                >
                  {lang === "ja" ? "解除" : "Unlock Dashboard"}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                  {lang === "ja"
                    ? "ゲーム管理ダッシュボード"
                    : "Game Management Dashboard"}
                </h1>
                <p className="text-sm text-slate-500">
                  {lang === "ja"
                    ? "ファイルをつかんでドロップするだけで簡単アップロード。"
                    : "Drag and drop HTML files to upload instantly. Click any game to edit details."}
                </p>
              </div>

              <form onSubmit={handleUpload} className="mb-10 space-y-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById("admin-file-input")?.click()
                  }
                  className="relative bg-white border-2 border-dashed border-slate-300 hover:border-[#1f497c] rounded-2xl p-8 text-center cursor-pointer group hover:bg-sky-50/40"
                >
                  <input
                    type="file"
                    id="admin-file-input"
                    accept=".html"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <div className="w-16 h-16 bg-sky-50 text-[#1f497c] group-hover:scale-110 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform shadow-xs">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    {selectedFile ? (
                      <span className="text-[#1f497c] font-bold">
                        📄 {selectedFile.name} selected
                      </span>
                    ) : lang === "ja" ? (
                      "HTML ファイルをドラッグ＆ドロップ、またはクリックして選択"
                    ) : (
                      "Drag & drop HTML file here, or click to browse"
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === "ja"
                      ? "HTMLファイルのみ対応 (最大 2MB)"
                      : "HTML files only (Max size: 2MB)"}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <div
                    className="flex items-center justify-between mb-3 cursor-pointer"
                    onClick={() => setShowOptional(!showOptional)}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#1f497c]" />
                      {lang === "ja"
                        ? "追加のゲーム情報 (任意)"
                        : "Additional Details (Optional)"}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {showOptional ? "▲" : "▼"}
                    </span>
                  </div>

                  {showOptional && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {lang === "ja"
                              ? "タイトル (英語)"
                              : "Title (English)"}
                          </label>
                          <input
                            type="text"
                            value={titleEn}
                            onChange={(e) => setTitleEn(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {lang === "ja"
                              ? "タイトル (日本語)"
                              : "Title (Japanese)"}
                          </label>
                          <input
                            type="text"
                            value={titleJa}
                            onChange={(e) => setTitleJa(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {lang === "ja"
                              ? "説明 (英語)"
                              : "Description (English)"}
                          </label>
                          <textarea
                            value={descEn}
                            onChange={(e) => setDescEn(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {lang === "ja"
                              ? "説明 (日本語)"
                              : "Description (Japanese)"}
                          </label>
                          <textarea
                            value={descJa}
                            onChange={(e) => setDescJa(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {lang === "ja"
                            ? "モジュールコード (任意)"
                            : "Module Code (Optional)"}
                        </label>
                        <input
                          type="text"
                          value={moduleCode}
                          onChange={(e) => setModuleCode(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-slate-50/50"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#1f497c] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {lang === "ja" ? "ゲームをアップロード" : "Upload Game"}
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  {lang === "ja"
                    ? "登録済みゲーム一覧"
                    : "Existing Games Catalog"}
                </h2>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-4">
                          {lang === "ja" ? "ゲーム" : "Game"}
                        </th>
                        <th className="py-3 px-4">
                          {lang === "ja" ? "コード" : "Code"}
                        </th>
                        <th className="py-3 px-4">
                          {lang === "ja" ? "クリック数" : "Clicks"}
                        </th>
                        <th className="py-3 px-4 text-right">
                          {lang === "ja" ? "操作" : "Action"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {games.map((game) => (
                        <tr
                          key={game.id}
                          onClick={() => setEditingGame(game)}
                          className="hover:bg-sky-50/50 cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-4 font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <span>
                                {(lang === "ja" ? game.name_ja : game.name) ||
                                  game.name}
                              </span>
                              <Pencil className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="block text-xs font-normal text-slate-400">
                              {game.slug}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-slate-500">
                            {game.code || "-"}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#1f497c]">
                            {game.clicks}
                          </td>
                          <td
                            className="py-3 px-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleDelete(game.slug, game.name)}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors"
                            >
                              {lang === "ja" ? "削除" : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {editingGame && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 relative">
                <button
                  onClick={() => setEditingGame(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
                >
                  ✕
                </button>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-[#1f497c]" />
                  <span>
                    {lang === "ja" ? "ゲーム情報の編集" : "Edit Game Details"}
                  </span>
                </h3>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Title (English)
                      </label>
                      <input
                        type="text"
                        value={editingGame.name}
                        onChange={(e) =>
                          setEditingGame({
                            ...editingGame,
                            name: e.target.value,
                          })
                        }
                        required
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Title (Japanese)
                      </label>
                      <input
                        type="text"
                        value={editingGame.name_ja || ""}
                        onChange={(e) =>
                          setEditingGame({
                            ...editingGame,
                            name_ja: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Replace HTML File (Optional)
                    </label>
                    <input
                      type="file"
                      accept=".html"
                      onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingGame(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#1f497c] text-white font-bold px-5 py-2 rounded-xl text-xs shadow-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
