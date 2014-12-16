/** excluded settings loading function */
function loadGeometry() {
	GeometryEditor.geometry = {

		/** Line geometry 
		 * draws a line in form of y = mx + c 
		 */
		"Line" : {
			draw : function (m,c, _color) {
				var lineThickness = 0.05;
				var length = 50;
				var geometry = new THREE.CylinderGeometry( lineThickness, lineThickness, length, 32 );
				var material = new THREE.MeshBasicMaterial( {color: _color} );
				
				// shift it so one end rests on the origin
  				// rotate it the right way for lookAt to work
				geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(90)));
				
				// create mesh
				var line = new THREE.Mesh( geometry, material );

				// Position it
				line.position.x = c.x;
				line.position.y = c.y;
				line.position.z = c.z;

				// And make it point to where we want
				line.lookAt(new THREE.Vector3().addVectors(m,c));

				line.primalColor = _color; // remember color
				line.objectType = "Line"; // and type
				line.direction = m; // save orientation

  				sceneGeometry.add( line );
			},
			redraw : function(values, line) {
				var c = vec3( parseFloat( values.originX), 
							parseFloat( values.originY), 
							parseFloat( values.originZ)), 
					m = vec3( parseFloat( values.directionX), 
							parseFloat( values.directionY), 
							parseFloat( values.directionZ)), 
					_color = parseColor(values.color);

				// Position it
				line.position = c;
				// And make it point to where we want
				line.lookAt(new THREE.Vector3().addVectors(m,c));

				line.primalColor = _color; // remember color
				line.material.color = new THREE.Color( _color );
				line.direction = m; // save orientation
			},
			form : function () {
				return "<a href='#' class='Line'>Add Line</a> "+
					"<form class='Line'>"+
					"   <span class='description'>Insert a line by line equation:<br> y = mx + c | m = direction, c = position</span><br>"+
					"	<div class='vec3'><label>Origin c (X,Y,Z):</label> "+
					"	<input type='number' value='0' name='originX'>"+
					"	<input type='number' value='0' name='originY'>"+
					"	<input type='number' value='0' name='originZ'></div>"+
					"	<div class='vec3'><label>Direction m (X,Y,Z):</label> "+
					"	<input type='number' value='1' name='directionX'>"+
					"	<input type='number' value='1' name='directionY'>"+
					"	<input type='number' value='1' name='directionZ'></div>"+
					"	<label for='color'>Hex Color:</label>"+
					"	<input type='color' name='color' value='#DF7401'><br>"+
					"	<input type='submit' value='Add to scene' />"+
					"</form><br>";
			},
			evaluate : function (values) {
				//call function
				this.draw(vec3( 	parseFloat( values.directionX), 
							parseFloat( values.directionY), 
							parseFloat( values.directionZ) ),
						vec3( parseFloat( values.originX), 
							parseFloat( values.originY), 
							parseFloat( values.originZ)), 
						parseColor(values.color), 16);

		    	// show success
		    	showMessage("Line successfully added!", true);
			},
			export : function (object) {
				var result = {};
				result.objectType = object.objectType;
				result.primalColor = object.primalColor;
				result.direction = object.direction;
				result.position = object.position;

				return result;
			},
			import : function (object) {
				this.draw( vec3(object.direction.x,object.direction.y,object.direction.z), 
					vec3(object.position.x,object.position.y,object.position.z),
					object.primalColor);
			}
		},

		/** Plane geometry 
		 * draw plane in normal form: p as V3 position and n as V3 normal
		 */
		"Plane" : {
			draw : function (p, n, _color, _opacity, planeWidth) {
				if(!planeWidth)
					var planeWidth = 30;

				var material = new THREE.MeshPhongMaterial( { 	color: _color,  //MeshPhongMaterial MeshBasicMaterial
															transparent: true,
															opacity : _opacity,
															side : THREE.DoubleSide, // so its visible from both sides
															ambient: 0x666666} );
				var plane = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeWidth), material);

				// set the plane position
				plane.position = p;

				// rotate the plane in the right direction
				plane.lookAt((n.clone()).add(p));
				plane.primalColor = _color; // remember color
				plane.objectType = "Plane"; // and type
				plane.direction = n; // save orientation
				plane.planeWidth = planeWidth;

				sceneGeometry.add( plane ); // and add to scene
			},
			redraw : function(values, plane) {
				var p = vec3( parseFloat( values.originX), 
							parseFloat( values.originY), 
							parseFloat( values.originZ)), 
					n = vec3( parseFloat( values.directionX), 
							parseFloat( values.directionY), 
							parseFloat( values.directionZ)), 
					_color = parseColor(values.color),
					_opacity = parseFloat( values.opacity);

				// set the opacity
				plane.material.opacity = _opacity;

				// Position it where we want
				plane.position = p;

				// rotate the plane in the right direction
				plane.lookAt((n.clone()).add(p));
				plane.primalColor = _color; // remember color
				plane.material.color = new THREE.Color( _color );
				plane.direction = n; // save orientation
			},
			form : function () {
				return "<a href='#' class='Plane'>Add Plane</a> "+
					"<form class='Plane'>"+
					"   <span class='description'>Insert a plane by normal form:<br> p = position to plan, n = plane normal</span><br>"+
					"	<div class='vec3'><label>Origin p (X,Y,Z):</label> "+
					"	<input type='number' value='0' name='originX'>"+
					"	<input type='number' value='0' name='originY'>"+
					"	<input type='number' value='0' name='originZ'></div>"+
					"	<div class='vec3'><label>Orientation n (X,Y,Z):</label> "+
					"	<input type='number' value='1' name='directionX'>"+
					"	<input type='number' value='1' name='directionY'>"+
					"	<input type='number' value='1' name='directionZ'></div>"+
					"	<label for='color'>Hex Color:</label>"+
					"	<input type='color' name='color' value='#DF7401'><br>"+
					"	<label for='opacity'>Opacity:</label>"+
					"	<input type='number' name='opacity' value='1'><br>"+
					"	<label for='planeWidth'>Plane Width:</label>"+
					"	<input type='number' name='planeWidth' value='20'><br>"+
					"	<input type='submit' value='Add to scene' />"+
					"</form><br>";
			},
			evaluate : function (values) {
				//call function
				this.draw(vec3( parseFloat( values.originX), 
								parseFloat( values.originY), 
								parseFloat( values.originZ)), 
					vec3( 	parseFloat( values.directionX), 
							parseFloat( values.directionY), 
							parseFloat( values.directionZ) ), 
					parseColor(values.color),
					parseFloat(values.opacity),
					parseFloat(values.planeWidth));

		    	// show success
		    	showMessage("Plane successfully added!", true);
			},
			export : function (object) {
				var result = {};
				result.objectType = object.objectType;
				result.primalColor = object.primalColor;
				result.direction = object.direction;
				result.position = object.position;
				result.opacity = object.material.opacity;
				result.planeWidth = object.planeWidth;

				return result;
			},
			import : function (object) {
				this.draw(vec3(object.position.x,object.position.y,object.position.z),
					vec3(object.direction.x,object.direction.y,object.direction.z), 
					object.primalColor, object.opacity, object.planeWidth);
			}
		},

		/** Arrow geometry 
		 * draw an arrow from origin to target
		 */
		"Arrow" : {
			draw : function (origin, target, _color) {
				var dir = (target.clone()).sub(origin);
				var length = dir.length();
				var arrowHelper = new THREE.ArrowHelper( dir.normalize(), origin, length, _color, 0.5, 0.3 );
				
				arrowHelper.primalColor = _color; // remember color
				arrowHelper.objectType = "Arrow"; // and type
				arrowHelper.direction = target; // save orientation
				sceneGeometry.add( arrowHelper ); // and add to scene
				GeometryEditor.arrowArray.push(arrowHelper);
				return arrowHelper;
			},
			form : function () {
				return "<a href='#' class='Arrow'>Add Arrow</a> "+
					"<form class='Arrow'>"+
					"   <span class='description'>Insert a arrow. It's showing from origin to target an<br> can be removed in the 'Scene' menu.</span><br>"+
					"	<div class='vec3'><label>Origin (X,Y,Z):</label> "+
					"	<input type='number' value='0' name='originX'>"+
					"	<input type='number' value='0' name='originY'>"+
					"	<input type='number' value='0' name='originZ'></div>"+
					"	<div class='vec3'><label>Direction (X,Y,Z):</label> "+
					"	<input type='number' value='1' name='targetX'>"+
					"	<input type='number' value='1' name='targetY'>"+
					"	<input type='number' value='1' name='targetZ'></div>"+
					"	<label for='color'>Hex Color:</label>"+
					"	<input type='color' name='color' value='#DF7401'><br>"+
					"	<input type='submit' value='Add to scene' />"+
					"</form><br>";
			},
			evaluate : function (values) {
				//call function
				this.draw(vec3( parseFloat( values.originX), 
								parseFloat( values.originY), 
								parseFloat( values.originZ)), 
					vec3( 	parseFloat( values.targetX), 
							parseFloat( values.targetY), 
							parseFloat( values.targetZ) ), 
					parseColor(values.color), 16);

		    	// show success
		    	showMessage("Arrow successfully added!", true);
			},
			export : function (object) {
				var result = {};
				result.objectType = object.objectType;
				result.primalColor = object.primalColor;
				result.direction = object.direction;
				result.position = object.position;

				return result;
			},
			import : function (object) {
				this.draw(vec3(object.position.x,object.position.y,object.position.z),
					vec3(object.direction.x,object.direction.y,object.direction.z), 
					object.primalColor);
			}
		},


		/** Sphere geometry 
		 * draw sphere with a v3 origin, a radius and the given color
		 */
		"Sphere" : {
			draw : function (origin, radius, _color, _opacity) {
				var geometry = new THREE.SphereGeometry( radius, 30, 30);
				var material = new THREE.MeshLambertMaterial( {	ambient: _color, 
																color: _color, 
																specular: 0xFFFFFF, 
																shininess: 10, 
																shading: THREE.SmoothShading, 
																transparent: true,
																opacity: _opacity} );
				var sphere = new THREE.Mesh( geometry, material );
				
				sphere.position = origin;
				sphere.primalColor = _color; // remember color
				sphere.objectType = "Sphere"; // and type
				sphere.radius = radius; // save last radius

				sceneGeometry.add( sphere ); // and add to scene

				return sphere;
			},
			redraw : function(values, sphere) {
				var origin = vec3( parseFloat( values.originX), 
							parseFloat( values.originY), 
							parseFloat( values.originZ)),
					radius = parseFloat( values.radius),
					_color = parseColor(values.color),
					_opacity = parseFloat( values.opacity);

				// set the opacity
				sphere.material.opacity = _opacity;

				// Position it where we want
				sphere.position = origin;

				sphere.primalColor = _color; // remember color
				sphere.material.color = new THREE.Color( _color );
				var scale = radius/sphere.radius;

				sphere.scale.x *= scale;
				sphere.scale.y *= scale;
				sphere.scale.z *= scale;

				sphere.geometry.radius = radius;
				sphere.radius = radius; // save radius
			},
			form : function () {
				return "<a href='#' class='Sphere'>Add Sphere</a> "+
					"<form class='Sphere'>"+
					"   <span class='description'>Insert a sphere. You can specify the position,<br> radius, color and opacity.</span><br>"+
					"	<div class='vec3'><label>Origin (X,Y,Z):</label> "+
					"	<input type='number' value='0' name='originX'>"+
					"	<input type='number' value='0' name='originY'>"+
					"	<input type='number' value='0' name='originZ'></div>"+
					"	<label for='radius'>Radius:</label>"+
					"	<input type='number' value='1' name='radius'><br>"+
					"	<label for='color'>Hex Color:</label>"+
					"	<input type='color' name='color' value='#DF7401'><br>"+
					"	<label for='opacity'>Opacity:</label>"+
					"	<input type='number' name='opacity' value='1'><br>"+
					"	<input type='submit' value='Add to scene' />"+
					"</form><br>";
			},
			evaluate : function (values) {
				//call function
				this.draw(vec3( parseFloat( values.originX), 
								parseFloat( values.originY), 
								parseFloat( values.originZ)), 
					parseFloat( values.radius), 
					parseColor(values.color),
					parseFloat(values.opacity));

		    	// show success
		    	showMessage("Sphere successfully added!", true);
			},
			export : function (object) {
				var result = {};

				result.objectType = object.objectType;
				result.primalColor = object.primalColor;
				result.position = object.position;
				result.radius = object.radius;
				result.opacity = object.material.opacity;

				return result;
			},
			import : function (object) {
				this.draw(vec3(object.position.x,object.position.y,object.position.z),
					object.radius, object.primalColor, object.opacity);
			}
		},

		/** Text label
		 * draw a text label, facing the camera
		 */
		"Text" : {
			draw : function (_position, _text, _size, autoFacing, _color) {
				if(_size === 0)
					_size = 1;

				if(_text == "")
					_text = "Sample text";

				// all characteristics
				var characteristics = {
			        size: _size,
			        height: 0.01,
			        curveSegments: 6,
			        font: "helvetiker",
			        style: "normal"
			    };
			    var  textMaterial = new THREE.MeshBasicMaterial({ color: _color });
			    var  textGeo = new THREE.TextGeometry(_text, characteristics);
			    var  text = new THREE.Mesh(textGeo , textMaterial);

			    text.position = _position;
			    scene.add(text);
			    text.objectType = "Text"; // and type
			    text.primalColor = _color;
			    text.text = _text;
			    text.size = _size;

			    text.autoFacing = autoFacing;
		    	GeometryEditor.textLabelArray.push(text);
		
				return text;
			},
			form : function () {
				return "<a href='#' class='Text'>Add Text Label</a> "+
					"<form class='Text'>"+
					"   <span class='description'>Insert a text label. It can't be modified, but you<br> can delete it in the 'Scene' menu.</span><br>"+
					"	<div class='vec3'><label>Origin (X,Y,Z):</label> "+
					"	<input type='number' value='0' name='originX'>"+
					"	<input type='number' value='0' name='originY'>"+
					"	<input type='number' value='0' name='originZ'></div>"+
					"	<label for='size'>Size:</label>"+
					"	<input type='number' value='1' name='size'>"+
					"	<label for='facing'>Facing Camera?:</label>"+
					"	<input type='checkbox' name='facing' value='yes'><br>"+
					"	<label for='color'>Hex Color:</label>"+
					"	<input type='color' name='color' value='#DF7401'><br>"+
					"	<label for='_text'>The Text:</label>"+
					"	<input type='text' name='_text'><br>"+
					"	<input type='submit' value='Add to scene' />"+
					"</form><br>";
			},
			evaluate : function (values) {
				//call function
				this.draw(vec3( parseFloat( values.originX), 
								parseFloat( values.originY), 
								parseFloat( values.originZ)), 
					values._text,
					parseFloat( values.size),
					(values.facing == "yes"),
					parseColor(values.color), 16);

		    	// show success
		    	showMessage("TextLabel successfully added!", true);
			},
			export : function (object) {
				var result = {};

				result.objectType = object.objectType;
				result.primalColor = object.primalColor;
				result.position = object.position;
				result.text = object.text;
				result.size = object.size;
				result.autoFacing = object.autoFacing;

				return result;
			},
			import : function (object) { 
				this.draw(vec3(object.position.x,object.position.y,object.position.z),
					object.text, object.size, object.autoFacing, object.primalColor);
			}
		},

		/** Box
		 *  draw plane in normal form: p as V3 position and n as V3 normal
		 */
		"Box" : {
			draw : function  (origin, _width, _height, _depth, rotation, _color, _opacity) {
				//THREE.BoxGeometry = function ( width, height, depth, widthSegments, heightSegments, depthSegments ) {

				var geometry = new THREE.BoxGeometry(_width, _height, _depth);

				var material = new THREE.MeshLambertMaterial( { ambient: 0x030303, 
					color: _color, 
					specular: 0xFFFFFF, 
					shininess: 30, 
					shading: THREE.SmoothShading, 
					transparent: true,
					opacity : _opacity } );
				var cube = new THREE.Mesh( geometry, material );

				cube.position.x = origin.x;
				cube.position.y = origin.y;
				cube.position.z = origin.z;

				cube.rotation.x = (rotation.x * Math.PI) /180;
				cube.rotation.y = (rotation.y * Math.PI) /180;
				cube.rotation.z = (rotation.z * Math.PI) /180;

				cube.primalColor = _color; // remember color
				cube.objectType = "Box"; // and type
				cube.box = new Object();
				cube.box.width = _width;
				cube.box.height = _height;
				cube.box.depth = _depth;

				sceneGeometry.add( cube ); // and add to scene

				return cube;
			},
			redraw : function(values, cube) {
				var origin = vec3( parseFloat( values.originX), 
							parseFloat( values.originY), 
							parseFloat( values.originZ)),
					rotation = vec3( parseFloat( values.rotationX), 
							parseFloat( values.rotationY), 
							parseFloat( values.rotationZ)),
					_width = parseFloat( values.width),
					_height = parseFloat( values.height),
					_depth = parseFloat( values.depth),
					_color = parseColor(values.color),
					_opacity = parseFloat( values.opacity);

				// Position it where we want
				cube.position = origin;
				cube.rotation.x = (rotation.x * Math.PI) /180;
				cube.rotation.y = (rotation.y * Math.PI) /180;
				cube.rotation.z = (rotation.z * Math.PI) /180;
				
				cube.material.opacity = _opacity;
				cube.primalColor = _color; // remember color
				cube.material.color = new THREE.Color( _color );

				cube.scale.x *= _width/cube.box.width;
				cube.scale.y *= _height/cube.box.height;
				cube.scale.z *= _depth/cube.box.depth;

				// find better way to prevent zero bug
				if(cube.scale.x === 0)
					cube.scale.x = 0.1;
				if(cube.scale.y === 0)
					cube.scale.y = 0.1;
				if(cube.scale.z === 0)
					cube.scale.z = 0.1;


				cube.box.width = _width;
				cube.box.height = _height;
				cube.box.depth = _depth;
			},
			form : function () {
				return "<a href='#' class='Box'>Add Box</a> "+
					"<form class='Box'>"+
					"   <span class='description'>Insert a box. The center of the box is the origin and<br> the size expands in both sides.</span><br>"+
					"	<div class='vec3'><label>Origin (X,Y,Z):</label> "+
					"	<input type='number' value='0' name='originX'>"+
					"	<input type='number' value='0' name='originY'>"+
					"	<input type='number' value='0' name='originZ'></div>"+
					"	<div class='vec3'><label>Width/Height<br>/Depth:</label> "+
					"	<input type='number' value='1' name='width'>"+
					"	<input type='number' value='1' name='height'>"+
					"	<input type='number' value='1' name='depth'></div>"+
					"	<div class='vec3'><label>Rotation (Degree):</label> "+
					"	<input type='number' value='0' name='rotationX'>"+
					"	<input type='number' value='0' name='rotationY'>"+
					"	<input type='number' value='0' name='rotationZ'></div>"+
					"	<label for='color'>Hex Color:</label>"+
					"	<input type='color' name='color' value='#DF7401'><br>"+
					"	<label for='opacity'>Opacity:</label>"+
					"	<input type='number' name='opacity' value='1'><br>"+
					"	<input type='submit' value='Add to scene' />"+
					"</form><br>";
			},
			evaluate : function (values) {
				//call function
				this.draw(vec3( parseFloat( values.originX), 
										parseFloat( values.originY), 
										parseFloat( values.originZ)), 
							parseFloat( values.width), 
							parseFloat( values.height), 
							parseFloat( values.depth),
							vec3( parseFloat( values.rotationX), 
										parseFloat( values.rotationY), 
										parseFloat( values.rotationZ)),
							parseColor(values.color),
							parseFloat(values.opacity));

		    	// show success
		    	showMessage("Box successfully added!", true);
			},
			export : function (object) {
				var result = {};

				result.objectType = object.objectType;
				result.primalColor = object.primalColor;
				result.position = object.position;
				result.opacity = object.material.opacity;

				// calc the box size out of primalSize and scale
				result.width = object.box.width;
				result.height = object.box.height;
				result.depth = object.box.depth;

				result.rotation = vec3(object.rotation.x *180 / Math.PI,
				 object.rotation.y *180 / Math.PI, 
				 object.rotation.z *180 / Math.PI);

				return result;
			},
			import : function (object) { 
				this.draw(vec3(object.position.x,object.position.y,object.position.z),
					object.width, object.height, object.depth, object.rotation, object.primalColor, object.opacity);
			}
		},

		/** Plot
		 *  plots a function string in specific range
		 */
		"Plot" : {
			draw : function  (term, xStart, xEnd, yStart, yEnd, _opacity, step) {
				// steps in x and y direction from -20 to 20
				if(!step)
					var step = 2.0;

				//console.log(xEnd + "" + xStart + "" + yEnd + "" + yStart);
				var width = Math.abs(-xStart+xEnd),
					height = Math.abs(-yStart+yEnd);

				var stepsX = width*step,
					stepsY = height*step;

				var posX = (xStart+xEnd)/2;
				var posZ = (yStart+yEnd)/2;

				//console.log("steps:"+ stepsX + ", " + stepsY +"| width = " + width + ", height:" + height);

				// add a plane and morph it to a function
				var geometry = new THREE.PlaneGeometry( width, height, stepsX - 1, stepsY - 1 );
				geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
				
				var	size = stepsX * (stepsY), 
					data = new Float32Array( size );

				var count = 0;
				var scope = {};

				mesh = new THREE.Mesh( geometry, new THREE.MeshNormalMaterial( { 
					side : THREE.DoubleSide,
					transparent: true,
					shading: THREE.SmoothShading,
					opacity : _opacity }));


				mesh.updateMatrixWorld();

				// calc y value for every vertice
				for ( var i = 0; i < size; i ++ ) {
					// calculate the current values
					// http://stackoverflow.com/questions/11495089/how-to-get-the-absolute-position-of-a-vertex-in-three-js
					var vector = mesh.geometry.vertices[i].clone();
					vector.applyMatrix4( 
						mesh.matrixWorld
						);

					// set them into the scope
					scope.x = vector.x + posX;
					scope.y = vector.z + posZ;

					// calculate point and write it in a temp array
					data[i] = math.eval(term, scope);
				}

				// push the new vertice data
				for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {
					geometry.vertices[ i ].y = data[ i ];
				}

				GeometryEditor.debugLog("GeometryEditor | Plot | Calculated "+ size + " Points (" + term + ").");

				// update the new normals
				geometry.computeFaceNormals();
				geometry.computeVertexNormals();


				//mesh.primalColor = _color; // and type
				mesh.objectType = "Plot"; // and type
				mesh.plot = term;
				mesh.area = {
					xStart : xStart,
					xEnd : xEnd,
					yStart : yStart,
					yEnd : yEnd
				};
				mesh.steps = step;

				mesh.position = vec3(posX, 0, posZ);

				sceneGeometry.add( mesh );
				return mesh;
			},
			redraw : function(values, mesh) {
				// TODO: only translation!
				var origin = vec3( parseFloat( values.originX), 
							parseFloat( values.originY), 
							parseFloat( values.originZ)),
					rotation = vec3( parseFloat( values.rotationX).toFixed(2), 
							parseFloat( values.rotationY).toFixed(2), 
							parseFloat( values.rotationZ).toFixed(2)),
					_opacity = parseFloat( values.opacity);

				// Position it where we want
				mesh.position = origin;
				mesh.rotation.x = (rotation.x * Math.PI) /180;
				mesh.rotation.y = (rotation.y * Math.PI) /180;
				mesh.rotation.z = (rotation.z * Math.PI) /180;
				
				mesh.material.opacity = _opacity;

			},
			form : function () {
				return "<a href='#' class='Plot'>Plot a function</a> "+
					"<form class='Plot'>"+
					"   <span class='description'>Insert a term with x and y as variables. Be careful when changing<br> the step size. It's defined as steps per grid field.</span><br>"+
					"	<label for='term'>Term f(x,y):</label>"+
					"	<input type='text' name='term' value='0.01 * sin(x) * (x^2) - y/4'> <a href='http://mathjs.org/docs/reference/functions/categorical.html' target='_blank' class='helpLabel'>?</a> <br><br>"+
					//"	<label for='color'>Hex Color:</label>"+
					//"	<input type='color' name='color'><br>"+
					"	<label>X start/end (Integer):</label>"+
					"	<input type='number' name='xStart' value='-20'>"+
					"	<input type='number' name='xEnd' value='20'><br>"+
					"	<label>Y start/end (Integer):</label>"+
					"	<input type='number' name='yStart' value='-20'>"+
					"	<input type='number' name='yEnd' value='20'><br>"+
					"	<label for='opacity'>Opacity:</label>"+
					"	<input type='number' name='opacity' value='0.8'><br>"+
					"	<label for='steps'>Steps per field:</label>"+
					"	<input type='number' name='steps' value='2'><br>"+
					"	<input type='submit' value='Add to scene' />"+
					"</form><br>";
			},
			inlineForm : function () {
				return "<a href='#' class='Plot'>Plot a function</a> "+
					"<form class='Plot'>"+
					"	<div class='vec3'><label>Origin (X,Y,Z):</label> "+
					"	<input type='number' value='0' name='originX'>"+
					"	<input type='number' value='0' name='originY'>"+
					"	<input type='number' value='0' name='originZ'></div>"+
					"	<div class='vec3'><label>Rotation (Degree):</label> "+
					"	<input type='number' value='0' name='rotationX'>"+
					"	<input type='number' value='0' name='rotationY'>"+
					"	<input type='number' value='0' name='rotationZ'></div>"+
					"	<label for='opacity'>Opacity:</label>"+
					"	<input type='number' name='opacity' value='0.8'><br>"+
					"	<input type='submit' value='Add to scene' />"+
					"</form><br>";
			},
			evaluate : function (values) {
				//call function
				this.draw( values.term, parseFloat(values.xStart), parseFloat(values.xEnd), parseFloat(values.yStart), parseFloat(values.yEnd), parseFloat(values.opacity), parseInt(values.steps)); //parseColor(values.color)
		    	// show success
		    	showMessage("Plot successfully added!", true);
			},
			export : function (object) {
				var result = {};

				result.objectType = object.objectType;
				result.opacity = object.material.opacity;

				result.rotation = vec3(object.rotation.x,
										object.rotation.y, 
										object.rotation.z);
				console.log(object.rotation);
				result.position = object.position;

				result.area = object.area;
				result.steps = object.steps;
				result.plot = object.plot;

				return result;
			},
			import : function (object) { 
				var mesh = this.draw(object.plot, 
									object.area.xStart, object.area.xEnd,
									object.area.yStart, object.area.yEnd,
									object.opacity,
									object.steps);

				// set translation and rotation manually
				mesh.position = object.position;
				
				mesh.rotation.x = object.rotation.x;
				mesh.rotation.y = object.rotation.y;
				mesh.rotation.z = object.rotation.z;
			}
		}
	};
}