import * as THREE from 'three';
import * as BAS from 'three-bas';
import * as d3 from 'd3';
import * as _ from 'underscore';
import {getElementCounter} from '../../utils/counter';
import NonUniformVertexBufferGeometry from '../bas/NonUniformVertexBufferGeometry';
import DatasetManager from "../../data/DatasetManager";

/**
 *
 */
export default class Path {
	constructor(propertyMap, dataScopeMap, dataIdList) {
		this._type = 'Path';
		this._id = getElementCounter('Path');
		this._classId = this._type + '' + this._id;
		this._propertyMap = propertyMap;
		this._dataScopeMap = dataScopeMap;
		this._dataIdList = dataIdList;
		this._peerCount = dataIdList.length;
		let scope0 = dataScopeMap[dataIdList[0]];
		this._peerTerm = DatasetManager.peerTermFromScope(scope0);

		this.positions = [];
		this.previous = [];
		this.next = [];
		this.b_positions = [];
		this.b_previous = [];
		this.b_next = [];
		this.side = [];
		this.indices_array = [];
		this.counters = [];

		this._prefab = new THREE.BufferGeometry();
		let vertexCounts = [];
		this._dataIdList.forEach((id, i) => {
			let p = this._propertyMap[id];
			vertexCounts.push(this.processGeometry(p.path[1].segments));
		});
		this._geometry = new NonUniformVertexBufferGeometry(this._prefab, vertexCounts, dataIdList.length);
		this.addAttributes();

		let strokeBuffer = this._geometry.createAttribute('a_stroke_color', 3);
		let opacityBuffer = this._geometry.createAttribute('a_opacity', 1);
		let widthBuffer = this._geometry.createAttribute('a_line_width', 1);
		this._geometry.createAttribute('b_stroke_color', 3);
		this._geometry.createAttribute('b_opacity', 1);
		this._geometry.createAttribute('b_line_width', 1);
		this._geometry.createAttribute('b_position', 3);
		this._geometry.createAttribute('b_previous', 3);
		this._geometry.createAttribute('b_next', 3);

		let tempArray = [];
		this._dataIdList.forEach((id, i) => {
			let p = this._propertyMap[id];
			let sc = p.path[1].strokeColor;
			tempArray[0] = sc[0];
			tempArray[1] = sc[1];
			tempArray[2] = sc[2];
			this._geometry.setPrefabData(strokeBuffer, i, tempArray);
			tempArray[0] = p.opacity;
			this._geometry.setPrefabData(opacityBuffer, i, tempArray);
			tempArray[0] = p.path[1].strokeWidth;
			this._geometry.setPrefabData(widthBuffer, i, tempArray);
		});

		this._material = new PathMaterial({
			useMap: false,
		});

		this._animateMaterial = new PathAnimateMaterial({
			useMap: false,
		});

		this._mesh = new THREE.Mesh(this._geometry, this._material);
		this._mesh.frustumCulled = false;
	}

	processGeometry(segments) {
		let l = segments.length;
		let positionOffset = this.positions.length / 6, indicesOffset = this.positions.length / 3;
		if (segments instanceof Float32Array || segments instanceof Array) {
			if (segments.length > 0 && segments[0] instanceof Array) {
				for (let j = 0; j < segments.length; j++) {
					let c = j / segments.length;
					this.positions.push(segments[j][0], -segments[j][1], 0.0);
					this.positions.push(segments[j][0], -segments[j][1], 0.0);
					this.counters.push(c);
					this.counters.push(c);
				}
			} else {
				for (let j = 0; j < segments.length; j += 2) {
					let c = j / segments.length;
					this.positions.push(segments[j], segments[j + 1], segments[j + 2]);
					this.positions.push(segments[j], segments[j + 1], segments[j + 2]);
					this.counters.push(c);
					this.counters.push(c);
				}
				l = segments.length / 3;
			}
		}

		for (let j = 0; j < l; j++) {
			this.side.push(1);
			this.side.push(-1);
		}

		let v;
		if (this.compareV3(indicesOffset, l - 1 + positionOffset)) {
			v = this.copyV3(l - 2 + positionOffset);
		} else {
			v = this.copyV3(positionOffset);
		}
		this.previous.push(v[0], v[1], v[2]);
		this.previous.push(v[0], v[1], v[2]);
		for (let j = 0; j < l - 1; j++) {
			v = this.copyV3(j + positionOffset);
			this.previous.push(v[0], v[1], v[2]);
			this.previous.push(v[0], v[1], v[2]);
		}

		for (let j = 1; j < l; j++) {
			v = this.copyV3(j + positionOffset);
			this.next.push(v[0], v[1], v[2]);
			this.next.push(v[0], v[1], v[2]);
		}

		if (this.compareV3(l - 1 + positionOffset, 0)) {
			v = this.copyV3(1 + positionOffset);
		} else {
			v = this.copyV3(l - 1 + positionOffset);
		}
		this.next.push(v[0], v[1], v[2]);
		this.next.push(v[0], v[1], v[2]);

		for (let j = 0; j < l - 1; j++) {
			let n = j * 2 + indicesOffset;
			this.indices_array.push(n, n + 1, n + 2);
			this.indices_array.push(n + 2, n + 1, n + 3);
		}

		return l * 2;
	}

	updateGeometry(segments) {
		let l = segments.length;
		let positionOffset = this.positions.length / 6, indicesOffset = this.positions.length / 3;
		if (segments instanceof Float32Array || segments instanceof Array) {
			if (segments.length > 0 && segments[0] instanceof Array) {
				for (let j = 0; j < segments.length; j++) {
					let c = j / segments.length;
					this.positions.push(segments[j][0], -segments[j][1], 0.0);
					this.positions.push(segments[j][0], -segments[j][1], 0.0);
				}
			} else {
				for (let j = 0; j < segments.length; j += 2) {
					let c = j / segments.length;
					this.positions.push(segments[j], segments[j + 1], segments[j + 2]);
					this.positions.push(segments[j], segments[j + 1], segments[j + 2]);
				}
				l = segments.length / 3;
			}
		}

		let v;
		if (this.compareV3(indicesOffset, l - 1 + positionOffset)) {
			v = this.copyV3(l - 2 + positionOffset);
		} else {
			v = this.copyV3(positionOffset);
		}
		this.previous.push(v[0], v[1], v[2]);
		this.previous.push(v[0], v[1], v[2]);
		for (let j = 0; j < l - 1; j++) {
			v = this.copyV3(j + positionOffset);
			this.previous.push(v[0], v[1], v[2]);
			this.previous.push(v[0], v[1], v[2]);
		}

		for (let j = 1; j < l; j++) {
			v = this.copyV3(j + positionOffset);
			this.next.push(v[0], v[1], v[2]);
			this.next.push(v[0], v[1], v[2]);
		}

		if (this.compareV3(l - 1 + positionOffset, 0)) {
			v = this.copyV3(1 + positionOffset);
		} else {
			v = this.copyV3(l - 1 + positionOffset);
		}
		this.next.push(v[0], v[1], v[2]);
		this.next.push(v[0], v[1], v[2]);
	}

	updateGeometryB(segments) {
		let l = segments.length;
		let positionOffset = this.b_positions.length / 6, indicesOffset = this.b_positions.length / 3;
		if (segments instanceof Float32Array || segments instanceof Array) {
			if (segments.length > 0 && segments[0] instanceof Array) {
				for (let j = 0; j < segments.length; j++) {
					this.b_positions.push(segments[j][0], -segments[j][1], 0.0);
					this.b_positions.push(segments[j][0], -segments[j][1], 0.0);
				}
			} else {
				for (let j = 0; j < segments.length; j += 2) {
					this.b_positions.push(segments[j], segments[j + 1], segments[j + 2]);
					this.b_positions.push(segments[j], segments[j + 1], segments[j + 2]);
				}
				l = segments.length / 3;
			}
		}

		let v;
		if (this.compareV3B(indicesOffset, l - 1 + positionOffset)) {
			v = this.copyV3B(l - 2 + positionOffset);
		} else {
			v = this.copyV3B(positionOffset);
		}
		this.b_previous.push(v[0], v[1], v[2]);
		this.b_previous.push(v[0], v[1], v[2]);
		for (let j = 0; j < l - 1; j++) {
			v = this.copyV3B(j + positionOffset);
			this.b_previous.push(v[0], v[1], v[2]);
			this.b_previous.push(v[0], v[1], v[2]);
		}

		for (let j = 1; j < l; j++) {
			v = this.copyV3B(j + positionOffset);
			this.b_next.push(v[0], v[1], v[2]);
			this.b_next.push(v[0], v[1], v[2]);
		}

		if (this.compareV3B(l - 1 + positionOffset, 0)) {
			v = this.copyV3B(1 + positionOffset);
		} else {
			v = this.copyV3B(l - 1 + positionOffset);
		}
		this.b_next.push(v[0], v[1], v[2]);
		this.b_next.push(v[0], v[1], v[2]);
	}

	addAttributes() {
		this._geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(this.positions), 3));
		this._geometry.addAttribute('previous', new THREE.BufferAttribute(new Float32Array(this.previous), 3));
		this._geometry.addAttribute('next', new THREE.BufferAttribute(new Float32Array(this.next), 3));
		this._geometry.addAttribute('side', new THREE.BufferAttribute(new Float32Array(this.side), 1));
		this._geometry.addAttribute('counters', new THREE.BufferAttribute(new Float32Array(this.counters), 1));

		this._geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(this.indices_array), 1));
	}

	setAttributes() {
		this._geometry.setAttribute('position', new Float32Array(this.positions));
		this._geometry.setAttribute('previous', new Float32Array(this.previous));
		this._geometry.setAttribute('next', new Float32Array(this.next));
	}

	setAttributesB() {
		this._geometry.setAttribute('b_position', new Float32Array(this.b_positions));
		this._geometry.setAttribute('b_previous', new Float32Array(this.b_previous));
		this._geometry.setAttribute('b_next', new Float32Array(this.b_next));
	}

	compareV3(a, b) {
		let aa = a * 6, bb = b * 6;
		return (this.positions[aa] === this.positions[bb]) && (this.positions[aa + 1] === this.positions[bb + 1]) && (this.positions[aa + 2] === this.positions[bb + 2]);
	}

	copyV3(a) {
		let aa = a * 6;
		return [this.positions[aa], this.positions[aa + 1], this.positions[aa + 2]];
	}

	compareV3B(a, b) {
		let aa = a * 6, bb = b * 6;
		return (this.b_positions[aa] === this.b_positions[bb]) && (this.b_positions[aa + 1] === this.b_positions[bb + 1]) && (this.b_positions[aa + 2] === this.b_positions[bb + 2]);
	}

	copyV3B(a) {
		let aa = a * 6;
		return [this.b_positions[aa], this.b_positions[aa + 1], this.b_positions[aa + 2]];
	}

	get type() {
		return this._type;
	}

	get id() {
		return this._id;
	}

	get classId() {
		return this._classId;
	}

	set classId(v) {
		this._classId = v;
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

	set time(value) {
		this._animateMaterial.setUniformValues({time: value});
	}

	get isPeer() {
		return true;
	}

	get peerCount() {
		return this._peerCount;
	}

	get peerTerm() {
		return this._peerTerm;
	}

	get dataIdList() {
		return this._dataIdList
	}

	updateProperties(propertyMap) {
		this._mesh.material = this._material;
		this.positions = [];
		this.previous = [];
		this.next = [];
		let tempArray = [];
		this._dataIdList.forEach((id, i) => {
			let p = propertyMap[id];
			this.updateGeometry(p.path[1].segments);
			let sc = p.path[1].strokeColor;

			tempArray[0] = sc[0];
			tempArray[1] = sc[1];
			tempArray[2] = sc[2];
			this._geometry.setPrefabData('a_stroke_color', i, tempArray);
			tempArray[0] = p.opacity;
			this._geometry.setPrefabData('a_opacity', i, tempArray);
			tempArray[0] = p.path[1].strokeWidth;
			this._geometry.setPrefabData('a_line_width', i, tempArray);
		});
		this.setAttributes();
		this._geometry.attributes['a_stroke_color'].needsUpdate = true;
		this._geometry.attributes['a_opacity'].needsUpdate = true;
		this._geometry.attributes['a_line_width'].needsUpdate = true;
		this._geometry.attributes['position'].needsUpdate = true;
		this._geometry.attributes['previous'].needsUpdate = true;
		this._geometry.attributes['next'].needsUpdate = true;
	}

	animateProperties(propA, propB) {
		this._mesh.material = this._animateMaterial;
		this.positions = [];
		this.previous = [];
		this.next = [];
		this.b_positions = [];
		this.b_previous = [];
		this.b_next = [];
		let tempArray = [];
		this._dataIdList.forEach((id, i) => {
			let pA = propA[id], pB = propB[id];

			this.updateGeometry(pA.path[1].segments);
			this.updateGeometryB(pB.path[1].segments);

			let sc = pA.path[1].strokeColor;
			tempArray[0] = sc[0];
			tempArray[1] = sc[1];
			tempArray[2] = sc[2];
			this._geometry.setPrefabData('a_stroke_color', i, tempArray);
			sc = pB.path[1].strokeColor;
			tempArray[0] = sc[0];
			tempArray[1] = sc[1];
			tempArray[2] = sc[2];
			this._geometry.setPrefabData('b_stroke_color', i, tempArray);

			tempArray[0] = pA.opacity;
			this._geometry.setPrefabData('a_opacity', i, tempArray);
			tempArray[0] = pB.opacity;
			this._geometry.setPrefabData('b_opacity', i, tempArray);

			tempArray[0] = pA.path[1].strokeWidth;
			this._geometry.setPrefabData('a_line_width', i, tempArray);
			tempArray[0] = pB.path[1].strokeWidth;
			this._geometry.setPrefabData('b_line_width', i, tempArray);
		});

		this.setAttributes();
		this.setAttributesB();

		this._geometry.attributes['a_stroke_color'].needsUpdate = true;
		this._geometry.attributes['a_opacity'].needsUpdate = true;
		this._geometry.attributes['a_line_width'].needsUpdate = true;
		this._geometry.attributes['position'].needsUpdate = true;
		this._geometry.attributes['previous'].needsUpdate = true;
		this._geometry.attributes['next'].needsUpdate = true;
		this._geometry.attributes['b_stroke_color'].needsUpdate = true;
		this._geometry.attributes['b_opacity'].needsUpdate = true;
		this._geometry.attributes['b_line_width'].needsUpdate = true;
		this._geometry.attributes['b_position'].needsUpdate = true;
		this._geometry.attributes['b_previous'].needsUpdate = true;
		this._geometry.attributes['b_next'].needsUpdate = true;
	}
}

class PathMaterial extends BAS.BasicAnimationMaterial {

	constructor(props) {
		let defaultProps = {
			transparent: true,
			flatShading: THREE.FlatShading,
			vertexParameters: [
				'attribute vec3 previous;',
				'attribute vec3 next;',
				'attribute float side;',
				'attribute float counters;',
				'attribute float a_line_width;',
				'attribute vec3 a_stroke_color;',
				'attribute float a_opacity;',
				'',
				'uniform float lineWidth;',
				'uniform vec3 color;',
				'uniform float opacity;',
				'uniform float sizeAttenuation;',
				'',
				'varying vec4 vColor;',
				'varying float vCounters;',
			],
			vertexFunctions: [BAS.ShaderChunk['ease_quad_in']],
			vertexPosition: [
				'vColor = vec4(a_stroke_color, a_opacity);',
				'vCounters = counters;',
				'',
				'vec3 finalPosition = vec3(position);',
				'',
				'float w = a_line_width;',
				'',
				'vec2 dir = vec2(0.0);',
				'if( next == position ) {',
				'    dir = normalize( position.xy - previous.xy );',
				'} else if( previous == position ) {',
				'    dir = normalize( next.xy - position.xy );',
				'} else {',
				'    vec2 dirA = normalize( position.xy - previous.xy );',
				'    vec2 dirB = normalize( next.xy - position.xy );',
				'    dir = normalize(dirA + dirB);',
				'    vec2 perp = vec2(-dirA.y, dirA.x);',
				'    vec2 miter = vec2(-dir.y, dir.x);',
				'    float miterDot = dot(miter, perp);',
				'    w = miterDot == 0.0 ? 0.0 : (w / miterDot);',
				'    w = (w < 0.0 || w > a_line_width * 10.0) ? a_line_width : w;',
				'}',
				'',
				'vec2 normal = vec2( -dir.y, dir.x );',
				'normal *= 0.5 * w;',
				'',
				'vec4 offset = vec4(normal * side, 0.0, 0.0);',
				'finalPosition.xy += offset.xy;',
				'',
				'transformed = finalPosition.xyz;',
			],
			fragmentParameters: [
				'uniform sampler2D map;',
				'uniform sampler2D alphaMap;',
				'uniform float useMap;',
				'uniform float useAlphaMap;',
				'uniform float useDash;',
				'uniform float dashArray;',
				'uniform float dashOffset;',
				'uniform float dashRatio;',
				'uniform float visibility;',
				'uniform float alphaTest;',
				'uniform vec2 repeat;',
				'',
				'varying vec4 vColor;',
				'varying float vCounters;',
			],
			fragmentDiffuse: [
				'diffuseColor = vColor;',
			]
		};

		function check(v, d) {
			if (v === undefined) return d;
			return v;
		}

		props = check(props, {});

		let materialProps = _.assign(defaultProps, {
			uniforms: {
				lineWidth: {type: 'f', value: check(props.lineWidth, 1)},
				map: {type: 't', value: check(props.map, null)},
				useMap: {type: 'f', value: check(props.useMap, 0)},
				alphaMap: {type: 't', value: check(props.alphaMap, null)},
				useAlphaMap: {type: 'f', value: check(props.useAlphaMap, 0)},
				color: {type: 'c', value: check(props.color, new THREE.Color(0xffffff))},
				opacity: {type: 'f', value: check(props.opacity, 1)},
				sizeAttenuation: {type: 'f', value: check(props.sizeAttenuation, 1)},
				dashArray: {type: 'f', value: check(props.dashArray, 0)},
				dashOffset: {type: 'f', value: check(props.dashOffset, 0)},
				dashRatio: {type: 'f', value: check(props.dashRatio, 0.5)},
				useDash: {type: 'f', value: (props.dashArray !== 0) ? 1 : 0},
				visibility: {type: 'f', value: check(props.visibility, 1)},
				alphaTest: {type: 'f', value: check(props.alphaTest, 0)},
				repeat: {type: 'v2', value: check(props.repeat, new THREE.Vector2(1, 1))}
			},
		});

		super(materialProps);

		delete props.lineWidth;
		delete props.map;
		delete props.useMap;
		delete props.alphaMap;
		delete props.useAlphaMap;
		delete props.color;
		delete props.opacity;
		delete props.resolution;
		delete props.sizeAttenuation;
		delete props.near;
		delete props.far;
		delete props.dashArray;
		delete props.dashOffset;
		delete props.dashRatio;
		delete props.visibility;
		delete props.alphaTest;
		delete props.repeat;

		this.type = 'PathMaterial';
		this.setValues(props);
	}

}

class PathAnimateMaterial extends BAS.BasicAnimationMaterial {

	constructor(props) {
		let defaultProps = {
			transparent: true,
			flatShading: THREE.FlatShading,
			vertexParameters: [
				'attribute vec3 previous;',
				'attribute vec3 next;',
				'attribute float side;',
				'attribute float counters;',
				'attribute vec3 a_stroke_color;',
				'attribute float a_opacity;',
				'attribute float a_line_width;',
				'attribute vec3 b_stroke_color;',
				'attribute float b_opacity;',
				'attribute float b_line_width;',
				'attribute vec3 b_position;',
				'attribute vec3 b_previous;',
				'attribute vec3 b_next;',
				'',
				'uniform float time;',
				'uniform float lineWidth;',
				'uniform vec3 color;',
				'uniform float opacity;',
				'uniform float sizeAttenuation;',
				'',
				'varying vec4 vColor;',
				'varying float vCounters;',
			],
			vertexFunctions: [BAS.ShaderChunk['ease_quad_in']],
			vertexPosition: [
				'float progress = easeQuadIn(time);',
				'vec3 stroke_color = mix(a_stroke_color, b_stroke_color, progress);',
				'float v_opacity = mix(a_opacity, b_opacity, progress);',
				'vColor = vec4(stroke_color, v_opacity);',
				'vCounters = counters;',
				'',
				'vec3 finalPosition = mix(position, b_position, progress);',
				'vec3 prevPosition = mix(previous, b_previous, progress);',
				'vec3 nextPosition = mix(next, b_next, progress);',
				'',
				'float line_width = mix(a_line_width, b_line_width, progress);',
				'float w = line_width;',
				'',
				'vec2 dir = vec2(0.0);',
				'if( nextPosition == finalPosition ) {',
				'    dir = normalize( finalPosition.xy - prevPosition.xy );',
				'} else if( prevPosition == finalPosition ) {',
				'    dir = normalize( nextPosition.xy - finalPosition.xy );',
				'} else {',
				'    vec2 dirA = normalize(finalPosition.xy - prevPosition.xy);',
				'    vec2 dirB = normalize(nextPosition.xy - finalPosition.xy );',
				'    dir = normalize(dirA + dirB);',
				'    vec2 perp = vec2(-dirA.y, dirA.x);',
				'    vec2 miter = vec2(-dir.y, dir.x);',
				'    float miterDot = dot(miter, perp);',
				'    w = miterDot == 0.0 ? 0.0 : (w / miterDot);',
				'    w = (w < 0.0 || w > line_width * 10.0) ? line_width : w;',
				'}',
				'',
				'vec2 normal = vec2( -dir.y, dir.x );',
				'normal *= 0.5 * w;',
				'',
				'vec4 offset = vec4(normal * side, 0.0, 0.0);',
				'finalPosition.xy += offset.xy;',
				'',
				'transformed = finalPosition.xyz;',
			],
			fragmentParameters: [
				'varying vec4 vColor;',
			],
			fragmentDiffuse: [
				'diffuseColor = vColor;',
			]
		};

		function check(v, d) {
			if (v === undefined) return d;
			return v;
		}

		props = check(props, {});

		let materialProps = _.assign(defaultProps, {
			uniforms: {
				time: {value: 0},
				lineWidth: {type: 'f', value: check(props.lineWidth, 1)},
				map: {type: 't', value: check(props.map, null)},
				useMap: {type: 'f', value: check(props.useMap, 0)},
				alphaMap: {type: 't', value: check(props.alphaMap, null)},
				useAlphaMap: {type: 'f', value: check(props.useAlphaMap, 0)},
				color: {type: 'c', value: check(props.color, new THREE.Color(0xffffff))},
				opacity: {type: 'f', value: check(props.opacity, 1)},
				sizeAttenuation: {type: 'f', value: check(props.sizeAttenuation, 1)},
				dashArray: {type: 'f', value: check(props.dashArray, 0)},
				dashOffset: {type: 'f', value: check(props.dashOffset, 0)},
				dashRatio: {type: 'f', value: check(props.dashRatio, 0.5)},
				useDash: {type: 'f', value: (props.dashArray !== 0) ? 1 : 0},
				visibility: {type: 'f', value: check(props.visibility, 1)},
				alphaTest: {type: 'f', value: check(props.alphaTest, 0)},
				repeat: {type: 'v2', value: check(props.repeat, new THREE.Vector2(1, 1))}
			},
		});

		super(materialProps);

		delete props.lineWidth;
		delete props.map;
		delete props.useMap;
		delete props.alphaMap;
		delete props.useAlphaMap;
		delete props.color;
		delete props.opacity;
		delete props.resolution;
		delete props.sizeAttenuation;
		delete props.near;
		delete props.far;
		delete props.dashArray;
		delete props.dashOffset;
		delete props.dashRatio;
		delete props.visibility;
		delete props.alphaTest;
		delete props.repeat;

		this.type = 'PathMaterial';
		this.setValues(props);
	}

}