import ContactsIcon from "@mui/icons-material/Contacts";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import TelegramIcon from "@mui/icons-material/Telegram";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
    Box,
    Button,
    Link,
    MenuItem,
    Select,
    SvgIcon,
    TextField,
    Typography,
} from "@mui/material";
import PararamIcon from "assets/icons/pararam";
import { contactTypes } from "config";
import { FC, useState } from "react";
import { useFormContext } from "react-hook-form";
import { ContactT, ContactTypeT } from "types";
import EditableWrapper from "./editable_wrapper";

const iconMap: Record<ContactTypeT, typeof SvgIcon> = {
    phone: PhoneIcon,
    email: EmailIcon,
    // @ts-ignore
    pararam: PararamIcon,
    telegram: TelegramIcon,
    whatsapp: WhatsAppIcon,
    other: ContactsIcon,
};

interface IContactProps {
    contact: ContactT;
}

interface IBaseContactProps extends IContactProps {
    link?: string;
}

const BaseContact: FC<IBaseContactProps> = ({ contact, link }) => {
    const Icon = iconMap[contact.type];

    return (
        <Box display="flex" gap={0.5} alignItems="center">
            <Icon />

            {contact.type !== "other" ? (
                <Link href={link} target="_blank" rel="noopener noreferrer">
                    {contact.value}
                </Link>
            ) : (
                <Typography>{contact.value}</Typography>
            )}
        </Box>
    );
};

const PhoneContact: FC<IContactProps> = ({ contact }) => {
    return <BaseContact link={`tel:${contact.value}`} contact={contact} />;
};

const EmailContact: FC<IContactProps> = ({ contact }) => {
    return <BaseContact link={`mailto:${contact.value}`} contact={contact} />;
};

const PararamContact: FC<IContactProps> = ({ contact }) => {
    return (
        <BaseContact
            link={`https://app.pararam.io/#/threads/new-pm/${contact.value}`}
            contact={contact}
        />
    );
};

const TelegramContact: FC<IContactProps> = ({ contact }) => {
    return (
        <BaseContact link={`https://t.me/${contact.value}`} contact={contact} />
    );
};

const WhatsAppContact: FC<IContactProps> = ({ contact }) => {
    return (
        <BaseContact
            link={`https://wa.me/${contact.value}`}
            contact={contact}
        />
    );
};

const OtherContact: FC<IContactProps> = ({ contact }) => {
    return <BaseContact contact={contact} />;
};

const contactComponentMap: Record<ContactTypeT, FC<IContactProps>> = {
    phone: PhoneContact,
    email: EmailContact,
    pararam: PararamContact,
    telegram: TelegramContact,
    whatsapp: WhatsAppContact,
    other: OtherContact,
};

interface IContactsPreviewProps {
    contacts: ContactT[];
}

const ContactsPreview: FC<IContactsPreviewProps> = ({ contacts }) => {
    return (
        <Box display="flex" flexDirection="column">
            {contacts.map((contact, index) => {
                const Component = contactComponentMap[contact.type];
                return <Component key={index} contact={contact} />;
            })}
        </Box>
    );
};

interface IContactsEditFieldProps {
    name: string;
    value: ContactT[];
    setValue: any;
}

export const ContactsEditField: FC<IContactsEditFieldProps> = ({
    name,
    value,
    setValue,
}) => {
    const [contacts, setContacts] = useState<ContactT[]>(value);

    const handleClickAdd = () => {
        const newContacts: ContactT[] = [
            ...contacts,
            {
                type: "other",
                value: "",
            },
        ];

        setContacts(newContacts);
        setValue(name, newContacts);
    };

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            {contacts.map((contact, index) => (
                <Box display="flex" gap={0.5} key={index}>
                    <Select
                        sx={{ height: "40px" }}
                        value={contact.type}
                        onChange={(e) => {
                            const newContacts = [...contacts];
                            newContacts[index] = {
                                ...newContacts[index],
                                type: e.target.value as ContactTypeT,
                            };
                            setContacts(newContacts);
                            setValue(name, newContacts);
                        }}
                    >
                        {contactTypes.map((type) => {
                            const Icon = iconMap[type];
                            return (
                                <MenuItem
                                    key={type}
                                    value={type}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Icon />
                                </MenuItem>
                            );
                        })}
                    </Select>

                    <TextField
                        sx={{ height: "40px" }}
                        value={contact.value}
                        onChange={(e) => {
                            const newContacts = [...contacts];
                            newContacts[index] = {
                                ...newContacts[index],
                                value: e.target.value,
                            };
                            setContacts(newContacts);
                            setValue(name, newContacts);
                        }}
                        size="small"
                        fullWidth
                    />
                </Box>
            ))}

            <Button
                sx={{ height: "40px" }}
                onClick={handleClickAdd}
                variant="outlined"
                size="small"
            >
                Add contacts
            </Button>
        </Box>
    );
};

interface IContactsFieldProps {
    value: ContactT[];
    label: string;
    name: string;
    editable: boolean;
    editMode: boolean;
    onChangeEditMode: () => void;
}

const ContactsField: FC<IContactsFieldProps> = (props) => {
    const { value: contacts, name } = props;

    const { setValue } = useFormContext();

    return (
        <EditableWrapper
            {...props}
            editModeChildren={
                <ContactsEditField
                    name={name}
                    value={contacts}
                    setValue={setValue}
                />
            }
            previewChildren={<ContactsPreview contacts={contacts} />}
        />
    );
};

export default ContactsField;
