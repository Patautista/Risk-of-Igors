var teximg = [];
var texSrc = ["igor.png", "gato.jpg", "igor.png"];
var loadTexs = 0;
var gl;
var prog;

var angle = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getGL(canvas) {
  var gl = canvas.getContext("webgl");
  if (gl) return gl;

  gl = canvas.getContext("experimental-webgl");
  if (gl) return gl;

  alert("Contexto WebGL inexistente! Troque de navegador!");
  return false;
}

function createShader(gl, shaderType, shaderSrc) {
  var shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSrc);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;

  alert("Erro de compilação: " + gl.getShaderInfoLog(shader));

  gl.deleteShader(shader);
}

function createProgram(gl, vtxShader, fragShader) {
  var prog = gl.createProgram();
  gl.attachShader(prog, vtxShader);
  gl.attachShader(prog, fragShader);
  gl.linkProgram(prog);

  if (gl.getProgramParameter(prog, gl.LINK_STATUS)) return prog;

  alert("Erro de linkagem: " + gl.getProgramInfoLog(prog));

  gl.deleteProgram(prog);
}

function init() {
  for (i = 0; i < texSrc.length; i++) {
    teximg[i] = new Image();
    teximg[i].src = texSrc[i];
    teximg[i].crossOrigin = "";
    teximg[i].onload = function () {
      loadTexs++;
      loadTextures();
    };
  }
}

function loadTextures() {
  if (loadTexs == texSrc.length) {
    initGL();
    configScene();
    draw();
  }
}

function initGL() {
  var canvas = document.getElementById("glcanvas1");

  gl = getGL(canvas);
  if (gl) {
    //Inicializa shaders
    var vtxShSrc = document.getElementById("vertex-shader").text;
    var fragShSrc = document.getElementById("frag-shader").text;

    var vtxShader = createShader(gl, gl.VERTEX_SHADER, vtxShSrc);
    var fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragShSrc);
    prog = createProgram(gl, vtxShader, fragShader);

    gl.useProgram(prog);

    //Inicializa área de desenho: viewport e cor de limpeza; limpa a tela
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);
  }
}

async function configScene() {
  //Define coordenadas dos triângulos
  var coordTriangles = new Float32Array([
    //Quad 1
    -0.5, 0.5, 0.0, 0.0, 0.0,
    -0.5, -0.5, 0.0, 0.0, 1.0,
    0.5, -0.5, 0.0, 1.0,1.0,
    0.5, 0.5, 0.0, 1.0, 0.0,
    -0.5, 0.5, 0.0, 0.0, 0.0,

  ]);
  

  // Load the .obj file
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "./obj/test2.obj", true);
  xhr.send(null);
  await sleep(2000);
  var objData = parseOBJ(xhr.responseText);
  coordTriangles = new Float32Array(objData.vertices);
  
  //Cria buffer na GPU e copia coordenadas para ele
  var bufPtr = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufPtr);
  gl.bufferData(gl.ARRAY_BUFFER, coordTriangles, gl.STATIC_DRAW);

  //Pega ponteiro para o atributo "position" do vertex shader
  var positionPtr = gl.getAttribLocation(prog, "position");
  gl.enableVertexAttribArray(positionPtr);
  //Especifica a cópia dos valores do buffer para o atributo
  gl.vertexAttribPointer(
    positionPtr,
    3, //quantidade de dados em cada processamento
    gl.FLOAT, //tipo de cada dado (tamanho)
    false, //não normalizar
    5 * 4, //tamanho do bloco de dados a processar em cada passo
    //0 indica que o tamanho do bloco é igual a tamanho
    //lido (2 floats, ou seja, 2*4 bytes = 8 bytes)
    0 //salto inicial (em bytes)
  );

  var texcoordPtr = gl.getAttribLocation(prog, "texCoord");
  gl.enableVertexAttribArray(texcoordPtr);
  //Especifica a cópia dos valores do buffer para o atributo
  gl.vertexAttribPointer(
    texcoordPtr,
    2, //quantidade de dados em cada processamento
    gl.FLOAT, //tipo de cada dado (tamanho)
    false, //não normalizar
    5 * 4, //tamanho do bloco de dados a processar em cada passo
    //0 indica que o tamanho do bloco é igual a tamanho
    //lido (2 floats, ou seja, 2*4 bytes = 8 bytes)
    3 * 4 //salto inicial (em bytes)
  );

  //Iluminação =================================================================
  var normals = new Float32Array([
    //Quad 1
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

    //Quad 2
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

    //Quad 3
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

    0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  ]);

  //Cria buffer na GPU e copia coordenadas para ele
  var bufnormalPtr = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufnormalPtr);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  //Pega ponteiro para o atributo "position" do vertex shader
  var normalPtr = gl.getAttribLocation(prog, "normal");
  gl.enableVertexAttribArray(normalPtr);
  //Especifica a cópia dos valores do buffer para o atributo
  gl.vertexAttribPointer(
    normalPtr,
    3, //quantidade de dados em cada processamento
    gl.FLOAT, //tipo de cada dado (tamanho)
    false, //não normalizar
    0, //tamanho do bloco de dados a processar em cada passo
    //0 indica que o tamanho do bloco é igual a tamanho
    //lido (2 floats, ou seja, 2*4 bytes = 8 bytes)
    0 //salto inicial (em bytes)
  );

  var lightDirectionPtr = gl.getUniformLocation(prog, "lightDirection");
  gl.uniform3fv(lightDirectionPtr, [0, 0, -1] /*[-0.2, -1, -0.7]*/);

  var lightColorPtr = gl.getUniformLocation(prog, "lightColor");
  gl.uniform3fv(lightColorPtr, [1, 1, 1]);
  //============================================================================

  //submeter textura para gpu
  var tex0 = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    teximg[0]
  );

  var tex1 = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, tex1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    teximg[1]
  );

  var tex2 = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, tex2);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    teximg[0]
  );
  
}

function createPerspective(fovy, aspect, near, far) {
  fovy = (fovy * Math.PI) / 180.0;

  var fy = 1 / math.tan(fovy / 2.0);
  var fx = fy / aspect;
  var B = (-2 * far * near) / (far - near);
  var A = -(far + near) / (far - near);

  var proj = math.matrix([
    [fx, 0.0, 0.0, 0.0],
    [0.0, fy, 0.0, 0.0],
    [0.0, 0.0, A, B],
    [0.0, 0.0, -1.0, 0.0],
  ]);

  return proj;
}

function createCamera(pos, target, up) {
  var zc = math.subtract(pos, target);
  zc = math.divide(zc, math.norm(zc));

  var yt = math.subtract(up, pos);
  yt = math.divide(yt, math.norm(yt));

  var xc = math.cross(yt, zc);
  xc = math.divide(xc, math.norm(xc));

  var yc = math.cross(zc, xc);
  yc = math.divide(yc, math.norm(yc));

  var mt = math.inv(math.transpose(math.matrix([xc, yc, zc])));

  mt = math.resize(mt, [4, 4], 0);
  mt._data[3][3] = 1;

  var mov = math.matrix([
    [1, 0, 0, -pos[0]],
    [0, 1, 0, -pos[1]],
    [0, 0, 1, -pos[2]],
    [0, 0, 0, 1],
  ]);

  var cam = math.multiply(mt, mov);

  return cam;
}


function draw() {
  var mproj = createPerspective(20, gl.canvas.width / gl.canvas.height, 1, 50);
  var cam = createCamera([5, 5, 5], [0, 0, 0], [5, 6, 5]);

  var tz = math.matrix([
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, -5.0],
    [0.0, 0.0, 0.0, 1.0],
  ]);

  var matrotZ = math.matrix([
    [
      Math.cos((angle * Math.PI) / 180.0),
      -Math.sin((angle * Math.PI) / 180.0),
      0.0,
      0.0,
    ],
    [
      Math.sin((angle * Math.PI) / 180.0),
      Math.cos((angle * Math.PI) / 180.0),
      0.0,
      0.0,
    ],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
  ]);

  var matrotY = math.matrix([
    [
      Math.cos((angle * Math.PI) / 180.0),
      0.0,
      -Math.sin((angle * Math.PI) / 180.0),
      0.0,
    ],
    [0.0, 1.0, 0.0, 0.0],
    [
      Math.sin((angle * Math.PI) / 180.0),
      0.0,
      Math.cos((angle * Math.PI) / 180.0),
      0.0,
    ],
    [0.0, 0.0, 0.0, 1.0],
  ]);

  var matrotX = math.matrix([
    [1.0, 0.0, 0.0, 0.0],
    [
      0.0,
      Math.cos((angle * Math.PI) / 180.0),
      -Math.sin((angle * Math.PI) / 180.0),
      0.0,
    ],
    [
      0.0,
      Math.sin((angle * Math.PI) / 180.0),
      Math.cos((angle * Math.PI) / 180.0),
      0.0,
    ],
    [0.0, 0.0, 0.0, 1.0],
  ]);

  var transforma = math.multiply(matrotY, matrotX);
  //transforma = math.multiply(matrotZ, transforma);

  var transformaproj = math.multiply(cam, transforma);
  transformaproj = math.multiply(mproj, transformaproj);

  transformaproj = math.flatten(math.transpose(transformaproj))._data;
  var transfprojPtr = gl.getUniformLocation(prog, "transfproj");
  gl.uniformMatrix4fv(transfprojPtr, false, transformaproj);

  transforma = math.flatten(math.transpose(transforma))._data;
  transfPtr = gl.getUniformLocation(prog, "transf");
  gl.uniformMatrix4fv(transfPtr, false, transforma);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //desenha triângulos - executa shaders
  var texPtr = gl.getUniformLocation(prog, "tex");
  gl.uniform1i(texPtr, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.drawArrays(gl.TRIANGLES, 2, 3);
  
  gl.uniform1i(texPtr, 1);
  gl.drawArrays(gl.TRIANGLES, 5, 3);
  gl.drawArrays(gl.TRIANGLES, 7, 3);

  gl.uniform1i(texPtr, 0);
  gl.drawArrays(gl.TRIANGLES, 10, 3);
  gl.uniform1i(texPtr, 1);
  gl.drawArrays(gl.TRIANGLES, 12, 3);

  gl.uniform1i(texPtr, 0);
  gl.drawArrays(gl.TRIANGLES, 15, 3);
  gl.drawArrays(gl.TRIANGLES, 17, 3);

  gl.uniform1i(texPtr, 0);
  gl.drawArrays(gl.TRIANGLES, 20, 3);
  gl.drawArrays(gl.TRIANGLES, 22, 3);

  gl.uniform1i(texPtr, 0);
  gl.drawArrays(gl.TRIANGLES, 25, 3);
  gl.drawArrays(gl.TRIANGLES, 27, 3);

  gl.uniform1i(texPtr, 0);
  gl.drawArrays(gl.TRIANGLES, 30, 3);
  gl.drawArrays(gl.TRIANGLES, 32, 3);

  gl.drawArrays(gl.TRIANGLES, 35, 3);
  gl.drawArrays(gl.TRIANGLES, 37, 3);

  gl.drawArrays(gl.TRIANGLES, 40, 3);
  gl.drawArrays(gl.TRIANGLES, 42, 3);

  angle++;

  requestAnimationFrame(draw);
}
