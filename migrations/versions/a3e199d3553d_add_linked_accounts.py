"""add linked accounts

Revision ID: a3e199d3553d
Revises: 9b7a94752c47
Create Date: 2024-05-22 19:50:05.352453

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a3e199d3553d'
down_revision = '9b7a94752c47'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('linked_account_sources',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('type', sa.String(length=32), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('config', postgresql.BYTEA(), nullable=True),
    sa.Column('active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.Column('public', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('linked_accounts',
    sa.Column('employee_id', sa.Integer(), nullable=False),
    sa.Column('source_id', sa.Integer(), nullable=False),
    sa.Column('account_id', sa.String(), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], name='linked_accounts_employee_id_fkey', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['source_id'], ['linked_account_sources.id'], name='linked_accounts_source_id_fkey', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('employee_id', 'source_id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('linked_accounts')
    op.drop_table('linked_account_sources')
    # ### end Alembic commands ###
