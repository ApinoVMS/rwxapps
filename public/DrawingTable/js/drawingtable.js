
function buildPopoverDiv(anlage){
	var anlDiv="<div>";
	if (anlage.hover) {
		anlDiv+="<span data-toggle=\"popover\" data-trigger=\"hover\" title=\"2dLevel\" data-html=\"true\" data-content=\"";
		anlDiv+=anlage.hover;
		anlDiv+="\"> ∞ </span>";
	}
	anlDiv+=anlage.ticker;
	if (anlage.click) {
		anlDiv+="<span data-toggle=\"popover\" data-trigger=\"click\" title=\"Debt,Div,CF,Vola,EPS\" data-html=\"true\" data-content=\"";
		anlDiv+=anlage.click;
		anlDiv+="\"> ‡ </span>";
	}
	anlDiv+="</div>";
	return anlDiv;
}

/** JSON */
function buildGrid(cols, rows, anlageJson) {

	var tableMarkup = "";
	var anlageForRow = "";
	var anlDiv="";
	if (!anlageJson) anlageJson={
		"AA": {ticker: "AA", accumLoss: 4, secondLevelStrength: 1 },

		"USG": {ticker: "USG", accumLoss: 1, secondLevelStrength: 2, 
			hover: "<b>USD appreciation = Commodities deflation</b>",
			click: "<span style='white-space: nowrap;'><img width='600' src='../img/Trade/Tickers/USG/image1.png'/><img width='600' src='../img/Trade/Tickers/USG/image2.png'/></span><br/><span style='white-space: nowrap;'><a href='../img/Trade/Tickers/USG/image3.png' target='new'><img width='500' src='../img/Trade/Tickers/USG/image3.png'/></a><img width='500' src='../img/Trade/Tickers/USG/image4.png'><img width='500' src='../img/Trade/Tickers/USG/vola.png'/></span>"
		} //USG

	};

	// anlageJson
	// row dimention - unrealized loss or gain
	// column dimention - 2dLevelStrength
	for (x = -4; x < 5; x++) {
		tableMarkup += "<tr>";
		if (anlageJson){
			console.log("anl in anlageJson:")
			for (anl in anlageJson){
				anlageForRow = anlageJson[anl];
				console.log(x+"="+anlageForRow.accumLoss);
				//Found anlage has row dimention - unrealized loss or gain
				if (anlageForRow.accumLoss && anlageForRow.accumLoss == x){
					console.log("break_");
					break;
				}else{
					anlageForRow="";
				}
			}
		}
		for (y = -4; y < 5; y++) {
			tableMarkup+= "<td ";
			if (y==0 || x==0) { tableMarkup+= " style='background: blue;'>&nbsp;</td>"; }
			else tableMarkup+= ">";

			if (x==-4 && y==0) tableMarkup+= "U-Gain";
			else if (x==4 && y==0) tableMarkup+= "ULoss";
			else if (x==0 && y==-4) tableMarkup+= "2dL-Short";
			else if (x==0 && y==4) tableMarkup+= "2dL-Long";

			if (anlageForRow && anlageForRow.secondLevelStrength==y){
				tableMarkup+= buildPopoverDiv(anlageForRow); 				
			} else { tableMarkup += "&nbsp;";}
			tableMarkup+= "</td>";
		}
		tableMarkup += "</tr>";	
		anlageForRow = "";
	}

	// var popoverDiv="";
	// for (anl in anlageJson){
	// 	anlageForRow = anlageJson[anl];
	// 	console.log(x+"="+anlageForRow.unrealizedGL);
	// 	//Found anlage has row dimention - unrealized loss or gain		
	// 	popoverDiv+= buildPopoverDiv(anlageForRow); 
	// }
	// $("#popoverFootnote").html(popoverDiv);	

	$("#drawing-table").html(tableMarkup);

};

$(function() {
	
	// Variable Setup
	var cols = 9,
	    rows = 9,
	    curColor = "red",
	    mouseDownState = false,
	    eraseState = false,
	    tracingMode = false,
	    prevColor = "",
	    $el;
	 
	// Inital Build of Table  
	buildGrid(cols, rows);
	
	// Dropdown for changing Grid Size
	$("#gridSize").change(function() {
		$el = $(this);
		rows = $el.val().split(",")[0];
		cols = $el.val().split(",")[1];
		buildGrid(rows, cols);
	});
	
	// Clearing the Design
	$("#clear").click(function() {
		rows = $("#gridSize").val().split(",")[0];
		cols = $("#gridSize").val().split(",")[1];
		buildGrid(rows, cols);
	});
	
	// Drawing functionality
	$("#drawing-table").delegate("td", "mousedown", function() {
		mouseDownState = true;
		$el = $(this);
	    if (eraseState) {
	    	$el.removeAttr("style");
	    } else {
	    	$el.css("background", curColor);
	    }
	}).delegate("td", "mouseenter", function() {
		if (mouseDownState) {
			$el = $(this);
		    if (eraseState) {
		    	$el.removeAttr("style");
		    } else {
		    
		    	// DRAWING ACTION
		    	$el.css("background", curColor);
		    }
		}
	});
	$("html").bind("mouseup", function() {
		mouseDownState = false;
	});
	
	// Erasing functionality through OPTION key
	$(document).keydown(function(event) {
		if (event.keyCode == 18) {
			eraseState = true;
			$(".selected").addClass("previous");
			$(".color").removeClass("selected");
			$(".eraser").addClass("selected");
			
		}
	}).keyup(function(event) {
		if (event.keyCode == 18) {
			eraseState = false;
			$(".color").removeClass("selected");
			$(".previous").addClass("selected").removeClass("previous");
			$("." + curColor).addClass("selected");
		}
	});
	
	// Color selection swatches
	$("#color-selector").delegate(".color", "click", function() {
		
		$el = $(this);
		var pulledVal = $el.attr("data-color");
		
		if (pulledVal == 'eraser') {
			eraseState = true;
		} else {
			eraseState = false;
			curColor = pulledVal;
		}
		
		$(".color").removeClass("selected");
		$(this).addClass("selected");
	});
	
	// Tracing Functionality
	$("#tracing-image-form").submit(function() {
		
			var url = $("#fileLocation").val();
						
			$("<div />", {
			
				css: {
					backgroundImage: "url(" + url + ")",
					width: 500,
					height: 500,
					opacity: 1,
					position: "absolute",
					top: 0,
					left: 0
				},
				id: "tracing-image"
			
			}).appendTo("#table-wrap");
			
			$("#drawing-table").css("opacity", 0.5);
			$("#toggle-tracing-mode").show(); 
			$("#tracing-image-form").remove();
			tracingMode = true;	
						
			return false;
	
		});
	
	$("#toggle-tracing-mode").click(function() {
	
		if (tracingMode) {
			$("#tracing-image").css("visibility", "hidden");
			$(this).html("Toggle Tracing Mode On");
			$("#drawing-table").css("opacity", 1);
			tracingMode = false;
		} else {
			$("#tracing-image").css("visibility", "visible");
			$(this).html("Toggle Tracing Mode Off");
			$("#drawing-table").css("opacity", 0.5);
			tracingMode = true;
		}
	
	});
	
	$('.color input').ColorPicker({
		onSubmit: function(hsb, hex, rgb, el) {
		
			var $swatch = $(el).parent();
			var newColor = "#" + hex;
			
			$(".color").removeClass("selected");
			$("." + $swatch.attr("data-color")).css("background", newColor).addClass("selected");
			$swatch.attr("data-color", newColor);
			curColor = newColor;
			    		    		
		},
		onBeforeShow: function () {
			$(this).ColorPickerSetColor(this.value);
		}
	});
    
	$("#get-html-button").click(function() {
		$("#the-html").val("<table style='width: 100%; border-collapse: collapse;'>" + $("#drawing-table").html() + "</table>");
	});	





});