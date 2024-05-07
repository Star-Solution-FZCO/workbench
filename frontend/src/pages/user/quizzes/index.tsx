import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import QuizEdit from "./edit";
import QuizList from "./list";
import QuizResultView from "./result";
import QuizResultList from "./results";
import QuizTake from "./take";
import QuizView from "./view";

const Quizzes = () => {
    return (
        <>
            <Title title="Quizzes" />

            <Routes>
                <Route path=":quiz_id/edit" element={<QuizEdit />} />
                <Route
                    path=":quiz_id/edit/question/:question_id"
                    element={<QuizEdit />}
                />
                <Route
                    path="my-results"
                    element={<QuizResultList personal />}
                />
                <Route path="results" element={<QuizResultList />} />
                <Route path="results/:id" element={<QuizResultView />} />
                <Route path=":quiz_id/view" element={<QuizView />} />
                <Route path=":quiz_id/take" element={<QuizTake />} />
                <Route index element={<QuizList />} />
            </Routes>
        </>
    );
};

export default Quizzes;
