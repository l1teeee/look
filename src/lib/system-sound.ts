export type SystemSoundKind = "appear" | "disappear";

interface Note {
  hz: number;
  peakGain: number;
  seconds: number;
}

interface Overtone {
  ratio: number;
  gain: number;
  decay: number;
}

// Two soft electric-piano notes a fifth apart: the higher one when the picture appears, the
// lower one, ringing as long as the fade, when it goes. No noise, only warm tones.
const NOTES: Record<SystemSoundKind, Note> = {
  appear: { hz: 659.25, peakGain: 0.16, seconds: 1.6 },
  disappear: { hz: 440, peakGain: 0.12, seconds: 2.6 },
};

// The first two overtones are a slightly detuned pair: their slow beating is the vintage warmth.
const OVERTONES: Overtone[] = [
  { ratio: 1, gain: 1, decay: 1 },
  { ratio: 1.0023, gain: 0.6, decay: 1 },
  { ratio: 2, gain: 0.35, decay: 0.55 },
  { ratio: 3, gain: 0.12, decay: 0.3 },
];

const TOTAL_GAIN = OVERTONES.reduce((sum, overtone) => sum + overtone.gain, 0);
const ATTACK_SECONDS = 0.01;
// Exponential ramps cannot start or end at exactly zero.
const SILENCE = 0.0001;
const WARMTH_LOWPASS_HZ = 3200;

interface SoundEngine {
  context: AudioContext;
  output: AudioNode;
}

let engine: SoundEngine | null = null;
let enabled = false;

function createOutput(context: AudioContext): AudioNode {
  const warmth = context.createBiquadFilter();
  warmth.type = "lowpass";
  warmth.frequency.value = WARMTH_LOWPASS_HZ;
  warmth.connect(context.destination);
  return warmth;
}

// Browsers only allow audio after a user gesture, so call this from a click handler.
export function setSystemSoundEnabled(nextEnabled: boolean): void {
  enabled = nextEnabled;
  if (!nextEnabled) return;

  if (engine === null) {
    const context = new AudioContext();
    engine = { context, output: createOutput(context) };
  }
  void engine.context.resume();
}

function playOvertone(
  context: AudioContext,
  output: AudioNode,
  note: Note,
  overtone: Overtone,
): void {
  const start = context.currentTime;
  const end = start + note.seconds * overtone.decay;

  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = note.hz * overtone.ratio;

  const volume = context.createGain();
  const peak = (note.peakGain * overtone.gain) / TOTAL_GAIN;
  volume.gain.setValueAtTime(SILENCE, start);
  volume.gain.exponentialRampToValueAtTime(peak, start + ATTACK_SECONDS);
  volume.gain.exponentialRampToValueAtTime(SILENCE, end);

  oscillator.connect(volume);
  volume.connect(output);
  oscillator.start(start);
  oscillator.stop(end);
}

export function playSystemSound(kind: SystemSoundKind): void {
  if (!enabled || engine === null) return;

  for (const overtone of OVERTONES) {
    playOvertone(engine.context, engine.output, NOTES[kind], overtone);
  }
}
