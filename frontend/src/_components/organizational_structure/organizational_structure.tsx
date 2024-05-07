import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ClearIcon from "@mui/icons-material/Clear";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { HierarchyPointNode } from "d3-hierarchy";
import { FC, useRef, useState } from "react";
import Tree, { CustomNodeElementProps, TreeNodeDatum } from "react-d3-tree";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { EmployeeHierarchyT } from "types";
import { centerNode, searchNodes } from "utils";
import { avatarUrl } from "utils/url";
import "./organizational_structure.scss";

const dimensions = {
    width: 1200,
    height: 800,
};

const zoom = 1;

const makeCollapsedTreeData = (
    node: HierarchyPointNode<TreeNodeDatum>,
    data: TreeNodeDatum[],
): TreeNodeDatum[] => {
    const traverse = (currentNode: TreeNodeDatum): TreeNodeDatum => {
        const isAncestorOrDescendant = (otherNode: TreeNodeDatum): boolean => {
            const ancestors = node.ancestors().map((a) => a.data.__rd3t.id);
            // const descendants = node.descendants().map((d) => d.data.__rd3t.id);

            return ancestors.includes(otherNode.__rd3t.id);
            // || descendants.includes(otherNode.__rd3t.id)
        };

        const newNode: TreeNodeDatum = {
            ...currentNode,
            children: currentNode.children?.map((child) => traverse(child)),
            __rd3t: {
                ...currentNode.__rd3t,
                collapsed: !isAncestorOrDescendant(currentNode),
            },
        };
        return newNode;
    };

    const updatedData: TreeNodeDatum[] = data.map((node) => traverse(node));

    return updatedData;
};

const CustomNode: FC<CustomNodeElementProps> = ({ nodeDatum, onNodeClick }) => {
    const navigate = useNavigate();

    const id = nodeDatum?.attributes?.value;
    const name = nodeDatum?.attributes?.label?.toString() || "";

    const wordCount = name.split(" ").length;

    const handleClickImage = () => {
        if (!id) return;
        navigate(`/people/view/${id}`);
    };

    if (nodeDatum.attributes === null)
        return (
            <g>
                <rect
                    height="109"
                    width="10"
                    x="-5"
                    fill="white"
                    strokeWidth="0"
                />
            </g>
        );

    return (
        <g className="node">
            <circle
                r={20}
                cy={20}
                stroke={
                    nodeDatum?.children?.length && nodeDatum.name !== "root"
                        ? "#0052cc"
                        : "black"
                }
                strokeWidth={2}
                fill="white"
                onClick={handleClickImage}
            />

            {id && (
                <image
                    href={avatarUrl(id as number, 36)}
                    // href={"https://i.pravatar.cc/150?u=" + id}
                    width={36}
                    height={36}
                    x="-18"
                    y="2"
                    clip-path="inset(0% round 50%)"
                    onClick={handleClickImage}
                />
            )}

            {name && (
                <rect
                    x="-60"
                    y="45"
                    width="120"
                    height={wordCount * 20}
                    fill="white"
                    strokeWidth="0"
                />
            )}

            <text y="40" onClick={onNodeClick}>
                {name
                    .toString()
                    .split(" ")
                    .map((word, i) => (
                        <tspan x="0" dy="1em" key={i}>
                            {word}
                        </tspan>
                    ))}
            </text>
        </g>
    );
};

interface IOrganizationalStructureProps {
    data: EmployeeHierarchyT;
}

const OrganizationalStructure: FC<IOrganizationalStructureProps> = ({
    data,
}) => {
    const [dataKey, setDataKey] = useState(nanoid());
    const [query, setQuery] = useState("");
    const [foundNodes, setFoundNodes] = useState<TreeNodeDatum[]>([]);
    const [selectedNode, setSelectedNode] = useState<TreeNodeDatum | null>(
        null,
    );

    const treeRef = useRef<Tree | null>(null);

    const handleClickSearch = () => {
        if (query === "") return;
        if (!treeRef.current) return;

        const root = treeRef.current.state.data.length
            ? treeRef.current.state.data[0]
            : null;

        if (!root) return;

        const nodes = searchNodes(root, query);

        if (nodes.length === 0) {
            toast.error("People not found");
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

    const handleClickNode = (node: HierarchyPointNode<TreeNodeDatum>) => {
        if (!node.data.attributes?.value) return;
        if (!treeRef.current) return;

        const updatedData = makeCollapsedTreeData(
            node,
            treeRef.current.state.data,
        );

        treeRef.current.setState({
            data: updatedData,
        });

        centerNode(node.data, treeRef, dimensions, zoom);
    };

    const handleClickReset = () => {
        handleClickClear();
        setDataKey(nanoid());
    };

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box display="flex" alignItems="center" gap={1}>
                <TextField
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleClickSearch()}
                    label="Search by name"
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

                <Button
                    onClick={handleClickReset}
                    variant="outlined"
                    size="small"
                    color="warning"
                >
                    <RestartAltIcon />
                </Button>
            </Box>

            {foundNodes.length ? (
                <Box display="flex" alignSelf="flex-end" gap={1}>
                    <Typography>
                        Found {foundNodes.length} person
                        {foundNodes.length > 1 ? "s" : ""}
                    </Typography>

                    {foundNodes.length > 1 ? (
                        <>
                            <IconButton sx={{ p: 0 }} onClick={handleClickPrev}>
                                <ArrowBackIcon />
                            </IconButton>

                            <IconButton sx={{ p: 0 }} onClick={handleClickNext}>
                                <ArrowForwardIcon />
                            </IconButton>
                        </>
                    ) : null}
                </Box>
            ) : null}

            <Tree
                key={dataKey}
                ref={treeRef}
                data={data}
                dimensions={dimensions}
                nodeSize={{ x: 120, y: 220 }}
                translate={{ x: 450, y: 100 }}
                renderCustomNodeElement={(props) => <CustomNode {...props} />}
                onNodeClick={handleClickNode}
                orientation="vertical"
                pathFunc="step"
            />
        </Box>
    );
};

export { OrganizationalStructure };
