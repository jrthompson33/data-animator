import React from 'react';
import ReactDOM from 'react-dom';

import {connect} from 'react-redux';

import {VisTemplate} from '../../core/VisTemplate';

interface TemplateListProps {
    templates: VisTemplate[];
}

export class TemplateList extends React.Component<TemplateListProps, {}> {
    public render() {
        return (
            <div id="sb-template-container" className="sb-container">
            </div>
        );
    }
}

export default connect()(TemplateList);
