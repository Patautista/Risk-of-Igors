class Enemy {
    constructor(intialPosition, intialState, intialDifficulty) {
      this.position = intialPosition;
      this.state = intialState;
      this.difficulty = intialDifficulty
      this.facingDirection = [0,0,0]
      this.obj;
      this.parts;
      this.currentAngle = 0;
      this.targetAngle;
    }
    targetAngle;
    currentAngle;
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
        // Rotation
        this.facingDirection = m4.subtractVectors(Target, this.position);
        // Translation
        // Rounding the vector is useful for keeping the movement speed as constant as possible
        let movingDirection = m4.scaleVector(this.facingDirection, ENEMY_SPEED/m4.length(this.facingDirection));
        if(m4.length(movingDirection) > ENEMY_SPEED){
          movingDirection = m4.roundVector(1e4, movingDirection)
        }
        this.position = m4.addVectors(this.position, movingDirection); 
        this.targetAngle = -Math.atan2(Target[2] -  this.position[2], Target[0] -  this.position[0]);
        //console.log("angle: ", this.targetAngle / (Math.PI/180) )
        //console.log("current angle: ", this.currentAngle)
    }
}

const ENEMY_SPEED = 0.0001;
const ENEMY_COUNT = 1;
const TOUCH_TOLERANCE = 2.5;