var App = (function(){
  var container, stats;
  var camera, controls, scene, renderer;
  var mesh, texture;
  var worldWidth = 264, worldDepth = 264, worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
  var worldSize = worldWidth * worldDepth;
  var movement = true;
  var worldData = new Uint8Array(new ArrayBuffer(worldSize));
  var clock = new THREE.Clock();
  var intensity = 2, terrain_intensity = 1.7;
  var particleSystems = [];
  var anchor;
  var sphere;
  var raycaster, rays, threshold = 10;
  var pointLight;

  return {

    init : function() {
      container = document.createElement( 'div' );
      container.setAttribute("id", "canvas-container");
      container.setAttribute("class", "canvas-container");
      document.body.appendChild( container );

      // Camera setup
      camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 18000 );
      camera.position.x = 2500;
      camera.position.y = worldData[ worldHalfWidth + worldHalfDepth * worldWidth ] * 5;

      // Controls setup
      controls = new THREE.OrbitControls( camera );
      controls.rotateSpeed = 0.02;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minPolarAngle = Math.PI / 3.3;
      controls.maxPolarAngle = Math.PI / 3.3;
      controls.enableZoom = false;
      // controls.autoRotate = true;
      // controls.autoRotateSpeed = -.1;
      controls.enableKeys = false;

      // Scene setup
      scene = new THREE.Scene();

      // Terrain fog effect
      pointLight = new THREE.PointLight( 0xffffff, 2 );
			scene.add( pointLight );
			pointLight.position.y = 700;


      // Noise setup
      noise.seed(Math.random()), quality = 1, z = 0;

      // Setting up particle system limits
      this.updateAnchors();

      // Particle system setup
      for (var i=10; i<20; i++) {
        this.generateParticles(i, 100, 50 + i);
      }

      // Terrain setup
      this.generateHeights();

      geometry = new THREE.PlaneBufferGeometry( 7500, 7500, worldWidth - 1, worldDepth - 1 );
      geometry.rotateX( - Math.PI / 2 );
      //geometry.dynamic = true;

      mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial({color:0x1C1C1C}));

      mesh.position.y = 0;

      this.updateMesh();

      scene.add( mesh );

      // Renderer setup
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setClearColor( 0x1C1C1C );
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );

      container.innerHTML = "";
      container.appendChild( renderer.domElement );

      // Show stats if available
      try{
        stats = new Stats();
        container.appendChild( stats.dom );
      }catch(e){

      }

      // Scene fade in
      container.style.opacity = 0;
      new TWEEN.Tween(container.style).to({opacity: 1}, 2000 ).start();

      // Disable controls on touch devices
      if(this.util.isTouchDevice()) controls.enabled = false, movement = false;

      // Start animation
      this.animate();
    },

    updateAnchors: function() {
      anchorX = window.innerWidth * 2;
      anchorY = window.innerHeight * 3;
    },

    resize: function() {
      camera.aspect = window.innerWidth / (window.innerHeight);
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight);
      this.updateAnchors();
    },

    generateParticles: function(id, particleCount, size) {
      // create the particle variables
      var particles = new THREE.Geometry();
      var pMaterial = new THREE.PointsMaterial({
        color: 0xCCCCCC,
        size: window.innerWidth / size,
        map: new THREE.TextureLoader().load(
          'images/snowflake-' + id + '.png'
        ),
        blending: THREE.AdditiveBlending,
        transparent: true,
      });

      // create the individual particles
      for (var p = 0; p < particleCount; p++) {

        // create a particle
        var pX = Math.random() * anchorX - (anchorX / 2),
            pY = Math.random() * anchorX - (anchorX / 2),
            pZ = Math.random() * anchorX - (anchorX / 2),
            particle = new THREE.Vector3(pX, pY, pZ);

        // create a velocity vector
        particle.velocity = new THREE.Vector3(
          0,        // x
          -Math.random(),  // y
          0);        // z

        // add it to the geometry
        particles.vertices.push(particle);
      }

      // create the particle system
      var particleSystem = new THREE.Points(
          particles,
          pMaterial);

      particleSystem.sortParticles = true;

      particleSystems.push({
        particleSystem: particleSystem,
        particleCount: particleCount,
        particles: particles,
        rotationFactor: 0.001,
        gravityFactor: Math.random() * .01
      });

      // add it to the scene
      scene.add(particleSystem);
    },

    generateHeights: function() {
      for ( var j = 0; j < 4; j ++ ) {
        for ( var i = 0; i < worldSize; i ++ ) {
          var x = i % worldWidth, y = ~~ ( i / worldWidth );
          worldData[ i ] += Math.abs( noise.perlin3( x / quality, y / quality, z ) * quality * terrain_intensity );
        }

        quality *= 5;
      }
    },

    updateHeights: function () {
      quality = 1
      z += .005;

      for ( var i = 0; i < worldSize; i ++ ) {
        worldData[ i ] = 0;
      }

      for ( var j = 0; j < 4; j ++ ) {
        for ( var i = 0; i < worldSize; i ++ ) {
          var x = i % worldWidth, y = ~~ ( i / worldWidth );
          worldData[ i ] += Math.abs( noise.perlin3( x / quality, y / quality, z ) * quality * terrain_intensity);
        }
        quality *= 5.5;
      }
    },

    updateMesh: function(){
      var vertices = mesh.geometry.attributes.position.array;
      for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
        vertices[ j + 1 ] = worldData[ i ] * 10;
      }

      mesh.geometry.attributes.position.needsUpdate = true;
    },

    animate: function(){
      TWEEN.update();

      for (var i=0; i<particleSystems.length; i++){
        var pCount = particleSystems[i].particleCount;
        var rotation = particleSystems[i].rotationFactor;
        var gravity = particleSystems[i].gravityFactor;

        while(pCount--) {
          // get the particle
          var particle = particleSystems[i].particles.vertices[pCount];

          // check if we need to reset
          if(particle.y < 0) {
            particle.y = anchorY;
            particle.velocity.y = 0;
          }

          // update the velocity
          particle.velocity.y -= gravity;

          // and to the position
          particle.add(particle.velocity);
        }

        // flag to the particle system that their
        // vertices where changed so it all updates.
        particleSystems[i].particleSystem.geometry.verticesNeedUpdate = true;
        particleSystems[i].particleSystem.rotation.y -= rotation;
      }

      var timer = 0.0001 * Date.now();

      pointLight.position.x = Math.sin( timer * 3.5 ) * 300;
			pointLight.position.z = Math.cos( timer * 1.5 ) * 300;

      requestAnimationFrame(this.animate.bind(this));

      controls.update();
      renderer.render( scene, camera );

      if(stats) stats.update();
    },

    pause: function(){
      controls.autoRotate = false;
      movement = false;
    },

    restart: function(){
      controls.autoRotate = true;
      if(!this.util.isTouchDevice()) movement = true;
    },

    toggleMovement: function() {
      movement = (movement) ? false : true;
    },

    up: function() {
      intensity = (intensity <= 2) ? 2 : (intensity - .05);
    },

    down: function() {
      intensity = (intensity >= 7) ? 7 : (intensity + .05);
    },

    util : {
      isTouchDevice: function() {
        return 'ontouchstart' in window        // works on most browsers
        || navigator.maxTouchPoints;       // works on IE10/11 and Surface
      }
    }
  };
})();

// Window events setup
window.addEventListener( 'DOMContentLoaded', function(){
  App.init();
}, false );

window.addEventListener( 'resize', function(){
  App.resize();
}, false );

window.addEventListener( 'scroll', function(){
  if(document.body.scrollTop > window.innerHeight) {
    App.pause();
  }else{
    App.restart();
  }
}, false );

window.addEventListener( 'keydown' , function(e){
  e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
         App.up();
    }
    else if (e.keyCode == '40') {
      // down arrow
        App.down();
    }
    else if (e.keyCode == '37') {
      // left arrow
    }
    else if (e.keyCode == '39') {
       // right arrow
    }
}, false );
