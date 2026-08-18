export function createSoundscape() {
  let context;
  let master;
  let muted = false;
  let drone;

  function ensureContext() {
    if (context) return context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.32;
    master.connect(context.destination);
    return context;
  }

  function tone(frequency, duration, volume, type = 'sine', endFrequency) {
    const audio = ensureContext();
    if (!audio || muted) return;
    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.05);
  }

  function startDrone() {
    const audio = ensureContext();
    if (!audio || muted || drone) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 54;
    gain.gain.value = 0.012;
    oscillator.connect(gain).connect(master);
    oscillator.start();
    drone = { oscillator, gain };
  }

  function stopDrone() {
    if (!drone || !context) return;
    const now = context.currentTime;
    drone.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    drone.oscillator.stop(now + 0.35);
    drone = null;
  }

  return {
    resume() {
      const audio = ensureContext();
      if (audio?.state === 'suspended') audio.resume();
    },
    seed() {
      tone(620, 0.55, 0.055, 'sine', 920);
    },
    flatten() {
      tone(130, 1.2, 0.075, 'triangle', 360);
      setTimeout(() => tone(520, 0.7, 0.035, 'sine', 780), 180);
    },
    rise() {
      tone(180, 1.8, 0.06, 'sine', 680);
      setTimeout(() => tone(920, 1.1, 0.025, 'sine', 1320), 450);
      startDrone();
    },
    fold() {
      tone(420, 0.8, 0.04, 'sine', 140);
      stopDrone();
    },
    vortex(active) {
      if (active) {
        tone(110, 1.8, 0.065, 'sawtooth', 240);
        startDrone();
      } else {
        tone(360, 0.6, 0.035, 'sine', 160);
      }
    },
    reset() {
      tone(240, 0.7, 0.035, 'sine', 90);
      stopDrone();
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.32;
      if (muted) stopDrone();
      return muted;
    },
    dispose() {
      stopDrone();
      context?.close();
      context = null;
      master = null;
    }
  };
}
