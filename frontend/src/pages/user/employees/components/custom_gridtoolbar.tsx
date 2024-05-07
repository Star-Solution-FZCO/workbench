import {
    GridToolbarColumnsButton,
    GridToolbarContainer,
} from "@mui/x-data-grid-pro";

const CustomGridToolbar = () => {
    return (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
        </GridToolbarContainer>
    );
};

export { CustomGridToolbar };
