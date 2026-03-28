const SEMITONE = Math.pow(2, 1 / 12);

function noteToHz(note) {
    return 442 * Math.pow(SEMITONE, note - 69);
}

export function randomRootHz(maxSemitoneUp = 12) {
    const minHz = 200;
    const maxHz = 800;

    // Hz → MIDIノートに変換
    const minNote = Math.ceil(69 + 12 * Math.log2(minHz / 442));
    const maxNote = Math.floor(
        69 + 12 * Math.log2((maxHz / Math.pow(SEMITONE, maxSemitoneUp)) / 442)
    );

    // 離散的なノートを選ぶ
    const note = Math.floor(Math.random() * (maxNote - minNote + 1)) + minNote;

    return noteToHz(note);
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
