import { Button, FormControl, Grid } from "@mui/material";
import { FormReduxSelectField } from "_components";
import { employeesApi } from "_redux";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { SelectOptionT } from "types/index";

type EditEmployeeTeamFormT = {
    id: number;
    team: SelectOptionT | null;
};

type EditEmployeeTeamFormPropsT = {
    initialValues: EditEmployeeTeamFormT;
    onSuccess?: () => void;
};

export const EditEmployeeTeamForm: React.FC<EditEmployeeTeamFormPropsT> = ({
    initialValues,
    onSuccess = () => {},
}) => {
    const methods = useForm<EditEmployeeTeamFormT>({
        defaultValues: initialValues,
    });
    const [updateEmployee] = employeesApi.useUpdateEmployeeMutation();

    const handleOnSubmit = (formData: EditEmployeeTeamFormT) => {
        updateEmployee(formData);
        onSuccess();
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleOnSubmit, () => {})}>
                <Grid container spacing={1}>
                    <Grid item xs={12}>
                        <FormControl sx={{ m: 1, width: "16rem" }}>
                            <FormReduxSelectField
                                name="team"
                                label="Team"
                                control={methods.control}
                                optionsLoadFn={
                                    employeesApi.useListTeamSelectQuery
                                }
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Button disabled={false} type="submit">
                            Update
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </FormProvider>
    );
};
