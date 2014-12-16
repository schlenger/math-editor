<?php 
	// include the db settings 
	include("dbConnection.php");
	
	if(isset($_GET["md5"]) && $_GET["md5"] = "true") {
		echo md5($db->real_escape_string($_POST["jsonData"]));
	}
	else if(isset($_POST["jsonData"]) && $_POST["jsonData"] != "") {

		// create id
		$jsonData = $db->real_escape_string($_POST["jsonData"]);
		$id = md5($jsonData);

		if(isset($_POST["userName"]) && $_POST["userName"] != "") {
			$userNameTag = "`userName`, ";
			$userName = "'".$db->real_escape_string($_POST["userName"])."',";
		}

		if(isset($_POST["sceneName"]) && $_POST["sceneName"] != "") {
			$sceneNameTag = "`sceneName`, ";
			$sceneName = "'".$db->real_escape_string($_POST["sceneName"])."',";
		}

		if(isset($_POST["specification"]) && $_POST["specification"] != "") {
			$specificationTag = "`specification`, ";
			$specification = "'".$db->real_escape_string($_POST["specification"])."',";
		}

		if(isset($_POST["password"]) && $_POST["password"] != "") {
			$passwordTag = "`password`, ";
			$password = "'".substr(md5("salt" . $_POST["password"]), 0, 12)."',";
		}

		if(isset($_POST["public"]) && $_POST["public"] != "") {
			$publicTag = "`public`, ";
			if($_POST["public"] == "1")
				$public = "'1',";
			else
				$public = "'0',";
		}

		// create sql string
		$sql = "INSERT INTO `db504547203`.`matsThreejsEditor` (`id`, $userNameTag $sceneNameTag $specificationTag $passwordTag $publicTag `jsonData`) VALUES ('$id', $userName $sceneName $specification $password $public '$jsonData');";


		// send query
		$db->query($sql) or die($db->error);
		// and print result
		if($error == '')
			echo "$id";
		else
			echo "Error: $error";
	}
	else
		header("Location:index.php"); 
 ?>