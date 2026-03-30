import { INTERVALS, CHORDS, INVERSIONS, MODE } from "../constants/music";
import { randomRootHz, shuffle } from "../utils/musicUtils";

function distribute(total, items) {
    const base = Math.floor(total / items.length);
    const remainder = total % items.length;

    let pool = [];

    items.forEach(item => {
        for (let i = 0; i < base; i++) pool.push(item);
    });

    const shuffled = shuffle(items);
    for (let i = 0; i < remainder; i++) {
        pool.push(shuffled[i]);
    }

    return shuffle(pool);
}

function applyInversion(semitones, inversion) {
    const notes = [...semitones];

    if (inversion === "1st") {
        return [notes[1], notes[2], notes[0] + 12];
    }
    if (inversion === "2nd") {
        return [notes[2], notes[0] + 12, notes[1] + 12];
    }
    return notes;
}

export function useQuestionGenerator() {
    function generate({ mode, total, selectedIds, selectedInversions }) {
        if (mode === MODE.INTERVAL) {
            const allowed = INTERVALS.filter(i => selectedIds.includes(i.id));
            const pool = distribute(total, allowed);

            return pool.map(it => ({
                rootHz: randomRootHz(),
                intervalId: it.id,
                label: it.label,
                semitones: it.semitones,
                choices: allowed.map(i => ({ id: i.id, label: i.label })),
            }));
        }

        if (mode === MODE.CHORD) {
            const allowed = CHORDS.filter(c => selectedIds.includes(c.id));
            const pool = distribute(total, allowed);

            return pool.map(chord => {
                const inversion =
                    selectedInversions[Math.floor(Math.random() * selectedInversions.length)];

                return {
                    rootHz: randomRootHz(),
                    chordId: chord.id,
                    inversionId: inversion,
                    label:
                        chord.label +
                        "（" +
                        INVERSIONS.find(i => i.id === inversion).label +
                        "）",
                    semitones: applyInversion(chord.semitones, inversion),
                    choices: allowed.map(c => ({ id: c.id, label: c.label })),
                };
            });
        }
    }

    return { generate };
}
