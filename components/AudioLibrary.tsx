"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sigil } from "@/components/Sigil";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { TrackWithUrl } from "@/lib/data/tracks";
import { deleteTrack, renameTrack } from "@/app/c/[campaignId]/t/audio/actions";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
const SIGNED_URL_TTL = 60 * 60 * 8;
const ALLOWED_PREFIXES = ["audio/"];

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string; pct: number }
  | { kind: "error"; message: string };

function formatDuration(sec: number | null | undefined): string {
  if (!sec || !isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
}

async function getDurationSec(file: File): Promise<number | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let done = false;
    const finish = (val: number | null) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(val);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => finish(audio.duration);
    audio.onerror = () => finish(null);
    setTimeout(() => finish(null), 8000);
    audio.src = url;
  });
}

export function AudioLibrary({
  campaignId,
  initialTracks,
}: {
  campaignId: string;
  initialTracks: TrackWithUrl[];
}) {
  const router = useRouter();
  const [tracks, setTracks] = React.useState(initialTracks);
  const [query, setQuery] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [upload, setUpload] = React.useState<UploadState>({ kind: "idle" });
  const [currentId, setCurrentId] = React.useState<string | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(0.8);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const allTags = React.useMemo(() => {
    const s = new Set<string>();
    for (const t of tracks) for (const tag of t.tags) s.add(tag);
    return Array.from(s).sort();
  }, [tracks]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return tracks.filter(t => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (selectedTags.length > 0) {
        return selectedTags.every(tag => t.tags.includes(tag));
      }
      return true;
    });
  }, [tracks, query, selectedTags]);

  const current = tracks.find(t => t.id === currentId) ?? null;

  const playTrack = React.useCallback((t: TrackWithUrl) => {
    if (!audioRef.current) return;
    if (currentId === t.id) {
      if (audioRef.current.paused) audioRef.current.play();
      else audioRef.current.pause();
      return;
    }
    setCurrentId(t.id);
  }, [currentId]);

  const playNext = React.useCallback((dir: 1 | -1) => {
    if (filtered.length === 0) return;
    const idx = filtered.findIndex(t => t.id === currentId);
    const next = filtered[(idx + dir + filtered.length) % filtered.length];
    if (next) setCurrentId(next.id);
  }, [filtered, currentId]);

  // Mount the new src and play whenever currentId changes.
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    el.src = current.url;
    el.volume = volume;
    void el.play().catch(() => {});
  }, [current, volume]);

  // Keyboard shortcuts.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (audioRef.current) {
          if (audioRef.current.paused) audioRef.current.play();
          else audioRef.current.pause();
        }
      } else if (e.code === "ArrowRight" && e.shiftKey) {
        e.preventDefault();
        playNext(1);
      } else if (e.code === "ArrowLeft" && e.shiftKey) {
        e.preventDefault();
        playNext(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playNext]);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      if (file.size > MAX_FILE_BYTES) {
        setUpload({
          kind: "error",
          message: `${file.name} is over the 50 MB limit.`,
        });
        continue;
      }
      if (!ALLOWED_PREFIXES.some(p => file.type.startsWith(p))) {
        setUpload({
          kind: "error",
          message: `${file.name} doesn't look like an audio file (got ${file.type || "no type"}).`,
        });
        continue;
      }
      await uploadOne(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadOne(file: File) {
    setUpload({ kind: "uploading", fileName: file.name, pct: 0 });
    try {
      const supabase = getBrowserSupabase();
      const { data: userResp } = await supabase.auth.getUser();
      const dmId = userResp.user?.id;
      if (!dmId) throw new Error("Not signed in.");

      const dur = await getDurationSec(file);
      const id = crypto.randomUUID();
      const ext = (file.name.split(".").pop() || "mp3").toLowerCase();
      const storagePath = `${campaignId}/${id}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("tracks")
        .upload(storagePath, file, {
          contentType: file.type || "audio/mpeg",
          upsert: false,
        });
      if (upErr) {
        throw new Error(`Storage upload failed (path "${storagePath}"): ${upErr.message}`);
      }

      const titleFromFile = file.name.replace(/\.[^.]+$/, "");

      const { error: insertErr } = await supabase.from("tracks").insert({
        id,
        campaign_id: campaignId,
        dm_id: dmId,
        title: titleFromFile,
        tags: [],
        storage_path: storagePath,
        duration_sec: dur,
        mime_type: file.type || null,
        size_bytes: file.size,
      });
      if (insertErr) {
        await supabase.storage.from("tracks").remove([storagePath]);
        throw new Error(`Database insert failed (campaign ${campaignId}, dm ${dmId}): ${insertErr.message}`);
      }

      const { data: signed } = await supabase.storage
        .from("tracks")
        .createSignedUrl(storagePath, SIGNED_URL_TTL);

      setTracks(prev => [
        {
          id,
          campaign_id: campaignId,
          dm_id: dmId,
          title: titleFromFile,
          tags: [],
          storage_path: storagePath,
          duration_sec: dur,
          mime_type: file.type || null,
          size_bytes: file.size,
          created_at: new Date().toISOString(),
          url: signed?.signedUrl ?? "",
        },
        ...prev,
      ]);
      setUpload({ kind: "idle" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setUpload({ kind: "error", message });
    }
  }

  async function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer.files?.length) await handleFiles(e.dataTransfer.files);
  }

  async function handleDelete(t: TrackWithUrl) {
    if (!confirm(`Delete "${t.title}"? This cannot be undone.`)) return;
    if (currentId === t.id) {
      audioRef.current?.pause();
      setCurrentId(null);
    }
    const res = await deleteTrack(campaignId, t.id);
    if (!res.ok) {
      alert(res.message ?? "Failed to delete.");
      return;
    }
    setTracks(prev => prev.filter(x => x.id !== t.id));
    router.refresh();
  }

  async function handleRenameSubmit(t: TrackWithUrl, fd: FormData) {
    const title = String(fd.get("title") ?? "");
    const tags = parseTags(String(fd.get("tags") ?? ""));
    const res = await renameTrack(campaignId, t.id, title, tags);
    if (!res.ok) {
      alert(res.message ?? "Failed to save.");
      return;
    }
    setTracks(prev =>
      prev.map(x => (x.id === t.id ? { ...x, title: title.trim(), tags } : x))
    );
    setEditingId(null);
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-5 sm:px-10 pt-8 pb-32 max-w-5xl w-full mx-auto">
        <div
          className="italic uppercase text-[12px]"
          style={{
            fontFamily: "var(--tome-display)",
            letterSpacing: "0.22em",
            color: "var(--tome-gold)",
          }}
        >
          Cap. VII &middot; Of Music & Ambience
        </div>
        <h1
          className="mt-1"
          style={{
            fontFamily: "var(--tome-display)",
            fontWeight: 600,
            fontSize: "clamp(40px, 6vw, 60px)",
            lineHeight: 0.95,
            color: "var(--tome-ink)",
          }}
        >
          The <em style={{ color: "var(--tome-oxblood)" }}>Library</em> of Sounds
        </h1>
        <p
          className="italic mt-1 mb-6"
          style={{
            fontFamily: "var(--tome-body)",
            fontSize: 16,
            color: "var(--tome-ink-soft)",
          }}
        >
          {tracks.length === 0
            ? "no recordings yet · upload a file to begin"
            : `${tracks.length} ${tracks.length === 1 ? "recording" : "recordings"} kept`}
        </p>

        <UploadZone
          onPick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          state={upload}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />

        {tracks.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="seek a recording..."
                className="bg-transparent outline-none italic"
                style={{
                  fontFamily: "var(--tome-body)",
                  fontSize: 15,
                  color: "var(--tome-ink)",
                  borderBottom: "1px solid var(--tome-rule)",
                  padding: "4px 2px",
                  minWidth: 220,
                  flex: "1 1 220px",
                }}
              />
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {allTags.map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setSelectedTags(prev =>
                          prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]
                        )
                      }
                      className="cursor-pointer"
                      style={{
                        fontFamily: "var(--tome-display)",
                        fontStyle: "italic",
                        fontSize: 12,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        background: active ? "var(--tome-oxblood)" : "transparent",
                        color: active ? "var(--tome-paper)" : "var(--tome-ink-soft)",
                        border: `1px solid ${active ? "var(--tome-oxblood)" : "var(--tome-rule)"}`,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="cursor-pointer italic"
                    style={{
                      fontFamily: "var(--tome-display)",
                      fontSize: 12,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--tome-ink-faint)",
                      background: "transparent",
                      border: "none",
                    }}
                  >
                    clear
                  </button>
                )}
              </div>
            )}

            <ul className="mt-6 flex flex-col">
              {filtered.length === 0 ? (
                <li
                  className="italic py-6"
                  style={{
                    fontFamily: "var(--tome-body)",
                    color: "var(--tome-ink-soft)",
                  }}
                >
                  no recordings match thy search.
                </li>
              ) : (
                filtered.map(t => {
                  const isCurrent = currentId === t.id;
                  const isEditing = editingId === t.id;
                  return (
                    <li
                      key={t.id}
                      className="grid items-center gap-3 py-3"
                      style={{
                        gridTemplateColumns: "44px minmax(0, 1fr) auto",
                        borderBottom: "1px dotted var(--tome-rule)",
                        background: isCurrent ? "rgba(168,118,40,0.08)" : "transparent",
                        paddingLeft: 8,
                        paddingRight: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => playTrack(t)}
                        className="cursor-pointer flex items-center justify-center"
                        style={{
                          width: 36,
                          height: 36,
                          background: isCurrent && isPlaying ? "var(--tome-oxblood)" : "transparent",
                          color: isCurrent && isPlaying ? "var(--tome-paper)" : "var(--tome-ink)",
                          border: `1px solid ${isCurrent ? "var(--tome-oxblood)" : "var(--tome-rule)"}`,
                          fontFamily: "var(--tome-display)",
                        }}
                        aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
                      >
                        {isCurrent && isPlaying ? "❚❚" : "▶"}
                      </button>
                      <div className="min-w-0">
                        {isEditing ? (
                          <form
                            action={fd => handleRenameSubmit(t, fd)}
                            className="flex flex-col gap-2"
                          >
                            <input
                              name="title"
                              defaultValue={t.title}
                              autoFocus
                              required
                              className="bg-transparent outline-none"
                              style={{
                                fontFamily: "var(--tome-display)",
                                fontWeight: 500,
                                fontSize: 18,
                                color: "var(--tome-ink)",
                                borderBottom: "1px solid var(--tome-ink)",
                                padding: "2px 0",
                              }}
                            />
                            <input
                              name="tags"
                              defaultValue={t.tags.join(", ")}
                              placeholder="tags, comma-separated · combat, tavern, boss"
                              className="bg-transparent outline-none italic"
                              style={{
                                fontFamily: "var(--tome-body)",
                                fontSize: 13,
                                color: "var(--tome-ink)",
                                borderBottom: "1px solid var(--tome-rule)",
                                padding: "2px 0",
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="cursor-pointer"
                                style={{
                                  fontFamily: "var(--tome-display)",
                                  fontStyle: "italic",
                                  fontSize: 11,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  padding: "4px 10px",
                                  background: "var(--tome-oxblood)",
                                  color: "var(--tome-paper)",
                                  border: "1px solid var(--tome-oxblood)",
                                }}
                              >
                                save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="cursor-pointer"
                                style={{
                                  fontFamily: "var(--tome-display)",
                                  fontStyle: "italic",
                                  fontSize: 11,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  padding: "4px 10px",
                                  background: "transparent",
                                  color: "var(--tome-ink)",
                                  border: "1px solid var(--tome-rule)",
                                }}
                              >
                                cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div
                              className="truncate"
                              style={{
                                fontFamily: "var(--tome-display)",
                                fontWeight: 500,
                                fontSize: 18,
                                color: "var(--tome-ink)",
                                lineHeight: 1.15,
                              }}
                            >
                              {t.title}
                            </div>
                            <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                              <span
                                className="italic"
                                style={{
                                  fontFamily: "var(--tome-display)",
                                  fontSize: 12,
                                  color: "var(--tome-ink-faint)",
                                }}
                              >
                                {formatDuration(t.duration_sec)}
                              </span>
                              {t.tags.map(tg => (
                                <span
                                  key={tg}
                                  className="italic uppercase"
                                  style={{
                                    fontFamily: "var(--tome-display)",
                                    fontSize: 10,
                                    letterSpacing: "0.08em",
                                    color: "var(--tome-gold)",
                                    border: "1px solid var(--tome-rule)",
                                    padding: "1px 6px",
                                  }}
                                >
                                  {tg}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(t.id)}
                            className="cursor-pointer italic uppercase"
                            style={{
                              fontFamily: "var(--tome-display)",
                              fontSize: 11,
                              letterSpacing: "0.1em",
                              padding: "4px 10px",
                              background: "transparent",
                              color: "var(--tome-ink-soft)",
                              border: "1px solid var(--tome-rule)",
                            }}
                          >
                            edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t)}
                            className="cursor-pointer italic uppercase"
                            style={{
                              fontFamily: "var(--tome-display)",
                              fontSize: 11,
                              letterSpacing: "0.1em",
                              padding: "4px 10px",
                              background: "transparent",
                              color: "var(--tome-oxblood)",
                              border: "1px solid var(--tome-rule)",
                            }}
                          >
                            delete
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </>
        )}
      </div>

      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) setProgress(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        preload="none"
      />

      {current && (
        <div
          className="fixed left-0 right-0 bottom-0 z-30"
          style={{
            background: "rgba(26,20,16,0.96)",
            borderTop: "1px solid var(--tome-gold)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="max-w-6xl mx-auto flex items-center gap-4 px-5 py-3 flex-wrap">
            <span style={{ color: "var(--tome-oxblood)" }} aria-hidden>
              <Sigil kind="note" size={28} strokeWidth={1.4} />
            </span>
            <div className="flex flex-col min-w-0" style={{ flex: "1 1 200px" }}>
              <span
                className="italic uppercase"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontSize: 10,
                  color: "var(--tome-gold)",
                  letterSpacing: "0.18em",
                }}
              >
                now playing
              </span>
              <span
                className="truncate"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontWeight: 600,
                  fontSize: 18,
                  color: "var(--tome-ink)",
                }}
              >
                {current.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playNext(-1)}
                className="cursor-pointer"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontSize: 16,
                  width: 32,
                  height: 32,
                  background: "transparent",
                  color: "var(--tome-ink)",
                  border: "1px solid var(--tome-rule)",
                }}
                aria-label="Previous"
              >
                ⏮
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!audioRef.current) return;
                  if (audioRef.current.paused) audioRef.current.play();
                  else audioRef.current.pause();
                }}
                className="cursor-pointer"
                style={{
                  width: 40,
                  height: 40,
                  background: isPlaying ? "var(--tome-oxblood)" : "transparent",
                  color: isPlaying ? "var(--tome-paper)" : "var(--tome-ink)",
                  border: "1px solid var(--tome-oxblood)",
                  fontFamily: "var(--tome-display)",
                }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "❚❚" : "▶"}
              </button>
              <button
                type="button"
                onClick={() => playNext(1)}
                className="cursor-pointer"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontSize: 16,
                  width: 32,
                  height: 32,
                  background: "transparent",
                  color: "var(--tome-ink)",
                  border: "1px solid var(--tome-rule)",
                }}
                aria-label="Next"
              >
                ⏭
              </button>
            </div>

            <div
              className="flex items-center gap-2"
              style={{ flex: "1 1 240px", minWidth: 200 }}
            >
              <span
                style={{
                  fontFamily: "var(--tome-mono)",
                  fontSize: 11,
                  color: "var(--tome-ink-faint)",
                  width: 42,
                  textAlign: "right",
                }}
              >
                {formatDuration(progress)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.5}
                value={progress}
                onChange={e => {
                  const v = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = v;
                  setProgress(v);
                }}
                style={{
                  flex: 1,
                  accentColor: "var(--tome-oxblood)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--tome-mono)",
                  fontSize: 11,
                  color: "var(--tome-ink-faint)",
                  width: 42,
                }}
              >
                {formatDuration(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="italic uppercase"
                style={{
                  fontFamily: "var(--tome-display)",
                  fontSize: 10,
                  color: "var(--tome-ink-faint)",
                  letterSpacing: "0.18em",
                }}
              >
                vol
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={e => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (audioRef.current) audioRef.current.volume = v;
                }}
                style={{
                  width: 80,
                  accentColor: "var(--tome-gold)",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadZone({
  onPick,
  onDrop,
  state,
}: {
  onPick: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  state: UploadState;
}) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onDragOver={e => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={e => {
        setHover(false);
        onDrop(e);
      }}
      className="flex flex-col items-center justify-center text-center cursor-pointer"
      style={{
        border: `1px dashed ${hover ? "var(--tome-gold)" : "var(--tome-rule)"}`,
        background: hover ? "rgba(212,168,80,0.08)" : "rgba(244,236,204,0.03)",
        padding: "26px 20px",
        transition: "background 120ms ease, border-color 120ms ease",
      }}
      onClick={onPick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.code === "Enter" || e.code === "Space") {
          e.preventDefault();
          onPick();
        }
      }}
    >
      <span style={{ color: "var(--tome-gold)" }} aria-hidden>
        <Sigil kind="note" size={32} strokeWidth={1.3} />
      </span>
      <div
        className="italic mt-2"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 18,
          color: "var(--tome-ink)",
        }}
      >
        Drop a recording here, or <span style={{ color: "var(--tome-oxblood)", textDecoration: "underline" }}>choose a file</span>
      </div>
      <div
        className="italic uppercase mt-1"
        style={{
          fontFamily: "var(--tome-display)",
          fontSize: 10,
          color: "var(--tome-ink-faint)",
          letterSpacing: "0.16em",
        }}
      >
        mp3 · wav · ogg · up to 50 MB · multiple at once welcome
      </div>
      {state.kind === "uploading" && (
        <div
          className="italic mt-3"
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 13,
            color: "var(--tome-gold)",
          }}
        >
          inscribing &middot; {state.fileName}
        </div>
      )}
      {state.kind === "error" && (
        <div
          className="italic mt-3"
          style={{
            fontFamily: "var(--tome-body)",
            fontSize: 13,
            color: "var(--tome-oxblood)",
          }}
        >
          {state.message}
        </div>
      )}
    </div>
  );
}
