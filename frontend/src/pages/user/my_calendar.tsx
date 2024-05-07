import { CalendarOnboarding, EmployeeCalendar, Title } from "_components";
import { useAppSelector } from "_redux";

const MyCalendar = () => {
    const id = useAppSelector((state) => state.profile.payload.id);
    return (
        <>
            <Title title="My Calendar" />

            <CalendarOnboarding>
                <EmployeeCalendar id={id} />
            </CalendarOnboarding>
        </>
    );
};

export default MyCalendar;
