import * as THREE from 'three';
import * as BAS from 'three-bas';
import * as d3 from 'd3';
import * as _ from 'underscore';
import {getElementCounter} from '../../utils/counter';

/**
 *
 */
export default class Path {
	constructor(props) {
		this._type = 'Path';
		this._id = getElementCounter('Path');
		this.positions = [];
		this.previous = [];
		this.next = [];
		this.side = [];
		this.width = [];
		this.indices_array = [];
		this.uvs = [];
		this.counters = [];
		this._geometry = new THREE.BufferGeometry();
		this.setGeometry(props.path[1].segments);

		this.widthCallback = null;

		let sc = props.path[1].strokeColor;
		console.log(props);

		this._material = new PathMaterial({
			lineWidth: props.path[1].strokeWidth,
			useMap: false,
			color: new THREE.Color(sc[0], sc[1], sc[2]),
			opacity: props.opacity,
		});

		this._mesh = new THREE.Mesh(this._geometry, this._material);
		this._mesh.frustumCulled = false;
	}

	setGeometry(geometry, callback) {
		this.widthCallback = callback;

		this.positions = [];
		this.counters = [];

		if (geometry instanceof THREE.Geometry) {
			for (let j = 0; j < geometry.vertices.length; j++) {
				let v = geometry.vertices[j];
				let c = j / geometry.vertices.length;
				this.positions.push(v.x, v.y, v.z);
				this.positions.push(v.x, v.y, v.z);
				this.counters.push(c);
				this.counters.push(c);
			}
		}

		if (geometry instanceof Float32Array || geometry instanceof Array) {
			if (geometry.length > 0 && geometry[0] instanceof Array) {
				for (let j = 0; j < geometry.length; j++) {
					let c = j / geometry.length;
					this.positions.push(geometry[j][0], -geometry[j][1], 0.0);
					this.positions.push(geometry[j][0], -geometry[j][1], 0.0);
					this.counters.push(c);
					this.counters.push(c);
				}
			} else {
				for (let j = 0; j < geometry.length; j += 2) {
					let c = j / geometry.length;
					this.positions.push(geometry[j], geometry[j + 1], 0.0);
					this.positions.push(geometry[j], geometry[j + 1], 0.0);
					this.counters.push(c);
					this.counters.push(c);
				}
			}
		}

		this.process();
	}

	process() {
		let l = this.positions.length / 6;

		this.previous = [];
		this.next = [];
		this.side = [];
		this.width = [];
		this.indices_array = [];
		this.uvs = [];

		for (let j = 0; j < l; j++) {
			this.side.push(1);
			this.side.push(-1);
		}

		let w;
		for (let j = 0; j < l; j++) {
			if (this.widthCallback) w = this.widthCallback(j / (l - 1));
			else w = 1;
			this.width.push(w);
			this.width.push(w);
		}

		for (let j = 0; j < l; j++) {
			this.uvs.push(j / (l - 1), 0);
			this.uvs.push(j / (l - 1), 1);
		}

		let v;

		if (this.compareV3(0, l - 1)) {
			v = this.copyV3(l - 2);
		} else {
			v = this.copyV3(0);
		}
		this.previous.push(v[0], v[1], v[2]);
		this.previous.push(v[0], v[1], v[2]);
		for (let j = 0; j < l - 1; j++) {
			v = this.copyV3(j);
			this.previous.push(v[0], v[1], v[2]);
			this.previous.push(v[0], v[1], v[2]);
		}

		for (let j = 1; j < l; j++) {
			v = this.copyV3(j);
			this.next.push(v[0], v[1], v[2]);
			this.next.push(v[0], v[1], v[2]);
		}

		if (this.compareV3(l - 1, 0)) {
			v = this.copyV3(1);
		} else {
			v = this.copyV3(l - 1);
		}
		this.next.push(v[0], v[1], v[2]);
		this.next.push(v[0], v[1], v[2]);

		for (let j = 0; j < l - 1; j++) {
			let n = j * 2;
			this.indices_array.push(n, n + 1, n + 2);
			this.indices_array.push(n + 2, n + 1, n + 3);
		}

		if (!this.attributes) {
			this.attributes = {
				position: new THREE.BufferAttribute(new Float32Array(this.positions), 3),
				previous: new THREE.BufferAttribute(new Float32Array(this.previous), 3),
				next: new THREE.BufferAttribute(new Float32Array(this.next), 3),
				side: new THREE.BufferAttribute(new Float32Array(this.side), 1),
				width: new THREE.BufferAttribute(new Float32Array(this.width), 1),
				uv: new THREE.BufferAttribute(new Float32Array(this.uvs), 2),
				index: new THREE.BufferAttribute(new Uint16Array(this.indices_array), 1),
				counters: new THREE.BufferAttribute(new Float32Array(this.counters), 1)
			}
		} else {
			this.attributes.position.copyArray(new Float32Array(this.positions));
			this.attributes.position.needsUpdate = true;
			this.attributes.previous.copyArray(new Float32Array(this.previous));
			this.attributes.previous.needsUpdate = true;
			this.attributes.next.copyArray(new Float32Array(this.next));
			this.attributes.next.needsUpdate = true;
			this.attributes.side.copyArray(new Float32Array(this.side));
			this.attributes.side.needsUpdate = true;
			this.attributes.width.copyArray(new Float32Array(this.width));
			this.attributes.width.needsUpdate = true;
			this.attributes.uv.copyArray(new Float32Array(this.uvs));
			this.attributes.uv.needsUpdate = true;
			this.attributes.index.copyArray(new Uint16Array(this.indices_array));
			this.attributes.index.needsUpdate = true;
		}

		this._geometry.addAttribute('position', this.attributes.position);
		this._geometry.addAttribute('previous', this.attributes.previous);
		this._geometry.addAttribute('next', this.attributes.next);
		this._geometry.addAttribute('side', this.attributes.side);
		this._geometry.addAttribute('width', this.attributes.width);
		this._geometry.addAttribute('uv', this.attributes.uv);
		this._geometry.addAttribute('counters', this.attributes.counters);

		this._geometry.setIndex(this.attributes.index);
	}

	advance(position) {
		let positions = this.attributes.position.array,
			previous = this.attributes.previous.array,
			next = this.attributes.next.array,
			l = positions.length;

		// PREVIOUS
		memcpy(positions, 0, previous, 0, l);

		// POSITIONS
		memcpy(positions, 4, positions, 0, l - 4);

		positions[l - 4] = position.x;
		positions[l - 3] = position.y;
		positions[l - 2] = position.x;
		positions[l - 1] = position.y;

		// NEXT
		memcpy(positions, 4, next, 0, l - 4);

		next[l - 4] = position.x;
		next[l - 3] = position.y;
		next[l - 2] = position.x;
		next[l - 1] = position.y;

		this.attributes.position.needsUpdate = true;
		this.attributes.previous.needsUpdate = true;
		this.attributes.next.needsUpdate = true;
	}

	compareV3(a, b) {
		let aa = a * 6, bb = b * 6;
		return (this.positions[aa] === this.positions[bb]) && (this.positions[aa + 1] === this.positions[bb + 1]) && (this.positions[aa + 2] === this.positions[bb + 2]);
	}

	copyV3(a) {
		let aa = a * 6;
		return [this.positions[aa], this.positions[aa + 1], this.positions[aa + 2]];
	}

	static memcpy(src, srcOffset, dst, dstOffset, length) {
		let i;

		src = src.subarray || src.slice ? src : src.buffer;
		dst = dst.subarray || dst.slice ? dst : dst.buffer;

		src = srcOffset ? src.subarray ?
			src.subarray(srcOffset, length && srcOffset + length) :
			src.slice(srcOffset, length && srcOffset + length) : src;

		if (dst.set) {
			dst.set(src, dstOffset)
		} else {
			for (i = 0; i < src.length; i++) {
				dst[i + dstOffset] = src[i];
			}
		}

		return dst;
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

	updateProperties(propertyMap) {

	}

	animateProperties(propA, propB) {

	}
}

class PathMaterial extends BAS.BasicAnimationMaterial {

	constructor(props) {
		let defaultProps = {
			transparent: true,
			flatShading: THREE.FlatShading,
			// vertexParameters: [
			// 	'uniform float lineWidth;',
			// 	'uniform vec3 color;',
			// 	'uniform float opacity;',
			// 	'varying vec4 vColor;',
			// ],
			// vertexFunctions: [BAS.ShaderChunk['ease_quad_in']],
			// vertexPosition: [
			// 	'vColor = vec4(color, opacity);',
			// ],
			vertexParameters: [
				'attribute vec3 previous;',
				'attribute vec3 next;',
				'attribute float side;',
				'attribute float width;',
				'attribute float counters;',
				'',
				'uniform float lineWidth;',
				'uniform vec3 color;',
				'uniform float opacity;',
				'uniform float sizeAttenuation;',
				'',
				'varying vec2 vUV;',
				'varying vec4 vColor;',
				'varying float vCounters;',
			],
			vertexFunctions: [BAS.ShaderChunk['ease_quad_in']],
			vertexPosition: [
				'vColor = vec4(color, opacity);',
				'vUV = uv;',
				'vCounters = counters;',
				'',
				// 'mat4 m = projectionMatrix * modelViewMatrix;',
				'vec3 finalPosition = vec3(position);',
				// 'vec4 prevPos = m * vec4(previous, 1.0);',
				// 'vec4 nextPos = m * vec4(next, 1.0);',
				// '',
				// 'vec2 currentP = position.xy;',
				// 'vec2 prevP = previous.xy;',
				// 'vec2 nextP = next.xy;',
				'',
				'float w = lineWidth * width;',
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
				'    w = (w < 0.0 || w > lineWidth * width * 10.0) ? lineWidth * width : w;',
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
				'varying vec2 vUV;',
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