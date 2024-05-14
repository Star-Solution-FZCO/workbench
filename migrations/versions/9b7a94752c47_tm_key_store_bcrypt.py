"""tm_key_store_bcrypt

Revision ID: 9b7a94752c47
Revises: aa7d34952751
Create Date: 2024-05-09 13:57:06.396283

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '9b7a94752c47'
down_revision = 'aa7d34952751'
branch_labels = None
depends_on = None


def _is_empty_table(table_name: str) -> None:
    with op.get_context().autocommit_block():
        conn = op.get_bind()
        res = conn.execute(sa.text(f'SELECT COUNT(*) FROM {table_name}'))
        cnt = res.scalar()
        if cnt != 0:
            raise ValueError(f'Table {table_name} is not empty {cnt=}')


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    _is_empty_table('employee__tm')
    op.drop_column('employee__tm', 'key')
    op.add_column('employee__tm', sa.Column('key_hash', sa.String(), nullable=False))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    _is_empty_table('employee__tm')
    op.drop_column('employee__tm', 'key_hash')
    op.add_column('employee__tm', sa.Column('key', postgresql.BYTEA(), nullable=False))
    # ### end Alembic commands ###