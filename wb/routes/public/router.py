import os

import sqlalchemy as sa
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session

__all__ = ('router',)

router = APIRouter(prefix='/public')


jinja_env = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates')),
    autoescape=True,
)


@router.get('/start-page')
async def get_start_page(
    session: AsyncSession = Depends(get_db_session),
) -> HTMLResponse:
    jinja_template = jinja_env.get_template('start_page.html.jinja2')
    results = await session.scalars(sa.select(m.UsefulLink).order_by(m.UsefulLink.name))
    return HTMLResponse(content=jinja_template.render(links=results.all()))
