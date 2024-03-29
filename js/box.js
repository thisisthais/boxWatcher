var canvas;
var renderer;
var camera;
var scene;
var cube;
var averageEyeX;
var averageEyeY;
var boundary;
var cubeTranslation = {
  vecX: 1,
  vecY: 1
};
var last5EyeChecks;
var clicks = 0;
var unWatchedTime = 0;
var startTime;

function increaseClicks() {
  clicks++;
}

document.body.addEventListener('click', increaseClicks, true);

class EvictingList {
  constructor(n) {
    this.list = [];
    this.maxSize = n;
    this.currIndex = 0;
  }

  add(elem) {
    this.list[this.currIndex] = elem;
    this.currIndex = (this.currIndex + 1) % this.maxSize;
  }
}

function updateMovingAverageEyeCoords(data) {
  if (!data) return;
  const [eyeX, eyeY] = getCanvasEyeCoordinates(data);

  // 0?
  if (!averageEyeX && !averageEyeY) {
    averageEyeX = eyeX;
    averageEyeY = eyeY;
  }

  averageEyeX = (4 / 5) * eyeX + averageEyeX / 5;
  averageEyeY = (4 / 5) * eyeY + averageEyeY / 5;

  last5EyeChecks.add([averageEyeX, averageEyeY]);

  document.getElementById('xPos').textContent = averageEyeX.toFixed(2);
  document.getElementById('yPos').textContent = averageEyeY.toFixed(2);
}

function isWithinErrorRange(eyePoint, min, max, error) {
  return eyePoint >= min - error && eyePoint <= max + error;
}

function isLookingAtCube(data) {
  if (!data) return false;
  const visibleHeight = visibleHeightAtZDepth(0, camera);
  const visibleWidth = visibleWidthAtZDepth(0, camera);
  const heightPrecisionDelta = 0.2 * visibleHeight;
  const widthPrecisionDelta = 0.2 * visibleWidth;

  boundary.geometry.computeBoundingBox();
  const { min, max } = boundary.geometry.boundingBox;

  return last5EyeChecks.list.some(point => {
    return (
      isWithinErrorRange(point[0], min.x, max.x, widthPrecisionDelta) &&
      isWithinErrorRange(point[1], min.y, max.y, heightPrecisionDelta)
    );
  });
}

function cubeIsWithinCanvas() {
  const [sceneHeight, sceneWidth] = [
    visibleHeightAtZDepth(0, camera),
    visibleWidthAtZDepth(0, camera)
  ];

  boundary.geometry.computeBoundingBox();
  const { min, max } = boundary.geometry.boundingBox;
  // no idea where these +- numbers come from
  const isWithinCanvas =
    min.x - 0.3 >= -sceneWidth / 2 &&
    max.x + 0.3 <= sceneWidth / 2 &&
    min.y - 0.25 >= -sceneHeight / 2 &&
    max.y + 0.25 <= sceneHeight / 2;

  return isWithinCanvas;
}

function detectEdgeCollision() {
  const [sceneHeight, sceneWidth] = [
    visibleHeightAtZDepth(0, camera),
    visibleWidthAtZDepth(0, camera)
  ];

  boundary.geometry.computeBoundingBox();
  const { min, max } = boundary.geometry.boundingBox;

  if (min.x - 0.3 <= -sceneWidth / 2 || max.x + 0.3 >= sceneWidth / 2) {
    return 'horizontal';
  } else if (
    min.y - 0.25 <= -sceneHeight / 2 ||
    max.y + 0.25 >= sceneHeight / 2
  ) {
    return 'vertical';
  }

  return 'within';
}

function animate(data, clock) {
  // correct data only shows up after click training

  if (unWatchedTime > 100) {
    const endTime = new Date();
    const timeInSeconds = Math.floor(endTime - startTime / 1000);
    window.alert(`Thanks for watching my box for ${timeInSeconds} seconds`);
  } else if (data != null && data.x && clicks >= 12) {
    if (startTime == undefined) {
      startTime = new Date();
    }
    updateMovingAverageEyeCoords(data);

    if (isLookingAtCube(data)) {
      cube.material.color.set(0x58b446);
    } else {
      cube.material.color.set(0xeb4034);
      unWatchedTime++;
    }

    // cube.rotation.y += 0.01;
    // cube.rotation.x += 0.01;

    const collision = detectEdgeCollision();

    if (collision == 'horizontal') {
      cubeTranslation.vecX *= -1;
      const { vecX, vecY } = cubeTranslation;
      cube.translateOnAxis(new THREE.Vector3(vecX, vecY, 0).normalize(), 0.03);
    } else if (collision == 'vertical') {
      cubeTranslation.vecY *= -1;
      const { vecX, vecY } = cubeTranslation;
      cube.translateOnAxis(new THREE.Vector3(vecX, vecY, 0).normalize(), 0.03);
    } else {
      const { vecX, vecY } = cubeTranslation;
      cube.translateOnAxis(new THREE.Vector3(vecX, vecY, 0).normalize(), 0.03);
    }

    boundary.update();
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
}

function init(data, clock) {
  canvas = document.querySelector('#myCanvas');
  renderer = new THREE.WebGLRenderer({ canvas });
  last5EyeChecks = new EvictingList(5);
  const fov = 75;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 5;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1adf7);
  const boxWidth = 0.5;
  const boxHeight = 0.5;
  const boxDepth = 0.25;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  const texture = new THREE.ImageUtils.loadTexture('media/rc.png');
  const material = new THREE.MeshPhongMaterial({
    color: 0x58b446,
    map: texture
  });
  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  boundary = new THREE.BoxHelper(cube, 0xde4996);
  boundary.geometry.computeBoundingBox();
  scene.add(boundary);
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

const getCanvasEyeCoordinates = data => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const eyeX = data.x <= screenWidth - canvas.clientWidth ? 0 : data.x;
  const eyeY = data.y <= screenHeight - canvas.clientHeight ? 0 : data.y;

  var scaledX = eyeX / screenWidth;
  var scaledY = eyeY / screenHeight;

  const visibleHeight = visibleHeightAtZDepth(0, camera);
  const visibleWidth = visibleWidthAtZDepth(0, camera);

  const canvasEyeX = scaledX * visibleWidth - visibleWidth / 2;
  const canvasEyeY = -1 * (scaledY * visibleHeight - visibleHeight / 2);

  return [canvasEyeX, canvasEyeY];
};

init();
animate();
