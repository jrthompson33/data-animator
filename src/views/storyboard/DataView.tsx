import React from 'react';
import {connect} from 'react-redux';

import _ from 'underscore';

import {
    Cell,
    Column,
    ColumnHeaderCell,
    Table,
    TableLoadingOption,
} from '@blueprintjs/table';

import {getActiveDataset, getDatasets} from '../../selectors';
import {Label, Tab, TabId, Tabs} from '@blueprintjs/core';

const CELL_RENDER = {
    number: (value) => <Cell>{value}</Cell>,
    integer: (value) => <Cell>{value}</Cell>,
    string: (value) => <Cell>{value}</Cell>,
    date: (value) => <Cell>{value}</Cell>,
    boolean: (value) => <Cell>{value}</Cell>,
};

const HEADER_RENDER = {
    number: (value) => <ColumnHeaderCell>{value}</ColumnHeaderCell>,
    integer: (value) => <ColumnHeaderCell>{value}</ColumnHeaderCell>,
    string: (value) => <ColumnHeaderCell>{value}</ColumnHeaderCell>,
    date: (value) => <ColumnHeaderCell>{value}</ColumnHeaderCell>,
    boolean: (value) => <ColumnHeaderCell>{value}</ColumnHeaderCell>,
};

interface IDataViewState {}

export class DataView extends React.Component<
    {datasets: any; activeDatasetId: TabId},
    IDataViewState
> {
    constructor(props) {
        super(props);
        // this.state = {
        //     activeDatasetId: undefined,
        // };
    }

    public render() {
        let table;
        if (this.props.datasets.length === 0 || !this.props.activeDatasetId) {
            let columns = _.range(6).map((i) => <Column />);
            table = (
                <Table
                    numRows={10}
                    loadingOptions={[
                        TableLoadingOption.CELLS,
                        TableLoadingOption.COLUMN_HEADERS,
                        TableLoadingOption.ROW_HEADERS,
                    ]}
                >
                    {columns}
                </Table>
            );
        } else {
            console.log(this.props);
            let {datasets, activeDatasetId} = this.props,
                data = datasets[activeDatasetId],
                columns = data.summary.map(this._renderColumn.bind(this));
            table = <Table numRows={data.table.length}>{columns}</Table>;
        }

        const tabs = _.values(this.props.datasets).map((ds) => {
            return <Tab id={ds.datasetId} title={ds.datasetName} />;
        });

        // Get the columns of data
        return (
            <div id="sb-data-container">
                <div id="sb-data-tabs">
                    <span className="panel-label">Data Tables</span>
                    <Tabs id="TabsExample" onChange={this._handleTabChange}>
                        {tabs}
                    </Tabs>
                </div>
                <div id="sb-data-view">{table}</div>
            </div>
        );
    }

    public cellRenderer(rowIndex, colIndex) {
        let {activeDatasetId, datasets} = this.props,
            data = datasets[activeDatasetId];
        let col = data.summary[colIndex];
        return CELL_RENDER[col.type](data.table[rowIndex][col.field]);
    }

    private _renderColumn(column) {
        return (
            <Column
                cellRenderer={this.cellRenderer.bind(this)}
                key={column.field}
                name={column.field}
            />
        );
    }

    private _handleTabChange = (activeDatasetId: TabId): void => {
        this.setState({activeDatasetId});
    };
}

const mapStateToProps = (state, ownProps) => {
    let datasets = getDatasets(state),
        active = getActiveDataset(state),
        activeDatasetId = active ? active.datasetId : undefined;
    return {datasets, activeDatasetId};
};

const mapDispatchToProps = (dispatch) => {
    return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(DataView);
