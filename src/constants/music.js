export const INTERVALS = [
    { id: "m2", label: "短2度", semitones: 1 },
    { id: "M2", label: "長2度", semitones: 2 },
    { id: "m3", label: "短3度", semitones: 3 },
    { id: "M3", label: "長3度", semitones: 4 },
    { id: "P4", label: "完全4度", semitones: 5 },
    { id: "TT", label: "増4度 (減5度)", semitones: 6 },
    { id: "P5", label: "完全5度", semitones: 7 },
    { id: "m6", label: "短6度", semitones: 8 },
    { id: "M6", label: "長6度", semitones: 9 },
    { id: "m7", label: "短7度", semitones: 10 },
    { id: "M7", label: "長7度", semitones: 11 },
    { id: "P8", label: "オクターブ(完全8度)", semitones: 12 },
];

export const CHORDS = [
    { id: "M3", label: "長3和音", semitones: [0, 4, 7] },
    { id: "m3", label: "短3和音", semitones: [0, 3, 7] },
    { id: "dim", label: "減3和音", semitones: [0, 3, 6] },
    { id: "aug", label: "増3和音", semitones: [0, 4, 8] },
];

export const INVERSIONS = [
    { id: "root", label: "基本形" },
    { id: "1st", label: "第1転回形" },
    { id: "2nd", label: "第2転回形" },
];

export const RESONANCE_INTERVALS = [
    { id: "m3", label: "短3度", semitones: 3, ratio: 6 / 5 },
    { id: "M3", label: "長3度", semitones: 4, ratio: 5 / 4 },
    { id: "P4", label: "完全4度", semitones: 5, ratio: 4 / 3 },
    { id: "P5", label: "完全5度", semitones: 7, ratio: 3 / 2 },
    { id: "m6", label: "短6度", semitones: 8, ratio: 8 / 5 },
    { id: "M6", label: "長6度", semitones: 9, ratio: 5 / 3 },
];


export const MODE = {
    INTERVAL: "INTERVAL", // 2音
    CHORD: "CHORD", // 3音
    RESONANCE: "RESONANCE", // 共鳴
}

export const STAGE = {
    SETUP: "SETUP",
    QUIZ: "QUIZ",
    REVIEW_INTRO: "REVIEW_INTRO",
    REVIEW: "REVIEW",
    COMPLETE: "COMPLETE",
};
