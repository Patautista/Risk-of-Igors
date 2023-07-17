class Scenario {
    constructor() {
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
          // Because data is just named arrays like this
          //
          // {
          //   position: [...],
          //   texcoord: [...],
          //   normal: [...],
          // }
          //
          // and because those names match the attributes in our vertex
          // shader we can pass it directly into `createBufferInfoFromArrays`
          // from the article "less code more fun".
      
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
  // Function to create collision boxes for the scenario
  createCollisionBoxes() {
    this.collisionBoxes = this.obj.geometries.map(({ data, material }) => {
      const modelMatrix = m4.identity(); // Initialize the model matrix as identity for each part

      // If the material has a u_world matrix (from your previous rendering code), use it for the model matrix
      if (material.u_world) {
        modelMatrix.set(material.u_world);
      }

      const { position } = data;
      const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
      const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];

      // Calculate the bounding box's center
      

      // Transform each vertex by the model matrix and calculate the minimum and maximum points
      for (let i = 0; i < position.length; i += 3) {
        const vertex = [position[i], position[i + 1], position[i + 2]];
        var center = [0,0,0];
        
        const transformedVertex = m4.transformPoint(modelMatrix, vertex, center);

        for (let j = 0; j < 3; j++) {
          const v = transformedVertex[j];
          min[j] = Math.min(v, min[j]);
          max[j] = Math.max(v, max[j]);
        }

        center = [
          (min[0] + max[0]) / 2,
          (min[1] + max[1]) / 2,
          (min[2] + max[2]) / 2,
        ];
      }

      return { min, max };
    });
  }

  // Function to check if the camera collides with the scenario
  checkCollision(cameraPosition) {
    if (!this.collisionBoxes) {
      this.createCollisionBoxes();
    }
    for (const box of this.collisionBoxes) {
      if (
        cameraPosition[0] >= box.min[0] && cameraPosition[0] <= box.max[0] &&
        cameraPosition[2] >= box.min[2] && cameraPosition[2] <= box.max[2]
      ) {
        // Collision detected, handle it accordingly (e.g., stop movement or take damage)
        return false;
      }
    }

    return true;
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