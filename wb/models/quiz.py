from datetime import datetime
from typing import List

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from wb.db import BaseDBModel

from .employee import Employee

__all__ = (
    'Quiz',
    'Question',
    'QuestionOption',
    'EmployeeQuizResult',
    'EmployeeAnswer',
)


class Quiz(BaseDBModel):
    __tablename__ = 'quizzes'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    pass_percent: Mapped[int]
    questions: Mapped[List['Question']] = relationship(
        back_populates='quiz',
        lazy='selectin',
        cascade='all, delete',
    )
    pool_question_count: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(default=True)
    hard_confirm: Mapped[bool] = mapped_column(default=True)


class Question(BaseDBModel):
    __tablename__ = 'quiz_questions'

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'quizzes.id', name='quiz_questions_quiz_id_fkey', ondelete='CASCADE'
        ),
    )
    quiz: Mapped['Quiz'] = relationship(
        foreign_keys=[quiz_id], back_populates='questions', lazy='selectin'
    )
    options: Mapped[List['QuestionOption']] = relationship(
        back_populates='question',
        lazy='selectin',
        cascade='all, delete',
    )
    title: Mapped[str] = mapped_column(default='')
    content: Mapped[str] = mapped_column(default='')
    solution: Mapped[str] = mapped_column(default='')
    required: Mapped[bool] = mapped_column(default=False)
    type: Mapped[str] = mapped_column(default='single')
    order: Mapped[int]
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )

    def get_content_dict(self) -> dict:
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'solution': self.solution,
        }


class QuestionOption(BaseDBModel):
    __tablename__ = 'quiz_question_options'

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'quiz_questions.id',
            name='quiz_question_options_question_id_fkey',
            ondelete='CASCADE',
        )
    )
    question: Mapped['Question'] = relationship(
        foreign_keys=[question_id],
        back_populates='options',
        lazy='selectin',
    )
    content: Mapped[str] = mapped_column(default='')
    correct: Mapped[bool] = mapped_column(default=False)
    order: Mapped[int]

    def get_content_dict(self, selected: bool) -> dict:
        data = {
            'id': self.id,
            'content': self.content,
            'selected': selected,
            'correct': self.correct,
        }
        return data


class EmployeeQuizResult(BaseDBModel):
    __tablename__ = 'quiz_employee_results'

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id',
            name='quiz_employee_results_employee_id_fkey',
            ondelete='CASCADE',
        )
    )
    employee: Mapped[Employee] = relationship(
        foreign_keys=[employee_id], lazy='selectin'
    )
    quiz_id: Mapped[int] = mapped_column(
        sa.ForeignKey('quizzes.id', name='quiz_employee_results_quiz_id_fkey')
    )
    quiz: Mapped['Quiz'] = relationship(foreign_keys=[quiz_id], lazy='selectin')
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    finished: Mapped[datetime | None]
    confirmed: Mapped[datetime | None]
    answers: Mapped[List['EmployeeAnswer']] = relationship(
        back_populates='result', lazy='selectin', cascade='all, delete'
    )
    passed: Mapped[bool]
    score: Mapped[int] = mapped_column(default=0)


class EmployeeAnswer(BaseDBModel):
    __tablename__ = 'quiz_employee_answers'

    id: Mapped[int] = mapped_column(primary_key=True)
    question: Mapped[str]
    options: Mapped[str]
    result_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'quiz_employee_results.id',
            name='quiz_employee_answers_result_id_fkey',
            ondelete='CASCADE',
        )
    )
    result: Mapped['EmployeeQuizResult'] = relationship(
        foreign_keys=[result_id], lazy='selectin'
    )
    correct: Mapped[bool]
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
