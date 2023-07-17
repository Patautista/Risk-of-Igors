function checkCollisionBox(box1, box2) {
    // Check if any of the X, Y, Z axes are not overlapping
    if (box1.max[0] < box2.min[0] || box1.min[0] > box2.max[0]) return false;
    if (box1.max[1] < box2.min[1] || box1.min[1] > box2.max[1]) return false;
    if (box1.max[2] < box2.min[2] || box1.min[2] > box2.max[2]) return false;
    
    // If all axes are overlapping, there is a collision
    return true;
  }
  
  // Define a flag to check if the game is over
  let IS_GAME_OVER = false;
  // Define a flag to check if the game has started
  let GAME_STARTED = true;
  
  // Function to show the game over screen
  function gameOver(score) {
    IS_GAME_OVER = true;
    // Hide the regular overlay content (FPS, Time, Difficulty, Score)
    document.getElementById("overlay").style.display = "none";
    // Hide the canvas
    document.getElementById("glcanvas1").style.display = "none";
    var scoreFinalElement = document.querySelector("#scoreFinal");
    var scoreFinalNode = document.createTextNode("");
    scoreFinalElement.appendChild(scoreFinalNode);
    scoreFinalNode.nodeValue = score;
    document.body.style.backgroundColor = "black";
    // Show the game over overlay
    document.getElementById("gameOverOverlay").style.display = "block";
  
  }