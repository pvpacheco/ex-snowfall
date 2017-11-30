var App = (function(){
  var container, stats;
  var camera, controls, scene, renderer;
	var mesh, texture;
	var worldWidth = 264, worldDepth = 264, worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
	var worldSize = worldWidth * worldDepth;
	var movement = true;
	var worldData = new Uint8Array(new ArrayBuffer(worldSize));
	var clock = new THREE.Clock();
	var intensity = 1.5;
  var particleSystem, particleCount, particles, pMaterial;
  var anchor;

	return {

		init : function() {
			container = document.createElement( 'div' );
			container.setAttribute("id", "canvas-container");
			container.setAttribute("class", "canvas-container");
			document.body.appendChild( container );

			// Camera setup
			camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 15000 );
			camera.position.x = 3000;
			camera.position.y = worldData[ worldHalfWidth + worldHalfDepth * worldWidth ] * 5;

			// Controls setup
			controls = new THREE.OrbitControls( camera );
			controls.rotateSpeed = 0.02;
			controls.enableDamping = true;
			controls.dampingFactor = 0.05;
			controls.minPolarAngle = Math.PI / 3;
			controls.maxPolarAngle = Math.PI / 3;
			controls.enableZoom = false;
			controls.autoRotate = true;
			controls.autoRotateSpeed = -.1;
			controls.enableKeys = false;

			// Scene setup
			scene = new THREE.Scene();

			scene.fog = new THREE.FogExp2( 0x1C1C1C, 0.00038 );

      // create the particle variables
      particleCount = 5000,
      particles = new THREE.Geometry(),
      pMaterial = new THREE.PointsMaterial({
        color: 0xCCCCCC,
        size: 20,
        map: new THREE.TextureLoader().load(
          'images/snowflake.png'
        ),
        blending: THREE.AdditiveBlending,
        transparent: true,
      });

      anchor = window.innerWidth * 2;

      // create the individual particles
      for (var p = 0; p < particleCount; p++) {

        // create a particle
        var pX = Math.random() * anchor - (anchor / 2),
            pY = Math.random() * anchor - (anchor / 2),
            pZ = Math.random() * anchor - (anchor / 2),
            particle = new THREE.Vector3(pX, pY, pZ);

        // create a velocity vector
    		particle.velocity = new THREE.Vector3(
    			0,				// x
    			-Math.random(),	// y
    			0);				// z

        // add it to the geometry
        particles.vertices.push(particle);
      }

      // create the particle system
      particleSystem = new THREE.Points(
          particles,
          pMaterial);

      particleSystem.sortParticles = true;

      // add it to the scene
      scene.add(particleSystem);

			// Renderer setup
			renderer = new THREE.WebGLRenderer();
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

		resize: function() {

			camera.aspect = window.innerWidth / (window.innerHeight);
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth, window.innerHeight);

		},

		animate: function(){
			TWEEN.update();

      var pCount = particleCount;
		  while(pCount--) {
        // get the particle
        var particle = particles.vertices[pCount];

        // check if we need to reset
  			if(particle.y < -(window.innerHeight/4)) {
  				particle.y = anchor;
  				particle.velocity.y = 0;
  			}

  			// update the velocity
  			particle.velocity.y -= Math.random() * .1;

  			// and to the position
  			particle.add(particle.velocity);
  		}

  		// flag to the particle system that their
      // vertices where changed so it all updates.
  		particleSystem.geometry.verticesNeedUpdate = true;

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
			intensity = (intensity >= 1.7) ? 1.7 : (intensity + .01);
		},

		down: function() {
			intensity = (intensity <= 0.4) ? 0.4 : (intensity - .01);
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
