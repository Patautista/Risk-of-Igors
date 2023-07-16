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

    let enemies = [];

    for(i=0; i<=ENEMY_COUNT-1; i++){
      p = m4.generateRandomPoint([0,0,0], 20)
      p[1] = 0
      let newEnemy = new Enemy(p, false, 0);
      await newEnemy.createObjFromURL(gl, "./obj/test2.obj")
      enemies.push(newEnemy);
    }

    let scenario = new Scenario();
    await scenario.createObjFromURL(gl, "./obj/scenario.obj")
  
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
  
    const extents = getGeometriesExtents(enemies[0].obj.geometries);
    const range = m4.subtractVectors(extents.max, extents.min);

    // amount to move the object so its center is at the origin
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
    const zFar = radius * 25;
    
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
  
      /*
      if (m4.distance(cameraPosition, enemy1.position) < TOUCH_TOLERANCE){
        console.log("too close!");
      }
      */

      // Rotates cameraTarget in response to input
      cameraTarget = m4.transformPoint(m4.yRotation(degToRad(angle)), cameraTarget, cameraPosition);
  
      // Follow player logic
      //D = A + (B - A) * (moving * step_amount)
      enemies.forEach(enemy => {
        enemy.updatePosition(cameraPosition)
      });
  
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
  
      // render enemies
      enemies.forEach(enemy => {
        let u_world = m4.identity();
        let target = enemy.targetAngle / (Math.PI / 180) + 90
        let rot_speed = 0.1;
        if(enemy.state){
          rot_speed = rot_speed * 2.5;
        }
        u_world = m4.translate(u_world, ...enemy.position)
        if(enemy.currentAngle == target){
          enemy.currentAngle = target
        }
        // Logic for avoiding turning more than 180 degrees due to Math.atan2() discontinuity
        if(enemy.currentAngle <= -80 && target > 180){
          enemy.currentAngle += 360
        }
        if(enemy.currentAngle >= 260 && target < 180){
          enemy.currentAngle -= 360
        }
        // Decide which way to turn
        if(enemy.currentAngle > target){
          enemy.currentAngle = enemy.currentAngle - rot_speed;
        }
        else if(enemy.currentAngle < target){
          enemy.currentAngle = enemy.currentAngle + rot_speed;
        }
        u_world = m4.multiply(u_world, m4.yRotation(degToRad(enemy.currentAngle - 90)))


        for (const {bufferInfo, material} of enemy.parts) {
          // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
          webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
          // calls gl.uniform
          webglUtils.setUniforms(meshProgramInfo, {
            u_world,
          }, material);
          // calls gl.drawArrays or gl.drawElements
          webglUtils.drawBufferInfo(gl, bufferInfo);
        }
      });

      // render scenario
      for (const {bufferInfo, material} of scenario.parts) {
        let u_world = m4.translate(m4.identity(), 0,-10.7,0);
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