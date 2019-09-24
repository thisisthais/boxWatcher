var canvas;
var renderer;
var camera;
var scene;
var cube;
// x: 0 - 1000
// y: 100 - 900

const screenHeight = window.innerHeight;
const screenWidth = window.innerWidth;

function animate(data, clock) {
  // x range -2, 2
  // y range -1.5, 1.5
  // 0 - maxX left to right
  // 0 - maxY top to bottom

  // data only shows up after click training?
  if (data) {
    var scaledX = (data.x * 1.0) / screenWidth;
    var scaledY = (data.y * 1.0) / screenHeight;

    if (scaledX < 0.5) {
      scaledX *= -1.0;
    }

    if (scaledY > 0.5) {
      scaledY *= -1.0;
    }

    const visibleHeight = visibleHeightAtZDepth(0, camera);
    const visibleWidth = visibleWidthAtZDepth(0, camera);

    const canvasX = (scaledX * visibleWidth) / 2;
    const canvasY = (scaledY * visibleHeight) / 2;

    cube.position.x = canvasX;
    cube.position.y = canvasY;
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.02;

  renderer.render(scene, camera);
}

function init(data, clock) {
  canvas = document.querySelector('#myCanvas');
  renderer = new THREE.WebGLRenderer({ canvas });

  const fov = 75;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 5;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  scene = new THREE.Scene();

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });

  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  const lightColor = 0xffffff;
  const intensity = 1;
  const light = new THREE.DirectionalLight(lightColor, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);

  requestAnimationFrame(animate);
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = (canvas.clientWidth * pixelRatio) | 0;
  const height = (canvas.clientHeight * pixelRatio) | 0;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

const visibleHeightAtZDepth = (depth, camera) => {
  // compensate for cameras not positioned at z=0
  const cameraOffset = camera.position.z;
  if (depth < cameraOffset) depth -= cameraOffset;
  else depth += cameraOffset;

  // vertical fov in radians
  const vFOV = (camera.fov * Math.PI) / 180;

  // Math.abs to ensure the result is always positive
  return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
};

const visibleWidthAtZDepth = (depth, camera) => {
  const height = visibleHeightAtZDepth(depth, camera);
  return height * camera.aspect;
};

init();
animate();
