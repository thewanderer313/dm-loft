"use client";

import * as React from "react";
import { Sigil } from "@/components/Sigil";

export type PlayableTrack = {
  id: string;
  title: string;
  url: string;
  duration_sec: number | null;
};

type Ctx = {
  current: PlayableTrack | null;
  queue: PlayableTrack[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  play: (track: PlayableTrack, queue?: PlayableTrack[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  stop: () => void;
};

const AudioPlayerCtx = React.createContext<Ctx | null>(null);

export function useAudioPlayer(): Ctx {
  const v = React.useContext(AudioPlayerCtx);
  if (!v) throw new Error("useAudioPlayer must be used inside <AudioPlayerProvider>.");
  return v;
}

function formatDuration(sec: number | null | undefined): string {
  if (!sec || !isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = React.useState<PlayableTrack | null>(null);
  const [queue, setQueue] = React.useState<PlayableTrack[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolumeState] = React.useState(0.8);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const play = React.useCallback((track: PlayableTrack, q?: PlayableTrack[]) => {
    if (q && q.length > 0) {
      setQueue(q);
    } else {
      setQueue(prev => (prev.find(t => t.id === track.id) ? prev : [track]));
    }
    setCurrent(track);
  }, []);

  const toggle = React.useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  }, []);

  const skipBy = React.useCallback(
    (dir: 1 | -1) => {
      if (queue.length === 0 || !current) return;
      const idx = queue.findIndex(t => t.id === current.id);
      if (idx === -1) return;
      const nextIdx = (idx + dir + queue.length) % queue.length;
      setCurrent(queue[nextIdx]);
    },
    [queue, current]
  );

  const next = React.useCallback(() => skipBy(1), [skipBy]);
  const prev = React.useCallback(() => skipBy(-1), [skipBy]);

  const seek = React.useCallback((sec: number) => {
    if (audioRef.current) audioRef.current.currentTime = sec;
    setProgress(sec);
  }, []);

  const setVolume = React.useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const stop = React.useCallback(() => {
    audioRef.current?.pause();
    setCurrent(null);
    setIsPlaying(false);
    setProgress(0);
  }, []);

  // Load + play whenever the current track changes.
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (el.src !== current.url) el.src = current.url;
    el.volume = volume;
    void el.play().catch(() => {});
    // We intentionally exclude `volume` so that adjusting volume mid-track
    // does NOT restart the track from 0 in this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // Reserve room at the bottom of every scroll surface for the player bar.
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (current) document.body.classList.add("with-audio-bar");
    else document.body.classList.remove("with-audio-bar");
    return () => document.body.classList.remove("with-audio-bar");
  }, [current]);

  // Global keyboard shortcuts. Skip when typing into a form field.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement | null;
      if (!tgt) return;
      const tag = tgt.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        tgt.isContentEditable
      )
        return;
      if (!current) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight" && e.shiftKey) {
        e.preventDefault();
        next();
      } else if (e.code === "ArrowLeft" && e.shiftKey) {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, toggle, next, prev]);

  const value: Ctx = {
    current,
    queue,
    isPlaying,
    progress,
    duration,
    volume,
    play,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    stop,
  };

  return (
    <AudioPlayerCtx.Provider value={value}>
      {children}
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
        <PersistentPlayerBar
          current={current}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          volume={volume}
          onToggle={toggle}
          onNext={next}
          onPrev={prev}
          onSeek={seek}
          onVolume={setVolume}
          onClose={stop}
          formatDuration={formatDuration}
        />
      )}
    </AudioPlayerCtx.Provider>
  );
}

function PersistentPlayerBar({
  current,
  isPlaying,
  progress,
  duration,
  volume,
  onToggle,
  onNext,
  onPrev,
  onSeek,
  onVolume,
  onClose,
  formatDuration,
}: {
  current: PlayableTrack;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (sec: number) => void;
  onVolume: (v: number) => void;
  onClose: () => void;
  formatDuration: (sec: number | null | undefined) => string;
}) {
  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40"
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
              fontSize: 12,
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
            onClick={onPrev}
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
            onClick={onToggle}
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
            onClick={onNext}
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

        <div className="flex items-center gap-2" style={{ flex: "1 1 240px", minWidth: 200 }}>
          <span
            style={{
              fontFamily: "var(--tome-mono)",
              fontSize: 12,
              color: "var(--tome-ink-faint)",
              width: 44,
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
            onChange={e => onSeek(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--tome-oxblood)" }}
          />
          <span
            style={{
              fontFamily: "var(--tome-mono)",
              fontSize: 12,
              color: "var(--tome-ink-faint)",
              width: 44,
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
              fontSize: 12,
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
            onChange={e => onVolume(Number(e.target.value))}
            style={{ width: 80, accentColor: "var(--tome-gold)" }}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer italic uppercase"
          style={{
            fontFamily: "var(--tome-display)",
            fontSize: 12,
            letterSpacing: "0.18em",
            color: "var(--tome-ink-faint)",
            background: "transparent",
            border: "1px solid var(--tome-rule)",
            padding: "6px 10px",
          }}
          aria-label="Close player"
          title="Stop and close the player"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
