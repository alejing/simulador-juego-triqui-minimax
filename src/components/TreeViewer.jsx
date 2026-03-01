import React, { useMemo, useRef, useState } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import TreeNode from './TreeNode';

// Define dimensions for layout
const NODE_WIDTH = 75;
const NODE_HEIGHT = 90;
const NODE_SEPARATION_X = 60; // Reduced horizontal gap
const NODE_SEPARATION_Y = 100; // Reduced vertical gap

const TreeViewer = ({ treeData, nodeStates, activeNodeId, propagatingNodeId }) => {
    // We need the wrapper width to center mathematically
    const wrapperRef = useRef(null);
    const [wrapperWidth, setWrapperWidth] = useState(1000); // Default fallback
    const [hoveredNodeId, setHoveredNodeId] = useState(null);

    React.useEffect(() => {
        if (wrapperRef.current) {
            setWrapperWidth(wrapperRef.current.clientWidth);
        }

        const handleResize = () => {
            if (wrapperRef.current) setWrapperWidth(wrapperRef.current.clientWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Compute positions using d3-hierarchy only when treeData changes
    const computedTree = useMemo(() => {
        if (!treeData) return null;

        const rootHierarchy = hierarchy(treeData, d => d.children);

        // Config tree layout
        const treeLayout = tree()
            .nodeSize([NODE_WIDTH + NODE_SEPARATION_X, NODE_HEIGHT + NODE_SEPARATION_Y]);

        treeLayout(rootHierarchy);
        return rootHierarchy;
    }, [treeData]);

    const pathToHovered = useMemo(() => {
        if (!hoveredNodeId || !computedTree) return new Set();
        const path = new Set();
        let target = computedTree.descendants().find(n => n.data.id === hoveredNodeId);
        while (target) {
            path.add(target.data.id);
            target = target.parent;
        }
        return path;
    }, [hoveredNodeId, computedTree]);

    if (!computedTree) return null;

    const descendants = computedTree.descendants();
    const links = computedTree.links();

    // Calculate shifting based on actual rendered canvas width vs tree mathematical center
    const xShift = wrapperWidth > 0 ? (wrapperWidth / 2) : 400;

    return (
        <div ref={wrapperRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <TransformWrapper
                initialScale={0.8}
                minScale={0.1}
                maxScale={4}
                centerOnInit={true}
                initialPositionX={0}
                initialPositionY={50}
            >
                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                    {/* We wrap everything in a relative div. d3 returns x, y around (0,0) */}
                    <div style={{ position: 'relative', width: wrapperWidth, height: '100vh' }}>
                        {/* Draw Edges (SVG) */}
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 0 }}>
                            <g transform={`translate(${xShift}, 50)`}>
                                {links.map((link, i) => {
                                    const sourceNodeState = nodeStates[link.source.data.id];
                                    const targetNodeState = nodeStates[link.target.data.id];

                                    // Only draw link if child is visible yet in simulation steps
                                    if (!targetNodeState?.visible) return null;

                                    // Thicker stroke if it's the "best choice"
                                    const isBestMove = sourceNodeState?.bestChildId === link.target.data.id;

                                    // Hover Logic
                                    const inHoverPath = hoveredNodeId && pathToHovered.has(link.source.data.id) && pathToHovered.has(link.target.data.id);
                                    const opacity = hoveredNodeId ? (inHoverPath ? 1 : 0.2) : 1;
                                    const computedStroke = inHoverPath ? "var(--accent-primary)" : (isBestMove ? "var(--accent-primary)" : "var(--border-color)");
                                    const computedWidth = inHoverPath ? 4 : (isBestMove ? 4 : 2);

                                    return (
                                        <path
                                            key={i}
                                            d={`M${link.source.x},${link.source.y} L${link.target.x},${link.target.y}`}
                                            fill="none"
                                            stroke={computedStroke}
                                            strokeWidth={computedWidth}
                                            strokeDasharray={isBestMove || inHoverPath ? "none" : "5,5"}
                                            style={{ opacity, transition: 'all 0.3s ease' }}
                                        />
                                    );
                                })}
                            </g>
                        </svg>

                        {/* Draw Nodes (HTML) */}
                        {descendants.map(d => {
                            const state = nodeStates[d.data.id];

                            // Only draw node if it has been visited in current simulation step
                            if (!state?.visible) return null;

                            const inHoverPath = hoveredNodeId && pathToHovered.has(d.data.id);
                            const nodeOpacity = hoveredNodeId ? (inHoverPath ? 1 : 0.3) : 1;

                            return (
                                <div
                                    key={d.data.id}
                                    onMouseEnter={() => setHoveredNodeId(d.data.id)}
                                    onMouseLeave={() => setHoveredNodeId(null)}
                                    style={{
                                        position: 'absolute',
                                        left: d.x + xShift,
                                        top: d.y + 50,
                                        transform: 'translate(-50%, 0)', // Center horizontally
                                        zIndex: inHoverPath ? 10 : 1,
                                        opacity: nodeOpacity,
                                        transition: 'opacity 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <TreeNode
                                        nodeData={d.data}
                                        isActive={activeNodeId === d.data.id}
                                        isEval={propagatingNodeId === d.data.id}
                                        utilityValue={state.utility}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
};

export default TreeViewer;
