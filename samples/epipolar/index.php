<?php 
	/** Connect to the database 
	include("../../dbConnection.php");

	if(isset($_GET["view"]) && $_GET["view"] != "") {
		$isLoadedScene = true;

		if($_GET["view"] == "standard") {
			$data = '{"lights":[{"lightType":"AmbientLight","color":11184810},{"lightType":"PointLight","color":16777215,"lookAt":{"x":0,"y":0,"z":0},"position":{"x":-10,"y":-50,"z":-130}},{"lightType":"PointLight","color":16777215,"lookAt":{"x":0,"y":0,"z":0},"position":{"x":10,"y":50,"z":130}},{"lightType":"DirectionalLight","color":16777215,"direction":{"x":0,"y":0,"z":1}}],"geometry":[{"objectType":"Sphere","primalColor":16755716,"position":{"x":5,"y":5,"z":5},"radius":0.2,"opacity":1},{"objectType":"Sphere","primalColor":16755716,"position":{"x":3,"y":0,"z":0},"radius":0.2,"opacity":1},{"objectType":"Sphere","primalColor":2456814,"position":{"x":-5,"y":0,"z":-5},"radius":5,"opacity":0.8},{"objectType":"Sphere","primalColor":3109342,"position":{"x":3,"y":0,"z":-7},"radius":3,"opacity":0.6},{"objectType":"Sphere","primalColor":6393819,"position":{"x":-2,"y":3,"z":-12},"radius":1.5,"opacity":1},{"objectType":"Plane","primalColor":10776576,"direction":{"x":-0.5,"y":1,"z":1},"position":{"x":-9,"y":-7.5,"z":10},"opacity":1},{"objectType":"Plane","primalColor":16755716,"direction":{"x":1,"y":1,"z":1},"position":{"x":-9,"y":0,"z":10},"opacity":0.8},{"objectType":"Line","primalColor":16755716,"direction":{"x":2,"y":1,"z":1},"position":{"x":5,"y":0,"z":0}},{"objectType":"Line","primalColor":16755716,"direction":{"x":1,"y":1,"z":1},"position":{"x":2,"y":2,"z":2}},{"objectType":"Box","primalColor":16755716,"position":{"x":7,"y":0,"z":3},"opacity":1,"width":7.25,"height":6,"depth":2,"rotation":{"x":-25.25,"y":45,"z":-14.5}},{"objectType":"Arrow","primalColor":11171588,"direction":{"x":9,"y":0,"z":4},"position":{"x":13.5,"y":0.2,"z":7.5}}],"_text":[{"objectType":"Text","primalColor":11171588,"position":{"x":14,"y":0,"z":8},"text":"Box","size":2,"autoFacing":true},{"objectType":"Text","primalColor":3355443,"position":{"x":-2,"y":4,"z":14},"text":"Planes","size":2,"autoFacing":false}],"settings":{"views":[{"left":0,"bottom":0,"width":1,"height":1,"background":16777215,"eye":[30,30,30],"lookAt":[0,0,0],"fov":30}],"gridColor":3158064,"gridVisible":true,"darkThemeActive":false}}';
			$sceneName = "Standard Example Scene";
		}
		else {
			// get db connection and recieve json file
			$id = $_GET["view"];
			$sql = "SELECT * FROM matsThreejsEditor WHERE id = '$id'";

			$result = $db->query($sql) or die($db->error);

			if($result->num_rows == 0) {
				$dbError =  "showMessage('Error occured: Wrong ID, please use the right link!', false);";
			}
			else if($db->error != "") {
				$dbError = "showMessage('Error occured: $error', false);";
			}
			else {
				$row = $result->fetch_assoc();

				$data = $row["jsonData"];
				$sceneName = $row["sceneName"];

				$userName = $row["userName"];
			}
			$result->free();
		}
	}
	*/

/** The final HTML Output. */
 ?>

<!DOCTYPE html>
<html lang="en">
	<head>
		<?php 
			if($isLoadedScene)
				echo "<title>" . $sceneName . " by " . $userName . " - Mats THREE.js Editor</title>";
			else
				echo "<title>Mats THREE.js Editor</title>";

		 ?>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
		<meta property="og:image" content="logo.jpg" />
		<meta property="og:description" content="A simple math scene editor for everyone. You are able to create, edit, save and load scenes - just give it a try!" />

		<!-- webfonts -->
		<link href='http://fonts.googleapis.com/css?family=Open+Sans:400,700' rel='stylesheet' type='text/css'>
		<!-- css -->
		<link rel="stylesheet" type="text/css" href="css/style.css" />
	</head>
	<body>
		<div id="noJS">
			<h1>Mats three.js Math Editor</h1>
			<h3 id="noJSMessage">- Epipolar geometry demonstration - </h3>
			
			<form id="createSceneForm">
				<h4>Camera1</h4>
				<div class='vec3'><label>Origin (X,Y,Z):</label>
				<input type='number' value='15' name='originX'>
				<input type='number' value='5' name='originY'>
				<input type='number' value='2' name='originZ'></div>
				<div class='vec3'><label>Look At (X,Y,Z):</label>
				<input type='number' value='0' name='lookAtX'>
				<input type='number' value='0' name='lookAtY'>
				<input type='number' value='0' name='lookAtZ'></div>
				<label for='color'>Background Color:</label>
				<input type='color' name='color' value='#ffffff'><br><br>

				<h4>Camera2</h4>
				<div class='vec3'><label>Origin (X,Y,Z):</label>
				<input type='number' value='-15' name='origin2X'>
				<input type='number' value='2' name='origin2Y'>
				<input type='number' value='5' name='origin2Z'></div>
				<div class='vec3'><label>Look At (X,Y,Z):</label>
				<input type='number' value='0' name='lookAt2X'>
				<input type='number' value='0' name='lookAt2Y'>
				<input type='number' value='0' name='lookAt2Z'></div>
				<label for='color2'>Background Color:</label>
				<input type='color' name='color2' value='#ffffff'><br><br>

				<label>Create random boxes:</label>
				<input type='checkbox' name="random" value="random"><br>

				<input type="submit" id="createScene" value="Create Scene">
			</form>

			<input type="submit" id="sampleScene" value="Load sample scene">

			<!--div class="spinner"></div-->
		</div>
		<div id="container"></div>
		
		<div id='overlay'>
			<div id='overlayContent'>
				<span id="close">X</span>
				<h1><span class="orange">Geometry Editor</span> | v1.0</h1>
				<p>Choose from the features underneath: 'Scene' holds the current light, text and arrow data. In 'Geometry' you'll find the objects to add and in 'Additional' you can change the current settings.</p>
				<nav>
					<h3>
						<a class="scene">Scene</a>
						<a class="geometry">Geometry</a>
						<a class="settings">Additional</a>
						<!--a class="save">Save</a-->
					</h3>

					<ul class="scene"></ul>
					<ul class="geometry"></ul>
					<ul class="settings"></ul>
					<!--div class="save">
						<form id="save">
							<label for="sceneName">Scene name:</label>
							<input type="text" name="sceneName" value="Math Scene"><br>

							<label for="userName"><span>(optional)</span> User name:</label>
							<input type="text" name="userName"><br>

							<label for="specification"><span>(optional)</span> Description:</label>
							<input type="text" name="specification"><br><br>

							<label for="public">Show Public:</label>
							<input type="hidden" name="public" value="0" />
							<input type="checkbox" name="public" value="1"><br>

							<input type="submit" value="Save Scene">	
						</form>
					</div-->
				</nav>
				<p id="author">For feedback or bugs please mail mat.schlenker@gmail.com</p>
			</div>
		</div>

		<!-- form for hidden post requests -->
		<form style="display: hidden" action="index.php" method="POST" id="hiddenPOST">
			<input type="hidden" id="isSavedOne" name="isSavedOne" value=""/>
		</form>

		<!-- <div id="info"><a href="http://threejs.org" target="_blank">three.js</a> - multiple views - webgl</div> -->

		<script src="js/math.min.js"></script>

		<!-- three.js core -->
		<script src="js/threejs/three.min.js"></script>
		<!-- three.js controls -->
		<script src="js/threejs/OrbitControls.js"></script>
		<!--script src="../js/controls/TransformControls.js"></script-->
		<script src="js/threejs/Detector.js"></script>
		<!-- for fps label -->
		<script src="js/threejs/stats.min.js"></script>
		<!-- for axis labeling -->
		<script src="js/threejs/helvetiker_regular.typeface.js"></script>
		<!-- jquery>
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script -->
		<script src="js/jquery.js"></script>

		<!-- the own helper functions -->
		<script src="js/functions.js"></script>
		<script src="js/geometry.js"></script>


		<script>
			$( document ).ready(function() {
				$("#sampleScene").click(function(e) {
					e.preventDefault();
					GeometryEditor.sampleScene = true;
					loadEverything();
				});

				$("#createScene").click(function(e) {
					e.preventDefault();

					var form = $("#createSceneForm"); // get the form dom element
			    	var paramObj = {}; // and the values
					$.each(form.serializeArray(), function(_, kv) {
					  paramObj[kv.name] = kv.value;
					});

					if(paramObj.random == "random")
						GeometryEditor.createRandom = true;

					GeometryEditor.createScene = [
						{
							left: 0,
							bottom: 0,
							width: 0.5,
							height: 1,
							background: new THREE.Color(0xFFFFFF),
							eye: [ 30, 30, 30 ],
							lookAt: [ 0, 0, 0 ],
							fov: 30
						},
						{
							left: 0.5,
							bottom: 0.5,
							width: 0.5,
							height: 0.5,
							background: new THREE.Color( parseColor(paramObj.color) ),
							eye: [ paramObj.originX, paramObj.originY, paramObj.originZ ],
							lookAt: [ paramObj.lookAtX, paramObj.lookAtY, paramObj.lookAtZ ],
							fov: 30
						},
						{
							left: 0.5,
							bottom: 0,
							width: 0.5,
							height: 0.5,
							background: new THREE.Color( parseColor(paramObj.color2) ),
							eye: [ paramObj.origin2X, paramObj.origin2Y, paramObj.origin2Z ],
							lookAt: [ paramObj.lookAt2X, paramObj.lookAt2Y, paramObj.lookAt2Z ],
							fov: 30
						}
					];

					loadEverything();
				});


			});




		function loadEverything () {
			$("<canvas id='drawSpace1'>Your browser does not support the canvas element.</canvas>").appendTo('body');
			$("<canvas id='drawSpace2'>Your browser does not support the canvas element.</canvas>").appendTo('body');

			var width = window.innerWidth;
			var height = window.innerHeight;
			$("#drawSpace1").css({
				left:width/2,
				top:0,
				width:width/2,
				height:height/2
			});
			$("#drawSpace2").css({
				left:width/2,
				top:height/2,
				width:width/2,
				height:height/2
			});

			// set the canvas sizes
			document.getElementById('drawSpace2').width = window.innerWidth/2;
			document.getElementById('drawSpace2').height = window.innerHeight/2;
			document.getElementById('drawSpace1').width = window.innerWidth/2;
			document.getElementById('drawSpace1').height = window.innerHeight/2;

			// load the existing scene, is there is one
			<?php 
				echo $dbError;

				if($isLoadedScene && $dbError == "")
					echo "GeometryEditor.import('".$data."');";

				// provide post data
				if(isset($_POST["isSavedOne"]) && $_POST["isSavedOne"] == "yes")
					echo "showMessage('Your Scene was successfully saved! Copy the URL above!', true);";

				/*	echo "var isSavedOne = true;"
				else
					echo "var isSavedOne = false";*/
			 ?>

			
				GeometryEditor.init();
			$("body").append("<div id='switch'><img src='../../images/switch.png'></div>"+
			"<div id='quickAdd'>"+
				"Quick Add:"+
				"<a href='#' name='Line'>Line</a> |"+
				"<a href='#' name='Plane'>Plane</a> |"+
				"<a href='#' name='Sphere'>Sphere</a> |"+
				"<a href='#' name='Box'>Box</a>"+
			"</div>");

			//
			var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
			if(!isChrome) {
				alert("For the fastest experience please use Chrome!")
			}

			// Make clear circumstances 
			if (document.location.hostname == "localhost" || document.location.origin == "file://")
					GeometryEditor.debugLog("System | Offline file");
				else
					GeometryEditor.debugLog("System | Online file");


			if(navigator.onLine) {
				GeometryEditor.debugLog("System | Online connection");
			}
			else
				GeometryEditor.debugLog("System | No online connection");


			// load the features only used on mobile
			if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
				GeometryEditor.debugLog("System | Mobile device");
				// disbale inline editing:
				GeometryEditor.enableInlineEditing = false;
				
				$( document ).ready(function() {
					// add the view/edit bar
					$("#quickAdd")
					.append("<br><br>Mode: <a href='#' id='switchViewMode'>View</a> | <a href='#' id='switchEditMode'>Edit</a>")
					.css({
						bottom:0,
						'border-top':'1px solid #666',
						top:'auto'
					});

					//$("#quickAdd").append("<br><br>Window: "+window.innerWidth+", "+window.innerHeight);
					// mark active
					$("#switchViewMode").css("color","#DF7401");



					// add event listener
					$("#switchViewMode").click(function(e) {
						e.preventDefault();

						// mark active
						$("#switchEditMode").css("color","#666666");
						$("#switchViewMode").css("color","#DF7401");

						GeometryEditor.enableInlineEditing = false;
					});

					$("#switchEditMode").click(function(e) {
						e.preventDefault();

						if(window.innerHeight > window.innerWidth || window.innerHeight > 400) {

							// mark active
							$("#switchEditMode").css("color","#DF7401");
							$("#switchViewMode").css("color","#666666");

							GeometryEditor.enableInlineEditing = true;
						}
						else {
							alert("Please use Portrait mode or a bigger device to use this feature!");
						}
					});
				});

				//$("#shortcuts").css("display","none");
			}
			else {
				GeometryEditor.debugLog("System | Desktop device");
				$("body").append("<div id='shortcuts'>"+
				"<p>"+
					"<strong>Shortcuts:</strong><br>"+
					"<span>right click</span> add observation point<br>"+
					"<span>+/-</span> move last added point<br>"+
					"<span>del</span> clear the drawn<br>"+
					"<span>enter</span> show/hide the camera helper<br>"+
				"</p>"+
			"</div>");
			}			
			// jQuery code
			$( document ).ready(function() {
				$("body").animate({background:"#ffffff"},20);
			    console.log( "jQuery | Everything loaded!" );

			    // start with overlay active
			    //GeometryEditor.toggleOverlay();
			    $('#overlayContent').css("margin-left",window.innerWidth/2-200);


			    // animate the switch at top
			    $("#switch")
				    .hover(function() {
				    	/* Stuff to do when the mouse enters the element */
				    	$(this).animate({"margin-top" : "-8px", "opacity" : 1.0},100);
				    }, function() {
				    	/* Stuff to do when the mouse leaves the element */
				    	if(!GeometryEditor.overlayActive)
				    		$(this).animate({"margin-top" : "-10px", "opacity" : 0.5},100);
				    })
				    .click(function(event) {
				    	GeometryEditor.toggleOverlay();

				    	// bug transparency fix, when clicking on the switch button
				    	//$(this).animate({"opacity" : 0.5},100);
				});

				// the quick add bar
				$("#quickAdd a").click( function (e) {
					e.preventDefault();

					// draw the specific type
					var current = $(this).attr("name");
					switch (current) {
						case "Line":
							// draw with default config
							GeometryEditor.geometry[current].draw(
								vec3(1,1,1),
								vec3(0,0,0),
								0x618FDB);
							break;

						case "Plane":
							// draw with default config
							GeometryEditor.geometry[current].draw(
								vec3(0,0,0),
								vec3(1,1,1),
								0x618FDB,
								0.8);
							break;

						case "Sphere":
							// draw with default config
							GeometryEditor.geometry[current].draw(
								vec3(0,0,0),
								2,
								0x618FDB,
								0.8);
							break;

						case "Box":
							// draw with default config
							GeometryEditor.geometry[current].draw(
								vec3(0,0,0),
								2,2,2,
								vec3(0,0,0),
								0x618FDB,
								0.8);
							break;
					};
				} );

				if(GeometryEditor.sampleScene)
					GeometryEditor.geometry["Sphere"].draw(
									vec3(0,0,0),
									2,
									0xDF7401,
									0.8);

				// set the close trigger
				$("#close").click(function(event) {	GeometryEditor.toggleOverlay(); });

				// input-focus variable for disabling shortcuts while focus
				$("input")
					.focus(function() { GeometryEditor.inputFocused = true; })
					.focusout(function() { GeometryEditor.inputFocused = false;	});


				// set the pager functionality
				$("#overlayContent nav ul").hide();
				$("#save").hide();

				$("#overlayContent h3 a").click(function(e){
					e.preventDefault();

					var current = $(this).attr("class");

					// update the current view, if the scene tab is loaded
					if(current == "scene")
						GeometryEditor.updateLayer();

					if(current == "save")
						$("#save").show();

					$("#overlayContent h3 a").css("color","#AAAAAA")
					$(this).css("color","#DF7401");
					$("#overlayContent nav ul").hide();
					//$("#save").hide();
					$("#overlayContent nav ul."+current).show();
					//$("#overlayContent nav div."+current).show();
				});

				// set starting tab to geometry tab
				$("#overlayContent a.geometry").trigger("click");

				// add event listener for click beneath overlay
				$("#overlay").click(function (e) {
					var rect =  document.getElementById("overlayContent").getBoundingClientRect();
					
					// check if click is in the content
					var x = e.clientX,
						y = e.clientY;

					// and then toggle overlay
					if(!(x > rect.left && x < rect.right &&
						y > rect.top && y < rect.bottom))
						GeometryEditor.toggleOverlay();
				});

				// small color fix on shortcuts
				if(GeometryEditor.darkThemeActive)
					$("#shortcuts").css("color","#fff");
				});


				// bind the save event
				$("#save input[type='submit']").click( function (e) {

					e.preventDefault();

					// get data out of the form and send it to the server
					var form = $("#save"); // get the form dom element
			    	var paramObj = {}; // and the values
					$.each(form.serializeArray(), function(_, kv) { paramObj[kv.name] = kv.value; });


					if(paramObj.sceneName != "") {
						// send it to server
						var exportData = GeometryEditor.export;
						$.post( "saveScene.php", 
							{ 
								"jsonData": exportData,
								"sceneName": paramObj.sceneName,
								"userName":  paramObj.userName,
								"public":  paramObj.public
							})
						.success(function(data){ 
							// check if scene is aready saved
							if(data.indexOf("Duplicate") > -1) {
								// show the existing url
								//showMessage("Scene is already saved under: ...", false);

								// get the md5 hash:
								$.post( "saveScene.php?md5=true", 
								{ 
									"jsonData": exportData
								})
								.success(function(data2){
									// dont redirect if it's the current page
									if(document.URL.indexOf(data2) > -1)
										showMessage("Scene is already saved!", false);
									else
										window.location.href = "index.php?view=" + data2;
								});
							}
							else {
								showMessage(data, true);
								// replace form and show link?
								// todo= check if link is ok?

								// instead reload page ;)
								//window.location.href = +data;

								//use a form to set the information about saving
								$("#hiddenPOST").attr("action", "index.php?view="+data)
								$("#isSavedOne").val("yes");
								$("#hiddenPOST").submit(); //submit and force reload

								//window.location.replace( "index.php?view="+data);
							}
						})
						.fail(function(data){ showMessage(data, false); });
					}
					else {
						// mark field
						showMessage("Please fill in the scene name!", true);
						$("input[name='sceneName']").css({background:"#DF7401", color : "#FFFFFF"}).trigger("focus");
					}
				});
			}
		</script>

	</body>
</html>