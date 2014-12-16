#Geometry Editor

A simple three.js based editor for math scenes.

## Given Features
	* create, edit, save and load scenes
	* create sample scenes as the given epipolar geometry
	* add mathematical objects like spheres, boxes and planes
	* add text labels and arrows
	* plot complex functions (expression evaluation with [math.js](http://mathjs.org/))
	* add, edit and delete light sources, background color and the grid

## Extension
You can easily add new objects and settings to the editor. Just use the given structure within the `geometryEditor.geometry` and `geometryEditor.settings` objects and the new features will be automatically appended to the menu overlay.

## Keybinding
You can use serveral keybindings for the editor:
	* `+` to add a camera
	* `-` to remove the last camera
	* `c` to toggle the background
	* `g` to toggle the grid
	* `s` to toggle the shortcuts info
	* `strg+s` to open the save menu 
	* `space` to toggle the overlay
	* `esc` to close the current popup


## About
This software projects was done in a bachelor thesis at Universität Tübingen.

**Adviser**:
Prof. Dr. Andreas Schilling & Dipl. Inf. Benjamin Wassermann

## Additional
You can find a live demonstration under [math.zumschlenker.de](http://math.zumschlenker.de/) and a full feature video demonstration [on vimeo](https://vimeo.com/107849896).