import { useState } from "react";

export function useStats() {
    const [stats, setStats] = useState({});

    function init(items) {
        const obj = {};
        items.forEach(i => {
            obj[i.id] = { total: 0, wrong: 0 };
        });
        setStats(obj);
    }

    function record(id, wrong) {
        setStats(prev => ({
            ...prev,
            [id]: {
                total: prev[id].total + 1,
                wrong: prev[id].wrong + (wrong ? 1 : 0),
            },
        }));
    }

    return { stats, init, record };
}
