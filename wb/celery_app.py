from celery import Celery
from celery.schedules import crontab

from wb.config import CONFIG

__all__ = ('celery_app',)


celery_app = Celery('wb')
celery_app.conf.broker_url = CONFIG.CELERY_BROKER_URL
celery_app.conf.result_backend = CONFIG.CELERY_BROKER_URL
celery_app.autodiscover_tasks(
    [
        'wb.tasks',
        'wb.tasks.scheduled',
    ]
)
celery_app.conf.beat_schedule = {
    'task-quarter-grade-check': {
        'task': 'quarter_grade_check',
        'schedule': crontab(
            hour='10', minute='0', day_of_month='1', month_of_year='*/3'
        ),
    },
    'task-weekly-null-team-check': {
        'task': 'weekly_null_team_check',
        'schedule': crontab(hour='9', minute='0', day_of_week='1'),
    },
    'task-collect-activities': {
        'task': 'collect_activities',
        'schedule': crontab(hour='*/4', minute='0'),
    },
    'task-update-done-tasks': {
        'task': 'update_done_tasks',
        'schedule': crontab(
            hour='2,6,10,14,18,22', minute='0'
        ),  # same as 2/4, but celery does not support it
    },
    'task-maintenance-create-next-month-partitions': {
        'task': 'maintenance_create_next_month_partitions',
        'schedule': crontab(hour='3', minute='3', day_of_month='3'),
    },
    'task-weekly-activity-reports': {
        'task': 'weekly_activity_reports',
        'schedule': crontab(hour='6', minute='0', day_of_week='1'),
    },
    'task-correct-yesterday-tm-log': {
        'task': 'correct_yesterday_tm_log',
        'schedule': crontab(hour='5', minute='0'),
    },
    'task-tm-auto-leave': {
        'task': 'tm_auto_leave',
        'schedule': crontab(hour='*/2', minute='55'),
    },
    'task-monthly-team-changes-report': {
        'task': 'monthly_team_changes_report',
        'schedule': crontab(hour='5', minute='17', day_of_month='1'),
    },
    'task-weekly-activity-monitor': {
        'task': 'weekly_activity_monitor',
        'schedule': crontab(hour='9', minute='0', day_of_week='1'),
    },
    'task-daily-activity-monitor': {
        'task': 'daily_activity_monitor',
        'schedule': crontab(hour='9', minute='15', day_of_week='1-5'),
    },
    'task-monthly-counteragents-check': {
        'task': 'monthly_counteragents_check',
        'schedule': crontab(hour='6', minute='0', day_of_month='1'),
    },
}

if CONFIG.YOUTRACK_URL:
    celery_app.conf.beat_schedule.update(
        {
            'task-sync-youtrack-projects': {
                'task': 'sync_youtrack_projects',
                'schedule': crontab(hour='1', minute='0'),
            },
            'task-weekly-collect-issues': {
                'task': 'weekly_collect_issues',
                'schedule': crontab(hour='0', minute='1', day_of_week='monday'),
            },
        }
    )
