class Enemy {
    constructor(intialPosition, intialState, intialDifficulty) {
      this.position = intialPosition;
      this.state = intialState;
      this.difficulty = intialDifficulty;
      this.idleSpot = m4.generateRandomPoint(this.position, 5);
      this.idleSpot[1] = 0;
      this.idleCounter = IDLE_COUNT;
      this.facingDirection = [0,0,0];
      this.obj;
      this.parts;
      this.currentAngle = 0;
      this.targetAngle;
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
          // creates an object with attributes to pass to the shaders      
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
    updatePosition(Target){
      let speed = IDLE_SPEED;
      if(m4.distance(Target, this.position) <= BASE_AGGRESSIVE_RANGE + BASE_AGGRESSIVE_RANGE/2 * this.difficulty){
        // Enemy becomes aggressive
        if(!this.state){
          try{
            ENEMY_SOUND.play();
          } catch(e){}
        }
        this.state = true;
        speed = BASE_AGGRESSIVE_SPEED + BASE_AGGRESSIVE_SPEED * this.difficulty;
      } else{
        this.state = false;
      }
      if(!this.state){
        Target = this.idleSpot
        if(m4.distance(Target, this.position) < BASE_AGGRESSIVE_SPEED){
          if(this.idleCounter == 0){
            // Find new spot to walk to
            this.idleSpot = m4.generateRandomPoint(this.position, 5);
            this.idleSpot[1] = 0;
            this.idleCounter = IDLE_COUNT;
          }
          else{
            // I'll be here for a while...
            this.idleCounter -= 1;
          }
        } else{
          Target = this.idleSpot
        }
      } 
      // Rotation
      this.facingDirection = m4.subtractVectors(Target, this.position);
      // Translation
      // Rounding the vector is useful for keeping the movement speed as constant as possible
      let movingDirection = m4.scaleVector(this.facingDirection, speed/m4.length(this.facingDirection));
      if(m4.length(movingDirection) > speed){
        movingDirection = m4.roundVector(1e4, movingDirection)
      }
      this.position = m4.addVectors(this.position, movingDirection); 
      this.targetAngle = -Math.atan2(Target[2] -  this.position[2], Target[0] -  this.position[0]);
    }
}

const ENEMY_COUNT = 4;
const TOUCH_TOLERANCE = 2.5;
const BASE_AGGRESSIVE_SPEED = 0.015;
const IDLE_SPEED = 0.01;
const BASE_AGGRESSIVE_RANGE = 10;
const IDLE_COUNT = 250
const ENEMY_SOUND = new Audio('./sound/aggressive.mp3');