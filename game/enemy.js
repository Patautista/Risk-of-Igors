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
            material: materials[material],
            bufferInfo,
        };
        });
    }
    updatePosition(Target){
        this.position = m4.addVectors(this.position, m4.scaleVector(this.facingDirection, 1/m4.length(this.facingDirection) * 0.01)); 
        this.targetAngle = -Math.atan2(Target[2] -  this.position[2], Target[0] -  this.position[0]);
    }
    updateTarget(newTarget){
        this.facingDirection = m4.subtractVectors(newTarget, this.position);
    }
}

const ENEMY_COUNT = 3;
const TOUCH_TOLERANCE = 2.5;