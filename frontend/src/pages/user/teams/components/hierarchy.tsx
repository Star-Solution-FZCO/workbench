import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ClearIcon from "@mui/icons-material/Clear";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    Button,
    IconButton,
    Modal,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { employeesApi } from "_redux";
import { FC, useRef, useState } from "react";
import Tree, { CustomNodeElementProps, TreeNodeDatum } from "react-d3-tree";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { centerNode, searchNodes } from "utils";
import "./hierarchy.scss";

const dimensions = {
    width: 1200,
    height: 800,
};

const translate = { x: 400, y: 100 };

const zoom = 1;

const CustomNode: FC<CustomNodeElementProps> = ({ nodeDatum, toggleNode }) => {
    const navigate = useNavigate();

    const handleClickTeam = () => {
        if (nodeDatum.attributes?.id === null) return;

        navigate(
            `/teams/view/${
                nodeDatum.attributes?.id
            }/${nodeDatum.name.replaceAll(" ", "+")}`,
        );
    };

    const handleClickManager = () => {
        // @ts-ignore
        if (!nodeDatum.attributes.manager) return;

        // @ts-ignore
        navigate(`/people/view/${nodeDatum.attributes.manager.id}`);
    };

    const teamWordCount =
        nodeDatum.name.split(" ").length > 2
            ? nodeDatum.name.split(" ").length
            : 1;

    const wordCount = teamWordCount + 1;

    if (nodeDatum.attributes?.id === null)
        return (
            <g>
                <rect
                    height="99"
                    width="10"
                    x="-5"
                    fill="white"
                    strokeWidth="0"
                />
            </g>
        );

    return (
        <g className="team-node">
            <circle cx="0" cy="20" r="20" onClick={toggleNode} />

            <rect
                x="-110"
                y="45"
                width="220"
                height={wordCount * 20}
                fill="white"
                strokeWidth="0"
            />

            <text fill="black" strokeWidth="1" x="0" y="60" textAnchor="middle">
                <tspan x="0" className="text" onClick={handleClickTeam}>
                    {nodeDatum.name}
                </tspan>

                {/* @ts-ignore */}
                {nodeDatum.attributes.manager && (
                    <tspan
                        x="0"
                        dy="1.2em"
                        className="text"
                        onClick={handleClickManager}
                    >
                        {/* @ts-ignore */}
                        {nodeDatum.attributes.manager.english_name}
                    </tspan>
                )}
            </text>
        </g>
    );
};

const TeamHierarchy = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [foundNodes, setFoundNodes] = useState<TreeNodeDatum[]>([]);
    const [selectedNode, setSelectedNode] = useState<TreeNodeDatum | null>(
        null,
    );

    const treeRef = useRef<Tree | null>(null);

    const { data } = employeesApi.useGetTeamHierarchyQuery();

    const handleClickSearch = () => {
        if (query === "") return;
        if (!data?.payload) return;
        if (!treeRef.current) return;

        const root = treeRef.current.state.data.length
            ? treeRef.current.state.data[0]
            : null;

        if (!root) return;

        const nodes = searchNodes(root, query);

        if (nodes.length === 0) {
            toast.error("No team found", {
                position: "top-center",
            });
            return;
        }

        setFoundNodes(nodes);
        setSelectedNode(nodes[0]);
        centerNode(nodes[0], treeRef, dimensions, zoom);
    };

    const handleClickClear = () => {
        setQuery("");
        setFoundNodes([]);
        setSelectedNode(null);
    };

    const handleNodeChange = (step: number) => {
        if (!selectedNode) return;

        const index = foundNodes.indexOf(selectedNode);
        const newIndex = (index + step + foundNodes.length) % foundNodes.length;

        setSelectedNode(foundNodes[newIndex]);
        centerNode(foundNodes[newIndex], treeRef, dimensions, zoom);
    };

    const handleClickNext = () => {
        handleNodeChange(1);
    };

    const handleClickPrev = () => {
        handleNodeChange(-1);
    };

    const handleClose = () => {
        setOpen(false);
        setQuery("");
    };

    if (!data?.payload) return null;

    return (
        <>
            <Tooltip title="Team hierarchy">
                <Button
                    onClick={() => setOpen(true)}
                    variant="outlined"
                    color="warning"
                    size="small"
                >
                    <AccountTreeIcon />
                </Button>
            </Tooltip>

            <Modal open={open} onClose={handleClose}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "#FFF",
                        borderRadius: 1,
                        p: 1,
                        width: "1200px",
                        height: "800px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                    }}
                >
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography fontWeight={500}>Team hierarchy</Typography>
                        <IconButton onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                        <TextField
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleClickSearch()
                            }
                            label="Search by team name"
                            size="small"
                            fullWidth
                        />

                        <Button
                            onClick={handleClickSearch}
                            variant="outlined"
                            size="small"
                            color="info"
                            disabled={!query}
                        >
                            <SearchIcon />
                        </Button>

                        <Button
                            onClick={handleClickClear}
                            variant="outlined"
                            size="small"
                            color="error"
                            disabled={!query}
                        >
                            <ClearIcon />
                        </Button>
                    </Box>

                    {foundNodes.length ? (
                        <Box display="flex" alignSelf="flex-end" gap={1}>
                            <Typography>
                                Found {foundNodes.length} team
                                {foundNodes.length > 1 ? "s" : ""}
                            </Typography>

                            {foundNodes.length > 1 ? (
                                <>
                                    <IconButton
                                        sx={{ p: 0 }}
                                        onClick={handleClickPrev}
                                    >
                                        <ArrowBackIcon />
                                    </IconButton>

                                    <IconButton
                                        sx={{ p: 0 }}
                                        onClick={handleClickNext}
                                    >
                                        <ArrowForwardIcon />
                                    </IconButton>
                                </>
                            ) : null}
                        </Box>
                    ) : null}

                    <Tree
                        ref={treeRef}
                        // @ts-ignore
                        data={data?.payload}
                        orientation="vertical"
                        collapsible={false}
                        renderCustomNodeElement={(props) => (
                            <CustomNode {...props} />
                        )}
                        zoom={zoom}
                        scaleExtent={{ min: 0.1, max: 1.5 }}
                        dimensions={dimensions}
                        translate={translate}
                        pathFunc="step"
                        nodeSize={{ x: 250, y: 200 }}
                    />
                </Box>
            </Modal>
        </>
    );
};

export { TeamHierarchy };
