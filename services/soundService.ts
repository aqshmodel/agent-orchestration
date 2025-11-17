
// Simple sound synthesizer using Web Audio API
// No external files required

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const createOscillator = (ctx: AudioContext, type: OscillatorType, frequency: number, startTime: number, duration: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  
  gain.gain.setValueAtTime(0.1, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const playStartSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;
    // Sci-fi startup sound: ascending sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 1.0);

    // Add a little sparkle
    createOscillator(ctx, 'triangle', 1100, now + 0.1, 0.3);
    createOscillator(ctx, 'triangle', 1600, now + 0.2, 0.3);

  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;
    // Gentle "Pong" sound for user attention
    createOscillator(ctx, 'sine', 523.25, now, 0.6); // C5
    createOscillator(ctx, 'sine', 783.99, now + 0.1, 0.6); // G5
  } catch (e) {
     console.error("Audio play failed", e);
  }
};

export const playCompletionSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    // Grand chord for task completion (C Major 7)
    const duration = 2.5;
    
    // C4
    createOscillator(ctx, 'triangle', 261.63, now, duration);
    // E4
    createOscillator(ctx, 'triangle', 329.63, now + 0.1, duration);
    // G4
    createOscillator(ctx, 'triangle', 392.00, now + 0.2, duration);
    // B4
    createOscillator(ctx, 'sine', 493.88, now + 0.3, duration);
    // C5
    createOscillator(ctx, 'sine', 523.25, now + 0.4, duration);

  } catch (e) {
     console.error("Audio play failed", e);
  }
};
