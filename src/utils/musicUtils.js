const SEMITONE = Math.pow(2, 1 / 12);

export function randomRootHz(maxSemitoneUp = 12) {
    const minHz = 200;
    const maxHz = 800;
    const upperLimit = maxHz / Math.pow(SEMITONE, maxSemitoneUp);
    return Math.random() * (upperLimit - minHz) + minHz;
}

export function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function applyInversion(semitones, inversion) {
    const notes = [...semitones];

    if (inversion === "root") return notes;
    if (inversion === "1st") return [notes[1], notes[2], notes[0] + 12];
    if (inversion === "2nd") return [notes[2], notes[0] + 12, notes[1] + 12];

    return notes;
}
