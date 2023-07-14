async function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("#glcanvas1");
    const gl = canvas.getContext("webgl");
    if (!gl) {
      return;
    }
  
    let response = await fetch("./shaders/vertex_shader.glsl");
    const vs = await response.text();
    response = await fetch("./shaders/fragment_shader.glsl");
    const fs = await response.text();
  
    // compiles and links the shaders, looks up attribute and uniform locations
    const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);
  
    const objHref = './obj/test2.obj';  
    response = await fetch(objHref);
    const text = await response.text();
    const obj = parseOBJ(text);
    const baseHref = new URL(objHref, window.location.href);
    const matTexts = await Promise.all(obj.materialLibs.map(async filename => {
      const matHref = new URL(filename, baseHref).href;
      const response = await fetch(matHref);
      return await response.text();
    }));
    const materials = parseMTL(matTexts.join('\n'));
  
    const parts = obj.geometries.map(({material, data}) => {
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
        material: materials[material],
        bufferInfo,
      };
    });
  
    function getExtents(positions) {
      const min = positions.slice(0, 3);
      const max = positions.slice(0, 3);
      for (let i = 3; i < positions.length; i += 3) {
        for (let j = 0; j < 3; ++j) {
          const v = positions[i + j];
          min[j] = Math.min(v, min[j]);
          max[j] = Math.max(v, max[j]);
        }
      }
      return {min, max};
    }
  
    function getGeometriesExtents(geometries) {
      return geometries.reduce(({min, max}, {data}) => {
        const minMax = getExtents(data.position);
        return {
          min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
          max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
        };
      }, {
        min: Array(3).fill(Number.POSITIVE_INFINITY),
        max: Array(3).fill(Number.NEGATIVE_INFINITY),
      });
    }
  
    const extents = getGeometriesExtents(obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);
    // amount to move the object so its center is at the origin
    var objOffset = m4.scaleVector(
        m4.addVectors(
          extents.min,
          m4.scaleVector(range, 0.5)),
        -1);
    let cameraTarget = [0, 0, 0];
  
    // figure out how far away to move the camera so we can likely
    // see the object.
    const radius = m4.length(range) * 1.2;
    let cameraPosition = m4.addVectors(cameraTarget, [
      0,
      0,
      radius,
    ]);
    // Set zNear and zFar to something hopefully appropriate
    // for the size of this object.
    const zNear = radius / 100;
    const zFar = radius * 3;
  
    enemyPosition = [0,0,0]
    enemyFacingDirection = m4.subtractVectors(enemyPosition, cameraPosition)
  
    function degToRad(deg) {
      return deg * Math.PI / 180;
    }

    var currentAngle = 0;          // Current rotation angle
    var rotationSpeed = 0.01;      // Speed of rotation per frame
  
    // -- Where the magic happens
    function render(time) {
      time *= 0.001;  // convert to seconds
  
      // scaleVector is used to calculate a point halfway the distance between current position and the targets
  
      //D = A + (B - A) * (moving * step_amount)
      cameraPosition = m4.addVectors(cameraPosition, m4.scaleVector(m4.subtractVectors(cameraTarget, cameraPosition), movement.backForth * STEP_AMOUNT));
  
      // Move camera target on the same direction
      //D = A + (B - A) * (moving * step_amount)
      cameraTarget = m4.addVectors(cameraTarget, m4.scaleVector(m4.subtractVectors(cameraTarget, cameraPosition), movement.backForth * STEP_AMOUNT));
      
      // Sideways movement
      // Define a perpendicular target for sideways movement
      var sideTarget = m4.transformPoint(m4.yRotation(degToRad(90 + (movement.sideways != 0) * 180)), cameraTarget, cameraPosition)
      cameraPosition = m4.addVectors(cameraPosition, m4.scaleVector(m4.subtractVectors(sideTarget, cameraPosition), -1 * movement.sideways * STEP_AMOUNT));
      cameraTarget = m4.addVectors(cameraTarget, m4.scaleVector(m4.subtractVectors(sideTarget, cameraPosition), -1 * movement.sideways * STEP_AMOUNT));
  
      if (m4.distance(cameraPosition, enemyPosition) < TOUCH_TOLERANCE){
        console.log("too close!");
      }
  
      // Rotates cameraTarget in response to input
      cameraTarget = m4.transformPoint(m4.yRotation(degToRad(angle)), cameraTarget, cameraPosition);
  
      // Follow player logic
      //D = A + (B - A) * (moving * step_amount)
      if(enemyIsIt){
        enemyFacingDirection = m4.subtractVectors(enemyPosition, cameraPosition)
        // Move enemy towards player
        enemyPosition = m4.addVectors(enemyPosition, m4.scaleVector(enemyFacingDirection, -0.001)); 
        // Rotates enemy
        // Calculate the angle between enemyFacingDirection and the vector to the player
        eAngle = -Math.atan2(cameraPosition[2] - enemyPosition[2], cameraPosition[0] - enemyPosition[0]);

        console.log("eAngle: ", eAngle / (Math.PI / 180) + 90)
      }
  
      webglUtils.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable(gl.DEPTH_TEST);
  
      const fieldOfViewRadians = degToRad(60);
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
  
      const up = [0, 1, 0];
      // Compute the camera's matrix
      const camera = m4.lookAt(cameraPosition, cameraTarget, up);
  
      // Make a view matrix from the camera matrix.
      const view = m4.inverse(camera);
  
      const sharedUniforms = {
        u_lightDirection: m4.normalize([-1, 3, 5]),
        u_view: view,
        u_projection: projection,
        u_viewWorldPosition: cameraPosition,
      };
  
      gl.useProgram(meshProgramInfo.program);
  
      // calls gl.uniform
      webglUtils.setUniforms(meshProgramInfo, sharedUniforms);
  
      // compute the world matrix once since all parts
      // are at the same space.


      // Apply the rotation to the object (e.g., using transformation matrices)

      let u_world = m4.identity();
      u_world = m4.translate(u_world, enemyPosition[0], enemyPosition[1], enemyPosition[2])
      if(currentAngle == eAngle / (Math.PI / 180) + 90){
        currentAngle = 0;
        console.log("NOT ROTATING :(")
      }
      else if(currentAngle > eAngle / (Math.PI / 180) + 90){
        currentAngle = currentAngle - 0.2;
      }
      else if(currentAngle < eAngle / (Math.PI / 180) + 90){
        currentAngle = currentAngle + 0.2;
      }  
      u_world = m4.multiply(u_world, m4.yRotation(degToRad(currentAngle)))


      for (const {bufferInfo, material} of parts) {
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
        // calls gl.uniform
        webglUtils.setUniforms(meshProgramInfo, {
          u_world,
        }, material);
        // calls gl.drawArrays or gl.drawElements
        webglUtils.drawBufferInfo(gl, bufferInfo);
      }
  
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }