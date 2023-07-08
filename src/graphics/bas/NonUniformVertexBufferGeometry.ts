import * as THREE from 'three';

/**
 * A NonUniformVertexBufferGeometry where a geometry is repeated a number of times with nonuniform number of vertices between
 * repeated geometry.
 *
 * @param {BufferGeometry} prefab - the buffer geometry to be repeated
 * @param {Array} vertexCounts - an Array of the count of position vertices for each geometry
 * @param {Number} count - the number of times to repeat the geometry
 */
export default class NonUniformVertexBufferGeometry extends THREE.BufferGeometry {
    constructor(prefab, vertexCounts, count) {
        super();
        this.prefabGeometry = prefab;
        this.vertexCounts = vertexCounts;
        this.prefabCount = count;
        // if (indices) this.bufferIndices(indices);
        // if (positions) this.bufferPositions(positions);
        this.totalVertexCount = this.vertexCounts.reduce((a, b) => a + b, 0);
    }

    public totalVertexCount: number = 0;
    public prefabGeometry;
    public vertexCounts: number[];
    public prefabCount: number;

    // bufferIndices(indices) {
    //     const indexBuffer = Uint32Array.from(indices);
    //
    //     this.setIndex(new THREE.BufferAttribute(indexBuffer, 1));
    // }

    // bufferPositions(positions) {
    //     const positionBuffer = this.createAttribute('position', 3);
    //
    //     for (let i = 0; i < this.totalVertexCount; i++) {
    //         positionBuffer[i] = positions[i];
    //         positionBuffer[i] = positions[i];
    //         positionBuffer[i] = positions[i];
    //     }
    // }

    bufferUvs() {}

    /**
     * Creates a BufferAttribute on this geometry instance.
     *
     * @param {String} name Name of the attribute.
     * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
     * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
     *
     * @returns {THREE.BufferAttribute}
     */
    createAttribute(name, itemSize, factory?) {
        const buffer = new Float32Array(this.totalVertexCount * itemSize);
        const attribute = new THREE.BufferAttribute(buffer, itemSize);
        // attribute.array = buffer;
        // this.attributes[name] = attribute;

        this.setAttribute(name, attribute);

        if (factory) {
            const data = [];

            for (let i = 0; i < this.prefabCount; i++) {
                factory(data, i, this.prefabCount);
                this.setPrefabData(attribute, i, data);
            }
        }

        return attribute;
    }

    /**
     * Sets data for all vertices of a prefab at a given index.
     * Usually called in a loop.
     *
     * @param {String|THREE.BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
     * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
     * @param {Array} data Array of data. Length should be equal to item size of the attribute.
     */
    setPrefabData(attribute, prefabIndex, data) {
        attribute =
            typeof attribute === 'string' ? this.attributes[attribute] : attribute;

        let offset =
            this.vertexCounts.slice(0, prefabIndex).reduce((a, b) => a + b, 0) *
            attribute.itemSize;

        for (let i = 0; i < this.vertexCounts[prefabIndex]; i++) {
            for (let j = 0; j < attribute.itemSize; j++) {
                attribute.array[offset++] = data[j];
            }
        }
    }

    setAttributeArray(attribute, array) {
        attribute =
            typeof attribute === 'string' ? this.attributes[attribute] : attribute;

        attribute.array = array;
    }
}
