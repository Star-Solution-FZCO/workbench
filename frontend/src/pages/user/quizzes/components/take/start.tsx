import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, Button, Typography } from "@mui/material";
import { FC } from "react";
import { TakeQuizT } from "types";

interface IStartQuizProps {
    quiz: TakeQuizT;
    onStart: () => void;
}

const StartQuiz: FC<IStartQuizProps> = ({ quiz, onStart }) => {
    const handleClickStart = () => {
        onStart();
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            border="1px solid #ccc"
            boxShadow={1}
            borderRadius={1}
            height="100%"
            gap={2}
        >
            <Typography variant="h4">Quiz: "{quiz.name}"</Typography>

            <Typography>
                {quiz.questions.length} questions. To pass the quiz you need to
                score {quiz.pass_percent}%
            </Typography>

            <Button
                onClick={handleClickStart}
                variant="outlined"
                color="success"
                startIcon={<PlayArrowIcon />}
            >
                Start quiz
            </Button>
        </Box>
    );
};

export { StartQuiz };
