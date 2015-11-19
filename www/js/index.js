var app = {
	// global vars
	map: new Object(),
	points: new Object(),
	new_point: new Object(),
	position: new Object(),
	geo_event: new Object(),
	new_point_marker: new Object(),
	points_layer: null,
	delay: "",
	// BASE_URL: "http://192.168.2.115/Strassenverbesserer/",
	BASE_URL: "http://reise.ddns.net/Strassenverbesserer/",
	// BASE_URL: "http://127.0.0.1/Strassenverbesserer/",
	pictureSource: "",   // picture source
    destinationType: "", // sets the format of returned value
	deviceType:  (navigator.userAgent.match(/iPad/i))  == "iPad" ? "iPad" : (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iPhone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null",
	
    init: function(){
		$("#onload_log").html("constructing map");
        if(this.construct_map() == true){
			$("#onload_log").html("loading data into it");
			app.getPoints();
			$("#onload_log").html("binding events");
			if(this.bindEvents() == true){
				$("#onload_log").html("device specific layout changes");
				if(app.deviceType == "iPad" || app.deviceType == "iPhone"){
					alert("iOS");
					$("body").prepend("<div id='apple_status_bar'></div>");
					$("#app").prepend("<div id='apple_heading_spacing'></div>");
					$('html').addClass('ipad ios7');
					$("meta[data-type='standard']").remove();
				}else{
					$("meta[data-type='IOS']").remove();
				}
				
				// Start data tests if all is set up perfectly
				
					if(typeof(Storage) !== "undefined"){
					var username = localStorage.getItem("username");
					var password = localStorage.getItem("password");
					if(username === null || password === null){
						$("#onload_log").fadeOut();
						$("#onload_login").fadeIn();
						
						$(".login_back").click(function(){
							$("#loginbox").hide();
							$("#registerbox").hide();
							$("#login_register_switch").slideDown();
						});
						$("#goto_login").click(function(){
							$("#login_register_switch").hide();
							$("#registerbox").hide();
							$("#loginbox").slideDown();
						});
						$("#goto_register").click(function(){
							$("#login_register_switch").hide();
							$("#loginbox").hide();
							$("#registerbox").slideDown();
						});
						$("#avatar_box").on('click', function(e){
							navigator.camera.getPicture(uploadPhoto, function(message) {
								alert('get picture failed');
							},{
								quality: 50, 
								destinationType: navigator.camera.DestinationType.FILE_URI,
								sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
								limit: 1
							});
						});
						
						$("form.imgupload").bind('submit', function(e){
							e.preventDefault();
							var form = $(this);
							var file  = form.children("input[type='file']").get(0).files[0];
							
							console.log("ConvertImgtoBase64URL");
							app.convertImgToBase64URL(file, function(base64){
								console.log("converted!");
								console.log(base64);
								uploadPhoto(base64);
							});
						});
						$("form.imgupload.auto_upload").children("input[type='file']").on( "change", function (e){
							console.log("trigger submit!");
							$(this).parent("form.imgupload.auto_upload").trigger("submit");
						});
						
						$("#login").bind('submit', function(e){
							
							e.preventDefault();
							
							console.log("submit");
							
							var data = $(this).serialize();
							var formtype = "GET";
							var form = $(this);
							
							$.ajax({
								url: app.BASE_URL + "/api/user.php",
								type: "GET",
								dataType: 'jsonp',			
								data: data,
								success: function(json, status, xhr){ 
									var ct = xhr.getResponseHeader("content-type") || "";
									var response = json; //default
									if (ct.indexOf("html") > -1) {
										response = jQuery.parseJSON(json);
									}

									if (ct.indexOf("json") > -1 || ct.indexOf("javascript") > -1) {
										response = json;
									}
									console.log(json);
									console.log(ct);
									if(response.status == "ok"){
										login_animation();
										if(response.location){
											location.replace(response.location);
										}
									}else{
										$("#login_errortext > span").html(response.msg);
									}
								}
							});
						});
						// regristation
						$("#register").bind('submit', function(e){
							
							e.preventDefault();
							
							console.log("submit");
							
							var data = $(this).serialize();
							var formtype = "GET";
							var form = $(this);
							
							console.log(data);
							
							$.ajax({
								url: app.BASE_URL + "/api/user.php",
								type: "GET",
								dataType: 'jsonp',			
								data: data,
								success: function(json, status, xhr){ 
									var ct = xhr.getResponseHeader("content-type") || "";
									var response = json; //default
									if (ct.indexOf("html") > -1) {
										response = jQuery.parseJSON(json);
									}

									if (ct.indexOf("json") > -1 || ct.indexOf("javascript") > -1) {
										response = json;
									}
									console.log(json);
									console.log(ct);
									if(response.status == "ok"){
										login_animation();
										if(response.location){
											location.replace(response.location);
										}
									}else{
										$("#register_errortext > span").html(response.msg);
									}
								}
							});
						});
					}else{
						// should add user and device tracking
						var data = "username=" + username + "&password=" + password;
						$.ajax({
							url: app.BASE_URL + "/api/user.php",
							type: "GET",
							dataType: 'jsonp',			
							data: data,

							success: function (answer){
								if (answer.status == "ok"){
									// store shit here
									login_animation();
								}else{
									console.error(answer);
								}
								app.updateList();
							},
							error: function(){
								console.error("connection error");
								
								// put user output here
							}
						});					
					}
				}else{
					// error
				}
			}
		}
		
		/** login animation **/
		function login_animation(){
			$("#logo_box_background").slideUp(1500);
			$("#onload_map_wrapper").delay(500).fadeOut(1000);
			$("#onload_login").delay(1500).fadeOut(500, function(){
				$(".onload").remove();
			});
		}
    },
	construct_map: function(elem_id){
		
		var networkState = navigator.connection;
		console.log(networkState);

		L.mapbox.accessToken = 'pk.eyJ1IjoicHVua3Rzb25zdG5pY2h0cyIsImEiOiJGWWVEQUl3In0.P-wDrt1oIjtCCw265FjGFQ';
		
		map = L.map('map').setView([52.374027, 9.739208], 13);
		L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
		  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions" target="_blank">CartoDB</a>'
		}).addTo(map);


		points_layer = L.mapbox.featureLayer().addTo(map);
		points = L.featureGroup().addTo(points_layer);
		new_point = L.featureGroup().addTo(points_layer);
		
		return true;
	},
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
		document.addEventListener("resume", app.reload, false);
		if( 1 == 0 ){ // setting
			document.addEventListener("geo", app.newCenter, false);
		}
		
		map.on('move', function(){
			console.log("updating");
			window.clearTimeout(app.delay);
			app.delay = window.setTimeout(app.getPoints(), 500);
			app.updateList();
		});
		map.on("load", function(){ /* should do something here */ });
		map.on('contextmenu', function(e){
			app.addPoint(e.latlng)
		});
		
		
		$(".point_category").on('click', function(e){
			if(this.checked){
				$("#icon_box").css({
					"background-color": "red"
				});
			}
		});
		new app.geo();
		
		return true;
    },
    // deviceready Event Handler
    //
    onDeviceReady: function(){
    },
	reload: function(){
		app.getPoints();
		// alert("welcome back");
	},
	getPoints: function(){ // return due to ajax not possible
		// Get the map bounds - the top-left and bottom-right locations.
		var bounds = map.getBounds();
		console.log(bounds);
		var data = "ne_lat=" + bounds._northEast.lat + "&ne_lon=" + bounds._northEast.lng + "&sw_lat=" + bounds._southWest.lat + "&sw_lon=" + bounds._southWest.lng;
		$.ajax({
			url: app.BASE_URL + "api/points.php",
			type: "GET",
			dataType: 'jsonp',			
			data: data,

			success: function (answer){
				if (answer.status == "ok"){
					changes = false;
					$.each(answer.points, function(index, point){
						
						found = false;
						points.eachLayer(function(existing_markers){
							if(existing_markers.options.id == point.id){
								found = true;
								console.log("marker already on map");
							}
						});
						
						if(!found){
							var marker = L.marker(new L.LatLng(point.lat, point.lon), {
								icon: L.mapbox.marker.icon({
									'marker-color': point.hex_color
								}),
								title: point.title,
								description: point.description,
								id: point.id,
								avatar : point.avatar,
								hex_color : point.hex_color,
								hex_color_hover : point.hex_color_hover
								
							});
							marker.addTo(points);
							changes = true;
						}
					});
				}else{
					// error handling
				}
				app.updateList();
			},
			error: function(){
				// error handling
			}
		});	
	},
	updateList: function(){
		console.log("updating list");
		// Construct an empty list to fill with onscreen markers.
		var inBounds = [],
		// Get the map bounds - the top-left and bottom-right locations.
		bounds = map.getBounds(),
		// If a point is in current view. if not -> error
		pointinbound = false;
		// For each marker, consider whether it is currently visible by comparing
		// with the current map bounds.
		points.eachLayer(function(marker){
			if(bounds.contains(marker.getLatLng())) {
				pointinbound = true;
				inBounds.push("<li class='point_elem' data-pointid='" + marker.options.id + "' data-hexcolor='" + marker.options.hex_color + "' data-hexcolorhover='" + marker.options.hex_color_hover + "'><div class='point_holder'><div class='point_avatar' style='background-color: #" + marker.options.hex_color + "'></div><div class='point_content'><div class='point_title'>" + marker.options.title + "</div><div class='point_description'>" + marker.options.description + "</div></div></div></li>");
			}
		});

		if(pointinbound){
			// Display a list of markers.
			$("#points_result").html("<ul class='point_list'>" + inBounds.join('\n') + "</ul>");
		}else{
			$("#points_result").html("<div class='error'><span>rezise map to see points</span><div class='or'>or</div><button class='btn btn_success flat big'>create point here</button></div>");
		}
		return true;
	},
	newCenter: function(){
		map.setView([position.coords.latitude, position.coords.longitude], 11);
	},
	geo: function(){
		$("#onload_log").html("activate geo");
		var geo_event = new CustomEvent('geo');
		var geo_ID = navigator.geolocation.watchPosition(function(return_position){
			position = return_position;
			document.dispatchEvent(geo_event);
		}, function(error){
			console.log("error on geo");
			// drop error here
		}, { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });
	}, 
	uploadPhoto: function(mediaFile){
		
		alert("hopefully this works");
        var ft = new FileTransfer(),
            path = mediaFile.fullPath,
            name = mediaFile.name;

        ft.upload(
			path,
           app.BASE_URL + "/api/image.php",
            function(result) {
                alert('Upload success: ' + result.responseCode);
                console.log(result.bytesSent + ' bytes sent');
            },
            function(error) {
               alert('Error uploading file ' + path + ': ' + error.code);
            },
            { fileName: name }
		);
	},
	addPoint: function(latlong){
		
		console.log(latlong);
		if(typeof(new_point_marker) != "undefined" && new_point_marker){
			console.log("new_point_marker");
			console.log(new_point_marker);
			new_point.removeLayer(new_point_marker);
			console.log(new_point_marker);
		}else{
			/** if new_point_marker is defined, user is already in addPoint-mode. Only store old bounds on first access **/
			oldbounds = map.getBounds();
		}
		new_point_marker = L.marker(new L.LatLng(latlong.lat, latlong.lng), {
			icon: L.mapbox.marker.icon({
				'marker-color': "#ef4a59"
			})			
		});
		new_point_marker.addTo(new_point);
		map.setView([latlong.lat, latlong.lng], 18);
		$("#new_point").slideDown();
		$("#addpoint_latlong").html(latlong.lat + " // " + latlong.lng);
		
		$("#addpoint_cancel").on("click", function(){
			new_point.removeLayer(new_point_marker);
			$("#new_point").slideUp();
			map.fitBounds(oldbounds);
		});
	},
	convertImgToBase64URL: function(url, callback, outputFormat){
	console.log("starting img converter");
	console.log(url);
    var img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
		console.log("onloading img");
        var canvas = document.createElement('CANVAS'),
        ctx = canvas.getContext('2d'), dataURL;
        canvas.height = this.height;
        canvas.width = this.width;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL(outputFormat);
        callback(dataURL);
        canvas = null; 
    };
    img.src = url;
}
};
