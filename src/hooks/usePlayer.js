import { MODE } from "../constants/music";

export function usePlayer(mode, playMode, synth) {
    function play(q) {
        if (!q) return;

        if (mode === MODE.INTERVAL) {
            return playMode === "harmonic"
                ? synth.playDyad(q.rootHz, q.semitones)
                : synth.playMelodic(q.rootHz, q.semitones);
        }

        if (mode === MODE.CHORD) {
            return synth.playChord(q.rootHz, q.semitones);
        }
    }

    return { play };
}
