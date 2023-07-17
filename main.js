async function main() {
  var gameOverOverlayElement = document.querySelector("#gameOverOverlay");
  gameOverOverlayElement.style.display = "none";
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#glcanvas1");
  const gl = canvas.getContext("webgl");
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  if (!gl) {
    return;
  }

  // look up the elements we want to affect
  var timeElement = document.querySelector("#time");
  var fpsElement = document.querySelector("#fps");
  var difficultyElement = document.querySelector("#difficulty");
  var scoreElement = document.querySelector("#score");

  // Create text nodes to save some time for the browser.
  var timeNode = document.createTextNode("");
  var fpsNode = document.createTextNode("");
  var difficultyNode = document.createTextNode("");
  var scoreNode = document.createTextNode("");

  // Add those text nodes where they need to go
  timeElement.appendChild(timeNode);
  fpsElement.appendChild(fpsNode);
  difficultyElement.appendChild(difficultyNode);
  scoreElement.appendChild(scoreNode);


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
    let newEnemy = new Enemy(p, STATE_IDLE, 1);
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
  var then = 0;
  var score = 1;
  var difficulty = 0;
  // Define jump related variables
  let isJumping = false;
  const jumpSpeed = 0.2; // Adjust this value to control the jump height

  let cameraRadius = 1.0; // Adjust this value based on the size of your camera/player
  let playerBox = {
    min: [cameraPosition[0] - cameraRadius, cameraPosition[1], cameraPosition[2] - cameraRadius],
    max: [cameraPosition[0] + cameraRadius, cameraPosition[1], cameraPosition[2] + cameraRadius]
  };

  let jump = 0;
  

  // -- Where the magic happens
  async function render(time) {
    if (IS_GAME_OVER) {
      // If the game is over, stop rendering
      return;
    }
    time *= 0.001; // convert to seconds
  timeNode.nodeValue = time.toFixed(2);

  const deltaTime = time - then; // compute time since last frame
  then = time; // remember time for next frame
  const fps = 1 / deltaTime; // compute frames per second
  fpsNode.nodeValue = fps.toFixed(1); // update fps display

  // Calculate score based on elapsed time and difficulty
  score += Math.floor(0.001 * time * difficulty);

  // Increase difficulty every 30 seconds
  var difficultyNew = Math.floor(time/30);
  if (difficulty < difficultyNew) {
    // Increase the difficulty by the difference between the old and new difficulty
    let difficultyIncrease = difficultyNew - difficulty;
    difficulty = difficultyNew;

    // Create new enemies based on the difficulty increase
    for (let i = 0; i < ENEMY_COUNT * difficultyIncrease; i++) {
      p = m4.generateRandomPoint([0, 0, 0], 20);
      p[1] = 0;
      let newEnemy = new Enemy(p, STATE_IDLE, 1);
      await newEnemy.createObjFromURL(gl, "./obj/test2.obj");
      enemies.push(newEnemy);
    }
    // Create new traps
    for(i=0; i<=TRAP_COUNT-1 * difficultyIncrease; i++){
      p = m4.generateRandomPoint([0,0,0], 20)
      p[1] = 0;
      let newTrap = new Trap(p);
      await newTrap.createObjFromURL(gl, "./obj/bear_trap.obj")
      traps.push(newTrap);
    }

    // Update DOM elements with the new difficulty
    difficultyNode.nodeValue = difficulty;
  }

  // Update DOM elements with score and difficulty
  difficultyNode.nodeValue = difficulty;
  scoreNode.nodeValue = score;

    function updateCamera() {
      
      const forwardDirection = m4.normalize(m4.subtractVectors(cameraTarget, cameraPosition));
      const forwardSpeed = CAMERA_SPEED * movement.forwardBackward;
    
      // Rotate camera around Y-axis (yaw) based on mouse movement
      const yawRotationMatrix = m4.yRotation(-rotation.yaw);
      const newForwardDirection = m4.transformDirection(yawRotationMatrix, forwardDirection);
    
      // Rotate camera around X-axis (pitch) based on mouse movement
      const pitchRotationMatrix = m4.xRotation(-rotation.pitch);
      const finalForwardDirection = m4.transformDirection(pitchRotationMatrix, newForwardDirection);

      // Jump
      if(movement.jump){
        if(jump < JUMP_AMOUNT) jump += 0.1;
        else movement.jump = false
      } 
      else{
        if(jump != 0) jump -= 0.1;
        if(jump > 0.0 && jump < 0.3){
          try{
            JUMP_IMPACT_SOUND.play();
          } catch(e){}
        }
      }
      jump = Math.round( jump * 10 )/10
      cameraPosition[1] = jump;
      
      // Update camera position and target
      const newPosition = m4.addVectors(cameraPosition, m4.scaleVector(finalForwardDirection, forwardSpeed));
      const newTarget = m4.addVectors(newPosition, m4.scaleVector(finalForwardDirection, 1)); // Camera target is always 1 unit away from the new position
    
      // Check for collision
      if (!scenario.checkCollision(newPosition)) {
        cameraPosition = [newPosition[0], cameraPosition[1], newPosition[2]]; // Keep y-position fixed
        cameraTarget = [newTarget[0], cameraPosition[1], newTarget[2]]; // Keep y-position fixed
      }
    
      // Handle left-right movement
      const leftDirection = m4.normalize(m4.cross(finalForwardDirection, [0, 1, 0]));
      const strafeAmount = CAMERA_SPEED * movement.leftRight;
      const strafeVector = m4.scaleVector(leftDirection, strafeAmount);
      const strafePosition = m4.addVectors(cameraPosition, strafeVector);
      const strafeTarget = m4.addVectors(cameraTarget, strafeVector);
    
      // Check for collision while strafing
      if (!scenario.checkCollision(strafePosition)) {
        cameraPosition = [strafePosition[0], cameraPosition[1], strafePosition[2]]; // Keep y-position fixed
        cameraTarget = [strafeTarget[0], cameraPosition[1], strafeTarget[2]]; // Keep y-position fixed
      }
      if((movement.forwardBackward != 0) || (movement.leftRight != 0)){
        try{
          WALKING_SOUND.play();
        } catch(e){}
      }

      cameraRadius = 1.0; // Adjust this value based on the size of your camera/player
      playerBox = {
        min: [cameraPosition[0] - cameraRadius, cameraPosition[1], cameraPosition[2] - cameraRadius],
        max: [cameraPosition[0] + cameraRadius, cameraPosition[1], cameraPosition[2] + cameraRadius]
      };

    }

    updateCamera();

    // render enemies
    enemies.forEach(enemy => {

      let enemyBox = {
        min: [enemy.position[0] - enemy.boundingRadius, enemy.position[1], enemy.position[2] - enemy.boundingRadius],
        max: [enemy.position[0] + enemy.boundingRadius, enemy.position[1], enemy.position[2] + enemy.boundingRadius]
      };

      // Check for collision between player and enemy bounding boxes
      if (checkCollisionBox(playerBox, enemyBox)) {
        // Handle collision, e.g., player is hit by an enemy
        gameOver(score);
      }

      // enemy killed so increase score
      if(enemy.removed) {
        // Using filter method to create a remove method
        function arrayRemove(arr, value) {
        
          return arr.filter(function (geeks) {
              return geeks != value;
          });

        }
        enemies = arrayRemove(enemies, enemy);
        score += 100;
      }
      // Follow player logic
      //D = A + (B - A) * (moving * step_amount)
      enemy.difficulty = difficulty;
      enemy.updatePosition(cameraPosition, traps)
      let model_matrix = m4.identity();
      let target = enemy.targetAngle / (Math.PI / 180) + 90
      let rot_speed = 0.1;
      if(enemy.state == STATE_AGGRESSIVE){
        rot_speed = rot_speed * 2.5 + 0.25 * difficulty;
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
    let model_matrix = m4.translate(m4.identity(), 0, SCENARIO_Y_OFFSET, 0);
    scenario.render(gl, meshProgramInfo, model_matrix);
      
    //If the mouse hasn't moved for a certain duration, stop camera rotation
    // Compute the camera's matrix
    var currentTime = Date.now();
    var timeSinceLastMouseMove = currentTime - lastMouseMoveTimestamp;
    if (timeSinceLastMouseMove > mouseStopTimeout) {
      rotation.yaw = 0;
      rotation.pitch  = 0;
      updateCamera();
    }

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