from fastapi import APIRouter

from wb.schemas import SuccessPayloadOutput, UserProfile
from wb.utils.current_user import current_employee
from wb.utils.query import make_success_output

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/profile', tags=['profile'])


@router.get('')
async def get_profile() -> SuccessPayloadOutput[UserProfile]:
    user = current_employee()
    return make_success_output(
        payload=UserProfile(
            id=user.id,
            english_name=user.english_name,
            email=user.email,
            account=user.account,
            photo=user.photo,
            hr=user.is_hr,
            admin=user.is_admin,
            timezone=user.timezone,
            roles=list(user.roles),
        ),
        metadata=None,
    )
