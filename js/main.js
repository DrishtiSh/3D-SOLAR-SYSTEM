import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, controls, raycaster, mouse;
let planets = {};
let isPaused = false;

const planetData = {
  sun: {
    texture: "../img/sun_hd.jpg",
    radius: 20,
    material: "basic",
    info: {
      name: "Sun",
      desc: "The center of our solar system.",
      fact: "Contains 99.86% of the solar system's mass.",
    },
  },
  mercury: {
    texture: "../img/mercury_hd.jpg",
    radius: 2,
    info: {
      name: "Mercury",
      desc: "Closest planet to the Sun.",
      fact: "Has no atmosphere and experiences extreme temperatures.",
    },
  },
  venus: {
    texture: "../img/venus_hd.jpg",
    radius: 3,
    info: {
      name: "Venus",
      desc: "Second planet from the Sun.",
      fact: "Has a runaway greenhouse effect, hotter than Mercury.",
    },
  },
  earth: {
    texture: "../img/earth_hd.jpg",
    radius: 4,
    info: {
      name: "Earth",
      desc: "Our home planet.",
      fact: "The only known planet to support life.",
    },
  },
  mars: {
    texture: "../img/mars_hd.jpg",
    radius: 3.5,
    info: {
      name: "Mars",
      desc: "The red planet.",
      fact: "Home to the tallest mountain in the solar system – Olympus Mons.",
    },
  },
  jupiter: {
    texture: "../img/jupiter_hd.jpg",
    radius: 10,
    info: {
      name: "Jupiter",
      desc: "Largest planet in the solar system.",
      fact: "Has a giant storm called the Great Red Spot.",
    },
  },
  saturn: {
    texture: "../img/saturn_hd.jpg",
    radius: 8,
    hasRing: true,
    ringTexture: "../img/saturn_ring_texture.png",
    info: {
      name: "Saturn",
      desc: "Famous for its ring system.",
      fact: "Saturn's density is so low it could float in water.",
    },
  },
  uranus: {
    texture: "../img/uranus_hd.jpg",
    radius: 6,
    info: {
      name: "Uranus",
      desc: "An ice giant with a unique tilt.",
      fact: "Rotates on its side with an axial tilt of 98 degrees.",
    },
  },
  neptune: {
    texture: "../img/neptune_hd.jpg",
    radius: 5,
    info: {
      name: "Neptune",
      desc: "Furthest known planet from the Sun.",
      fact: "Has the fastest winds in the solar system.",
    },
  },
};

const orbitRadii = {
  mercury: 50,
  venus: 90,
  earth: 130,
  mars: 170,
  jupiter: 220,
  saturn: 280,
  uranus: 350,
  neptune: 420,
};

const revolutionSpeeds = {
  mercury: 4,
  venus: 3,
  earth: 2,
  mars: 1.8,
  jupiter: 1.2,
  saturn: 1,
  uranus: 0.7,
  neptune: 0.5,
};

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 200, 600);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 1200;

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  const light = new THREE.PointLight(0xffffff, 2);
  light.position.set(0, 0, 0);
  scene.add(light);

  addSkybox();
  addPlanets();
  addOrbits();
  setupUI();

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("click", onClick);
}

function addSkybox() {
  const paths = [
    "../img/skybox/space_ft.png",
    "../img/skybox/space_bk.png",
    "../img/skybox/space_up.png",
    "../img/skybox/space_dn.png",
    "../img/skybox/space_rt.png",
    "../img/skybox/space_lf.png",
  ];
  const materials = paths.map((path) => {
    const tex = new THREE.TextureLoader().load(path);
    return new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
  });
  const skyboxGeo = new THREE.BoxGeometry(2000, 2000, 2000);
  const skybox = new THREE.Mesh(skyboxGeo, materials);
  scene.add(skybox);
}

function addPlanets() {
  for (const [name, data] of Object.entries(planetData)) {
    const texture = new THREE.TextureLoader().load(data.texture);
    const material = data.material === "basic"
      ? new THREE.MeshBasicMaterial({ map: texture })
      : new THREE.MeshStandardMaterial({ map: texture });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 64, 64), material);

    if (name === "sun") {
      mesh.position.set(0, 0, 0);
    } else {
      mesh.userData.orbitRadius = orbitRadii[name];
      mesh.userData.speed = revolutionSpeeds[name];
      mesh.userData.name = name;
    }

    if (name === "saturn" && data.hasRing) {
      const ringTexture = new THREE.TextureLoader().load(data.ringTexture);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(data.radius + 1, data.radius + 6, 64),
        new THREE.MeshBasicMaterial({ map: ringTexture, side: THREE.DoubleSide, transparent: true })
      );
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);
    }

    scene.add(mesh);
    planets[name] = mesh;
  }
}

function addOrbits() {
  for (const [_, radius] of Object.entries(orbitRadii)) {
    const orbit = new THREE.RingGeometry(radius - 0.2, radius, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(orbit, material);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
  }
}

function animate(time) {
  requestAnimationFrame(animate);

  if (!isPaused) {
    for (const [name, mesh] of Object.entries(planets)) {
      if (name !== "sun") {
        const angle = time * 0.0005 * mesh.userData.speed;
        const radius = mesh.userData.orbitRadius;
        mesh.position.x = radius * Math.cos(angle);
        mesh.position.z = radius * Math.sin(angle);
      }
      mesh.rotation.y += 0.005;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(Object.values(planets));
  if (intersects.length > 0) {
    const clicked = Object.keys(planets).find(k => planets[k] === intersects[0].object);
    if (clicked) {
      camera.position.copy(planets[clicked].position.clone().add(new THREE.Vector3(20, 20, 20)));
      controls.target.copy(planets[clicked].position);
      showInfo(clicked);
    }
  }
}

function setupUI() {
  const toggleBtn = document.getElementById("toggleBtn");
  toggleBtn.onclick = () => (isPaused = !isPaused);

  const resetBtn = document.getElementById("resetBtn");
  resetBtn.onclick = () => {
    camera.position.set(0, 200, 600);
    controls.target.set(0, 0, 0);
  };

  const closeBtn = document.getElementById("closeInfoBtn");
  closeBtn.onclick = () => {
    document.getElementById("planetInfoContent").innerHTML = "Click a planet to learn more";
  };
}

function showInfo(name) {
  const info = planetData[name].info;
  const box = document.getElementById("planetInfoContent");
  box.innerHTML = `
    <h2>${info.name}</h2>
    <p><strong>Description:</strong> ${info.desc}</p>
    <p><strong>Fun Fact:</strong> ${info.fact}</p>
  `;
}

init();
animate();
