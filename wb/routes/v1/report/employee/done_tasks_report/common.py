from pydantic import Field

from .._base import BaseReportItem

__all__ = ('ReportItem',)


class ReportItem(BaseReportItem):
    issues: int = Field(title='Resolved issues', default=0)
    gerrit_commits: int = Field(title='Gerrit commits merged', default=0)
    gerrit_comments: int = Field(title='Gerrit comments in reviews', default=0)
    cvs_commits: int = Field(title='CVS Commits', default=0)
    vacations: int = Field(title='Vacations', default=0)
    sick_days: int = Field(title='Sick days', default=0)
    working_days: int = Field(title='Working days', default=0)
