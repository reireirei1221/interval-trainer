import { useState, useMemo } from "react";
import { STAGE } from "../constants/music";

export function useQuizEngine() {
    const [stage, setStage] = useState(STAGE.SETUP);
    const [questions, setQuestions] = useState([]);
    const [index, setIndex] = useState(0);

    const currentQuestion = useMemo(() => {
        return questions[index] ?? null;
    }, [questions, index]);

    function next() {
        if (index + 1 < questions.length) {
            setIndex(i => i + 1);
        } else {
            setStage(STAGE.REVIEW_INTRO);
        }
    }

    function reset() {
        setStage(STAGE.SETUP);
        setQuestions([]);
        setIndex(0);
    }

    return {
        stage,
        setStage,
        questions,
        setQuestions,
        index,
        currentQuestion,
        next,
        reset,
    };
}
