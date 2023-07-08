import * as THREE from 'three';
import * as BAS from 'three-bas';
import * as d3 from 'd3';
import {getElementCounter} from '../../utils/counter';

/**
 *
 */
export default class Rectangle {
	constructor(props) {
		this._type = 'Rectangle';
		this._id = getElementCounter('Rectangle');
		this._width = props.width;
		this._height = props.height;
		this._center = new THREE.Vector3(props.left - props.width / 2, -props.top - props.height / 2, 0.);
		this._prefab = new THREE.PlaneGeometry(this._width, this._height, 10, 10);
		this._fillColor = props.fillColor;
		this._opacity = props.opacity;
		this._geometry = new BAS.PrefabBufferGeometry(this._prefab, 1);
		let positionBuffer = this._geometry.createAttribute('startPosition', 3);
		this._geometry.setPrefabData(positionBuffer, 0, this._center.toArray());
		this._material = new BAS.BasicAnimationMaterial({
			transparent: true,
			flatShading: THREE.FlatShading,
			uniforms: {
				diffuse: {value: (new THREE.Color(d3.color(props.fillColor).hex()))},
				opacity: {value: props.opacity},
			},
			vertexParameters: [
				'attribute vec3 startPosition;',
			],
			vertexFunctions: [],
			vertexPosition: [
				'transformed += startPosition;'
			]
		});
		this._mesh = new THREE.Mesh(this._geometry, this._material);
		this._mesh.frustumCulled = false;
	}

	get type() {
		return this._type;
	}

	get id() {
		return this._id;
	}

	get mesh() {
		return this._mesh;
	}

	get visible() {
		return this._mesh.visible;
	}

	set visible(value) {
		this._mesh.visible = value;
	}

	updateProperties(props) {
		this._center = new THREE.Vector3(props.left - props.width / 2., props.height / 2. - props.top, 0.);
		this._fillColor = props.fillColor;
		this._opacity = props.opacity;
		this._material.setUniformValues({diffuse: (new THREE.Color(d3.color(this._fillColor).hex()))});
		this._material.setUniformValues({opacity: this._opacity});
		this._geometry.setPrefabData('a_position', 0, this._center.toArray());
		this._geometry.setPrefabData('a_scale', 0, [props.width / 2. / this._initRadius, props.height / 2. / this._initRadius, 1.]);
		this._geometry.attributes['a_position'].needsUpdate = true;
		this._geometry.attributes['a_scale'].needsUpdate = true;
	}

	animateProperties(props) {

	}
}