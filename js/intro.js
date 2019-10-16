let canvas;
let scene;
let camera;
let renderer;
let cube;
let tick;
let uniforms;

function init() {
  tick = 0;

  scene = new THREE.Scene();

  setupRenderer();
  setupCamera();
  setupCube();
  setupLights();

  window.addEventListener('resize', onWindowResize);
}

function setupRenderer() {
  canvas = document.querySelector('#myCanvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // document.body.appendChild(renderer.domElement);
}

function setupCamera() {
  let res = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, res, 0.1, 1000);
  camera.position.z = 14;
  camera.position.y = -25;

  camera.lookAt(scene.position);
}

function setupCube() {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  // let material = new THREE.MeshStandardMaterial({
  //   roughness: 0.6,
  //   color: 'red'
  // });
  const fragmentShader = `
    #include <common>
    
    uniform vec3 iResolution;
    uniform float iTime;
    
    const float Pi = 3.14159;

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = fragCoord.xy / iResolution.xy;
      vec2 p=(2.0*fragCoord.xy-iResolution.xy)/max(iResolution.x,iResolution.y);
      
      for(int i=1;i<45;i++)
      {
        vec2 newp=p;
        newp.x+=(0.5/float(i))*cos(float(i)*p.y+iTime*11.0/37.0+0.03*float(i))+1.3;		
        newp.y+=(0.5/float(i))*cos(float(i)*p.x+iTime*17.0/41.0+0.03*float(i+10))+1.9;
        p=newp;
      }

      vec3 col=vec3(0.5*sin(3.0*p.x)+0.5,0.5*sin(3.0*p.y)+0.5,sin(1.3*p.x+1.7*p.y));
      fragColor=vec4(col, 1.0);
    }
    
    void main() {
      mainImage(gl_FragColor, gl_FragCoord.xy);
    }
  `;

  const loader = new THREE.TextureLoader();
  const texture = loader.load('resources/images/bayer.png');
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() }
  };
  const material = new THREE.ShaderMaterial({
    fragmentShader,
    uniforms
  });
  cube = new THREE.Mesh(geometry, material);

  cube.callback = objectClickHandler;

  cube.position.set(0, 15, 0);
  scene.add(cube);
}

function setupLights() {
  let ambientLight = new THREE.AmbientLight(0x777777);
  scene.add(ambientLight);

  let spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(-30, 30, 30);
  spotLight.castShadow = true;
  scene.add(spotLight);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
  time *= 0.001;
  const canvas = renderer.domElement;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iTime.value = time;

  tick++;
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  let scale = Math.sin(tick / 50) + 4;
  cube.scale.z = scale;
  cube.scale.x = scale;
  cube.scale.y = scale;
}

// Default click handler for our three.js objects
function objectClickHandler() {
  window.location.href = '/collision.html';
}
window.onload = function() {
  init();
  animate();

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();

  function onDocumentMouseDown(event) {
    event.preventDefault();

    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1.6;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([cube]);

    if (intersects.length > 0) {
      intersects[0].object.callback();
    }
  }

  document.addEventListener('mousedown', onDocumentMouseDown, false);
};
