class Trap {
    constructor(position) {
      this.position = position;
      this.obj;
      this.parts;
    }
    async createObjFromURL(gl, url){
        const response = await fetch(url);
        const text = await response.text();
        this.obj = parseOBJ(text);
        const baseHref = new URL(url, window.location.href);
        const matTexts = await Promise.all(this.obj.materialLibs.map(async filename => {
        const matHref = new URL(filename, baseHref).href;
        const response = await fetch(matHref);
        return await response.text();
        }));
        const materials = parseMTL(matTexts.join('\n'));

        const textures = {
          defaultWhite: create1PixelTexture(gl, [255, 255, 255, 255]),
        };
      
        // load texture for materials
        for (const material of Object.values(materials)) {
          Object.entries(material)
            .filter(([key]) => key.endsWith('Map'))
            .forEach(([key, filename]) => {
              let texture = textures[filename];
              if (!texture) {
                const textureHref = new URL(filename, baseHref).href;
                texture = createTexture(gl, textureHref);
                textures[filename] = texture;
              }
              material[key] = texture;
            });
        }
      
        const defaultMaterial = {
          diffuse: [1, 1, 1],
          diffuseMap: textures.defaultWhite,
          ambient: [0, 0, 0],
          specular: [1, 1, 1],
          shininess: 400,
          opacity: 1,
        };
      
        this.parts = this.obj.geometries.map(({material, data}) => {
          if (data.color) {
            if (data.position.length === data.color.length) {
              // it's 3. The our helper library assumes 4 so we need
              // to tell it there are only 3.
              data.color = { numComponents: 3, data: data.color };
            }
          } else {
            // there are no vertex colors so just use constant white
            data.color = { value: [1, 1, 1, 1] };
          }
      
          // create a buffer for each array by calling
          // gl.createBuffer, gl.bindBuffer, gl.bufferData
          const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
          return {
            material: {
              ...defaultMaterial,
              ...materials[material],
            },
            bufferInfo,
          };
        });
    }
    render(gl, meshProgramInfo, u_world){
      for (const {bufferInfo, material} of this.parts) {
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
        // calls gl.uniform
        webglUtils.setUniforms(meshProgramInfo, {
          u_world,
        }, material);
        // calls gl.drawArrays or gl.drawElements
        webglUtils.drawBufferInfo(gl, bufferInfo);
      }
    }
}

const TRAP_PROXIMITY_RANGE = 1.2
const TRAP_COUNT = 5