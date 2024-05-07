import { EmployeePresence, Title } from "_components";
import { useAppSelector } from "_redux";

const MyPresence = () => {
    const id = useAppSelector((state) => state.profile.payload.id);
    return (
        <>
            <Title title="My Presence" />

            <EmployeePresence id={id} />
        </>
    );
};

export default MyPresence;
