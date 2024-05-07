import { select } from "d3-selection";
import { zoom as d3zoom, zoomIdentity } from "d3-zoom";
import Tree, { TreeNodeDatum } from "react-d3-tree";

export const getTransformCoordinates = (
    transform: string,
): { x: number; y: number } => {
    const regex = /translate\(([-\d.]+),([-\d.]+)\)/;
    const matches = transform.match(regex);
    if (matches && matches.length === 3) {
        const x = parseFloat(matches[1]);
        const y = parseFloat(matches[2]);
        return { x, y };
    }
    return { x: 0, y: 0 };
};

export function searchNodes(
    node: TreeNodeDatum,
    query: string,
): TreeNodeDatum[] {
    const results: TreeNodeDatum[] = [];

    if (
        node.name.toLowerCase().includes(query.trim().toLowerCase()) &&
        !node.__rd3t.collapsed
    ) {
        results.push(node);
    }

    for (const child of node.children || []) {
        const childResults = searchNodes(child, query);
        results.push(...childResults);
    }

    return results;
}

const _centerNode = (
    x_: number,
    y_: number,
    gInstanceRef: string,
    svgInstanceRef: string,
    scale: number,
    dimensions: { width: number; height: number },
    zoom: number,
    centeringTransitionDuration: number = 800,
) => {
    const g = select(`.${gInstanceRef}`);
    const svg = select(`.${svgInstanceRef}`);

    const x = -x_ * scale + dimensions.width / 2;
    const y = -y_ * scale + dimensions.height / 2;

    // @ts-ignore
    g.transition()
        .duration(centeringTransitionDuration)
        .attr(
            "transform",
            "translate(" + x + "," + y + ")scale(" + scale + ")",
        );

    // @ts-ignore
    svg.call(d3zoom().transform, zoomIdentity.translate(x, y).scale(zoom));
};

export const centerNode = (
    node: TreeNodeDatum,
    treeRef: React.MutableRefObject<Tree | null>,
    dimensions: { width: number; height: number },
    zoom: number,
) => {
    if (!treeRef.current) return;

    const nodeElem = document.getElementById(node.__rd3t.id);
    if (!nodeElem) return;

    const nodeTransform = nodeElem.getAttribute("transform");
    if (!nodeTransform) return;

    const { x, y } = getTransformCoordinates(nodeTransform);

    _centerNode(
        x,
        y,
        treeRef.current.gInstanceRef,
        treeRef.current.svgInstanceRef,
        treeRef.current.state.d3.scale,
        dimensions,
        zoom,
        treeRef.current.props.centeringTransitionDuration,
    );
};
