import json
from datetime import datetime

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BasePayloadOutput,
    ListFilterParams,
    SelectFieldInt,
)
from wb.schemas.output import SelectOutput
from wb.schemas.params import SelectParams
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import (
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import (
    ConfirmQuizResult,
    EmployeeQuizResultOut,
    OptionCreate,
    OptionOut,
    OptionUpdate,
    QuestionCreate,
    QuestionOut,
    QuestionUpdate,
    QuizCreate,
    QuizOut,
    QuizUpdate,
    SubmitQuiz,
    TakeQuizOut,
)

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/quiz', tags=['v1', 'quiz'])


@router.get('/list')
async def list_quiz(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[QuizOut]:
    curr_user = current_employee()
    q = sa.select(m.Quiz)
    if not curr_user.is_admin:
        q = q.where(m.Quiz.is_active.is_(True))
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter, m.Quiz, available_fields=['name', 'is_active']
            )
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.Quiz.created,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Quiz,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=[
                'name',
                'created',
                'updated',
                'is_active',
                'pass_percent',
            ],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[QuizOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/select')
async def quiz_select(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.Quiz).where(m.Quiz.is_active.is_(True))
    if query.search:
        q = q.filter(m.Quiz.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('name'))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='name', value='id')
            for obj in results.all()
        ]
    )


@router.get('/result/list')
async def list_result(
    personal: bool | None = None,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[EmployeeQuizResultOut]:
    curr_user = current_employee()
    available_fields = ['quiz_id', 'passed']
    q = sa.select(m.EmployeeQuizResult).where(m.EmployeeQuizResult.finished.isnot(None))
    if curr_user.is_admin:
        available_fields.append('employee_id')
    if personal:
        q = q.where(m.EmployeeQuizResult.employee_id == curr_user.id)
    if query.filter:
        flt = filter_to_query(
            query.filter, m.EmployeeQuizResult, available_fields=available_fields
        )  # type: ignore
        q = q.filter(flt)  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.EmployeeQuizResult.created.desc(),)
    if query.sort_by:
        sorts = sort_to_query(
            m.EmployeeQuizResult,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['created', 'passed'],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[EmployeeQuizResultOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/result/{result_id}')
async def get_result(
    result_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[EmployeeQuizResultOut]:
    curr_user = current_employee()
    obj: m.EmployeeQuizResult | None = await session.scalar(
        sa.select(m.EmployeeQuizResult).where(
            m.EmployeeQuizResult.id == result_id,
            m.EmployeeQuizResult.finished.isnot(None),
        )
    )
    if not obj:
        raise HTTPException(404, detail='Quiz result not found')
    if not curr_user.is_admin and obj.employee_id != curr_user.id:
        raise HTTPException(403, detail='Forbidden')
    return make_success_output(payload=EmployeeQuizResultOut.from_obj(obj))


@router.get('/{quiz_id}')
async def get_quiz(
    quiz_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[QuizOut]:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Quiz | None = await session.scalar(
        sa.select(m.Quiz).where(m.Quiz.id == quiz_id, m.Quiz.is_active.is_(True))
    )
    if not obj:
        raise HTTPException(404, detail='Quiz not found')
    return make_success_output(payload=QuizOut.from_obj(obj))


@router.post('')
async def create_quiz(
    body: QuizCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    try:
        obj = m.Quiz(
            name=body.name, pass_percent=body.pass_percent, is_active=body.is_active
        )
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.put('/{quiz_id}')
async def update_quiz(
    quiz_id: int,
    body: QuizUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Quiz | None = await session.scalar(
        sa.select(m.Quiz).where(m.Quiz.id == quiz_id, m.Quiz.is_active.is_(True))
    )
    if not obj:
        raise HTTPException(404, detail='Quiz not found')
    if body.pool_question_count and body.pool_question_count > len(obj.questions):
        raise HTTPException(
            400,
            detail='Pool question count cannot be more than the number of questions',
        )
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    obj.updated = datetime.utcnow()
    if session.is_modified(obj):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.delete('/{quiz_id}')
async def delete_quiz(
    quiz_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Quiz | None = await session.scalar(
        sa.select(m.Quiz).where(m.Quiz.id == quiz_id)
    )
    if not obj:
        raise HTTPException(404, detail='Quiz not found')
    await session.delete(obj)
    await session.commit()
    return make_id_output(obj.id)


@router.get('/{quiz_id}/take')
async def take_quiz(
    quiz_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[TakeQuizOut]:
    curr_user = current_employee()
    obj: m.Quiz | None = await session.scalar(
        sa.select(m.Quiz).where(m.Quiz.id == quiz_id, m.Quiz.is_active.is_(True))
    )
    if not obj:
        raise HTTPException(404, detail='Quiz not found')
    result = m.EmployeeQuizResult(
        employee_id=curr_user.id, quiz_id=obj.id, passed=False
    )
    session.add(result)
    await session.flush()
    output_quiz = TakeQuizOut.from_obj(obj, result_id=result.id)
    for question in output_quiz.questions:
        answer = m.EmployeeAnswer(
            question=str(question.id),
            options='',
            result_id=result.id,
            correct=False,
        )
        session.add(answer)
    await session.commit()
    return make_success_output(payload=output_quiz)


@router.post('/{quiz_id}/submit')
async def submit_quiz(  # pylint: disable=too-many-locals
    quiz_id: int,
    body: SubmitQuiz,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    quiz: m.Quiz | None = await session.scalar(
        sa.select(m.Quiz).where(m.Quiz.id == quiz_id, m.Quiz.is_active.is_(True))
    )
    if not quiz:
        raise HTTPException(404, detail='Quiz not found')
    result: m.EmployeeQuizResult | None = await session.scalar(
        sa.select(m.EmployeeQuizResult).where(m.EmployeeQuizResult.id == body.result_id)
    )
    if not result:
        raise HTTPException(404, detail='Result not found')
    if (result.employee_id != curr_user.id) or (result.quiz_id != quiz.id):
        raise HTTPException(403, detail='Forbidden')
    if set(a.question_id for a in body.answers) != set(
        int(a.question) for a in result.answers
    ):
        raise HTTPException(400, detail="Questions don't match")
    correct_count = 0
    for answer, result_answer in zip(body.answers, result.answers):
        question = await session.scalar(
            sa.select(m.Question).where(m.Question.id == answer.question_id)
        )
        option = next(filter(lambda o, a=answer: o.id == a.option_id, question.options))
        if option.correct:
            correct_count = correct_count + 1
        result_answer.question = json.dumps(question.get_content_dict())
        result_answer.options = json.dumps(
            [
                o.get_content_dict(selected=o.id == answer.option_id)
                for o in question.options
            ]
        )
        result_answer.correct = option.correct
    score = round((correct_count / len(result.answers)), 2) * 100
    if score >= quiz.pass_percent:
        result.passed = True
        if not quiz.hard_confirm:
            result.confirmed = datetime.utcnow()
        elif score == 100:
            result.confirmed = datetime.utcnow()
    result.score = score
    result.finished = datetime.utcnow()
    await session.commit()
    return make_id_output(result.id)


@router.post('/result/{result_id}/confirm')
async def confirm_quiz_result(  # pylint: disable=too-many-locals
    result_id: int,
    body: ConfirmQuizResult,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    result: m.EmployeeQuizResult | None = await session.scalar(
        sa.select(m.EmployeeQuizResult).where(m.EmployeeQuizResult.id == result_id)
    )
    if not result:
        raise HTTPException(404, detail='Result not found')
    if result.employee_id != curr_user.id:
        raise HTTPException(403, detail='Forbidden')
    if result.confirmed:
        raise HTTPException(404, detail='Quiz already confirmed')
    if set(a.question_id for a in body.answers) != set(
        json.loads(a.question).get('id') for a in result.answers
    ):
        raise HTTPException(400, detail="Questions don't match")
    for answer in body.answers:
        question = await session.scalar(
            sa.select(m.Question).where(m.Question.id == answer.question_id)
        )
        option = next(filter(lambda o, a=answer: o.id == a.option_id, question.options))
        if not option.correct:
            raise HTTPException(400, detail='All questions must be answered correctly')
    result.confirmed = datetime.utcnow()
    await session.commit()
    return make_id_output(result.id)


@router.get('/question/list')
async def list_question(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[QuestionOut]:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    q = sa.select(m.Question)
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter,
                m.Question,
                available_fields=[
                    'quiz_id',
                    'title',
                ],
            )
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.Question.created,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Question,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['title', 'order', 'created', 'updated'],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[QuestionOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/question/{question_id}')
async def get_question(
    question_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[QuestionOut]:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Question | None = await session.scalar(
        sa.select(m.Question).where(m.Question.id == question_id)
    )
    if not obj:
        raise HTTPException(404, detail='Quesion not found')
    return make_success_output(payload=QuestionOut.from_obj(obj))


@router.post('/question')
async def create_question(
    body: QuestionCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    quiz: m.Quiz | None = await session.scalar(
        sa.select(m.Quiz).where(m.Quiz.id == body.quiz_id)
    )
    if not quiz:
        raise HTTPException(404, detail='Quiz not found')
    try:
        quiz.updated = datetime.utcnow()
        question = m.Question(
            quiz_id=quiz.id,
            order=body.order,
        )
        session.add(question)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(question.id)


@router.put('/question/{question_id}')
async def update_question(
    question_id: int,
    body: QuestionUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Question | None = await session.scalar(
        sa.select(m.Question).where(m.Question.id == question_id)
    )
    if not obj:
        raise HTTPException(404, detail='Question not found')
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    obj.updated = datetime.utcnow()
    obj.quiz.updated = datetime.utcnow()
    if session.is_modified(obj):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.delete('/question/{question_id}')
async def delete_question(
    question_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.Question | None = await session.scalar(
        sa.select(m.Question).where(m.Question.id == question_id)
    )
    if not obj:
        raise HTTPException(404, detail='Question not found')
    obj.quiz.updated = datetime.utcnow()
    await session.delete(obj)
    questions = await session.scalars(
        sa.select(m.Question).where(m.Question.quiz_id == obj.quiz_id)
    )
    for index, question in enumerate(questions.all()):
        question.order = index + 1
    await session.commit()
    return make_id_output(obj.id)


@router.get('/option/list')
async def list_options(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[OptionOut]:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    q = sa.select(m.QuestionOption)
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter,
                m.QuestionOption,
                available_fields=['question_id', 'correct'],
            )
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.QuestionOption.order,)
    if query.sort_by:
        sorts = sort_to_query(
            m.QuestionOption,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['order', 'correct'],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[OptionOut.from_obj(obj) for obj in results.all()],
    )


@router.post('/option')
async def create_option(
    body: OptionCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    question: m.Question | None = await session.scalar(
        sa.select(m.Question).where(m.Question.id == body.question_id)
    )
    if not question:
        raise HTTPException(404, detail='Question not found')
    try:
        question.quiz.updated = datetime.utcnow()
        option = m.QuestionOption(
            question_id=question.id,
            order=body.order,
        )
        session.add(option)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(option.id)


@router.put('/option/{option_id}')
async def update_option(
    option_id: int,
    body: OptionUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.QuestionOption | None = await session.scalar(
        sa.select(m.QuestionOption).where(m.QuestionOption.id == option_id)
    )
    if not obj:
        raise HTTPException(404, detail='Question option not found')
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    obj.question.quiz.updated = datetime.utcnow()
    if session.is_modified(obj):
        try:
            await session.commit()
        except IntegrityError as err:
            raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.delete('/option/{option_id}')
async def delete_option(
    option_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='Forbidden')
    obj: m.QuestionOption | None = await session.scalar(
        sa.select(m.QuestionOption).where(m.QuestionOption.id == option_id)
    )
    if not obj:
        raise HTTPException(404, detail='Question option not found')
    obj.question.quiz.updated = datetime.utcnow()
    await session.delete(obj)
    question_options = await session.scalars(
        sa.select(m.QuestionOption).where(
            m.QuestionOption.question_id == obj.question.id
        )
    )
    for index, option in enumerate(question_options.all()):
        option.order = index + 1
    await session.commit()
    return make_id_output(obj.id)
