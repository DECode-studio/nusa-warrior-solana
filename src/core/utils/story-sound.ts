let audioContext: AudioContext | null = null;

export function playStoryTransitionSound(): void {
  try {
    audioContext ??= new window.AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();
    const now = audioContext.currentTime;
    [392, 587.33].forEach((frequency, index) => {
      const oscillator = audioContext?.createOscillator();
      const gain = audioContext?.createGain();
      if (!oscillator || !gain || !audioContext) return;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.07, now + index * 0.045 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.045 + 0.42);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now + index * 0.045);
      oscillator.stop(now + index * 0.045 + 0.44);
    });
  } catch {
    // Audio playback is optional when the browser blocks sound.
  }
}
