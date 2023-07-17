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

    const radius = 5;
    let cameraTarget = [0, 0, 0];
    let cameraPosition = m4.addVectors(cameraTarget, [
      0,
      0,
      radius,
    ]);
    // Set zNear and zFar to something hopefully appropriate
    const zNear = radius / 100;
    const zFar = radius * 25;

    let enemies = [];

    for(i=0; i<=ENEMY_COUNT-1; i++){
      p = m4.generateRandomPoint([0,0,0], 20)
      p[1] = 0
      let newEnemy = new Enemy(p, STATE_IDLE, 0);
      await newEnemy.createObjFromURL(gl, "./obj/test2.obj")
      enemies.push(newEnemy);
    }

    let traps = [];

    for(i=0; i<=TRAP_COUNT-1; i++){
      p = m4.generateRandomPoint([0,0,0], 20)
      p[1] = 0;
      let newTrap = new Trap(p);
      await newTrap.createObjFromURL(gl, "./obj/bear_trap.obj")
      traps.push(newTrap);
    }

    let scenario = new Scenario();
    await scenario.createObjFromURL(gl, "./obj/scenario.obj");
  
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
      var sideTarget = m4.transformPoint(m4.yRotation(m4.degToRad(90 + (movement.sideways != 0) * 180)), cameraTarget, cameraPosition)
      cameraPosition = m4.addVectors(cameraPosition, m4.scaleVector(m4.subtractVectors(sideTarget, cameraPosition), -1 * movement.sideways * STEP_AMOUNT));
      cameraTarget = m4.addVectors(cameraTarget, m4.scaleVector(m4.subtractVectors(sideTarget, cameraPosition), -1 * movement.sideways * STEP_AMOUNT));
  
      if((movement.sideways != 0) || (movement.backForth != 0)){
        try{
          WALKING_SOUND.play();
        } catch(e){}
      }

      // Rotates cameraTarget in response to input
      cameraTarget = m4.transformPoint(m4.yRotation(m4.degToRad(angle)), cameraTarget, cameraPosition);
  
      // END OF PLAYER MOVEMENT

      // render enemies
      enemies.forEach(enemy => {
        // Follow player logic
        //D = A + (B - A) * (moving * step_amount)
        enemy.updatePosition(cameraPosition, traps)
        let model_matrix = m4.identity();
        let target = enemy.targetAngle / (Math.PI / 180) + 90
        let rot_speed = 0.1;
        if(enemy.state == STATE_AGGRESSIVE){
          rot_speed = rot_speed * 2.5;
        }
        model_matrix = m4.translate(model_matrix, ...enemy.position)
        if(enemy.currentAngle == target){
          enemy.currentAngle = target
        }
        // Logic for avoiding turning more than 180 degrees due to Math.atan2() discontinuity
        if(enemy.currentAngle <= -70 && target > 180){
          enemy.currentAngle += 360
        }
        if(enemy.currentAngle >= 250 && target < 180){
          enemy.currentAngle -= 360
        }
        // Decide which way to turn
        if(enemy.currentAngle > target){
          enemy.currentAngle = enemy.currentAngle - rot_speed;
        }
        else if(enemy.currentAngle < target){
          enemy.currentAngle = enemy.currentAngle + rot_speed;
        }
        model_matrix = m4.multiply(model_matrix, m4.yRotation(m4.degToRad(enemy.currentAngle - 90)))
        enemy.render(gl, meshProgramInfo, model_matrix)
      });

      // render traps
      traps.forEach(
        trap => {
          // translate trap's y offset
          let model_matrix = m4.translate(m4.identity(), trap.position[0],0.3,trap.position[2])
          // translate it to its position
          trap.render(gl, meshProgramInfo, model_matrix)
          // translate 
        }
      )

      // render scenario
      let model_matrix = m4.translate(m4.identity(), 0,-12,0);
      scenario.render(gl, meshProgramInfo, model_matrix);

      // WEGBL configs

      webglUtils.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable(gl.DEPTH_TEST);
  
      const fieldOfViewRadians = m4.degToRad(60);
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
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }