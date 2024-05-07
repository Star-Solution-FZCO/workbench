import json
import random
import typing as t
from datetime import datetime

from pydantic import BaseModel

from wb.schemas import BaseOutModel, ShortEmployeeOut
from wb.utils.current_user import current_employee

if t.TYPE_CHECKING:
    import wb.models as m

__all__ = (
    'ConfirmQuizResult',
    'EmployeeQuizResultOut',
    'OptionOut',
    'OptionUpdate',
    'QuestionOut',
    'QuestionUpdate',
    'QuizCreate',
    'QuizOut',
    'QuizUpdate',
    'SubmitQuiz',
    'TakeQuizOut',
)


class BaseOptionOut(BaseOutModel['m.QuestionOption']):
    id: int
    content: str


class OptionOut(BaseOptionOut):
    correct: bool
    order: int


class BaseQuestionOut(BaseOutModel['m.Question']):
    id: int
    title: str
    content: str


class QuestionOut(BaseQuestionOut):
    solution: str
    type: str
    order: int
    options: t.List['OptionOut']
    created: datetime
    updated: datetime
    required: bool

    @classmethod
    def from_obj(cls, obj: 'm.Question') -> t.Self:
        options = [
            OptionOut.from_obj(option)
            for option in sorted(obj.options, key=lambda o: o.order)
        ]
        data = {
            'id': obj.id,
            'title': obj.title,
            'content': obj.content,
            'solution': obj.solution,
            'type': obj.type,
            'order': obj.order,
            'options': options,
            'created': obj.created,
            'updated': obj.updated,
            'required': obj.required,
        }
        return cls(**data)  # type: ignore


class BaseQuizOut(BaseOutModel['m.Quiz']):
    id: int
    name: str
    pass_percent: int


class QuizOut(BaseQuizOut):
    pool_question_count: int
    questions: t.List['QuestionOut']
    is_active: bool
    hard_confirm: bool
    created: datetime
    updated: datetime

    @classmethod
    def from_obj(cls, obj: 'm.Quiz') -> t.Self:
        data = {
            'id': obj.id,
            'name': obj.name,
            'pass_percent': obj.pass_percent,
            'pool_question_count': obj.pool_question_count,
            'questions': [QuestionOut.from_obj(question) for question in obj.questions],
            'created': obj.created,
            'updated': obj.updated,
            'is_active': obj.is_active,
            'hard_confirm': obj.hard_confirm,
        }
        return cls(**data)  # type: ignore


class TakeQuizQuestion(BaseQuestionOut):
    options: t.List['BaseOptionOut']

    @classmethod
    def from_obj(cls, obj: 'm.Question') -> t.Self:
        options = [
            BaseOptionOut.from_obj(option)
            for option in sorted(obj.options, key=lambda o: o.order)
        ]
        data = {
            'id': obj.id,
            'title': obj.title,
            'content': obj.content,
            'options': options,
        }
        return cls(**data)  # type: ignore


class TakeQuizOut(BaseQuizOut):
    questions: t.List['TakeQuizQuestion']
    result_id: int

    @classmethod
    def from_obj(  # pylint: disable=arguments-differ
        cls, obj: 'm.Quiz', result_id: int
    ) -> t.Self:
        questions = [q for q in obj.questions if q.required]
        k = obj.pool_question_count if obj.pool_question_count else len(obj.questions)
        if len(questions) < k:
            questions.extend(
                random.sample(
                    [q for q in obj.questions if not q.required], k - len(questions)
                )
            )
        random.shuffle(questions)
        data = {
            'id': obj.id,
            'name': obj.name,
            'questions': [
                TakeQuizQuestion.from_obj(question) for question in questions
            ],
            'pass_percent': obj.pass_percent,
            'result_id': result_id,
        }
        return cls(**data)  # type: ignore


class QuizCreate(BaseModel):
    name: str
    pass_percent: int
    is_active: bool


class QuizUpdate(BaseModel):
    name: str | None = None
    pass_percent: int | None = None
    pool_question_count: int | None = None
    is_active: bool | None = None
    hard_confirm: bool | None = None


class QuestionCreate(BaseModel):
    quiz_id: int
    order: int


class OptionCreate(BaseModel):
    question_id: int
    order: int


class QuestionUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    solution: str | None = None
    type: str | None = None
    order: int | None = None
    required: bool | None = None


class OptionUpdate(BaseModel):
    content: str | None = None
    correct: bool | None = None
    order: int | None = None


class Answer(BaseModel):
    question_id: int
    option_id: int


class AnswerList(BaseModel):
    answers: list[Answer]


class SubmitQuiz(AnswerList):
    result_id: int


class ConfirmQuizResult(AnswerList):
    pass


class BaseContent(BaseModel):
    id: int
    content: str


class QuestionContent(BaseContent):
    title: str
    solution: str


class EmployeeAnswerOption(BaseContent):
    selected: bool
    correct: bool


class EmployeeAnswerOut(BaseModel):
    id: int
    order: int
    question: QuestionContent
    options: list[EmployeeAnswerOption]
    correct: bool
    created: datetime

    @classmethod
    def from_obj(
        cls, obj: 'm.EmployeeAnswer', order: int, hide_correct_option: bool = False
    ) -> t.Self:
        options = json.loads(obj.options)
        if hide_correct_option:
            for option in options:
                option['correct'] = False
        data = {
            'id': obj.id,
            'order': order,
            'question': json.loads(obj.question),
            'options': options,
            'correct': obj.correct,
            'created': obj.created,
        }
        return cls(**data)  # type: ignore


class EmployeeQuizResultOut(BaseOutModel['m.EmployeeQuizResult']):
    id: int
    employee: ShortEmployeeOut
    quiz: BaseQuizOut
    created: datetime
    finished: datetime | None
    confirmed: datetime | None
    created: datetime
    answers: list[EmployeeAnswerOut]
    number_of_answers: int
    passed: bool
    score: int
    can_confirm: bool

    @classmethod
    def from_obj(cls, obj: 'm.EmployeeQuizResult') -> t.Self:
        curr_user = current_employee()
        can_confirm = (
            curr_user.id == obj.employee_id
            and obj.passed
            and obj.score != 100
            and not obj.confirmed
            and obj.quiz.hard_confirm
        )
        data = {
            'id': obj.id,
            'employee': ShortEmployeeOut.from_obj(obj.employee),
            'quiz': BaseQuizOut.from_obj(obj.quiz),
            'created': obj.created,
            'finished': obj.finished,
            'confirmed': obj.confirmed,
            'answers': [
                EmployeeAnswerOut.from_obj(
                    answer,
                    order=order,
                    hide_correct_option=not obj.passed and not answer.correct,
                )
                for order, answer in enumerate(obj.answers, start=1)
            ],
            'number_of_answers': len(obj.answers),
            'passed': obj.passed,
            'score': obj.score,
            'can_confirm': can_confirm,
        }
        return cls(**data)  # type: ignore
