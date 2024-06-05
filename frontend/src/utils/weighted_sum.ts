const gradientStart = [214, 230, 133];
const gradientEnd = [30, 104, 35];
const maxScore = 15;

export const weightedSumGradientColor = (score: number) => {
    if (score <= 0) {
        return "#cccccc";
    }
    const gradientResult = [];
    for (let i = 0; i < 3; i++) {
        if (score > maxScore) {
            score = maxScore;
        }
        gradientResult[i] = Math.round(
            gradientStart[i] +
                ((gradientEnd[i] - gradientStart[i]) * score) / maxScore,
        )
            .toString(16)
            .padStart(2, "0");
    }
    return `#${gradientResult.join("")}`;
};
