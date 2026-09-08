import fs from 'fs';
import path from 'path';

/**
 * Generates a valid 16-bit Stereo PCM WAV file with musical chords and ambient harmony
 */
function generateWavFile(
  filePath: string,
  durationSec: number = 30,
  scaleFreqs: number[] = [220, 261.63, 329.63, 392, 440], // A minor pentatonic / dorian
  tempoBpm: number = 80
) {
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const totalSamples = sampleRate * durationSec;
  const dataSize = totalSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample (16)

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const secondsPerBeat = 60 / tempoBpm;

  // Synthesize musical audio: warm ambient chords with subtle modulation
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const beatIndex = Math.floor(t / secondsPerBeat) % scaleFreqs.length;
    const baseFreq = scaleFreqs[beatIndex];
    const fifthFreq = baseFreq * 1.5;
    const octaveFreq = baseFreq * 0.5;

    // Smooth envelope per beat
    const beatTime = (t % secondsPerBeat) / secondsPerBeat;
    const env = Math.sin(beatTime * Math.PI);

    // Warm chord layering
    const wave1 = Math.sin(2 * Math.PI * baseFreq * t);
    const wave2 = 0.6 * Math.sin(2 * Math.PI * fifthFreq * t + 0.2);
    const wave3 = 0.5 * Math.sin(2 * Math.PI * octaveFreq * t);
    const chorus = 0.3 * Math.sin(2 * Math.PI * (baseFreq * 1.005) * t);

    // Subtle stereo panning
    const sampleL = (wave1 + wave3 + chorus) * env * 0.35;
    const sampleR = (wave2 + wave3 + chorus) * env * 0.35;

    // Master fade-in (first 2s) and fade-out (last 2s)
    let masterEnv = 1.0;
    if (t < 2) masterEnv = t / 2;
    if (t > durationSec - 2) masterEnv = (durationSec - t) / 2;

    const intL = Math.max(-32767, Math.min(32767, Math.floor(sampleL * masterEnv * 32767)));
    const intR = Math.max(-32767, Math.min(32767, Math.floor(sampleR * masterEnv * 32767)));

    const offset = 44 + i * 4;
    buffer.writeInt16LE(intL, offset);
    buffer.writeInt16LE(intR, offset + 2);
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`Generated audio: ${filePath} (${(dataSize / 1024 / 1024).toFixed(2)} MB)`);
}

const audioDir = path.join(process.cwd(), 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// 1. Monsoon Cybernetics (Electronic Sarod Ambient: D minor)
generateWavFile(path.join(audioDir, 'track-1.wav'), 60, [146.83, 174.61, 220, 261.63, 293.66], 90);

// 2. Varanasi Midnight Drone (Deep Ambient Drone: C minor)
generateWavFile(path.join(audioDir, 'track-2.wav'), 60, [130.81, 155.56, 196, 233.08, 261.63], 60);

// 3. Letters to Hooghly (Indie Folk: G major pentatonic)
generateWavFile(path.join(audioDir, 'track-3.wav'), 60, [196, 220, 246.94, 293.66, 329.63], 100);

// 4. Northern Ridge Nocturne (Cinematic Post-Rock: E minor)
generateWavFile(path.join(audioDir, 'track-4.wav'), 60, [164.81, 196, 246.94, 293.66, 329.63], 75);

// 5. Saffron Rain (Neo-Soul Hindustani Raag Megh: C modal)
generateWavFile(path.join(audioDir, 'track-5.wav'), 60, [130.81, 146.83, 174.61, 196, 233.08], 85);

// 6. Kal Baisakhi Breeze (Acoustic Folk: F major)
generateWavFile(path.join(audioDir, 'track-6.wav'), 60, [174.61, 196, 220, 261.63, 293.66], 105);

console.log('✨ All 6 local audio files generated in public/audio/');
