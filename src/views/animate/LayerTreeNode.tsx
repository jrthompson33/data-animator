import React, {FormEvent} from 'react';
import classNames from 'classnames';

import ReactDOM from 'react-dom';
import {
    Icon,
    IconName,
    IProps,
    MaybeElement,
    Classes,
    Collapse,
    Button,
    Tag,
    Position,
    Tooltip,
    HTMLSelect,
    Checkbox,
    Intent,
    MenuItem,
    Popover,
} from '@blueprintjs/core';
import {safeInvoke} from '../../utils';
import LayerElement, {DragContext} from './svg/LayerElement';
import PropertyElement from './svg/PropertyElement';
import {TimingSelect} from './tree/TimingSelect';
import PeerTimingElement from './svg/PeerTimingElement';
import CustomIcon from '../common/CustomIcon';
import {AGGREGATE_LIST, ORDER_LIST} from '../../data/data_utils';
import {
    AnimationEffect,
    AnimationEffectGroup,
    AnimationEffectList,
} from '../../animation/AnimationEffect';
import {Select} from '@blueprintjs/select';
import {IColumnOption} from './LinkCanvas';
import {EasingOption, EasingOptionList} from '../../animation/EasingOption';
import PeerTooltip from './tree/PeerTooltip';

const AnimationEffectSelect = Select.ofType<AnimationEffectGroup>();
const EasingOptionSelect = Select.ofType<EasingOption>();

export interface ILayerTreeNode extends IProps {
    /**
     * Child tree nodes of this node.
     */
    childNodes?: Array<ILayerTreeNode>;

    /**
     * Whether this tree node is non-interactive. Enabling this prop will ignore
     * mouse event handlers (in particular click, down, enter, leave).
     */
    disabled?: boolean;

    /**
     * The name of a Blueprint icon (or an icon element) to render next to the node's label.
     */
    icon?: string;

    /**
     * The number of elements present in the animation.
     */
    counts?: number[];

    /**
     * A unique identifier for the node.
     */
    id: string | number;

    map?: any;

    /**
     * The type of element to be represented for this node.
     */
    type?: string;

    linkType?: 'linked' | 'exit' | 'enter';

    isAnimating?: boolean;

    properties?: any;

    peers?: any;

    effect: any;

    timing?: any;

    parentScale: any;

    /**
     * Whether this tree node's children are expanded.
     * @default false
     */
    childExpanded?: boolean;

    /**
     * Whether this tree property and peer info are expanded.
     * @default false
     */
    propExpanded?: boolean;

    /**
     * Whether this node is selected.
     * @default false
     */
    isSelected?: boolean;

    /**
     * Whether this node is soloed in the timeline. Soloed means only this layer and children are visible.
     */
    isSoloed?: boolean;

    /**
     * The main label for the node.
     */
    label: string | JSX.Element;
}

export interface ITreeNodeProps extends ILayerTreeNode {
    children?: React.ReactNode;
    contentRef?: (node: LayerTreeNode, element: HTMLDivElement | null) => void;
    depth: number;
    siblingBelow: boolean;
    hasParent: boolean;
    key?: string | number;
    scale: any;
    linkMode: boolean;
    onChildExpand?: (node: LayerTreeNode, e: React.MouseEvent<HTMLElement>) => void;
    onTimingSelect?: (node: LayerTreeNode, type: string, field: string) => void;
    onEffectChange?: (node: LayerTreeNode, effect: AnimationEffect) => void;
    onEasingChange?: (node: LayerTreeNode, easing: EasingOption) => void;
    onKeyUpdate?: (
        node: LayerTreeNode,
        key: string,
        value: number,
        which: string
    ) => void;
    onPeerDurationUpdate?: (node: LayerTreeNode, value: number) => void;
    onAggregationChange?: (node: LayerTreeNode, value: string) => void;
    onReverseSequencing?: (node: LayerTreeNode) => void;
    onGuideUpdate?: (show: boolean, startOrEnd?: string, time?: number) => void;
    onChildCollapse?: (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLElement>
    ) => void;
    onPropExpand?: (node: LayerTreeNode, e: React.MouseEvent<HTMLElement>) => void;
    onSoloedChange?: (node: LayerTreeNode, isSoloed: boolean) => void;
    onPropCollapse?: (node: LayerTreeNode, e: React.MouseEvent<HTMLElement>) => void;
    onClick?: (node: LayerTreeNode, e: React.MouseEvent<HTMLDivElement>) => void;
    onContextMenu?: (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLDivElement>
    ) => void;
    onDoubleClick?: (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLDivElement>
    ) => void;
    onMouseEnter?: (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLDivElement>
    ) => void;
    onMouseLeave?: (
        node: LayerTreeNode,
        e: React.MouseEvent<HTMLDivElement>
    ) => void;
    path: number[];
}

export class LayerTreeNode extends React.Component<
    ITreeNodeProps,
    {isTooltipOpen; tooltipContent; propExpanded}
> {
    constructor(props: ITreeNodeProps) {
        super(props);
        this.state = {
            isTooltipOpen: false,
            tooltipContent: {label: '', count: 0},
            propExpanded: false,
            // isSoloedClicked: false,
        };
    }

    private _refs = {
        $tooltip: React.createRef<PeerTooltip>(),
    };

    public render() {
        const {
            children,
            className,
            disabled,
            icon,
            childExpanded,
            propExpanded,
            siblingBelow,
            hasParent,
            timing,
            isSelected,
            isAnimating,
            linkMode,
            label,
            counts,
            linkType,
            properties,
            peers,
            effect,
            scale,
            parentScale,
        } = this.props;

        let duration = this.props.scale.range()[1];

        const classes = classNames(
            Classes.TREE_NODE,
            {
                [Classes.DISABLED]: disabled,
                // [Classes.TREE_NODE_SELECTED]: isSelected,
                [Classes.TREE_NODE_EXPANDED]: childExpanded,
            },
            className
        );

        const contentClasses = classNames(
            Classes.TREE_NODE_CONTENT,
            `${Classes.TREE_NODE_CONTENT}-${this.props.depth}`,
            'row'
        );

        const childCollapseClasses = classNames(
            'bp3-tree-child-collapse',
            `bp3-tree-child-collapse-${this.props.depth}`,
            'row'
        );

        const iconElement: MaybeElement = (
            <Icon className={Classes.TREE_NODE_ICON} icon={CustomIcon[icon]} />
        );

        const eventHandlers =
            disabled === true
                ? {}
                : {
                      onClick: this._handleClick,
                      onContextMenu: this._handleContextMenu,
                      onDoubleClick: this._handleDoubleClick,
                      onMouseEnter: this._handleMouseEnter,
                      onMouseLeave: this._handleMouseLeave,
                  };

        return (
            <li className={classes} key={this.props.id}>
                <div style={{position: 'relative'}}>
                    {childExpanded ? (
                        <span className="bp3-tree-node-link bp3-tree-node-link-child" />
                    ) : undefined}
                    {childExpanded ? (
                        <span
                            className="bp3-key-frame-link bp3-key-frame-link-child start"
                            style={{
                                marginLeft: `${
                                    scale(parentScale(timing.startRaw)) + 84
                                }px`,
                            }}
                        />
                    ) : undefined}
                    {childExpanded ? (
                        <span
                            className="bp3-key-frame-link bp3-key-frame-link-child end"
                            style={{
                                marginLeft: `${
                                    scale(parentScale(timing.endRaw)) + 84
                                }px`,
                            }}
                        />
                    ) : undefined}
                    {hasParent && !siblingBelow ? (
                        <span
                            className="bp3-key-frame-link bp3-key-frame-link-parent start"
                            style={{marginLeft: `${scale(parentScale(0)) + 84}px`}}
                        />
                    ) : undefined}
                    {hasParent && !siblingBelow ? (
                        <span
                            className="bp3-key-frame-link bp3-key-frame-link-parent end"
                            style={{marginLeft: `${scale(parentScale(1)) + 84}px`}}
                        />
                    ) : undefined}
                    {siblingBelow ? (
                        <span
                            className="bp3-key-frame-link bp3-key-frame-link-sibling start"
                            style={{marginLeft: `${scale(parentScale(0)) + 84}px`}}
                        />
                    ) : undefined}
                    {siblingBelow ? (
                        <span
                            className="bp3-key-frame-link bp3-key-frame-link-sibling end"
                            style={{marginLeft: `${scale(parentScale(1)) + 84}px`}}
                        />
                    ) : undefined}
                    {siblingBelow ? (
                        <span className="bp3-tree-node-link bp3-tree-node-link-sibling" />
                    ) : undefined}
                    <div
                        className={contentClasses}
                        ref={this._handleContentRef}
                        {...eventHandlers}
                    >
                        <div className="col-md-12 layer-title-div">
                            {this.maybeRenderCaret()}
                            <Tag
                                minimal={true}
                                icon={iconElement}
                                intent={isSelected ? Intent.PRIMARY : undefined}
                                style={{marginLeft: '0', height: '22px'}}
                            >
                                {label}
                            </Tag>
                            <div
                                style={{marginLeft: 'auto', display: 'inline-block'}}
                            >
                                {this.renderSoloed()}
                                {this.maybeRenderEasing()}
                                {this.maybeRenderExpand()}
                            </div>
                        </div>
                        <div className="col-md-12 layer-svg-div">
                            <div
                                style={{
                                    padding: '0 4px',
                                    width: '70px',
                                    flex: '0 0 70px',
                                }}
                            >
                                {this.maybeRenderCheckbox()}
                                <Tag
                                    minimal={true}
                                    style={{float: 'right'}}
                                    intent={isSelected ? Intent.PRIMARY : undefined}
                                >
                                    {counts[0]}
                                </Tag>
                            </div>
                            <div style={{flex: '1 1 auto', height: '20px'}}>
                                <svg className="layer-svg">
                                    <LayerElement
                                        startKey={timing.startRaw}
                                        endKey={timing.endRaw}
                                        parentScale={parentScale}
                                        scale={scale}
                                        linkType={linkType}
                                        isInteractive={!linkMode && isAnimating}
                                        isAnimating={isAnimating}
                                        isExpanded={
                                            this.state.propExpanded && !linkMode
                                        }
                                        onDragStart={this._handleKeyDragStart}
                                    />
                                </svg>
                            </div>
                            <div
                                style={{
                                    padding: '0 4px',
                                    width: '70px',
                                    flex: '0 0 70px',
                                }}
                            >
                                <Tag
                                    minimal={true}
                                    style={{marginLeft: '0'}}
                                    intent={isSelected ? Intent.PRIMARY : undefined}
                                >
                                    {counts[1]}
                                </Tag>
                            </div>
                        </div>
                    </div>
                    {this.maybeRenderPropExpand(
                        properties,
                        peers,
                        effect,
                        timing,
                        parentScale,
                        counts
                    )}
                </div>

                <Collapse className={childCollapseClasses} isOpen={childExpanded}>
                    {children}
                </Collapse>
            </li>
        );
    }

    private maybeRenderPropExpand(
        properties,
        peers,
        effect,
        timing,
        parentScale,
        counts
    ) {
        return !this.props.linkMode && properties && peers ? (
            <Collapse isOpen={this.state.propExpanded}>
                <div className="row layer-peers-div" style={{marginBottom: '-2px'}}>
                    {this._renderPeers(peers, counts, timing, parentScale)}
                </div>
                <div className="row layer-props-div">
                    {effect
                        ? this._renderEffect(effect, peers, parentScale)
                        : undefined}
                    {this._renderProperties(properties, peers, parentScale)}
                </div>
            </Collapse>
        ) : undefined;
    }

    private maybeRenderCaret() {
        const {children, childExpanded, disabled, depth, siblingBelow} = this.props;
        const hasCaret = React.Children.count(children) > 0;
        if (hasCaret) {
            const caretIcon = childExpanded
                ? depth > 0
                    ? CustomIcon.TREE_NODE_EXPAND_PT_SF_CT
                    : CustomIcon.TREE_NODE_EXPAND_PF_SF_CT
                : depth > 0
                ? CustomIcon.TREE_NODE_COLLAPSE_PT_SF_CT
                : CustomIcon.TREE_NODE_COLLAPSE_PF_SF_CT;
            const onClick = disabled === true ? undefined : this._handleCaretClick;
            return (
                <span onClick={onClick} className={Classes.TREE_NODE_CARET}>
                    <Icon icon={caretIcon} />
                </span>
            );
        } else if (depth > 0) {
            return (
                <Icon
                    icon={
                        siblingBelow
                            ? CustomIcon.TREE_NODE_LEAF_PT_ST
                            : CustomIcon.TREE_NODE_LEAF_PT_SF
                    }
                />
            );
        }
        return <span className={Classes.TREE_NODE_CARET_NONE} />;
    }

    private renderSoloed() {
        const {isSoloed} = this.props;
        // icon = this.state.isSoloedClicked ? 'eye-on' : 'eye-open';
        return (
            <Tooltip
                hoverOpenDelay={HOVER_DELAY}
                content="Solo Visibility"
                position={Position.LEFT}
            >
                <Button
                    icon="eye-open"
                    active={isSoloed}
                    className="layer-hover-btn"
                    minimal={true}
                    small={true}
                    // onClick={() => this._handleSoloed('click')}
                    onMouseEnter={() => this._handleSoloed('enter')}
                    onMouseLeave={() => this._handleSoloed('leave')}
                />
            </Tooltip>
        );
    }

    private maybeRenderEasing() {
        const easing = this.props.timing.easing;
        return !this.props.linkMode && this.props.isAnimating ? (
            <EasingOptionSelect
                items={EasingOptionList}
                activeItem={easing}
                itemPredicate={this._filterEasingOption}
                itemRenderer={this._renderEasingOption}
                onItemSelect={this._handleEasingChange}
                popoverProps={{minimal: true}}
                noResults={<MenuItem disabled={true} text="No results." />}
            >
                <Tooltip
                    hoverOpenDelay={HOVER_DELAY}
                    content={easing.title}
                    position={Position.LEFT}
                >
                    <Button
                        icon={easing.icon}
                        minimal={true}
                        className="layer-hover-btn"
                        small={true}
                    />
                </Tooltip>
            </EasingOptionSelect>
        ) : (
            <span className="bp3-tree-node-button-none" />
        );
    }

    private maybeRenderCheckbox() {
        return this.props.linkMode ? (
            <Checkbox
                onChange={this._handleCheckboxChange}
                onClick={this._handleCheckboxChange}
                checked={this.props.isSelected}
            />
        ) : undefined;
    }

    private maybeRenderExpand() {
        const {peers, properties, disabled, linkMode, isAnimating} = this.props;
        const hasExpand =
            !linkMode &&
            isAnimating &&
            ((properties && properties.length > 0) || peers);
        if (hasExpand) {
            const onClick = disabled === true ? undefined : this._handleExpandClick;
            const icon = this.state.propExpanded ? 'collapse-all' : 'expand-all';
            const tooltip = this.state.propExpanded ? 'Collapse' : 'Expand';
            return (
                <Tooltip
                    hoverOpenDelay={HOVER_DELAY}
                    content={tooltip}
                    position={Position.LEFT}
                >
                    <Button
                        icon={icon}
                        active={this.state.propExpanded}
                        className="layer-hover-btn"
                        minimal={true}
                        small={true}
                        onClick={onClick}
                    />
                </Tooltip>
            );
        }
        return <span className="bp3-tree-node-button-none" />;
    }

    private _renderEffect(effect, peers, parentScale) {
        let effectTimes = this.props.timing.getPropTimes('effect');
        return (
            <div
                className={classNames('tree-node-effect', 'row')}
                key={effect.title}
            >
                <div
                    className="col-md-12 effect-select-div"
                    style={{
                        marginTop: '0',
                        marginBottom: '-13px',
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            padding: '0 4px',
                            flex: '0 0 70px',
                            width: '70px',
                        }}
                    />
                    <div style={{flex: '1 1 auto'}}>
                        <span
                            className="an-small-label"
                            style={{marginLeft: '20px', marginRight: '6px'}}
                        >
                            Preset Effect
                        </span>
                        <div
                            style={{display: 'inline-block'}}
                            className="an-effect-select"
                        >
                            <AnimationEffectSelect
                                activeItem={effect}
                                itemRenderer={this._renderEffectOption}
                                onItemSelect={this._handleEffectChange}
                                popoverProps={{
                                    minimal: true,
                                    position: Position.BOTTOM,
                                }}
                                filterable={false}
                                items={AnimationEffectList[this.props.linkType]}
                            >
                                <Button
                                    text={effect.title}
                                    rightIcon="caret-down"
                                    outlined={true}
                                    minimal={true}
                                />
                            </AnimationEffectSelect>
                        </div>
                    </div>
                    <div
                        style={{
                            padding: '0 4px',
                            flex: '0 0 70px',
                            width: '70px',
                        }}
                    />
                </div>
                <div className="col-md-12 property-svg-div">
                    <div
                        style={{
                            padding: '0 4px',
                            flex: '0 0 70px',
                            width: '70px',
                        }}
                    />
                    <svg
                        className="property-svg"
                        style={{flex: '1 1 auto', height: '20px'}}
                    >
                        <PropertyElement
                            startKey={effectTimes.start}
                            endKey={effectTimes.end}
                            parentStartKey={this.props.timing.startRaw}
                            parentEndKey={this.props.timing.endRaw}
                            peerScale={peers.scale}
                            parentScale={parentScale}
                            scale={this.props.scale}
                            name="effect"
                            isEffect={true}
                            linkType={this.props.linkType}
                            onDragStart={this._handleKeyDragStart}
                        />
                    </svg>
                    <div
                        style={{
                            padding: '0 4px',
                            flex: '0 0 70px',
                            width: '70px',
                        }}
                    />
                </div>
            </div>
        );
    }

    private _renderProperties(properties, peers, parentScale) {
        let duration = this.props.scale.range()[1];
        return properties.map((p) => {
            return (
                <div
                    className={classNames('tree-node-property', 'row')}
                    key={p.name}
                >
                    <div className="col-md-12 property-svg-div">
                        <div
                            style={{
                                padding: '0 4px',
                                flex: '0 0 70px',
                                width: '70px',
                            }}
                        />
                        <svg
                            className="property-svg"
                            style={{flex: '1 1 auto', height: '20px'}}
                        >
                            <PropertyElement
                                startKey={p.startKey}
                                endKey={p.endKey}
                                parentStartKey={this.props.timing.startRaw}
                                parentEndKey={this.props.timing.endRaw}
                                peerScale={peers.scale}
                                parentScale={parentScale}
                                scale={this.props.scale}
                                name={p.name}
                                linkType={this.props.linkType}
                                onDragStart={this._handleKeyDragStart}
                            />
                        </svg>
                        <div
                            style={{
                                padding: '0 4px',
                                flex: '0 0 70px',
                                width: '70px',
                            }}
                        />
                    </div>
                </div>
            );
        });
    }

    private _renderPeers(peers, counts, timing, parentScale) {
        const expanded = timing.sequenceType !== 'all',
            sequenceClassNames = classNames(
                'sequencing-controls-div',
                expanded ? 'sequencing-expanded' : ''
            ),
            icon = expanded
                ? CustomIcon[
                      `${timing.sequenceType}_${timing.sequenceSubType}`.toUpperCase()
                  ]
                : undefined,
            reverseIcon =
                timing.sequenceFieldType === 'boolean' ||
                timing.sequenceFieldType === 'string'
                    ? timing.sequenceIsReverse
                        ? 'sort-alphabetical-desc'
                        : 'sort-alphabetical'
                    : timing.sequenceIsReverse
                    ? 'sort-numerical-desc'
                    : 'sort-numerical',
            aggrSelect =
                timing.sequenceFieldType === 'boolean' ||
                timing.sequenceFieldType === 'date' ? undefined : (
                    <HTMLSelect
                        minimal={true}
                        onChange={(e) =>
                            this._handleAggregationChange(e.currentTarget.value)
                        }
                        value={timing.sequenceAggr}
                    >
                        {(timing.sequenceFieldType === 'string'
                            ? ORDER_LIST
                            : AGGREGATE_LIST
                        ).map((a) => (
                            <option value={a}>{a}</option>
                        ))}
                    </HTMLSelect>
                ),
            sequenceField = expanded ? (
                <div className="sequencing-field-div">
                    {aggrSelect}
                    <Button
                        className="sequence-reverse-button"
                        icon={reverseIcon}
                        minimal={true}
                        small={true}
                        outlined={true}
                        onClick={this._handleReverseSequencing}
                    />
                    <Tag
                        icon={CustomIcon[timing.sequenceFieldType.toUpperCase()]}
                        minimal={true}
                    >
                        {timing.sequenceField}
                    </Tag>
                </div>
            ) : undefined;
        return (
            <div className={classNames('tree-node-peers', 'row')}>
                <div
                    className="col-md-12 peers-select-div"
                    style={{marginTop: '-6px', marginBottom: '-16px', zIndex: 10}}
                >
                    <div
                        style={{padding: '0 4px', flex: '0 0 70px', width: '70px'}}
                    />
                    <div style={{flex: '1 1 auto'}}>
                        <span
                            className="an-small-label"
                            style={{marginLeft: '20px', marginRight: '6px'}}
                        >
                            Peer Sequencing
                        </span>
                        <div
                            style={{display: 'inline-block'}}
                            className={sequenceClassNames}
                        >
                            {sequenceField}
                            <TimingSelect
                                key="sequence"
                                icon={icon}
                                selectedType={timing.sequenceType}
                                onItemSelect={this._handleTimingSelect}
                                items={peers.sequenceOptions}
                            />
                        </div>
                    </div>
                    <div
                        style={{padding: '0 4px', flex: '0 0 70px', width: '70px'}}
                    />
                </div>
                <div className="col-md-12 peers-svg-div">
                    <div
                        style={{
                            padding: '0 4px',
                            flex: '0 0 70px',
                            width: '70px',
                        }}
                    />
                    <div
                        style={{
                            flex: '1 1 auto',
                            height: peers.groups.length > 1 ? '80px' : '42px',
                        }}
                    >
                        <svg className="peers-svg">
                            <PeerTimingElement
                                groups={peers.groups}
                                totalCount={Math.max(counts[0], counts[1])}
                                defaultDuration={timing.sequenceDefaultDuration}
                                startKey={timing.startRaw}
                                endKey={timing.endRaw}
                                scale={this.props.scale}
                                parentScale={parentScale}
                                onPeerEnter={this._handlePeerEnter}
                                onPeerLeave={this._handlePeerLeave}
                                onDragStart={this._handleDurationDragStart}
                            />
                        </svg>
                        <PeerTooltip ref={this._refs.$tooltip} />
                    </div>
                    <div
                        style={{
                            padding: '0 4px',
                            flex: '0 0 70px',
                            width: '70px',
                        }}
                    />
                </div>
            </div>
        );
    }

    private _handleKeyDragStart = (draggable, context) => {
        safeInvoke(this.props.onGuideUpdate, true);
        context.onDrag((e) => {
            safeInvoke(this.props.onGuideUpdate, true, e.startOrEnd, e.scaled);
        });
        context.onEnd((e) => {
            safeInvoke(this.props.onGuideUpdate, false, e.startOrEnd, e.scaled);
            safeInvoke(this.props.onKeyUpdate, this, draggable, e.raw, e.which);
        });
    };

    private _handleDurationDragStart = (draggable, context) => {
        safeInvoke(this.props.onGuideUpdate, true);
        context.onDrag((e) => {
            safeInvoke(this.props.onGuideUpdate, true, e.startOrEnd, e.scaled);
        });
        context.onEnd((e) => {
            safeInvoke(this.props.onGuideUpdate, false, e.startOrEnd, e.scaled);
            safeInvoke(this.props.onPeerDurationUpdate, this, e.raw);
        });
    };

    private _handleAggregationChange = (aggr: string) => {
        safeInvoke(this.props.onAggregationChange, this, aggr);
    };

    private _handleReverseSequencing = () => {
        safeInvoke(this.props.onReverseSequencing, this);
    };

    private _handlePeerEnter = (
        group: any,
        peerPosition: number[],
        peerDimension: number[],
        e: React.MouseEvent<SVGRectElement>
    ) => {
        this._refs.$tooltip.current.setState({
            isOpen: true,
            peerLabel: group.label,
            peerCount: group.count,
            peerPosition,
            peerDimension,
        });
    };

    private _handlePeerLeave = (group: any, e: React.MouseEvent<SVGRectElement>) => {
        this._refs.$tooltip.current.setState({isOpen: false});
    };

    private _handleCaretClick = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        const {childExpanded, onChildCollapse, onChildExpand} = this.props;
        childExpanded ? onChildCollapse(this, e) : onChildExpand(this, e);
    };

    private _handleCheckboxChange = (e: FormEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    private _handleExpandClick = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        this.setState({
            propExpanded: !this.state.propExpanded,
        });
    };

    private _handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        safeInvoke(this.props.onClick, this, e);
    };

    private _handleContentRef = (element: HTMLDivElement | null) => {
        safeInvoke(this.props.contentRef, this, element);
    };

    private _handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        safeInvoke(this.props.onContextMenu, this, e);
    };

    private _handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        safeInvoke(this.props.onDoubleClick, this, e);
    };

    private _handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        safeInvoke(this.props.onMouseEnter, this, e);
    };

    private _handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        safeInvoke(this.props.onMouseLeave, this, e);
    };

    private _handleTimingSelect = (type: string, field: string) => {
        safeInvoke(this.props.onTimingSelect, this, type, field);
    };

    private _handleEffectChange = (group: AnimationEffectGroup, event) => {
        let index = parseInt(event.currentTarget.getAttribute('data-index'));
        safeInvoke(this.props.onEffectChange, this, group.effects[index]);
    };

    private _handleEasingChange = (easing: EasingOption) => {
        safeInvoke(this.props.onEasingChange, this, easing);
    };

    private _handleSoloed = (type: string) => {
        switch (type) {
            // case 'click':
            //     safeInvoke(this.props.onSoloedChange, this, !this.state.isSoloedClicked);
            //     this.setState({
            //         isSoloedClicked: !this.state.isSoloedClicked,
            //     });
            //     break;
            case 'enter':
                safeInvoke(this.props.onSoloedChange, this, true);
                break;
            case 'leave':
                safeInvoke(this.props.onSoloedChange, this, false);
                break;
        }
    };

    private _renderEffectOption = (
        g: AnimationEffectGroup,
        {handleClick, modifiers, query}
    ) => {
        const effectItems =
            g.effects.length === 1
                ? undefined
                : g.effects.map((e, i) => {
                      return (
                          <MenuItem
                              key={e.title}
                              active={modifiers.active}
                              disabled={modifiers.disabled}
                              text={e.direction}
                              data-index={i}
                              onClick={handleClick}
                          >
                              {effectItems}
                          </MenuItem>
                      );
                  });
        return (
            <MenuItem
                active={modifiers.active}
                disabled={modifiers.disabled}
                text={g.title}
                data-index={0}
                onClick={g.effects.length === 1 ? handleClick : undefined}
            >
                {effectItems}
            </MenuItem>
        );
    };

    private _renderEasingOption = (
        o: EasingOption,
        {handleClick, modifiers, query}
    ) => {
        return (
            <MenuItem
                icon={o.icon}
                text={o.title}
                active={modifiers.active}
                disabled={modifiers.disabled}
                onClick={handleClick}
            />
        );
    };

    private _filterEasingOption = (
        query: string,
        o: EasingOption,
        index?: number,
        exactMatch?: boolean
    ): boolean => {
        const normalizedName = o.title.toLowerCase(),
            normalizedQuery = query.toLowerCase();
        if (exactMatch) {
            return normalizedName === normalizedQuery;
        } else {
            return normalizedName.indexOf(normalizedQuery) >= 0;
        }
    };
}

const HOVER_DELAY = 250; // ms
