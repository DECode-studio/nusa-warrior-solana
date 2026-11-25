"use client";

export interface AccessibilityPreferences {
  soundEnabled: boolean;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  animationsEnabled: boolean;
  vibrationEnabled: boolean;
}

const PREF_STORAGE_KEY = "nusantara_card_accessibility_prefs";

const DEFAULT_PREFS: AccessibilityPreferences = {
  soundEnabled: true,
  sfxEnabled: true,
  musicEnabled: false,
  animationsEnabled: true,
  vibrationEnabled: true,
};

class NusantaraAudioEngine {
  private ctx: AudioContext | null = null;
  private prefs: AccessibilityPreferences = { ...DEFAULT_PREFS };

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(PREF_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences>;
          const sfx = parsed.sfxEnabled ?? parsed.soundEnabled ?? true;
          this.prefs = {
            soundEnabled: sfx,
            sfxEnabled: sfx,
            musicEnabled: parsed.musicEnabled ?? false,
            animationsEnabled: parsed.animationsEnabled ?? true,
            vibrationEnabled: parsed.vibrationEnabled ?? true,
          };
        }
      } catch {
        // Ignore storage read errors
      }
    }
  }

  public getPreferences(): AccessibilityPreferences {
    return { ...this.prefs };
  }

  public setPreferences(
    next: Partial<AccessibilityPreferences>
  ): AccessibilityPreferences {
    return this.updatePreferences(next);
  }

  public updatePreferences(
    next: Partial<AccessibilityPreferences>
  ): AccessibilityPreferences {
    const sfx =
      next.sfxEnabled ?? next.soundEnabled ?? this.prefs.sfxEnabled;
    this.prefs = {
      ...this.prefs,
      ...next,
      soundEnabled: sfx,
      sfxEnabled: sfx,
    };
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          PREF_STORAGE_KEY,
          JSON.stringify(this.prefs)
        );
      } catch {
        // Ignore storage write errors
      }
    }
    return { ...this.prefs };
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public vibrate(pattern: number | number[]): void {
    if (!this.prefs.vibrationEnabled) return;
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    ) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration errors
      }
    }
  }

  public playTone(
    freq: number,
    durationMs: number,
    type: OscillatorType = "sine",
    gainLevel = 0.14
  ): void {
    if (!this.prefs.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + durationMs / 1000
    );

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  }

  public playCardSelect(): void {
    this.playTone(587.33, 180, "triangle", 0.12);
  }

  public playTurnChange(): void {
    this.playTone(523.25, 180, "triangle", 0.14);
    setTimeout(() => this.playTone(783.99, 260, "triangle", 0.15), 120);
  }

  public playDiceRoll(): void {
    this.playTone(329.63, 120, "triangle", 0.11);
    setTimeout(() => this.playTone(440.0, 160, "triangle", 0.13), 100);
  }

  public playDrawInstrument(): void {
    this.playTone(440, 140, "sine", 0.11);
    setTimeout(() => this.playTone(554.37, 220, "sine", 0.13), 90);
  }

  public playInstrumentBuff(synergy = false): void {
    this.playTone(440, 180, "triangle", 0.13);
    setTimeout(
      () => this.playTone(synergy ? 659.25 : 554.37, 260, "triangle", 0.15),
      110
    );
  }

  public playGamelanChord(): void {
    const freqs = [293.66, 369.99, 440.0, 587.33];
    freqs.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 420, "sine", 0.1), idx * 120);
    });
  }

  public playClash(): void {
    this.playTone(130.81, 520, "sawtooth", 0.18);
    this.playTone(293.66, 260, "triangle", 0.15);
    this.vibrate([45, 30, 65]);
  }

  public playCounterAttack(): void {
    this.playTone(196.0, 220, "sawtooth", 0.16);
    setTimeout(() => this.playTone(261.63, 380, "triangle", 0.18), 140);
    this.vibrate([60, 40, 80]);
  }

  public playVictory(): void {
    const notes = [293.66, 329.63, 440.0, 587.33];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 360, "triangle", 0.15), idx * 140);
    });
  }

  public playDefeat(): void {
    const notes = [329.63, 293.66, 220.0];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 380, "sawtooth", 0.13), idx * 160);
    });
  }
}

export const audioEngine = new NusantaraAudioEngine();
export const gamelanAudio = audioEngine;

