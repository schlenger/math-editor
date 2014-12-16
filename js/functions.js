/******** EDITOR ***********/

/** the html elements */
var container, stats,
/** the Three.js renderer */
	camera, scene, renderer; 

/** holds the grid information */
var grid, 
/** for label update */
	axis = [], 
/** holds the geometry */
	sceneGeometry = new THREE.Object3D(), 
/** the cameras */
	views = []; 

/** enable picker (http://soledadpenades.com/articles/three-js-tutorials/object-picking/) */
var mouseVector = new THREE.Vector3(),
	projector = new THREE.Projector();

var windowWidth = window.innerWidth,
	windowHeight = window.innerHeight;


/**
 * Creates an instance of GeometryEditor.
 *
 * @constructor
 * @this {GeometryEditor}
 * @version 1.0
 * @author Mathias Schlenker
 */
var GeometryEditor = {
	/** false: no debug log, true: print debug log on console */
	debug : true,
	/** is raycasting enabled? */
	enableRaycasting : true, 
	/** is inline editing enabled? */
	enableInlineEditing : true, 
	/** are multiple cameras are enabled? */
	enableMultipleCameras : true, 

	/** the text label array */
	textLabelArray : [],
	/** the arrow array */
	arrowArray : [],
	/** the lieghts array */
	lightsArray : [],

	/** is the scene a loaded or new one? */
	isLoadedScene : false, 
	/** holds the loaded json data */
	importData : null,
	/** holds the raycasting cursor */
	raycastingCursor : null, 
	/** the last hovered element */
	lastRaycastingObject : null, 
	/** temp var label update */
	axisLabelFace : true, 
	/** is the raycasting tooltip active */
	pickerActive : false, 
	/** is dark mode on? */
	darkThemeActive : false, 
	/** is dark mode on? */
	overlayActive : false, 
	/** the tooltip editor */
	editorActive : false, 
	 /** temp var,  
	  * -> for continuous disabling please use GeometryEditor.enableRaycasting */
	_temp_raycastingActive : true,
	
	/** true if typing focus is in input field */
	inputFocused : false, 
	/** some basic initialisation */
	mouseDown : {x : -999, y : -999}, 
	mouseUp : {x : -999, y : -999},

	/**
	 * Initialize a three.js scene and sets the starting
	 * parameters for the GeometryEditor itself and handels
	 * the loaded data.
	 */
	init : function () {

		// *** THREE.js Initialisation *** //
		scene = new THREE.Scene();					
		scene.add( sceneGeometry );


		// *** The Cameras *** //
		// the initial camera:
		if(GeometryEditor.isLoadedScene) {
			views = GeometryEditor.importData.settings.views;
		}
		else {
			views.push({
				left: 0,
				bottom: 0,
				width: 1,
				height: 1,
				background: new THREE.Color(0xFFFFFF),
				eye: [ 30, 30, 30 ],
				lookAt: [ 0, 0, 0 ],
				fov: 30
			});
		}

		for (var i =  0; i < views.length; i++ ) {
			var view = views[i];
			
			// create the bg color object
			view.background = new THREE.Color(view.background);

			// and create the corresponding camera
			camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
			camera.position.x = view.eye[0];
			camera.position.y = view.eye[1];
			camera.position.z = view.eye[2];
			camera.lookAt(vec3(view.lookAt[0],view.lookAt[1],view.lookAt[2]));
			view.camera = camera;

			// only add the orbit controls to the first cam
			if(i === 0) {
				controls = new THREE.OrbitControls( camera );
				//control.addEventListener( 'change', render );
			}
		}

		// *** The Renderer *** //
		// better with antialias
		// and load canvas renderer if opengl renderer is not accessable
		if(Detector.webgl) {
			renderer = new THREE.WebGLRenderer({antialias: true});
			GeometryEditor.debugLog("GeometryEditor | WebGL Renderer loaded!");
		}
		else {
			renderer = new THREE.CanvasRenderer({antialias: true}); 
			GeometryEditor.debugLog("GeometryEditor | Canvas Renderer loaded (could not load WebGL Renderer)!");
		}

		renderer.setClearColor (0x222222);
		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );
		renderer.domElement.style.zIndex = "0";
		

		// *** The Grid *** //
		window.gridVisible = true;
		var geometry = new THREE.Geometry(),
			bottom = -0.001, 
			step = 1;

		// check if there is another loaded version than standard
		var lineMaterial;

		if(GeometryEditor.isLoadedScene)
			lineMaterial = new THREE.LineBasicMaterial( { color: GeometryEditor.importData.settings.gridColor, transparent: true, opacity: 0.5 } );
		else
			lineMaterial = new THREE.LineBasicMaterial( { color: 0x303030, transparent: true, opacity: 0.5 } );

		for ( var i = 0; i <= 40; i ++ ) {
			geometry.vertices.push( vec3( - 20, bottom, i * step - 20 ) );
			geometry.vertices.push( vec3(   20, bottom, i * step - 20 ) );

			geometry.vertices.push( vec3( i * step - 20, bottom, -20 ) );
			geometry.vertices.push( vec3( i * step - 20, bottom,  20 ) );
		}
		geometry.dynamic = true;
		grid = new THREE.Line( geometry, lineMaterial, THREE.LinePieces );

		if(GeometryEditor.isLoadedScene && ! GeometryEditor.importData.settings.gridVisible) {
			grid.traverse( function ( object ) { object.visible = false; } );
			window.gridVisible = false;
		}

		scene.add( grid );
		window.gridColor = 0x303030;


		// *** The Axis *** //
		GeometryEditor.labelAxis(2, 2, 20);
		drawAxisArrow(vec3( 0, 0, 0 ), vec3( 1, 0, 0 ), 21, 0xFF0000);
		drawAxisArrow(vec3( 0, 0, 0 ), vec3( 0, 1, 0 ), 21, 0x00FF00);
		drawAxisArrow(vec3( 0, 0, 0 ), vec3( 0, 0, 1 ), 21, 0x0000FF);


		// *** The Stats *** //
		container = document.getElementById( 'container' );
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.right = '0px';
		container.appendChild( stats.domElement );


		// *** The Cursor *** //
		geometry = new THREE.SphereGeometry( 0.1, 10, 10);
		var material = new THREE.MeshBasicMaterial({ color: 0xFF8000 });
		var sphere = new THREE.Mesh( geometry, material );

		// a small helper function
		sphere.reset = function () {
			GeometryEditor.raycastingCursor.position = vec3(-5000,-5000,5000);
		};
		scene.add( sphere ); // and add to scene
		GeometryEditor.raycastingCursor = sphere;
		sphere.reset();
		

		// *** Event Listener *** //
		document.addEventListener( 'mousemove', GeometryEditor.onDocumentMouseMove, false ); // raycasting picker
		document.addEventListener( 'keydown', GeometryEditor.onKeyDown, false ); // add keyboard event listenener
		document.addEventListener( 'touchmove', GeometryEditor.onDocumentTouchMove, false ); // add keyboard event listenener

		document.addEventListener( 'mousedown', function (e) {
			GeometryEditor.mouseDown.x = e.clientX;
			GeometryEditor.mouseDown.y = e.clientY;
		}, false ); // add keyboard event listenener
		document.addEventListener( 'mouseup', function (e) {
			GeometryEditor.mouseUp.x = e.clientX;
			GeometryEditor.mouseUp.y = e.clientY;
		}, false ); // add keyboard event listenener
		document.addEventListener( 'click', GeometryEditor.onRaycastClick, false ); // add keyboard event listenener
		

		// *** Create Navigation *** //

		// load the geometry
		loadGeometry();
		GeometryEditor.debugLog("GeometryEditor | Loaded geometries:");

		for( var name in GeometryEditor.geometry ) {
			if(GeometryEditor.geometry.hasOwnProperty(name)) {
				//var i = 0; i < GeometryEditor.geometry.length; i++) {
				var geo = GeometryEditor.geometry[name];
				GeometryEditor.debugLog(" - " + name);

				$("nav ul.geometry").append("<li>&raquo; "+geo.form()+"</li>");
			}
		}

		// and add the corresponding triggers
 		$("nav ul.geometry input[type='submit']").click(function (e) {
	    	e.preventDefault(); // prevent site reload
	    	var form = $(this).closest("form"); // get the form dom element
	    	var paramObj = {}; // and the values
			$.each(form.serializeArray(), function(_, kv) {
			  paramObj[kv.name] = kv.value;
			});

			if(currentGeometry == "Plot") {
				console.log("yay");
				form.append("<div class='spinner'></div>");
			}

			// call function
			var currentGeometry = form.attr("class");
			GeometryEditor.geometry[currentGeometry].evaluate(paramObj);

	    	//hide form
	    	form.fadeToggle(300);
	    	// and reset it 
	    	form.trigger("reset");
	    });




 		// load the settings menü
	    GeometryEditor.loadSettings();
		GeometryEditor.debugLog("GeometryEditor | Loaded settings:");

		for(var name in GeometryEditor.settings) {
			if(GeometryEditor.settings.hasOwnProperty(name)) {
				//var i = 0; i < GeometryEditor.geometry.length; i++) {
				var setting = GeometryEditor.settings[name];
				GeometryEditor.debugLog(" - " + name);

				$("nav ul.settings").append("<li>"+setting.form()+"</li>");
			}
		}
	    
	    // and add the corresponding triggers
 		$("nav ul.settings input[type='submit']").click(function (e) {
	    	e.preventDefault(); // prevent site reload
	    	var form = $(this).closest("form"); // get the form dom element
	    	var paramObj = {}; // and the values
			$.each(form.serializeArray(), function(_, kv) {
			  paramObj[kv.name] = kv.value;
			});

			// call function
			var currentSetting = form.attr("class");
			//console.log(currentSetting);
			GeometryEditor.settings[currentSetting].evaluate(paramObj);

	    	//hide form
	    	form.fadeToggle(300);
	    	// and reset it 
	    	form.trigger("reset");
	    });

 		// and add the settings having no forms
	    $("nav ul.settings a[settingLink]").click(function (e) {
	    	e.preventDefault();
	    	var currentSetting = $(this).attr("id");
	    	GeometryEditor.settings[currentSetting].evaluate();
	    });


 		// add folding animations to forms 
	    $("#overlayContent nav a")
	    .not("ul.load a")
	    .not(".helpLabel")
	    .click(function (e) {
	    	e.preventDefault();
	    	var className = $(this).attr("class"); // get the current class
	    	$("form:not(form."+className+")").hide(); // hide every other form
	    	$("form."+className).fadeToggle(300); // toggle visibility
	    });


	    // add a sweet slider alternative
		$("input")
			.not("input[type=submit]")
			.not("input[type=text]")
			.mousedown(function(e) {
				startx = e.pageX;
				currentItem = $(this);
				currentVal = currentItem.attr("value");
				$(window).bind('mousemove', mouseMove);
				$(window).bind('mouseup', fieldUp);
				$("body").css("cursor","w-resize");
				e.preventDefault();
			});

	    $("form").hide(); // hide all forms


		GeometryEditor.debugLog("Renderer Info:");
		GeometryEditor.debugLog(renderer.info);
		document.getElementById("noJSMessage").innerHTML ="Preparing your scene...";
		console.log("GeometryEditor initialized!");

		// make sure changes are applied, so add a short timeout
		setTimeout(function(){
			// load the scene
			if(GeometryEditor.isLoadedScene) {
				// load lights
				var lights = GeometryEditor.importData.lights;
				for (var i = lights.length - 1; i >= 0; i--) {
					// type: current.lightType
					switch(lights[i].lightType) {
						case "DirectionalLight":
							var light = new THREE.DirectionalLight( lights[i].color );
							light.position = lights[i].direction;
							light.direction = light.position;
							
							scene.add( light );
							light.lightType = "DirectionalLight";
							GeometryEditor.lightsArray.push(light);
							break;
						case "PointLight":
							var pointLight = new THREE.PointLight( lights[i].color );
							pointLight.position = lights[i].position;

							pointLight.lookAt = lights[i].lookAt;
							scene.add(pointLight);
							pointLight.lightType = "PointLight";
							GeometryEditor.lightsArray.push(pointLight);
							break;
						case "AmbientLight":
							// only need color
							var ambientLight = new THREE.AmbientLight( lights[i].color ); // soft white light
							scene.add( ambientLight );
							ambientLight.lightType = "AmbientLight";
							GeometryEditor.lightsArray.push(ambientLight);
							break;
					}
				}

				// set the additional temp vars:
				if(GeometryEditor.importData.settings.darkThemeActive)
					GeometryEditor.toggleColor();

				

				var geometry = GeometryEditor.importData.geometry;
				// load the existing sceneGeometry:
				for(var i = 0; i < geometry.length; i++) {
					// if import function exists, import data
					if(GeometryEditor.geometry[geometry[i].objectType].import != undefined)
						GeometryEditor.geometry[geometry[i].objectType].import(geometry[i]);
				}


				var text = GeometryEditor.importData._text;
				// text label
				for(var i = 0; i < text.length; i++) {
					GeometryEditor.geometry["Text"].import(text[i]);
				}
			}
			else {
				// create some basic scene light
				// *** Light Sources *** //
				var light = new THREE.DirectionalLight( 0xFFFFFF );
				light.position.set( 0, 0, 1 );
				light.direction = vec3( 0,0,1 );
				scene.add( light );
				light.lightType = "DirectionalLight";
				GeometryEditor.lightsArray.push(light);

				// create a point light
				var pointLight = new THREE.PointLight( 0xFFFFFF );
				pointLight.position.set(10,50,130);
				pointLight.lookAt = vec3(0,0,0);
				scene.add(pointLight);
				pointLight.lightType = "PointLight";
				GeometryEditor.lightsArray.push(pointLight);

				var pointLight2 = new THREE.PointLight(0xFFFFFF);
				pointLight2.position.set(-10,-50,-130);
				pointLight2.lookAt = vec3(0,0,0);
				scene.add(pointLight2);
				pointLight2.lightType = "PointLight";
				GeometryEditor.lightsArray.push(pointLight2);

				// some ambient light
				var ambientLight = new THREE.AmbientLight( 0xAAAAAA ); // soft white light
				scene.add( ambientLight );
				ambientLight.lightType = "AmbientLight";
				GeometryEditor.lightsArray.push(ambientLight);
			}


			GeometryEditor.render();

			$("#noJS").remove();

			// display the ui elements
			$("#switch").show();
			$("#shortcuts").show();
			$("#quickAdd").show();
		}, 200);
	},

	/**
	 * Event listener which implements the raycasting function.
	 * Checks wheter an object is hit and if so displays an overlay
	 * with the cooresponding coordinates.
	 *
	 * @param {mouseEvent} e - the mouse event
	 */
	onDocumentMouseMove : function ( e ) {

		// if raycasting is generally enabled && overlay isnt active && editorbox isnt active
		if(GeometryEditor.enableRaycasting && GeometryEditor._temp_raycastingActive && !GeometryEditor.editorActive) {
			// get ray source point
			if(views.length > 1 && e.clientX < window.innerWidth/2) {
				// compute the rays for the new field of view:
				// input: from 0.0 to 0.5 x <-> output from 0.25 to 0.75x because of slicing
				mouseVector.x = 4* ((e.clientX + (window.innerWidth/4)) / window.innerWidth) - 2;
				//GeormetryEditor.debugLog("More views, left side touched| mouseX:"+ e.clientX +  ", computed:"+ mouseVector.x);
			}
			else if (views.length == 1) {
				mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
				//GeormetryEditor.debugLog("One view | mouseX:"+ e.clientX +  ", computed:"+ mouseVector.x);
			}
			else {
				//remove pickerOverlay
				GeometryEditor.raycastReset();
				//GeormetryEditor.debugLog("More than one view, right side touched");
				return;
			}
		    mouseVector.y = 1 - 2 * ( e.clientY / window.innerHeight );

		    // only use the main camera
		    camera = views[0].camera; 

		    // set the raycaster 
		    var raycaster = projector.pickingRay( mouseVector.clone(), camera ),
		    // and get the intersecting objects (nearest first)
				intersects = raycaster.intersectObjects( sceneGeometry.children );

			// reset the last changed color
			if(GeometryEditor.lastRaycastingObject != undefined) {
				GeometryEditor.lastRaycastingObject.object.material.color = new THREE.Color(GeometryEditor.lastRaycastingObject.object.primalColor);
			}

			// and finally place the overlay if there's an intersection
			var overlayRightMargin = 15;
			var overlayTopMargin = -18;

			if( intersects[0] != undefined) {
				$("canvas").css("cursor", "crosshair");

				var intersection = intersects[ 0 ],
					obj = intersection.object;

				// update temp var
				GeometryEditor.lastRaycastingObject = intersects [0];

				// check wheter object is bright or dark
				if(obj.material.color != undefined) // make sure attr exists
					if(calcLuminance(obj.primalColor)<0.4)
						obj.material.color.setRGB( 0.2 , 0.2, 0,2 );
					else
						obj.material.color.setRGB( 0.8 , 0.8, 0.8 );

				GeometryEditor.raycastingCursor.position = intersection.point;

				// only use 2 decimal places
				var point = intersection.point;
				point.x = point.x.toFixed(2);
				point.y = point.y.toFixed(2);
				point.z = point.z.toFixed(2);

				var posX = e.clientX;
				var posY = e.clientY;

				// don't cut at right side
				if(e.clientX > window.innerWidth - 170) {
					posX = window.innerWidth - 170;
					if(posY > window.innerHeight - 50)
						posY -= 25;
					else
						posY += 33;
				}

				if (GeometryEditor.pickerActive) {
					$("#pickerOverlay")
						// update data
						.html("<strong>X:</strong> " + point.x + ", <strong>Y:</strong> "+ point.y + ", <strong>Z:</strong> "+ point.z)
						// move pickerOverlay
						.css({top:posY + overlayTopMargin, left:posX + overlayRightMargin});
				}
				else {
					// create pickerOverlay at position
					GeometryEditor.pickerActive = true;
					$("<div id='pickerOverlay' />")
						// fill with data
						.html("<strong>X:</strong> " + point.x + ", <strong>Y:</strong> "+ point.y + ", <strong>Z:</strong> "+ point.z)
						.css({top:posY + overlayTopMargin, left:posX + overlayRightMargin})
						.appendTo('body');
				}
			}
			else if(GeometryEditor.pickerActive) {
				//remove pickerOverlay
				GeometryEditor.raycastReset();
			}
		}
	},

	/**
	 * Function provides functionality, if the raycaster didn't hit 
	 * anything or is disabled.
	 */
	raycastReset : function () {
		GeometryEditor.pickerActive = false;
		$("#pickerOverlay").remove(); // remove dom element
		GeometryEditor.raycastingCursor.reset(); // reset cursor position
		$("canvas").css("cursor", "move");
	},

	/**
	 * Functionity for object click. Modifies and displays the inline edit 
	 * form and updates the event listener.
	 *
	 * @param {keyEvent} e - the key event
	 */
	onRaycastClick : function ( e ) {
		// make sure quickadd bar isn't clicked
		var rect =  document.getElementById("quickAdd").getBoundingClientRect();	
		// check if click is in the content
		var x = e.clientX, y = e.clientY;

		// and then toggle overlay
		if((x > rect.left && x < rect.right &&
			y > rect.top && y < rect.bottom))
			return;

		// if picker is active &&  mouse wasn't moved while click 
		if( GeometryEditor.enableInlineEditing && 
			GeometryEditor.pickerActive && 
			!GeometryEditor.editorActive &&
			GeometryEditor.mouseDown.x == GeometryEditor.mouseUp.x && GeometryEditor.mouseDown.y == GeometryEditor.mouseUp.y && GeometryEditor.mouseDown.x != -999) {

			// get the current object
			var obj = GeometryEditor.lastRaycastingObject.object;
			obj.material.color = new THREE.Color( obj.primalColor );

			// visulize, that camera is disabled
			$("canvas").css("cursor", "not-allowed");

			// reposition tooltip
			var overlayRightMargin = 10;
			var overlayTopMargin = -18;
			var posX = e.clientX;
			var posY = e.clientY;

			// don't cut at right side
			if(e.clientX > window.innerWidth - 320) {
				posX = window.innerWidth - 320;
				if(posY > window.innerHeight - 240)
					posY -= 240;
				else
					posY += 30;
			}

			// change the tooltip content and reposition it
			if(obj.objectType == "Plot") {
				//use inline form
				$("#pickerOverlay")
					.html("<strong id='editorClose'><span>(Discard changes)</span> X</strong>" + GeometryEditor.geometry[obj.objectType].inlineForm())
					.css({top:posY + overlayTopMargin, left:posX + overlayRightMargin});
			}
			else
				$("#pickerOverlay")
					.html("<strong id='editorClose'><span>(Discard changes)</span> X</strong>" + GeometryEditor.geometry[obj.objectType].form())
					.css({top:posY + overlayTopMargin, left:posX + overlayRightMargin});

			$("#pickerOverlay a."+obj.objectType).replaceWith($("<span>Edit "+obj.objectType+"</span>"));
			// small bugfix for some devices
			$("#pickerOverlay input[type='submit']").attr("onSubmit","return false;");
			$("#pickerOverlay span.description").remove();
			$("#pickerOverlay input[name='planeWidth']").remove();
			$("#pickerOverlay label[for='planeWidth']").remove();


		// *** FILL with existing information ****

			$("#pickerOverlay input[name='originX']").attr("value", obj.position.x);
			$("#pickerOverlay input[name='originY']").attr("value", obj.position.y);
			$("#pickerOverlay input[name='originZ']").attr("value", obj.position.z);


			

			if(obj.material.opacity != undefined) {
				$("#pickerOverlay input[name='opacity']").attr("value", obj.material.opacity);
			}


			if(obj.direction != undefined) {
				$("#pickerOverlay input[name='directionX']").attr("value", obj.direction.x);
				$("#pickerOverlay input[name='directionY']").attr("value", obj.direction.y);
				$("#pickerOverlay input[name='directionZ']").attr("value", obj.direction.z);
			}

			// for sphere
			if(obj.radius != undefined) {
				$("#pickerOverlay input[name='radius']").attr("value", obj.radius);
			}

			// for box
			if(obj.box != undefined) {
				$("#pickerOverlay input[name='width']").attr("value", obj.box.width);
				$("#pickerOverlay input[name='height']").attr("value", obj.box.height);
				$("#pickerOverlay input[name='depth']").attr("value", obj.box.depth);

				$("#pickerOverlay input[name='rotationX']").attr("value", (obj.rotation.x / Math.PI) *180 );
				$("#pickerOverlay input[name='rotationY']").attr("value", (obj.rotation.y / Math.PI) *180 );
				$("#pickerOverlay input[name='rotationZ']").attr("value", (obj.rotation.z / Math.PI) *180 );
			}

			// for plot
			if(obj.plot != undefined) {
				//$("#pickerOverlay input[name='term']").attr("value", obj.plot);
				$("#pickerOverlay input[name='rotationX']").attr("value", (obj.rotation.x / Math.PI) *180 );
				$("#pickerOverlay input[name='rotationY']").attr("value", (obj.rotation.y / Math.PI) *180 );
				$("#pickerOverlay input[name='rotationZ']").attr("value", (obj.rotation.z / Math.PI) *180 );
			}
			else
				$("#pickerOverlay input[name='color']").val("#"+obj.primalColor.toString(16));//.toUpperCase()


			// **** INSERT NEW GEOMETRY AUTO FILLS HERE ****




			// **** INSERT NEW GEOMETRY AUTO FILLS HERE ****

			$("#pickerOverlay input[type='submit']")
				.attr("value", "Update")
				.click(function(e) {

					// only plot: redraw if update is pressed
					if(obj.objectType == "Plot") {
						var paramObj = {}; // and the values
						$.each($("#pickerOverlay form").serializeArray(), function(_, kv) {
						  paramObj[kv.name] = kv.value;
						});

						// call the redraw function
						GeometryEditor.geometry[obj.objectType].redraw(paramObj, obj);
					}

					close(e);
				});

			// keep the initial state in mind for reset:
			var resetVal = {}; // and the values
			$.each($("#pickerOverlay form").serializeArray(), function(_, kv) {
			  resetVal[kv.name] = kv.value;
			});
			// and bind it on discard button
			$("#editorClose").click(function (e) {
				if(obj.objectType != "Plot") // for efficiency
					GeometryEditor.geometry[obj.objectType].redraw(resetVal, obj);
				close();
			});

			$("<button class='deleteCurrent'>Delete</button>")
				.click(function(e){
					e.preventDefault();

					if(confirm("Do you really want to delete this object?")) {
						sceneGeometry.remove(obj);
						// and close overlay
						close();
					}
				})
				.appendTo("#pickerOverlay form");

		// *** END FILL****

			// insert slider funtionality
			$("#pickerOverlay input")
				.not("input[type=submit]")
				.not("input[type=text]")
				.mousedown(function(e) {
					startx = e.pageX;
					currentItem = $(this);
					currentVal = currentItem.attr("value");
					$(window).bind('mousemove', mouseMove);
					$(window).bind('mouseup', fieldUp);
					$("body").css("cursor","w-resize");
					e.preventDefault();
			});

			// redraw on every change
			$("#pickerOverlay input").not("#pickerOverlay input[name='term']").change( function(e) {
				var paramObj = {}; // and the values
				$.each($("#pickerOverlay form").serializeArray(), function(_, kv) {
				  paramObj[kv.name] = kv.value;
				});

				// call the redraw function
				GeometryEditor.geometry[obj.objectType].redraw(paramObj, obj);
			});

			// bugfix: update if input is focused or left
			$("input").focus(function() {
				GeometryEditor.inputFocused = true;
			})
			.focusout(function() {
				GeometryEditor.inputFocused = false;
			});

			// log event
			GeometryEditor.debugLog("GeometryEditor | raycastClick | ID: "+ obj.uuid);

			// set flags
			GeometryEditor.editorActive = true;
			controls.enabled = false; // disable controls
		}
	},

	/**
	 * Removes the picker, if the camera is moved.
	 *
	 * @param {touchEvent} e - the touch event
	 */
	onDocumentTouchMove : function ( e ) {
		if(GeometryEditor.pickerActive) {
			//remove pickerOverlay
			GeometryEditor.pickerActive = false;
			GeometryEditor.editorActive = false;
			controls.enabled = true;
			GeometryEditor.raycastingCursor.reset();
			$("#pickerOverlay").remove();
		}
	},

	/**
	 * Adds a new camera to the scene, if possible.
	 * If no attributes are given, a sample cam is added.
	 *
	 * @param {Object} attr - the camera attributes
	 */
	addCam : function (attr) {
		if(GeometryEditor.enableMultipleCameras) {
			// remove overlay
			close();

			var leftRatio = 0.5;
			if(views.length == 1) {

				if(attr === undefined){
					attr = {
						left: leftRatio,
						bottom: 0.0,
						width: 1-leftRatio,
						height: 1.0,
						background: new THREE.Color(0xF3E2A9),
						eye: [ 0, 50, 0 ],
						lookAt: [ 0, 0, 0 ],
						fov: 30
					};
				}
				else {
					// expand the attributes to the given screen
					attr.left = leftRatio;
					attr.bottom = 0.0;
					attr.width = 1-leftRatio;
					attr.height = 1.0;
				} 

				// compute the corresponding camera
				views.push(attr);
				camera = new THREE.PerspectiveCamera( attr.fov, window.innerWidth / window.innerHeight, 1, 10000 );
				camera.position.x = attr.eye[ 0 ];
				camera.position.y = attr.eye[ 1 ];
				camera.position.z = attr.eye[ 2 ];
				camera.lookAt(vec3(attr.lookAt[0],attr.lookAt[1],attr.lookAt[2]));
				attr.camera = camera;

				views[0].width = leftRatio;
				GeometryEditor.debugLog("GeometryEditor | addCam | views:"+ views.length);
			}
			else if (views.length == 2) {
				views[1].height = 0.5;
				views[1].bottom = 0.5;

				if(attr === undefined){
					attr = { 
						left: leftRatio,
						bottom: 0.0,
						width: 1-leftRatio,
						height: 0.5,
						background: new THREE.Color(0xF5DA81),
						eye: [ 20, 20, 20 ],
						lookAt: [ 0, 0, 0 ],
						fov: 60
					};
				}
				else {
					// expand the attributes to the given screen
					attr.left = leftRatio;
					attr.bottom = 0.0;
					attr.width = 1-leftRatio;
					attr.height = 0.5;
				}

				// compute the corresponding camera
				views.push(attr);
				camera = new THREE.PerspectiveCamera( attr.fov, window.innerWidth / window.innerHeight, 1, 10000 );
				camera.position.x = attr.eye[ 0 ];
				camera.position.y = attr.eye[ 1 ];
				camera.position.z = attr.eye[ 2 ];
				camera.lookAt(vec3(attr.lookAt[0],attr.lookAt[1],attr.lookAt[2]));
				attr.camera = camera;
				GeometryEditor.debugLog("GeometryEditor | addCam | views:"+ views.length);
			}
			else
				GeometryEditor.debugLog("GeometryEditor | addCam | Max cam count: cannot add more cams!");
		}
		else {
			GeometryEditor.debugLog("GeometryEditor | Multiple Camera Controls are disabled!");
		}
	},

	/**
	 * Removes the last added camera (if no number is given) 
	 * or camera number camNo. Does nothing if there is
	 * only one camera.
	 *
	 * @param {int} camNo - the camera number to be removed
	 */
	removeCam : function (camNo) {
		if(GeometryEditor.enableMultipleCameras) {
			// if there is a camera to remove
			if(views.length > 1) {
				// if no specific cam should be removed, remove last one
				if(camNo === undefined)
					camNo = views.length-1;

				views.splice(camNo, 1);

				if(views.length == 2) {
					views[1].height = 1.0;
					views[1].bottom = 0;
				}
				if(views.length == 1)
					views[0].width = 1;
				
				GeometryEditor.debugLog("GeometryEditor | removeCam | Current views:"+ views.length);
			}
			else {
				GeometryEditor.debugLog("GeometryEditor | removeCam | No cameras to remove");
				showMessage("No Cameras to remove!", false);
			}
		}
		else
			GeometryEditor.debugLog("GeometryEditor | Multiple Camera Controls are disabled!");
	},



	/**
	 * The three.js render loop. Calls itselt through
	 * requestAnimationFrame().
	 */
	render : function () {
		stats.update();

		// update the axis labels if necessary
		if(views[0].camera.position.z < 0 && GeometryEditor.axisLabelFace) {
			GeometryEditor.debugLog("GeometryEditor | Behind x axis");
			GeometryEditor.axisLabelFace = false;

			for (var i = 0; i < axis.length; i++) {
			    (axis[i]).rotation.y = Math.PI;
			    (axis[i]).position.x += 0.3;
			}
		}
		else if(views[0].camera.position.z >= 0 && !GeometryEditor.axisLabelFace) {
			GeometryEditor.debugLog("GeometryEditor | In front of x axis");
			GeometryEditor.axisLabelFace = true;

			for (var i = 0; i < axis.length; i++) {
			    (axis[i]).rotation.y = 0;
			    (axis[i]).position.x -= 0.3;
			}
		}

		// and update the text labels ()
		for (var i = 0; i < GeometryEditor.textLabelArray.length; i++) {
			if(GeometryEditor.textLabelArray[i].autoFacing)
				GeometryEditor.textLabelArray[i].lookAt(views[0].camera.position);
		}

		// update size
		if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {

			windowWidth  = window.innerWidth;
			windowHeight = window.innerHeight;

			renderer.setSize ( windowWidth, windowHeight );
			GeometryEditor.debugLog("System | Window was resized!");

			$('#overlayContent').css("margin-left",windowWidth/2-200);
			
			// hide overlay, when device is moved from landscape to portrait mode
			if(window.innerHeight > window.innerWidth && GeometryEditor.overlayActive){
				GeometryEditor.toggleOverlay();
			}
			if((window.innerHeight < window.innerWidth || window.innerHeight > 400) && !GeometryEditor.pickerActive) {
				// mobile fix: leave edit mode in portrait mode
				$("#switchEditMode").css("color","#666666");
				$("#switchViewMode").css("color","#DF7401");

				GeometryEditor.enableInlineEditing = false;
				close(); //close inline overlay
			}
		}

		var mouseX = 0,
			mouseY = 0;

		// change render size if windows size has changed
		if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {
			windowWidth  = window.innerWidth;
			windowHeight = window.innerHeight;
			renderer.setSize ( windowWidth, windowHeight );
		}

		// update the cameras
		for ( var i = 0; i < views.length; ++i ) {
			view = views[i];
			camera = view.camera;
			
			var left   = Math.floor( windowWidth  * view.left );
			var bottom = Math.floor( windowHeight * view.bottom );
			var width  = Math.floor( windowWidth  * view.width );
			var height = Math.floor( windowHeight * view.height ) + 1;
			
			renderer.setViewport( left, bottom, width, height );
			renderer.setScissor( left, bottom, width, height );
			renderer.enableScissorTest ( true );
			renderer.setClearColor( view.background );

			// keep the right ratio
			camera.aspect = width / height;
			camera.updateProjectionMatrix();

			//and finally render the scene slice
			renderer.render( scene, camera );
		}

		// render Callback
        requestAnimationFrame( GeometryEditor.render );
	},

	/**
	 * Keyboard listener which implements the shortcuts.
	 * 
	 * @param {keyEvent} event - the given event
	 * @return {boolean} returns false, if strg+s is supressed
	 */
	onKeyDown : function (event) {
		// disable keybindings on input focus
		if(!GeometryEditor.inputFocused)
			switch( event.keyCode ) {
				case 67: // c
					GeometryEditor.toggleColor();
					break;

				case 71: // g
					GeometryEditor.toggleGrid();
					GeometryEditor.debugLog(GeometryEditor.export());
					break;

				case 83: // s
					if(event.ctrlKey) {
						//open overlay and switch to save tab
						if(!GeometryEditor.overlayActive)
							$("a.save").trigger("click");

						$("input[name='sceneName']").trigger("focus");

						event.preventDefault();
						return false;
					}
					else {
						$("#shortcuts").toggle();
					}

					break;

				case 107: // + (numpad)
				case 187: // +
					GeometryEditor.addCam();
					break;

				case 109: // - (numpad)
				case 189: // - 
					GeometryEditor.removeCam();
					break;

				case 32: // space
					GeometryEditor.toggleOverlay();
					break;

				case 13: // enter
					break;
			}

		// keybindings, which are always active
		switch( event.keyCode ) {
			case 27: // esc
				if(GeometryEditor.overlayActive)
					GeometryEditor.toggleOverlay();
				// close overlay
				$("#editorClose").trigger("click");
				break;
		}
	},

	/**
	 * Logs the string on console, if debug mode is enabled.
	 * 
	 * @param {string} string - the given string to log
	 */
	debugLog : function (string) {
		// only log if debug is enabled
		if(GeometryEditor.debug)
			console.log(string);
	},

	/**
	 * Toggles the grid from visible to hidden and back.
	 */
	toggleGrid: function () {
		if(window.gridVisible) {
			// hide grid
			console.log("GeometryEditor | Hide grid!");
			window.gridVisible = false;
			grid.traverse( function ( object ) { object.visible = false; } );
		}
		else {
			// show grid
			console.log("GeometryEditor | Show grid!");
			window.gridVisible = true;
			grid.traverse( function ( object ) { object.visible = true; } );
		}
	},

	/**
	 * Toggles the color scheme from white to dark grey and reverse.
	 */
	toggleColor: function () {
		if(GeometryEditor.darkThemeActive) {
			GeometryEditor.darkThemeActive = false;
			// set grid color
			grid.traverse( function ( object ) { 
				object.material.color.setHex(0x303030);
			} );
			window.gridColor = 0x303030;
			// set bg color
			views[0].background = new THREE.Color().setRGB( 1, 1, 1);

			if(views[1])
				views[1].background = new THREE.Color().setRGB( 0.9, 0.9, 0.9);

			if(views[2])
				views[2].background = new THREE.Color().setRGB( 0.8, 0.8, 0.8);


			$("#shortcuts").css("color","#333");
		}
		else {
			GeometryEditor.darkThemeActive = true;
			// set grid color
			grid.traverse( function ( object ) { 
				object.material.color.setHex(0x666666);
			} );
			window.gridColor = 0x666666;
			// set bg color
			views[0].background = new THREE.Color().setRGB( 0.1, 0.1, 0.1);

			if(views[1])
				views[1].background = new THREE.Color().setRGB( 0.15, 0.15, 0.15);

			if(views[2])
				views[2].background = new THREE.Color().setRGB( 0.2, 0.2, 0.2);

			$("#shortcuts").css("color","#fff");
		}
		GeometryEditor.debugLog("GeometryEditor | BackgroundColor toggled!");
	},

	/**
	 * Displays and hides the overlay.
	 */
	toggleOverlay : function () {
		// mobile tipp:
		if(window.innerHeight > window.innerWidth && !GeometryEditor.overlayActive && window.innerWidth < 500){
		    alert("Please use Landscape mode to use this feature!");
		    return;
		}

		if(GeometryEditor.overlayActive) {
			GeometryEditor.overlayActive = false;

			// remove overlay
			$('#overlay').stop();
			$("#switch").stop();
			$('#overlay').animate({"top": "-" + (window.innerHeight+400) }, 1000, function () {
			$("#overlay form").not("#save").hide(); // hide all forms onoverlay
			});
			$("#switch").animate({"margin-top" : "-10px", "opacity" : 0.5}, 1000);

			controls.enabled = true; // enable controls
			GeometryEditor._temp_raycastingActive = true;
			GeometryEditor.debugLog("GeometryEditor | Remove Overlay.");					
		}
		else {
			GeometryEditor.overlayActive = true;

			// display overlay
			$('#overlay').stop();
			$("#switch").stop();
			$("#overlay").animate({"top": "0"}, 1000);
			$("#switch").clearQueue().animate({"margin-top" : "-60px"},1000);

			GeometryEditor.debugLog("GeometryEditor | Display Overlay.");
			controls.enabled = false; // disable orbit controls
			GeometryEditor.editorActive = false;

			// update scene information
			GeometryEditor.updateLayer();

			// disable raycasting
			GeometryEditor._temp_raycastingActive = false;
			if(GeometryEditor.pickerActive) {
				//remove pickerOverlay
				GeometryEditor.pickerActive = false;
				$("#pickerOverlay").remove();
			}
		}
	},

	/**
	 * Labels the axis in x,y and z direction.
	 *
	 * @param {float} start - the start value
	 * @param {float} stepSize -  self explaining
	 * @param {float} stop - the stop value
	 */
	labelAxis : function (start, stepSize, stop) {
		// all characteristics
		var characteristics = {
	        size: 0.3,
	        height: 0.01,
	        curveSegments: 6,
	        font: "helvetiker",
	        style: "normal"
	    };
	    var  color = new THREE.Color();
	    var  textMaterial;
	    var  textGeo;
	    var  text;
		
	    // label x axis:
	    color.setRGB(255, 0, 0);
	    textMaterial = new THREE.MeshBasicMaterial({ color: color });

	    for(var i = start; i <= stop; i = i+stepSize) {
	    	textGeo = new THREE.TextGeometry(i, characteristics);
			text = new THREE.Mesh(textGeo , textMaterial);
			text.rotation = camera.rotation;
			text.position.x = i;
			text.position.y = -0.5;
			scene.add(text);
			axis.push(text);
	    }

		// label z axis:
	    color.setRGB(0, 0, 255);
	    textMaterial = new THREE.MeshBasicMaterial({ color: color });

	    for(var i = start; i <= stop; i = i+stepSize) {
	    	textGeo = new THREE.TextGeometry(i, characteristics);
			text = new THREE.Mesh(textGeo , textMaterial);
			text.rotation = camera.rotation;
			text.position.z = i;
			text.position.x = -0.2;
			text.position.y = -0.5;
			scene.add(text);
			axis.push(text);
	    }

	    // label y axis:
	    color.setRGB(0, 255, 0);
	    textMaterial = new THREE.MeshBasicMaterial({ color: color });

	    for(var i = start; i <= stop; i = i+stepSize) {
	    	textGeo = new THREE.TextGeometry(i, characteristics);
			text = new THREE.Mesh(textGeo , textMaterial);
			text.rotation = camera.rotation;
			text.position.x = 0.2;
			text.position.y = i;
			scene.add(text);
			axis.push(text);
	    }

	    // example at http://stackoverflow.com/questions/19564051/labelling-the-vertices-in-axishelper-of-three-js
	},

	/**
	 * Clears the complete scene and holding arrays.
	 */
	clearScene : function() {
		// delete current scene
		scene.remove(sceneGeometry);
		GeometryEditor.raycastingCursor.reset();

		// restore object
		sceneGeometry = new THREE.Object3D();
		scene.add(sceneGeometry);
		sceneGeometry.needsUpdate = true;
		GeometryEditor.arrowArray = []; // and arrowArray


		// remove textlabels
		for (var i = 0; i < GeometryEditor.textLabelArray.length; i++) {
			scene.remove(GeometryEditor.textLabelArray[i]); 
		}
		GeometryEditor.textLabelArray = [];

		// clear lights?
		if(confirm("Clear lights also?")) {
			console.log("Lights cleared!");

			for (var i = GeometryEditor.lightsArray.length - 1; i >= 0; i--) {
				scene.remove(GeometryEditor.lightsArray[i]);
				GeometryEditor.lightsArray[i].intensity = 0;
			}
			GeometryEditor.lightsArray = [];
		}
	},

	/**
	 * Loads the settings for the 'Additional' tab into
	 * the GeometryEditor.settings array.
	 */
	loadSettings : function () {
		GeometryEditor.settings = {
			"labelScene" : {
				form : function () { return "<h4>Scene:</h4>"; }
			},
			"clearScene" : {
				form : function () {
					return "<a href='#' id='clearScene' settingLink>Clear Scene</a><br>";
				},
				evaluate : GeometryEditor.clearScene
			},
			"labelCamera" : {
				form : function () { return "<h4>Camera:</h4>"; }
			},
			"addCam" : {
				form : function () {
					return "<a href='#' class='addCam'>Add Camera</a>" +
						"	<form class='addCam'>" +
						"		<div class='vec3'><label>Origin (X,Y,Z):</label> " +
						"			<input type='number' value='20' name='originX'>" +
						"			<input type='number' value='20' name='originY'>" +
						"			<input type='number' value='20' name='originZ'></div>" +
						"		<div class='vec3'><label>Look At (X,Y,Z):</label> " +
						"			<input type='number' value='0' name='lookAtX'>" +
						"			<input type='number' value='0' name='lookAtY'>" +
						"			<input type='number' value='0' name='lookAtZ'></div>" +
						"		<label for='color'>Background Color:</label>" +
						"		<input type='color' name='color' value='#ffffff'>" +
						"		<input type='submit' value='Add Camera' />" +
						"	</form><br>";
				},
				evaluate : function (values) {

					// call the function
					GeometryEditor.addCam({
						background: new THREE.Color(parseColor(values.color)),
						eye: [ parseFloat( values.originX), 
							parseFloat( values.originY), 
							parseFloat( values.originZ) ],
						lookAt: [ parseFloat( values.lookAtX),
							parseFloat( values.lookAtY), 
							parseFloat( values.lookAtZ) ],
						fov: 30
					});
					
				}
			},
			"removeCam" : {
				form : function () {
					return "<a href='#' id='removeCam' settingLink>Remove last Camera</a><br>";
				},
				evaluate : GeometryEditor.removeCam
			},
			"labelLight" : {
				form : function () { return "<h4>Lights:</h4>"; }
			},
			"addPointLight" : {
				form : function () {
					return "<a href='#' class='addPointLight'>Add Pointlight</a>"+
						"	<form class='addPointLight'>"+
						"		<div class='vec3'><label>Origin (X,Y,Z):</label> "+
						"			<input type='number' value='20' name='originX'>"+
						"			<input type='number' value='20' name='originY'>"+
						"			<input type='number' value='20' name='originZ'></div>"+
						"		<div class='vec3'><label>Look At (X,Y,Z):</label> "+
						"			<input type='number' value='0' name='lookAtX'>"+
						"			<input type='number' value='0' name='lookAtY'>"+
						"			<input type='number' value='0' name='lookAtZ'></div>"+
						"		<label for='color'>Color:</label>"+
						"		<input type='color' name='color' value='#ffffff'>"+
						"		<input type='submit' value='Add pointlight' />"+
						"	</form><br>";
				},
				evaluate : function (values) {
					var pointLight = new THREE.PointLight(parseColor(values.color));
					pointLight.position.set(parseFloat( values.originX), 
							parseFloat( values.originY), 
							parseFloat( values.originZ));
					pointLight.lookAt(parseFloat( values.lookAtX), 
							parseFloat( values.lookAtY), 
							parseFloat( values.lookAtZ));
					scene.add(pointLight);
					pointLight.lightType = "PointLight";
					pointLight.lookAt = vec3(values.lookAtX,values.lookAtY,values.lookAtZ);
					GeometryEditor.lightsArray.push(pointLight);

					//update the existing geometries:
					sceneGeometry.children.forEach(function( currentObj ) {
						if(currentObj.material != undefined)
							currentObj.material.needsUpdate = true;
					});
					//sceneGeometry.needsUpdate = true;
					// add pointlight to the scene
					
					showMessage("Pointlight added!", true);
				}
			},
			"addDirectionalLight" : {
				form : function () {
					return "<a href='#' class='addDirectionalLight'>Add directional light</a>"+
						"	<form class='addDirectionalLight'>"+
						"		<div class='vec3'><label>Direction (X,Y,Z):</label> "+
						"			<input type='number' value='1' name='directionX'>"+
						"			<input type='number' value='1' name='directionY'>"+
						"			<input type='number' value='1' name='directionZ'></div>"+
						"		<label for='color'>Color:</label>"+
						"		<input type='color' name='color'  value='#ffffff'>"+//value='#DF7401'
						"		<input type='submit' value='Add directional light' />"+
						"	</form><br>";
				},
				evaluate : function (values) {
					var light = new THREE.DirectionalLight( parseColor(values.color));

					light.position.set( parseFloat( values.directionX), 
							parseFloat( values.directionY), 
							parseFloat( values.directionZ) );
					scene.add( light );

					//update the existing geometries:
					sceneGeometry.children.forEach(function( currentObj ) {
						if(currentObj.material != undefined)
							currentObj.material.needsUpdate = true;
					});

					light.lightType = "DirectionalLight";
					light.direction = light.position;
					GeometryEditor.lightsArray.push(light);

					showMessage("Directional light added!", true);
				}
			},
			"addAmbientLight" : {
				form : function () {
					return "<a href='#' class='addAmbientLight'>Add ambientlight</a>"+
						"	<form class='addAmbientLight'>"+
						"		<label for='color'>Color:</label>"+
						"		<input type='color' name='color' value='#ffffff'>"+
						"		<input type='submit' value='Add ambient light' />"+
						"	</form><br>";
				},
				evaluate : function (values) {
					var light = new THREE.AmbientLight( parseColor(values.color));
					scene.add( light );

					//update the existing geometries:
					sceneGeometry.children.forEach(function( currentObj ) {
						if(currentObj.material != undefined)
							currentObj.material.needsUpdate = true;
					});

					light.lightType = "AmbientLight";
					GeometryEditor.lightsArray.push(light);					
					showMessage("Ambient light added!", true);
				}
			},
			"labelEditor" : {
				form : function () { return "<h4>Editor:</h4>"; }
			},
			"toggleGrid" : {
				form : function () {
					return "<a href='#' id='toggleGrid' settingLink>Toggle grid</a><br>";
				},
				evaluate : GeometryEditor.toggleGrid
			},
			"toggleColor" : {
				form : function () {
					return "<a href='#' id='toggleColor' settingLink>Toggle grey/white</a><br>";
				},
				evaluate : GeometryEditor.toggleColor
			},
			"bgColor" : {
				form : function () {
					return "<a href='#' class='bgColor'>Change background</a>"+
						"	<form class='bgColor'>"+
						"		<label for='color'>Hex Color:</label>"+
						"		<input type='color' name='color' value='#ffffff'>"+
						"		<input type='submit' value='Change color' />"+
						"	</form><br>";
				},
				evaluate : function (values) {
					// get the chosen color
					var bgColor = parseColor(values.color);

					// setup the background color according to the lumincane
					var luminance = calcLuminance(bgColor);
					if(luminance > 0.4)
						$("#shortcuts").css("color","#333");
					else
						$("#shortcuts").css("color","#aaa");

					//finally set the bg color of the canvas
					views[0].background = new THREE.Color(bgColor);
				}
			},
			"gridColor" : {
				form : function () {
					return "<a href='#' class='gridColor'>Change Grid Color</a>"+
						"	<form class='gridColor'>"+
						"		<label for='color'>Hex Color:</label>"+
						"		<input type='color' name='color'  value='#333333'>"+
						"		<input type='submit' value='Change color' />"+
						"	</form><br>";
				},
				evaluate : function (values) {
					// get the chosen color
					var bgColor = parseColor(values.color);

					grid.traverse( function ( object ) { 
						object.material.color.setHex(bgColor);
					});
					window.gridColor = bgColor;

			    	// show success
			    	showMessage("Grid color changed!", true);
				}
			}
		};
	},

	/**
	 * Updates the <ul> in the 'Scene' tab with information
	 * about the current light, arrows and text boxes.
	 * 
	 * @return {string} the final replacement data
	 */
	updateLayer : function () {
		// put together html output:
		var result = "";

		// lights
		for (var i = GeometryEditor.lightsArray.length - 1; i >= 0; i--) {
			var current = GeometryEditor.lightsArray[i];
			result += "<li><span class='color' style='background:"+"#"+current.color.getHex().toString(16)+"'>&nbsp;</span> "+current.lightType+" <a class='delete' type='light' no='"+i+"'>X</a></li>";
		}

		// arrows
		for (var i = GeometryEditor.arrowArray.length - 1; i >= 0; i--) {
			var current = GeometryEditor.arrowArray[i];
			result += "<li><span class='color' style='background:"+"#"+(current.line.material.color.getHex()).toString(16)+"'>&nbsp;</span> Arrow "+(i+1)+" <a class='delete' type='arrow' no='"+i+"'>X</a></li>";
			//console.log(current.line.material.color.getHex());
		}

		// textlabels
		for (var i = GeometryEditor.textLabelArray.length - 1; i >= 0; i--) {
			var current = GeometryEditor.textLabelArray[i];
			result += "<li><span class='color' style='background:"+"#"+(current.material.color.getHex()).toString(16)+"'>&nbsp;</span> Text: '"+current.text.substr(0,10)+"...' <a class='delete' type='text' no='"+i+"'>X</a></li>";
		}

		if(result != "") {
			$("ul.scene").html(result);

			$(".delete").click(function(e) {
				e.preventDefault();

				switch($(this).attr("type")) {
				    case "light":
				    	// delete light
				    	var no = $(this).attr("no");
				    	var current = GeometryEditor.lightsArray[no];
				    	current.intensity = 0;
				    	scene.remove(current);

				    	GeometryEditor.lightsArray.splice(no,1);
				        break;
				    case "arrow":
				    	//delete arrow
				    	var no = $(this).attr("no");
				    	var current = GeometryEditor.arrowArray[no];
				    	sceneGeometry.remove(current);

				    	GeometryEditor.arrowArray.splice(no,1);
				    	break;
				    case "text":
				    	// delete text
				    	var no = $(this).attr("no");
				    	var current = GeometryEditor.textLabelArray[no];
				    	scene.remove(current);

				    	GeometryEditor.textLabelArray.splice(no,1);
				    	break;
				}

				GeometryEditor.updateLayer();
			});
		}
		else {
			$("ul.scene").html("<li>No Elements to display here!</li>");
		}
		

		return result;
	},

	/**
	 * Exports a whole GeometryEditor scene in parametric style.
	 *
	 * @return {string} the stringified json object for mysql saving
	 */
	export : function () {
		// init the returned object
		var result = {};

		// add lights
		result.lights = [];
		for (var i = GeometryEditor.lightsArray.length - 1; i >= 0; i--) {
			var current = GeometryEditor.lightsArray[i];
			var _color = current.color.getHex();
			var newLight = {lightType : current.lightType, color:_color};

			// type: current.lightType
			switch(current.lightType) {
				case "DirectionalLight":
					newLight.direction = current.direction;
					break;
				case "PointLight":
					newLight.lookAt = current.lookAt;
					newLight.position = current.position;
					break;
				case "AmbientLight":
					// only need color
					break;
			}
			result.lights.push(newLight);
		}

		// add sceneGeometry
		result.geometry = [];

		// iterate trough objects
		sceneGeometry.children.forEach(function( currentObj ) {
			result.geometry.push(
				GeometryEditor.geometry[currentObj.objectType].export(currentObj)
			);
			//console.log("export"+currentObj.objectType);
		});

		// add text labels
		result._text = [];
		for (var i = GeometryEditor.textLabelArray.length - 1; i >= 0; i--) {
			result._text.push(GeometryEditor.geometry["Text"].export(GeometryEditor.textLabelArray[i]));
		};

		// add current settings
		result.settings = {};
			// cams -> bg
			// no need, because of grid and bg color
			result.settings.views = [];
			for (var i =  0; i < views.length; i++ ) {
				var view = views[i];
				var current = {};
				current.left = view.left;
				current.bottom = view.bottom;
				current.width = view.width;
				current.height = view.height;
				current.background = view.background.getHex();
				current.eye = view.eye;
				current.lookAt = view.lookAt;
				current.fov = view.fov;

				result.settings.views.push(current);
			}
			// grid on/off
			result.settings.gridColor = window.gridColor;
			result.settings.gridVisible = window.gridVisible;
			result.settings.darkThemeActive = GeometryEditor.darkThemeActive;

		// finally return the string
		return JSON.stringify(result);
	},

	/**
	 * Imports a given data string to an intern attribute:
	 * (GeometryEditor.importData).
	 *
	 * @param {string} the stringified json object from mysql database
	 */
	import : function ( data ) {
		// parse the data
		GeometryEditor.importData = JSON.parse(data);
		// and save it temporarily
		GeometryEditor.isLoadedScene = true;
	}
};


/******* ADDITIONAL (helper) FUNCTIONS *******/

/**
 * Displays a message as small popup, which fades out.
 *
 * @param {string} string - the string to display
 * @param {boolean} success - shows, wheter it's a success or error message
 */
function showMessage(string, success) {
	// check wheter task was successful or not
	if(success) {
		message = $("<p class='success' />");
		GeometryEditor.debugLog("Popup | Success: " + string);
	}
	else {
		message = $("<p class='error' />");
		GeometryEditor.debugLog("Popup | Error: " + string);
	}

	// put the message in it and append it to body
	message.html(string);
	$("body").append(message);
	
	// animate the message box
	message.hide()
		.fadeIn(1000)
		.delay(2000)
		.fadeOut(1000, function(){
			message.remove();
		});
	
}

/**
 * Calculates the luminance of a given colorcode.
 *
 * @param {color} _color - the given color
 * @return {float} the luminance
 */
function calcLuminance(_color) {
	// calc the lumincance
	var r = (_color & 0xff0000) >> 16;
	var g = (_color & 0xff00) >> 8;
	var b = (_color & 0xff);
	return (r*0.299 + g*0.587 + b*0.114) / 256;
}

/**
 * Calculates the three.js color code
 *
 * @param {hexColor} hex - the given color (#ff66ff)
 * @return {colorCode} the colorcode
 */
function parseColor(hex) {
	return parseInt("0x"+(hex.substring(1)));
}

/**
 * Draws an axis arrow - Helperfunction
 *
 * @param {THREE.Vector3} origin - the source
 * @param {THREE.Vector3} dir - the direction
 * @param {float} length - the arrow length
 * @param {colorCode} _color - the arrow color
 */
function drawAxisArrow (origin, dir, length, _color) {
	var arrowHelper = new THREE.ArrowHelper( dir, origin, length, _color, 0.5, 0.3 );
	scene.add( arrowHelper );
}

/**
 * The mousedown slider - if click ended.
 *
 * @param {mouseEvent} e - the mouse event
 */
function fieldUp(e) {
	$(window).unbind('mousemove', mouseMove);
	$(window).unbind('mouseup', fieldUp);
	$("body").css("cursor","auto");
	currentItem.select();
}

/**
 * The mousedown slider - if mouse is moved.
 *
 * @param {mouseEvent} e - the mouse event
 */
function mouseMove(e) {
	var o = (e.pageX - startx)/4;

	var newVal = ~~currentVal + o;
	var name = currentItem.attr("name");
	if( name != "originX" && name != "originY" && name != "originZ" &&
		name != "directionX" && name != "directionY" && name != "directionZ" &&
		name != "rotationX" && name != "rotationY" && name != "rotationZ" &&
		name != "xStart" && name != "xEnd" && name != "yStart" && name != "yEnd" &&
		newVal <= 0.25)
		newVal = 0.25;

	if( name == "opacity") {
		newVal /= 4;
		newVal = newVal.toFixed(2);

		if(newVal > 1) 
			newVal = 1;
		if(newVal < 0.1)
			newVal = 0.1
	} 
	currentItem.attr("value", newVal);
	currentItem.trigger("change");
}

/**
 * If a close button is clicked, or a close
 * task is forced.
 *
 * @param {mouseEvent} e - the mouse event
 */
function close (e) {
	if(e != undefined)
		e.preventDefault();

	$("canvas").css("cursor", "move");

	GeometryEditor.editorActive = false;
	GeometryEditor.raycastReset();
	controls.enabled = true; // enable controls
	GeometryEditor.inputFocused = false;
}

/**
 * A simpler way to create Vectors.
 *
 * @param {float} x
 * @param {float} y
 * @param {float} z
 *
 * @return {THREE.Vector3} the new vector object.
 */
function vec3(x,y,z) {
	return new THREE.Vector3(x, y, z);
}