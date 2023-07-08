import React from 'react';
import {LayerTreeNode, ILayerTreeNode} from './LayerTreeNode';
import {IProps, Classes} from '@blueprintjs/core';

import {AnimationEffect} from '../../animation/AnimationEffect';
import {EasingOption} from '../../animation/EasingOption';

export type TreeEventHandler = (
    node: ILayerTreeNode,
    nodePath: number[],
    e: React.MouseEvent<HTMLElement>
) => void;

export interface ILayerTreeProps extends IProps {
    /**
     * The data specifying the contents and appearance of the tree.
     */
    contents: Array<ILayerTreeNode>;

    scale: any;

    linkMode: boolean;

    /**
     * Invoked when a node is clicked anywhere other than the caret for expanding/collapsing the node.
     */
    onNodeClick?: TreeEventHandler;

    /**
     * Invoked when a node's expand button is clicked to expand properties/peers.
     */
    onNodePropExpand?: TreeEventHandler;

    /**
     * Invoked when a node's expand button is clicked to collapse properties/peers.
     */
    onNodePropCollapse?: TreeEventHandler;

    /**
     * Invoked when a node's caret is clicked to expand child nodes.
     */
    onNodeChildExpand?: TreeEventHandler;

    /**
     * Invoked when a node's caret is clicked to collapse child nodes.
     */
    onNodeChildCollapse?: TreeEventHandler;

    /**
     * Invoked when a node is right-clicked or the context menu button is pressed on a focused node.
     */
    onNodeContextMenu?: TreeEventHandler;

    /**
     * Invoked when a node is double-clicked. Be careful when using this in combination with
     * an `onNodeClick` (single-click) handler, as the way this behaves can vary between browsers.
     * See http://stackoverflow.com/q/5497073/3124288
     */
    onNodeDoubleClick?: TreeEventHandler;

    /**
     * Invoked when the mouse is moved over a node.
     */
    onNodeMouseEnter?: TreeEventHandler;

    /**
     * Invoked when the mouse is moved out of a node.
     */
    onNodeMouseLeave?: TreeEventHandler;

    onNodeSoloedChange?: (node: ILayerTreeNode, isSoloed: boolean) => void;

    onNodeTimingSelect?: (node: ILayerTreeNode, type: string, field: string) => void;

    onNodeEffectChange?: (node: ILayerTreeNode, effect: AnimationEffect) => void;

    onNodeEasingChange?: (node: ILayerTreeNode, easing: EasingOption) => void;

    onGuideUpdate?: (show: boolean, startOrEnd?: string, scaled?: number) => void;

    onNodePeerDurationUpdate?: (node: ILayerTreeNode, value: number) => void;

    onNodeAggregationChange?: (node: ILayerTreeNode, value: string) => void;

    onNodeReverseSequencing?: (node: ILayerTreeNode) => void;

    onNodeKeyUpdate?: (
        node: ILayerTreeNode,
        key: string,
        raw: number,
        which: string
    ) => void;
}

export class LayerTree extends React.Component<ILayerTreeProps, {}> {
    public static nodeFromPath(
        path: number[],
        treeNodes: ILayerTreeNode[]
    ): ILayerTreeNode {
        if (path.length === 1) {
            return treeNodes[path[0]];
        } else {
            return LayerTree.nodeFromPath(
                path.slice(1),
                treeNodes[path[0]].childNodes
            );
        }
    }

    private nodeRefs: {[nodeId: string]: HTMLElement} = {};

    public render() {
        return (
            <div className={Classes.TREE}>
                {this.renderNodes(this.props.contents, [], Classes.TREE_ROOT)}
            </div>
        );
    }

    /**
     * Returns the underlying HTML element of the `Tree` node with an id of `nodeId`.
     * This element does not contain the children of the node, only its label and controls.
     * If the node is not currently mounted, `undefined` is returned.
     */
    public getNodeContentElement(nodeId: string | number): HTMLElement | undefined {
        return this.nodeRefs[nodeId];
    }

    private renderNodes(
        treeNodes: Array<ILayerTreeNode>,
        currentPath?: number[],
        className?: string
    ): JSX.Element {
        if (treeNodes == null || treeNodes.length === 0) {
            return null;
        }

        const nodeItems = treeNodes.map((node, i) => {
            const elementPath = currentPath.concat(i);
            return (
                <LayerTreeNode
                    {...node}
                    key={node.id}
                    contentRef={this.handleContentRef}
                    depth={elementPath.length - 1}
                    siblingBelow={
                        elementPath.length - 1 > 0 && treeNodes.length - 1 !== i
                    }
                    hasParent={elementPath.length - 1 > 0}
                    onClick={this.handleNodeClick}
                    onContextMenu={this.handleNodeContextMenu}
                    onChildCollapse={this.handleNodeChildCollapse}
                    onChildExpand={this.handleNodeChildExpand}
                    onPropCollapse={this.handleNodePropCollapse}
                    onPropExpand={this.handleNodePropExpand}
                    onDoubleClick={this.handleNodeDoubleClick}
                    onMouseEnter={this.handleNodeMouseEnter}
                    onMouseLeave={this.handleNodeMouseLeave}
                    onSoloedChange={this.handleNodeSoloedChange}
                    onTimingSelect={this.handleNodeTimingSelect}
                    onKeyUpdate={this.handleNodeKeyUpdate}
                    onPeerDurationUpdate={this.handleNodePeerDurationUpdate}
                    onAggregationChange={this.handleNodeAggregationChange}
                    onReverseSequencing={this.handleNodeReverseSequencing}
                    onGuideUpdate={this.handleGuideUpdate}
                    onEffectChange={this.handleNodeEffectChange}
                    onEasingChange={this.handleNodeEasingChange}
                    path={elementPath}
                    scale={this.props.scale}
                    linkMode={this.props.linkMode}
                >
                    {this.renderNodes(node.childNodes, elementPath)}
                </LayerTreeNode>
            );
        });

        return <ul className={Classes.TREE_NODE_LIST}>{nodeItems}</ul>;
    }

    private handleNodeChildCollapse = (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) => {
        this.handlerHelper(this.props.onNodeChildCollapse, node, e);
    };

    private handleNodeChildExpand = (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) => {
        this.handlerHelper(this.props.onNodeChildExpand, node, e);
    };

    private handleNodePropCollapse = (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) => {
        this.handlerHelper(this.props.onNodePropCollapse, node, e);
    };

    private handleNodePropExpand = (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) => {
        this.handlerHelper(this.props.onNodePropExpand, node, e);
    };

    private handleNodeClick = (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) => {
        this.handlerHelper(this.props.onNodeClick, node, e);
    };

    private handleContentRef = (
        node: LayerTreeNode,
        element: HTMLElement | null
    ) => {
        if (element != null) {
            this.nodeRefs[node.props.id] = element;
        } else {
            // don't want our object to get bloated with old keys
            delete this.nodeRefs[node.props.id];
        }
    };

    private handleNodeContextMenu = (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) => {
        this.handlerHelper(this.props.onNodeContextMenu, node, e);
    };

    private handleNodeDoubleClick = (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) => {
        this.handlerHelper(this.props.onNodeDoubleClick, node, e);
    };

    private handleNodeMouseEnter = (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) => {
        this.handlerHelper(this.props.onNodeMouseEnter, node, e);
    };

    private handleNodeMouseLeave = (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) => {
        this.handlerHelper(this.props.onNodeMouseLeave, node, e);
    };

    private handleNodeTimingSelect = (
        node: LayerTreeNode,
        type: string,
        field: string
    ) => {
        const nodeData = LayerTree.nodeFromPath(
            node.props.path,
            this.props.contents
        );
        this.props.onNodeTimingSelect(nodeData, type, field);
    };

    private handleNodeEffectChange = (
        node: LayerTreeNode,
        effect: AnimationEffect
    ) => {
        const nodeData = LayerTree.nodeFromPath(
            node.props.path,
            this.props.contents
        );
        this.props.onNodeEffectChange(nodeData, effect);
    };

    private handleNodeSoloedChange = (node: LayerTreeNode, isSoloed: boolean) => {
        const nodeData = LayerTree.nodeFromPath(
            node.props.path,
            this.props.contents
        );
        this.props.onNodeSoloedChange(nodeData, isSoloed);
    }

    private handleNodeEasingChange = (node: LayerTreeNode, easing: EasingOption) => {
        const nodeData = LayerTree.nodeFromPath(
            node.props.path,
            this.props.contents
        );
        this.props.onNodeEasingChange(nodeData, easing);
    };

    private handleNodeKeyUpdate = (
        node: LayerTreeNode,
        key: string,
        raw: number,
        which: string
    ) => {
        const nodeData = LayerTree.nodeFromPath(
            node.props.path,
            this.props.contents
        );
        this.props.onNodeKeyUpdate(nodeData, key, raw, which);
    };

    private handleNodePeerDurationUpdate = (node: LayerTreeNode, value: number) => {
        const nodeData = LayerTree.nodeFromPath(
            node.props.path,
            this.props.contents
        );
        this.props.onNodePeerDurationUpdate(nodeData, value);
    };

    private handleNodeAggregationChange = (node: LayerTreeNode, value: string) => {
        const nodeData = LayerTree.nodeFromPath(
            node.props.path,
            this.props.contents
        );
        this.props.onNodeAggregationChange(nodeData, value);
    };

    private handleNodeReverseSequencing = (node: LayerTreeNode) => {
        const nodeData = LayerTree.nodeFromPath(
            node.props.path,
            this.props.contents
        );
        this.props.onNodeReverseSequencing(nodeData);
    };

    private handleGuideUpdate = (
        show: boolean,
        startOrEnd?: string,
        scaled?: number
    ) => {
        this.props.onGuideUpdate(show, startOrEnd, scaled);
    };

    private handlerHelper(
        handlerFromProps: TreeEventHandler,
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) {
        if (handlerFromProps) {
            const nodeData = LayerTree.nodeFromPath(
                node.props.path,
                this.props.contents
            );
            handlerFromProps(nodeData, node.props.path, e);
        }
    }
}
