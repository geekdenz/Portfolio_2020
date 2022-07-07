import * as THREE from 'three';
// const THREE = require('three');
import { WEBGL } from './WebGL';
import * as Ammo from './builds/ammo';
import * as dat from 'dat.gui';
// import {SVGLoader} from 'jsm/SVGLoader.js';
// import './jsm/SVGLoader.js';
import * as SVGLoader from './jsm/SVGLoader.js';

// require('./jsm/SVGLoader.js');
import {
  billboardTextures,
  boxTexture,
  inputText,
  URL,
  stoneTexture,
  woodTexture,
  oe_v2,
} from './resources/textures';

import {
  setupEventHandlers,
  moveDirection,
  isTouchscreenDevice,
  touchEvent,
  createJoystick,
} from './resources/eventHandlers';

import {
  preloadDivs,
  preloadOpacity,
  postloadDivs,
  startScreenDivs,
  startButton,
  noWebGL,
  fadeOutDivs,
} from './resources/preload';

import {
  clock,
  scene,
  camera,
  renderer,
  // stats,
  manager,
  createWorld,
  lensFlareObject,
  createLensFlare,
  particleGroup,
  particleAttributes,
  particleSystemObject,
  glowingParticles,
  addParticles,
  moveParticles,
  generateGalaxy,
  galaxyMaterial,
  galaxyClock,
  galaxyPoints,
} from './resources/world';

import {
  simpleText,
  floatingLabel,
  allSkillsSection,
  createTextOnPlane,
  addVideo,
} from './resources/surfaces';

import {
  pickPosition,
  launchClickPosition,
  getCanvasRelativePosition,
  rotateCamera,
  launchHover,
} from './resources/utils';
import { AdditiveAnimationBlendMode } from 'three';

export let cursorHoverObjects = [];


// start Ammo Engine
Ammo().then((Ammo) => {
  // const gui = new dat.GUI();
  //Ammo.js variable declaration
  let rigidBodies = [],
    physicsWorld;

  //Ammo Dynamic bodies for ball
  let ballObject = null;
  const STATE = { DISABLE_DEACTIVATION: 4 };

  //default transform object
  let tmpTrans = new Ammo.btTransform();

  // list of hyperlink objects
  var objectsWithLinks = [];

  //function to create physics world with Ammo.js
  function createPhysicsWorld() {
    //algortihms for full (not broadphase) collision detection
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration), // dispatch calculations for overlapping pairs/ collisions.
      overlappingPairCache = new Ammo.btDbvtBroadphase(), //broadphase collision detection list of all possible colliding pairs
      constraintSolver = new Ammo.btSequentialImpulseConstraintSolver(); //causes the objects to interact properly, like gravity, game logic forces, collisions

    // see bullet physics docs for info
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(
      dispatcher,
      overlappingPairCache,
      constraintSolver,
      collisionConfiguration
    );

    // add gravity
    physicsWorld.setGravity(new Ammo.btVector3(0, -50, 0));
  }

  //create flat plane
  function createGridPlane() {
    // block properties
    let pos = { x: 0, y: -0.25, z: 0 };
    let scale = { x: 175, y: 0.5, z: 175 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    //create grid overlay on plane
    var grid = new THREE.GridHelper(175, 20, 0xffffff, 0xffffff);
    grid.material.opacity = 0.15;
    grid.material.transparent = true;
    grid.position.y = 0.005;
    scene.add(grid);

    //Create Threejs Plane
    let blockPlane = new THREE.Mesh(
      new THREE.BoxBufferGeometry(),
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
      })
    );
    blockPlane.position.set(pos.x, pos.y, pos.z);
    blockPlane.scale.set(scale.x, scale.y, scale.z);
    blockPlane.receiveShadow = true;
    scene.add(blockPlane);

    //Ammo.js Physics
    let transform = new Ammo.btTransform();
    transform.setIdentity(); // sets safe default values
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    //setup collision box
    let colShape = new Ammo.btBoxShape(
      new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
    );
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    //  provides information to create a rigid body
    let rigidBodyStruct = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rigidBodyStruct);
    body.setFriction(10);
    body.setRollingFriction(10);

    // add to world
    physicsWorld.addRigidBody(body);
  }

  // create ball
  function createBall() {
    let pos = { x: 8.75, y: 0, z: 0 };
    let radius = 2;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 3;

    var marble_loader = new THREE.TextureLoader(manager);
    var marbleTexture = marble_loader.load('./src/jsm/earth.jpg');
    marbleTexture.wrapS = marbleTexture.wrapT = THREE.RepeatWrapping;
    marbleTexture.repeat.set(1, 1);
    marbleTexture.anisotropy = 1;
    marbleTexture.encoding = THREE.sRGBEncoding;

    //threeJS Section
    let ball = (ballObject = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32),
      new THREE.MeshLambertMaterial({ map: marbleTexture })
    ));

    ball.geometry.computeBoundingSphere();
    ball.geometry.computeBoundingBox();

    ball.position.set(pos.x, pos.y, pos.z);

    ball.castShadow = true;
    ball.receiveShadow = true;

    scene.add(ball);

    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);
    //body.setFriction(4);
    body.setRollingFriction(10);

    //set ball friction

    //once state is set to disable, dynamic interaction no longer calculated
    body.setActivationState(STATE.DISABLE_DEACTIVATION);

    physicsWorld.addRigidBody(
      body //collisionGroupRedBall, collisionGroupGreenBall | collisionGroupPlane
    );

    ball.userData.physicsBody = body;
    ballObject.userData.physicsBody = body;

    rigidBodies.push(ball);
    rigidBodies.push(ballObject);
  }

  //create beach ball Mesh
  function createBeachBall() {
    let pos = { x: 20, y: 30, z: 0 };
    let radius = 2;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 20;

    //import beach ball texture
    var texture_loader = new THREE.TextureLoader(manager);
    var beachTexture = texture_loader.load('./src/jsm/BeachBallColor.jpg');
    beachTexture.wrapS = beachTexture.wrapT = THREE.RepeatWrapping;
    beachTexture.repeat.set(1, 1);
    beachTexture.anisotropy = 1;
    beachTexture.encoding = THREE.sRGBEncoding;

    //threeJS Section
    let ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32),
      new THREE.MeshLambertMaterial({ map: beachTexture })
    );

    ball.position.set(pos.x, pos.y, pos.z);
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);

    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);

    body.setRollingFriction(1);
    physicsWorld.addRigidBody(body);

    ball.userData.physicsBody = body;
    rigidBodies.push(ball);
  }

  //create link boxes
  function createBox(
    x,
    y,
    z,
    scaleX,
    scaleY,
    scaleZ,
    boxTexture,
    URLLink,
    color = 0x000000,
    transparent = true
  ) {
    const boxScale = { x: scaleX, y: scaleY, z: scaleZ };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    //load link logo
    const loader = new THREE.TextureLoader(manager);
    const texture = loader.load(boxTexture);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: transparent,
      opacity: 0.9,
      color: 0xffffff,
    });

    var borderMaterial = new THREE.MeshBasicMaterial({
      color: color,
    });
    borderMaterial.color.convertSRGBToLinear();

    var materials = [
      borderMaterial, // Left side
      borderMaterial, // Right side
      borderMaterial, // Top side   ---> THIS IS THE FRONT
      borderMaterial, // Bottom side --> THIS IS THE BACK
      loadedTexture, // Front side
      borderMaterial, // Back side
    ];

    const linkBox = new THREE.Mesh(
      new THREE.BoxBufferGeometry(boxScale.x, boxScale.y, boxScale.z),
      materials
    );
    linkBox.position.set(x, y, z);
    linkBox.renderOrder = 1;
    linkBox.castShadow = true;
    linkBox.receiveShadow = true;
    linkBox.userData = { URL: URLLink, email: URLLink };
    scene.add(linkBox);
    objectsWithLinks.push(linkBox.uuid);

    addRigidPhysics(linkBox, boxScale);

    cursorHoverObjects.push(linkBox);
  }

  //create Ammo.js body to add solid mass to "Tim-Hinnerk Heuer Software Engineer"
  function ryanFloydWords(x, y, z) {
    const boxScale = { x: 46, y: 3, z: 2 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    const linkBox = new THREE.Mesh(
      new THREE.BoxBufferGeometry(boxScale.x, boxScale.y, boxScale.z),
      new THREE.MeshPhongMaterial({
        color: 0xff6600,
      })
    );

    linkBox.position.set(x, y, z);
    linkBox.castShadow = true;
    linkBox.receiveShadow = true;
    objectsWithLinks.push(linkBox.uuid);

    addRigidPhysics(linkBox, boxScale);
  }

  //loads text for Tim-H. Heuer's Mesh
  function loadTimText() {
    var text_loader = new THREE.FontLoader();

    const font = 'NimbusSanL_Bold'; //Roboto_Regular 
    text_loader.load(`./src/jsm/${font}.json`, function (font) {
      var xMid, text;

      var color = 0xecaf36;

      var textMaterials = [
        new THREE.MeshBasicMaterial({ color: color }), // front
        new THREE.MeshPhongMaterial({ color: color }), // side
      ];

      var geometry = new THREE.TextGeometry('Tim-Hinnerk Heuer', {
        font: font,
        size: 3,
        height: 0.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.11,
        bevelOffset: 0,
        bevelSegments: 1,
      });

      geometry.computeBoundingBox();
      geometry.computeVertexNormals();

      xMid = -0.25 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

      geometry.translate(xMid, 3, 0);

      var textGeo = new THREE.BufferGeometry().fromGeometry(geometry);

      text = new THREE.Mesh(geometry, textMaterials);
      text.position.x = 0;
      text.position.z = -20;
      text.position.y = 0.1;
      text.receiveShadow = true;
      text.castShadow = true;
      scene.add(text);
    });
  }

  //create "software engineer text"
  function loadEngineerText() {
    var text_loader = new THREE.FontLoader();

    const font = 'NimbusSanL_Bold'; //Roboto_Regular 
    text_loader.load(`./src/jsm/${font}.json`, function (font) {
      var xMid, text;

      var color = 0x24bd9b;

      var textMaterials = [
        new THREE.MeshBasicMaterial({ color: color }), // front
        new THREE.MeshPhongMaterial({ color: color }), // side
      ];

      var geometry = new THREE.TextGeometry('Software Developer', {
        font: font,
        size: 1.5,
        height: 0.5,
        curveSegments: 20,
        bevelEnabled: true,
        bevelThickness: 0.25,
        bevelSize: 0.1,
      });

      geometry.computeBoundingBox();
      geometry.computeVertexNormals();

      xMid = -0.125 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

      geometry.translate(xMid, 0, 0);

      var textGeo = new THREE.BufferGeometry().fromGeometry(geometry);

      text = new THREE.Mesh(textGeo, textMaterials);
      text.position.z = -20;
      text.position.y = 0.1;
      text.position.x = 2;
      text.receiveShadow = true;
      text.castShadow = true;
      scene.add(text);
    });
  }

  //function to create billboard
  function createBillboard(
    x,
    y,
    z,
    textureImage = billboardTextures.grassImage,
    urlLink,
    rotation = 0
  ) {
    const billboardPoleScale = { x: 1, y: 5, z: 1 };
    const billboardSignScale = { x: 30, y: 15, z: 1 };

    /* default texture loading */
    const loader = new THREE.TextureLoader(manager);

    const billboardPole = new THREE.Mesh(
      new THREE.BoxBufferGeometry(
        billboardPoleScale.x,
        billboardPoleScale.y,
        billboardPoleScale.z
      ),
      new THREE.MeshStandardMaterial({
        map: loader.load(woodTexture),
      })
    );

    const texture = loader.load(textureImage);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    var borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
    });

    var materials = [
      borderMaterial, // Left side
      borderMaterial, // Right side
      borderMaterial, // Top side   ---> THIS IS THE FRONT
      borderMaterial, // Bottom side --> THIS IS THE BACK
      loadedTexture, // Front side
      borderMaterial, // Back side
    ];
    // order to add materials: x+,x-,y+,y-,z+,z-
    const billboardSign = new THREE.Mesh(
      new THREE.BoxGeometry(
        billboardSignScale.x,
        billboardSignScale.y,
        billboardSignScale.z
      ),
      materials
    );

    billboardPole.position.x = x;
    billboardPole.position.y = y;
    billboardPole.position.z = z;

    billboardSign.position.x = x;
    billboardSign.position.y = y + 10;
    billboardSign.position.z = z;

    /* Rotate Billboard */
    billboardPole.rotation.y = rotation;
    billboardSign.rotation.y = rotation;

    billboardPole.castShadow = true;
    billboardPole.receiveShadow = true;

    billboardSign.castShadow = true;
    billboardSign.receiveShadow = true;

    billboardSign.userData = { URL: urlLink };

    scene.add(billboardPole);
    scene.add(billboardSign);
    addRigidPhysics(billboardPole, billboardPoleScale);

    cursorHoverObjects.push(billboardSign);
  }

  //create vertical billboard
  function createBillboardRotated(
    x,
    y,
    z,
    textureImage = billboardTextures.grassImage,
    urlLink,
    rotation = 0
  ) {
    const billboardPoleScale = { x: 1, y: 2.5, z: 1 };
    const billboardSignScale = { x: 15, y: 20, z: 1 };

    /* default texture loading */
    const loader = new THREE.TextureLoader(manager);
    const billboardPole = new THREE.Mesh(
      new THREE.BoxBufferGeometry(
        billboardPoleScale.x,
        billboardPoleScale.y,
        billboardPoleScale.z
      ),
      new THREE.MeshStandardMaterial({
        map: loader.load(woodTexture),
      })
    );
    const texture = loader.load(textureImage);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    var borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
    });

    var materials = [
      borderMaterial, // Left side
      borderMaterial, // Right side
      borderMaterial, // Top side   ---> THIS IS THE FRONT
      borderMaterial, // Bottom side --> THIS IS THE BACK
      loadedTexture, // Front side
      borderMaterial, // Back side
    ];
    // order to add materials: x+,x-,y+,y-,z+,z-
    const billboardSign = new THREE.Mesh(
      new THREE.BoxGeometry(
        billboardSignScale.x,
        billboardSignScale.y,
        billboardSignScale.z
      ),
      materials
    );

    billboardPole.position.x = x;
    billboardPole.position.y = y;
    billboardPole.position.z = z;

    billboardSign.position.x = x;
    billboardSign.position.y = y + 11.25;
    billboardSign.position.z = z;

    /* Rotate Billboard */
    billboardPole.rotation.y = rotation;
    billboardSign.rotation.y = rotation;

    billboardPole.castShadow = true;
    billboardPole.receiveShadow = true;

    billboardSign.castShadow = true;
    billboardSign.receiveShadow = true;

    billboardSign.userData = { URL: urlLink };

    scene.add(billboardPole);
    scene.add(billboardSign);
    addRigidPhysics(billboardPole, billboardPoleScale);
    addRigidPhysics(billboardSign, billboardSignScale);

    cursorHoverObjects.push(billboardSign);
  }

  function createVideoBillboard(
    x,
    y,
    z,
    videoUrl = URL.siblingFinderVideo,
    urlLink = '',
    rotation = 0,
    muted = true,
    speed = 1,
    from = 0
  ) {
    const billboardPoleScale = { x: 1, y: 5, z: 1 };
    const billboardSignScale = { x: 30, y: 15, z: 1 };

    const video = document.createElement('video');
    video.src = videoUrl;
    video.loop = true;
    video.crossOrigin = 'anonymous';
    video.autoplay = true;
    video.muted = muted;
    video.playbackRate = speed;
    video.currentTime = from;
    // const geometry = new THREE.PlaneBufferGeometry(width, height);
    const texture = new THREE.VideoTexture(video);

    // const material = new THREE.MeshBasicMaterial({
    //   map: texture,
    // });

    // let mesh = new THREE.Mesh(geometry, material);
    // mesh.position.x = x;
    // mesh.position.y = y;
    // mesh.position.z = z;
    // mesh.rotation.y = rotation;
    // // activitiesText.rotation.x = -Math.PI * 0.5;

    // material.depthWrite = true;
    // material.depthTest = true;
    // mesh.renderOrder = 1;
    /* default texture loading */
    const loader = new THREE.TextureLoader(manager);

    const billboardPole = new THREE.Mesh(
      new THREE.BoxBufferGeometry(
        billboardPoleScale.x,
        billboardPoleScale.y,
        billboardPoleScale.z
      ),
      new THREE.MeshStandardMaterial({
        map: loader.load(woodTexture),
      })
    );

    // const texture = loader.load(videoUrl);
    // texture.magFilter = THREE.LinearFilter;
    // texture.minFilter = THREE.LinearFilter;
    // texture.encoding = THREE.sRGBEncoding;
    var borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
    });
    loadedTexture.depthWrite = true;
    loadedTexture.depthTest = true;

    var materials = [
      borderMaterial, // Left side
      borderMaterial, // Right side
      borderMaterial, // Top side   ---> THIS IS THE FRONT
      borderMaterial, // Bottom side --> THIS IS THE BACK
      loadedTexture, // Front side
      borderMaterial, // Back side
    ];
    // order to add materials: x+,x-,y+,y-,z+,z-
    const billboardSign = new THREE.Mesh(
      new THREE.BoxGeometry(
        billboardSignScale.x,
        billboardSignScale.y,
        billboardSignScale.z
      ),
      materials
    );

    billboardSign.renderOrder = 1;
    billboardPole.position.x = x;
    billboardPole.position.y = y;
    billboardPole.position.z = z;

    billboardSign.position.x = x;
    billboardSign.position.y = y + 10;
    billboardSign.position.z = z;

    /* Rotate Billboard */
    console.log('rotation', rotation)
    billboardPole.rotation.y = rotation;
    billboardSign.rotation.y = rotation;

    billboardPole.castShadow = true;
    billboardPole.receiveShadow = true;

    billboardSign.castShadow = true;
    billboardSign.receiveShadow = true;

    billboardSign.userData = { URL: urlLink };

    scene.add(billboardPole);
    scene.add(billboardSign);
    addRigidPhysics(billboardPole, billboardPoleScale);

    cursorHoverObjects.push(billboardSign);
  }
  //create X axis wall around entire plane
  function createWallX(x, y, z) {
    const wallScale = { x: 0.125, y: 4, z: 175 };

    const wall = new THREE.Mesh(
      new THREE.BoxBufferGeometry(wallScale.x, wallScale.y, wallScale.z),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        opacity: 0.75,
        transparent: true,
      })
    );

    wall.position.x = x;
    wall.position.y = y;
    wall.position.z = z;

    wall.receiveShadow = true;

    scene.add(wall);

    addRigidPhysics(wall, wallScale);
  }

  //create Z axis wall around entire plane
  function createWallZ(x, y, z) {
    const wallScale = { x: 175, y: 4, z: 0.125 };

    const wall = new THREE.Mesh(
      new THREE.BoxBufferGeometry(wallScale.x, wallScale.y, wallScale.z),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        opacity: 0.75,
        transparent: true,
      })
    );

    wall.position.x = x;
    wall.position.y = y;
    wall.position.z = z;

    wall.receiveShadow = true;

    scene.add(wall);

    addRigidPhysics(wall, wallScale);
  }

  //create brick wall
  function wallOfBricks() {
    const loader = new THREE.TextureLoader(manager);
    var pos = new THREE.Vector3();
    var quat = new THREE.Quaternion();
    var brickMass = 0.1;
    var brickLength = 3;
    var brickDepth = 3;
    var brickHeight = 1.5;
    var numberOfBricksAcross = 6;
    var numberOfRowsHigh = 6;

    pos.set(70, brickHeight * 0.5, -60);
    quat.set(0, 0, 0, 1);

    for (var j = 0; j < numberOfRowsHigh; j++) {
      var oddRow = j % 2 == 1;

      pos.x = 60;

      if (oddRow) {
        pos.x += 0.25 * brickLength;
      }

      var currentRow = oddRow ? numberOfBricksAcross + 1 : numberOfBricksAcross;
      for (let i = 0; i < currentRow; i++) {
        var brickLengthCurrent = brickLength;
        var brickMassCurrent = brickMass;
        if (oddRow && (i == 0 || i == currentRow - 1)) {
          //first or last brick
          brickLengthCurrent *= 0.5;
          brickMassCurrent *= 0.5;
        }
        var brick = createBrick(
          brickLengthCurrent,
          brickHeight,
          brickDepth,
          brickMassCurrent,
          pos,
          quat,
          new THREE.MeshStandardMaterial({
            map: loader.load(stoneTexture),
          })
        );
        brick.castShadow = true;
        brick.receiveShadow = true;

        if (oddRow && (i == 0 || i == currentRow - 2)) {
          //first or last brick
          pos.x += brickLength * 0.25;
        } else {
          pos.x += brickLength;
        }
        pos.z += 0.0001;
      }
      pos.y += brickHeight;
    }
  }

  //helper function to create individual brick mesh
  function createBrick(sx, sy, sz, mass, pos, quat, material) {
    var threeObject = new THREE.Mesh(
      new THREE.BoxBufferGeometry(sx, sy, sz, 1, 1, 1),
      material
    );
    var shape = new Ammo.btBoxShape(
      new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
    );
    shape.setMargin(0.05);

    createBrickBody(threeObject, shape, mass, pos, quat);

    return threeObject;
  }

  //add physics to brick body
  function createBrickBody(threeObject, physicsShape, mass, pos, quat) {
    threeObject.position.copy(pos);
    threeObject.quaternion.copy(quat);

    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    var motionState = new Ammo.btDefaultMotionState(transform);

    var localInertia = new Ammo.btVector3(0, 0, 0);
    physicsShape.calculateLocalInertia(mass, localInertia);

    var rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      physicsShape,
      localInertia
    );
    var body = new Ammo.btRigidBody(rbInfo);

    threeObject.userData.physicsBody = body;

    scene.add(threeObject);

    if (mass > 0) {
      rigidBodies.push(threeObject);

      // Disable deactivation
      body.setActivationState(4);
    }

    physicsWorld.addRigidBody(body);
  }

  function createTriangle(x, z) {
    var geom = new THREE.Geometry();
    var v1 = new THREE.Vector3(4, 0, 0);
    var v2 = new THREE.Vector3(5, 0, 0);
    var v3 = new THREE.Vector3(4.5, 1, 0);

    geom.vertices.push(v1);
    geom.vertices.push(v2);
    geom.vertices.push(v3);

    geom.faces.push(new THREE.Face3(0, 1, 2));
    geom.computeFaceNormals();

    var mesh = new THREE.Mesh(
      geom,
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    mesh.rotation.x = -Math.PI * 0.5;
    //mesh.rotation.z = -90;
    mesh.position.y = 0.01;
    mesh.position.x = x;
    mesh.position.z = z;
    scene.add(mesh);
  }

  function createSVG(x, y, z, path) {
    // instantiate a loader
    // console.log('loader',THREE.SVGLoader)
    // return;
    const {SVGLoader} = THREE;
    const loader = new SVGLoader();

    // load a SVG resource
    loader.load(
      // resource URL
      path,
      // called when the resource is loaded
      function (data) {
        console.log('svg data', data)
        const paths = data.paths;
        const group = new THREE.Group();
        // group.position.set(x, y, z);
        group.position.x = x;
        group.position.y = y;
        group.position.z = z;

        for (let i = 0; i < paths.length; i++) {
          // console.log(`path ${i}`);

          const path = paths[i];

          const material = new THREE.MeshBasicMaterial({
            color: path.color,
            side: THREE.DoubleSide,
            depthWrite: false
          });

          const shapes = SVGLoader.createShapes(path);

          for (let j = 0; j < shapes.length; j++) {

            const shape = shapes[j];
            const geometry = new THREE.ShapeGeometry(shape);
            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);

          }

        }

        group.scale.multiplyScalar( 0.1 );
        group.rotation.x = Math.PI * 0.5;
        // group.rotation.x = -Math.PI;
        // group.rotation.z = -Math.PI * 1;
        console.log('adding svg to scene', group);
        scene.add(group);

      },
      // called when loading is in progresses
      function (xhr) {

        console.log((xhr.loaded / xhr.total * 100) + '% loaded');

      },
      // called when loading has errors
      function (error) {

        console.log('An error happened', error);

      }
    );

  }

  //generic function to add physics to Mesh with scale
  function addRigidPhysics(item, itemScale) {
    let pos = { x: item.position.x, y: item.position.y, z: item.position.z };
    let scale = { x: itemScale.x, y: itemScale.y, z: itemScale.z };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;
    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );

    var localInertia = new Ammo.btVector3(0, 0, 0);
    var motionState = new Ammo.btDefaultMotionState(transform);
    let colShape = new Ammo.btBoxShape(
      new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
    );
    colShape.setMargin(0.05);
    colShape.calculateLocalInertia(mass, localInertia);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);
    body.setActivationState(STATE.DISABLE_DEACTIVATION);
    body.setCollisionFlags(2);
    physicsWorld.addRigidBody(body);
  }

  function moveBall() {
    let scalingFactor = 20;
    let moveX = moveDirection.right - moveDirection.left;
    let moveZ = moveDirection.back - moveDirection.forward;
    let moveY = 0;

    if (ballObject.position.y < 2.01) {
      moveX = moveDirection.right - moveDirection.left;
      moveZ = moveDirection.back - moveDirection.forward;
      moveY = 0;
    } else {
      moveX = moveDirection.right - moveDirection.left;
      moveZ = moveDirection.back - moveDirection.forward;
      moveY = -0.25;
    }

    // no movement
    if (moveX == 0 && moveY == 0 && moveZ == 0) return;

    let resultantImpulse = new Ammo.btVector3(moveX, moveY, moveZ);
    resultantImpulse.op_mul(scalingFactor);
    let physicsBody = ballObject.userData.physicsBody;
    physicsBody.setLinearVelocity(resultantImpulse);
  }

  window.addEventListener('resize', () => {
    let sizes = {}
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  })

  function renderFrame() {
    // FPS stats module
    // stats.begin();

    const elapsedTime = galaxyClock.getElapsedTime() + 150;

    let deltaTime = clock.getDelta();
    if (!isTouchscreenDevice())
      if (document.hasFocus()) {
        moveBall();
      } else {
        moveDirection.forward = 0;
        moveDirection.back = 0;
        moveDirection.left = 0;
        moveDirection.right = 0;
      }
    else {
      moveBall();
    }

    updatePhysics(deltaTime);

    moveParticles();

    // console.log('render')
    renderer.render(scene, camera);
    // stats.end();

    galaxyMaterial.uniforms.uTime.value = elapsedTime * 5;
    //galaxyPoints.position.set(-50, -50, 0);

    // tells browser theres animation, update before the next repaint
    requestAnimationFrame(renderFrame);
  }

  //loading page section
  function startButtonEventListener() {
    for (let i = 0; i < fadeOutDivs.length; i++) {
      fadeOutDivs[i].classList.add('fade-out');
    }
    setTimeout(() => {
      document.getElementById('preload-overlay').style.display = 'none';
    }, 750);

    startButton.removeEventListener('click', startButtonEventListener);
    document.addEventListener('click', launchClickPosition);
    // createBeachBall();

    setTimeout(() => {
      document.addEventListener('mousemove', launchHover);
    }, 1000);
  }

  function updatePhysics(deltaTime) {
    // Step world
    physicsWorld.stepSimulation(deltaTime, 10);

    // Update rigid bodies
    for (let i = 0; i < rigidBodies.length; i++) {
      let objThree = rigidBodies[i];
      let objAmmo = objThree.userData.physicsBody;
      let ms = objAmmo.getMotionState();
      if (ms) {
        ms.getWorldTransform(tmpTrans);
        let p = tmpTrans.getOrigin();
        let q = tmpTrans.getRotation();
        objThree.position.set(p.x(), p.y(), p.z());
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }
    }

    //check to see if ball escaped the plane
    if (ballObject.position.y < -50) {
      scene.remove(ballObject);
      createBall();
    }

    //check to see if ball is on text to rotate camera
    rotateCamera(ballObject);
  }

  //document loading
  manager.onStart = function (item, loaded, total) {
    //console.log("Loading started");
  };

  manager.onLoad = function () {
    var readyStateCheckInterval = setInterval(function () {
      if (document.readyState === 'complete') {
        clearInterval(readyStateCheckInterval);
        for (let i = 0; i < preloadDivs.length; i++) {
          preloadDivs[i].style.visibility = 'hidden'; // or
          preloadDivs[i].style.display = 'none';
        }
        for (let i = 0; i < postloadDivs.length; i++) {
          postloadDivs[i].style.visibility = 'visible'; // or
          postloadDivs[i].style.display = 'block';
        }
      }
    }, 1000);
    //console.log("Loading complete");
  };

  manager.onError = function (url) {
    //console.log("Error loading");
  };

  startButton.addEventListener('click', startButtonEventListener);

  if (isTouchscreenDevice()) {
    document.getElementById('appDirections').innerHTML =
      'Use the joystick in the bottom left to move the ball. Please use your device in portrait orientation!';
    createJoystick(document.getElementById('joystick-wrapper'));
    document.getElementById('joystick-wrapper').style.visibility = 'visible';
    document.getElementById('joystick').style.visibility = 'visible';
  }

  //initialize world and begin
  function start() {
    createWorld();
    createPhysicsWorld();

    createGridPlane();
    createBall();

    createWallX(87.5, 1.75, 0);
    createWallX(-87.5, 1.75, 0);
    createWallZ(0, 1.75, 87.5);
    createWallZ(0, 1.75, -87.5);

    // createBillboard(
    //   -80,
    //   2.5,
    //   -70,
    //   billboardTextures.terpSolutionsTexture,
    //   URL.terpsolutions,
    //   Math.PI * 0.22
    // );

    createBillboard(
      -45,
      2.5,
      -78,
      billboardTextures.smapMap,
      URL.smap,
    );

    createBillboardRotated(
      -17,
      1.25,
      -75,
      billboardTextures.oeTablet,
      URL.oeWebsite,
      Math.PI * -0.15
    );

    ryanFloydWords(11.2, 1, -20);
    // createTextOnPlane(-70, 0.01, -48, inputText.mwlrText, 20, 40);
    // createTextOnPlane(-42, 0.01, -53, inputText.bagholderBetsText, 20, 40);
    // createTextOnPlane(-14, 0.01, -49, inputText.homeSweetHomeText, 20, 40);

    createBox(
      12,
      2,
      -70,
      4,
      4,
      1,
      boxTexture.Github,
      URL.gitHub,
      0x000000,
      true
    );

    // createBox(
    //   4,
    //   2,
    //   -70,
    //   4,
    //   4,
    //   1,
    //   boxTexture.twitter,
    //   URL.twitter,
    //   0xffffff,
    //   true
    // );

    createBox(
      19,
      2,
      -70,
      4,
      4,
      1,
      boxTexture.LinkedIn,
      URL.LinkedIn,
      0x0077b5,
      true
    );
    // createBox(
    //   35,
    //   2,
    //   -70,
    //   4,
    //   4,
    //   1,
    //   boxTexture.globe,
    //   URL.ryanfloyd,
    //   0xffffff,
    //   false
    // );

    createBox(
      27,
      2,
      -70,
      4,
      4,
      1,
      boxTexture.mail,
      'mailto:tim@heuer.nz',
      0x000000,
      false
    );

    // createBox(
    //   44,
    //   2,
    //   -70,
    //   4,
    //   4,
    //   1,
    //   boxTexture.writing,
    //   URL.devTo,
    //   0x000000,
    //   false
    // );

    createBox(
      35,
      2,
      -70,
      4,
      4,
      1,
      boxTexture.writing,
      'https://github.com/geekdenz/Portfolio_2020/blob/master/README.md',
      0x000000,
      false
    );

    // floatingLabel(3.875, 4.5, -70, 'Twitter');
    floatingLabel(11.875, 4.5, -70, 'Github');
    floatingLabel(19.125, 4.5, -70, 'LinkedIn');
    floatingLabel(26.875, 4.5, -70, 'Email');
    // floatingLabel(35, 6.5, -70, '  Static \nWebsite');
    floatingLabel(35, 6.5, -70, ' How this\nwas made');
    // floatingLabel(44, 6.5, -70, '   How I \nmade this');

    allSkillsSection(-50, 0.025, 20, 40, 40, boxTexture.allSkills);
    allSkillsSection(55, 0.025, -3, 60, 30, inputText.activities);
//    allSkillsSection(8.5, 0.025, 54, 7, 3.5, boxTexture.skrillex);
//    allSkillsSection(9, 0.01, 45, 15, 15, boxTexture.edmText);
    // allSkillsSection(9, 0.01, 20, 21, 10.5, inputText.staticPortfolio);

    //lensflare
    createLensFlare(50, -50, -800, 200, 200, boxTexture.lensFlareMain);

    loadTimText();
    loadEngineerText();

    let touchText, instructionsText;
    if (isTouchscreenDevice()) {
      touchText = 'Touch boxes with your \nfinger to open links';
      instructionsText =
        '   Use the joystick in the bottom \nleft of the screen to move the ball.';
    } else {
      touchText = 'Click on boxes with \nthe mouse to open links';
      instructionsText =
        'Use the arrow keys on your \nkeyboard to move the ball.';
    }

    simpleText(9, 0.01, 20,
      'Static portfolio site\n' +
      '   available north\n' +
      'in the "links" section', 1);
    // createTextOnPlane(-42, 0.01, -53, inputText.bagholderBetsText, 20, 40);
    simpleText(9, 0.01, 5, instructionsText, 1.25);

    simpleText(23, 0.01, -60, touchText, 1.5);
    simpleText(-50, 0.01, -5, 'SKILLS', 3);
    simpleText(-42, 0.01, -30, 'EXPERIENCE', 3);
    // simpleText(61, 0.01, -15, 'TIMELINE', 3);

    simpleText(-75, 0.01, -70,
      ' MANAAKI WHENUA \n' +
      'LANDCARE RESEARCH\n\n' +
      '  Web Developer  \n' +
      '    2010-2021    \n' +
      '  S-map Online\n' +
      ' Sibling Finder',
      1.75
    );
    simpleText(-42, 0.01, -70,
      '    S-map Online    \n' +
      'This map application\n' +
      'has been a long term\n' +
      'project since 2010. \n' +
      " I've been program- \n" +
      " ming for it for 11 \n" + 
      "      years.",
      1.75
    );
    simpleText(-9, 0.01, -70,
      'Our Environment  \n' +
      'Responsive tablet\n' +
      'view. This is the\n' +
      'running prototype\n' +
      'for S-map Online \n' +
      ' and actually a  \n' +
      'more advanced app\n' +
      ' app, though not \n' +
      '   as popular.',
      1.75
    );
    simpleText(23 + 37, 0.01, -80, 'Our Environment - High Quality Print', 1.5);
    // createSVG(-65, 0.02, -75, 'src/jsm/mwlr-portfolio-smap-text-plain.svg');
    // wallOfBricks();
    // createTriangle(63, -55);
    // createTriangle(63, -51);
    // createTriangle(63, -47);
    // createTriangle(63, -43);
    // createSVG(30, 0, -90, 'src/jsm/oe_v2.svg');
    // createTextOnPlane(60, 0.01, -40, oe_v2, 20, 40);
    allSkillsSection(60, 0.05, -50, 40, Math.round(40 * Math.sqrt(2)), oe_v2, 'https://ourenvironment.scinfo.org.nz', 0.8);

    // AdditiveAnimationBlendMode()
    // console.log(URL.video)
    // const ratio = 1920/1080;
    // const vHeight = 10;
    // const vWidth = Math.round(ratio * vHeight);
    /**
     *       -80, 2.5, -70,
      billboardTextures.terpSolutionsTexture,
      URL.terpsolutions,
      Math.PI * 0.22
     */
    // addVideo(-79, 5, -70, URL.video, vWidth, vHeight, 10, 10, false, Math.PI * 0.22);
    // Math.PI * 0.22
    // 
    //   -80,
    //   2.5,
    //   -70,
    createVideoBillboard(-80, 2.5, -75, URL.siblingFinderVideo, 'https://youtu.be/_1YpyP6fyV8', Math.PI * 0.22, false, 1, 90); 

    addParticles();
    glowingParticles();
    generateGalaxy();

    setupEventHandlers();
    // window.addEventListener('mousemove', onDocumentMouseMove, false);
    renderFrame();
  }

  //check if user's browser has WebGL capabilities
  if (WEBGL.isWebGLAvailable()) {
    start();
  } else {
    noWebGL();
  }
});
