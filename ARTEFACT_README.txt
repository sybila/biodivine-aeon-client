Artefact evaluation instructions:

1. Starting Aeon
	Normally, one would start using Aeon by opening the https://biodivine.fi.muni.cz/aeon/ link. 
	To make this artefact self contained, we include the web client in this virtual machine.

	The web client can be opened by running (double-click) the "open aeon" file found in the home
	folder of the VM. This should open a Firefox window and load the Aeon GUI.

	A normal user would also have to download and run the native compute engine binary (link to which
	is available in the GUI itself). To simplify evaluation, the "open aeon" script will
	start the engine automatically as well (this is indicated in the GUI by the presence of a
	green dot in the left menu, next to the "Compute Engine" button). If for some reason the
	compute engine is not running (red dot appears in the GUI), it can be started by running
	the binary at /home/aeon/compute-engine/compute-engine (or by running the "open aeon"
	script again).

	Note that some large benchmarks may require substantial amount of memory to complete. To prevent
	memory exhaustion and swapping, "open aeon" starts the compute engine with a hard limit of 2.5GB
	memory (when exhausted, the engine will be killed). If you want to run larger benchmarks 
	(and you are sure your machine has sufficient memory for this), you have to start the compute 
	engine without this memory limit.

2. Once the Firefox window is open, you can start by creating/opening a model:
	a) You can open one of the benchmark models that are located in /home/aeon/benchmarks/small.

	Click the Import/Export button in the left menu and in import, select .AEON. Navigate to the
	benchmarks directory and select one of the models. We recommend the "Budding Yeast (Orlando)
	parametric.aeon" model. A model network should appear on the screen. You can open the model
	editor tab (again in the left menu) to inspect the loaded model.

	b) You can create a new model by adding new variables (double click anywhere in the editor
	or open the model editor tab in the left menu and select "Add variable").

	Once you have created some variables, you can create regulations by hovering over one of 
	the variables and then dragging from the + button displayed on top of the variable node 
	to some other variable node. This will create a new regulation between the two variables. 

	Once the regulation is  created, you can change its monotonicity and observability by selecting
	it (click the arrow) and changing the values in the menu that appears next to the arrow. 

	In the model editor tab, you can also update the name and description of the model, as well
	as update functions for the individual variables (we will get to this in more detail in step 
	4).

3. Run the analysis:
	Once you have a model, you can click the Run Analysis button in the left menu to start the analysis.
	In the Compute Engine panel, you should see an indication that the computation is running and
	have the option to cancel it or download partial results. If you selected the Orlando example, 
	the analysis should take several seconds (up to minutes on slower VMs). Once the analysis is 
	complete, you will be presented with a results table displaying possible types of behaviour in 
	the Boolean network and the number of parametrisations for which the behaviour occurs. In this 
	table, you can click the  "witness" link to open a new tab with a witness network. This is a 
	Boolean network where all update functions are fully instantiated and the network falls into the 
	specified behaviour class.

4. Modify the witness:
	In the new browser tab, you can open the model editor and inspect the synthesized update functions
	for each variable. You can then further edit these update functions. For example if you selected
	the Orlando example, you can edit the update function of the CLN3 variable. You
	can specify an update function to be for example "ACE2 & p_CLN3(YOX1, YHP1, SWI5)". This will create 
	a partially parametrised function (p_CLN3 is the parameter) where the dependence on ACE2 is fixed 
	but the dependence on YOX1, YHP1 and SWI5 is still unknown. You can then re-run the analysis for 
	this model and see how this new parametrisation affects the behaviour.

	For more examples of models with partially parametrised update funcitons, you can load some of 
	the benchmark models in the "large" directory (although, as previously noted, analysis of these 
	is only possible with higher RAM limit).

Subsequently, you can try to load other benchmark models (from the small directory, unless you
have enough RAM available) and run the analysis for them as well. 

For more detailed information about the tool, please consult the manual at
http://biodivine.fi.muni.cz/aeon/manual.pdf