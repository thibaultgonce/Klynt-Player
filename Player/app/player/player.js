/**
 * Copyright 2013, Honkytonk Films
 * Licensed under GNU GPL
 * http://www.klynt.net
 */
 
var PLAYER = (function () {
	var elapsedTime = 0;

	var PLAYER = {
		width: data.general.width,
		height: data.general.height,
		title: data.general.title
	};

	/* Public API */

	PLAYER.init = function () {
		PLAYER.div = document.createElement("div");
		PLAYER.div.id = 'player';
		PLAYER.div.className = 'player';
		PLAYER.div.style.position = 'relative';
		PLAYER.div.style.overflow = 'hidden';
		PLAYER.div.style.margin = '0 auto';
		PLAYER.div.style.padding = '0';
		PLAYER.div.style.top = '0px';
		PLAYER.div.style.left = '0px';
		PLAYER.div.style.width = this.width + 'px';
		PLAYER.div.style.height = this.height + 'px';
		document.getElementById("main").appendChild(PLAYER.div);

		window.onkeyup = keyUpHandler;
		window.setInterval(updatePlayPauseStatus, 50);
		
		PLAYER.center();
	};
	
	PLAYER.center = function() {
		var main = document.getElementById('main');
		main.style.top = main.style.left = "50%";
		main.style.marginLeft = (-PLAYER.width / 2) + "px";
		main.style.marginTop = (-PLAYER.height / 2) + "px";
		main.style.marginRight = main.style.marginBottom = "auto";
	};
	
	PLAYER.uncenter = function() {
		var main = document.getElementById('main');
		main.style.top = main.style.left = 0;
		main.style.marginLeft = main.style.marginTop = 0;
		main.style.marginRight = main.style.marginBottom = "auto";
	};
	
	PLAYER.hide = function() {
		PLAYER.div.style.display = 'none';
	};
	
	PLAYER.show = function() {
		PLAYER.div.style.display = 'block';
	};

	/* All parameters are optional */
	PLAYER.showSequence = function (sequenceId, link, time) {
		// If a sequence is given as a parameter, it is displayed.
		// Otherwise, we try to display the sequence specified in the url.
		if (!sequenceId) {
			sequenceId = Hashtag.toSequenceId();
			// We display the main sequence if we still don't have a sequenceId, or if the specified sequence is not found.
			if (!data.sequences[sequenceId]) {
				sequenceId = data.mainSequence;
			}
			link = null;
		}

        var overlay = !!(link && link.overlay);
        (overlay)? showOverlayFrame(sequenceId, link) : showNormalFrame(sequenceId, link, time);


	};
	
	PLAYER.openSequence = function (params) {
		var targetSequence = null;
		if (params) {
			targetSequence = params.targetSequence || params;
		    targetSequence = getSequenceIdFromAliases(targetSequence);	
		}
		
		if (targetSequence && (typeof targetSequence === "string") && data.sequences[targetSequence]) {
			var link = {
				targetSequence: targetSequence,
				transition: params.transition || "fade",
				overlay: params.overlay || false,
				pauseParent: params.pauseParent || true,
				automaticClose: params.automaticClose || false,
				closeButton: params.hasOwnProperty("closeButton") ? params.closeButton : true,
				closeButtonX: params.hasOwnProperty("closeButtonX") ? params.closeButtonX : data.general.overlayCloseButtonX || 0,
				closeButtonY: params.hasOwnProperty("closeButtonY") ? params.closeButtonY : data.general.overlayCloseButtonY || 0
			};
		    PLAYER.showSequence(targetSequence, link);
		}
	};
	
	PLAYER.openOverlay = function (params) {
		if (params && params.targetSequence) {
			params.overlay = true;
		} else {
			params = {
				targetSequence: params,
				overlay: true
			}
		}
		PLAYER.openSequence(params);
		/*
		var targetSequence = null;
		if (params) {
			targetSequence = params.targetSequence || params;
		    targetSequence = getSequenceIdFromAliases(targetSequence);	
		}
		
		if (targetSequence && (typeof targetSequence === "string") && data.sequences[targetSequence]) {
			var link = {
				targetSequence: targetSequence,
				transition: params.transition || "fade",
				overlay: true,
				pauseParent: params.pauseParent || true,
				automaticClose: params.automaticClose || false,
				closeButton: params.hasOwnProperty("closeButton") ? params.closeButton : true,
				closeButtonX: params.hasOwnProperty("closeButtonX") ? params.closeButtonX : data.general.overlayCloseButtonX || 0,
				closeButtonY: params.hasOwnProperty("closeButtonY") ? params.closeButtonY : data.general.overlayCloseButtonY || 0
			};
			PLAYER.showSequence(targetSequence, link);
		}
		*/
	};

	PLAYER.closeOverlay = function () {
        var currentOverlay = STATE.getOverlaySequence();
        if (!currentOverlay)
            return;
		removeSequence(currentOverlay);
        APIHandler.dispatchNotification('overlayClosed', {id: currentOverlay.sequenceId});
	};

	PLAYER.runLink = function (link) {
		switch (link.linkType) {
			case "linkToMenu":
				PLAYER.showMenu();
				break;
			case "linkToMap":
				PLAYER.showMap();
				break;
			case "linkToURL":
				window.open(link.targetURL, link.window);
				break;
			case "linkToSequence":
				PLAYER.showSequence(link.targetSequence, link);
				break;
		}
	};

	PLAYER.runAction = function (action) {
		if (action) {
			APIHandler.runCommand(action.name, action.params);
		}
	};
	
	function updatePlayPauseStatus() {
		if (elapsedTime > 320) {
			PLAYER.setIsPlaying(false);
		}
		elapsedTime += 50;
	}
	
	PLAYER.isPlaying = function () {
		return !$(PLAYER.div).hasClass("paused");
	};
	
	PLAYER.setIsPlaying = function (playing) {
		if (playing != PLAYER.isPlaying()) {
			if (playing) {
				$(PLAYER.div).removeClass("paused");
				$(PLAYER.div).addClass("playing");
			} else {
				$(PLAYER.div).removeClass("playing");
				$(PLAYER.div).addClass("paused");
			}
		}
	};

	PLAYER.updateTime = function (time, sequence) {
		if (sequence == STATE.getActiveSequence()) {
			playerTime = time;
			elapsedTime = 0;
			PLAYER.setIsPlaying(true);
			updateTimer(time);
		}
	};

	PLAYER.togglePause = function () {
		PLAYER.isPlaying() ? PLAYER.pause() : PLAYER.resume();
	};

	PLAYER.pause = function () {
		if (PLAYER.isPlaying()) {
			PLAYER.setIsPlaying(false);
			STATE.getActiveSequence().pause();
		}
	};

	PLAYER.resume = function () {
		if (!PLAYER.isPlaying()) {
			PLAYER.setIsPlaying(true);
			STATE.getActiveSequence().resume();
		}
	};

	PLAYER.seek = function (time) {
		STATE.getActiveSequence().seek(time);
	};

	PLAYER.toggleMute = function () {
		STATE.mutedByUser ? PLAYER.unmute() : PLAYER.mute();
	};

	PLAYER.mute = function () {
		if (!STATE.mutedByUser) {
			STATE.mutedByUser = true;
			$(PLAYER.div).removeClass("unmuted");
			$(PLAYER.div).addClass("muted");
			STATE.getCurrentSequences().forEach(function (sequence) {
				sequence.mute();
			});
		}
	};

	PLAYER.unmute = function () {
		if (STATE.mutedByUser) {
			STATE.mutedByUser = false;
			$(PLAYER.div).removeClass("muted");
			$(PLAYER.div).addClass("unmuted");
			STATE.getCurrentSequences().forEach(function (sequence) {
				sequence.unmute();
			});
		}
	};

	PLAYER.showMenu = function () {
		PLAYER.pause();
		showMenu();
	};

	PLAYER.hideMenu = function () {
		hideMenu();
		PLAYER.resume();
	};

	PLAYER.showMap = function () {
		if (STATE.mapsEnabled) {
			PLAYER.pause();
			showMap();
		}
	};

	PLAYER.hideMap = function () {
		if (STATE.mapsEnabled) {
			hideMap();
			PLAYER.resume();
		}
	};

	PLAYER.setMapsEnabled = function (enabled) {
		STATE.mapsEnabled = enabled;
	};

	PLAYER.toggleFullScreen = function () {
		STATE.fullScreenActive ? PLAYER.exitFullScreen() : PLAYER.enterFullScreen();
	};

	PLAYER.enterFullScreen = function () {
		if (!STATE.fullScreenActive) {
			fullScreen("main");
        }
	};

	PLAYER.exitFullScreen = function () {
		if (STATE.fullScreenActive) {
			fullScreenCancel("main");
		}
	};
	
	PLAYER.handleFullScreenEvent = function () {
		if (document.fullScreenElement || document.webkitIsFullScreen || document.mozFullScreen) {
			fullScreenBrowser();
			STATE.fullScreenActive = true;
			$(PLAYER.div).addClass("fullscreen");
			PLAYER.uncenter();
		} else {
			cancelFullScreen();
			STATE.fullScreenActive = false;
			$(PLAYER.div).removeClass("fullscreen");
			PLAYER.center();
		}
		
		PLAYER.notifyFullscreenStateToAPI();
	};
	
	PLAYER.notifyFullscreenStateToAPI = function () {
		APIHandler.dispatchNotification('fullscreen', {
			chrome: 		$.browser.chrome,
			fullscreen: 	STATE.fullScreenActive,
			scale:			Fullscreen.scale
		});
	}

	/* Sequence creation */

	function showNormalFrame(sequenceId, link, time) {
		var oldSequences = STATE.getCurrentSequences();
		oldSequences.forEach(function (seq) {
			seq.pause();
		});
		var oldMainSequence = STATE.getMainSequence();

		var sequence = createSequence(sequenceId);

		PLAYER.div.appendChild(sequence.div);
		STATE.setMainSequence(sequence);
		
		updateTimeSheetsContainers(sequence);

		if (time) {
			sequence.seek(time);
		}
		if (link) {
			sequence.div.style.zIndex = 2;
			TRANSITION.applyToSequence(sequence, link.transition, oldMainSequence, function () {
				oldSequences.forEach(removeSequence);
				sequence.div.style.zIndex = 0;
			});
		} else {
			oldSequences.forEach(removeSequence);
			sequence.div.style.zIndex = 0;
		}
		
		//updatePlayerURL(sequenceId);
		Hashtag.setCurrentSequence(sequenceId);

        APIHandler.dispatchNotification('sequenceOpened', { id: sequenceId });

		return sequence;
	}

	function showOverlayFrame(sequenceId, link) {
		PLAYER.closeOverlay();
		
		if (link.pauseParent) {
			STATE.mainDeactivatedByOverlay = true;
			STATE.getMainSequence().pause("overlayVolume");
		}

		var sequence = createSequence(sequenceId, link.automaticClose, link.closeButton, link.closeButtonX, link.closeButtonY);
		$(sequence.div).addClass("overlay");
		STATE.setOverlaySequence(sequence);
		PLAYER.div.appendChild(sequence.div);
		
		updateTimeSheetsContainers(sequence);
		
		sequence.div.style.zIndex = 1;
		TRANSITION.applyToSequence(sequence, link.transition);

        APIHandler.dispatchNotification('overlayOpened', { id: sequenceId });
		
		return sequence;
	}

	function createSequence(sequenceId, autoClose, closeButton, closeButtonX, closeButtonY) {
		var sequenceData = data.sequences[sequenceId];
		var sequence = new Sequence(sequenceData, autoClose);
		if (closeButton) {
			sequence.addCloseButton(closeButtonX, closeButtonY);
		}
		
		trackPageView(sequenceData.name);

		return sequence;
	}

	function removeSequence(sequence) {
		sequence.pause();
		PLAYER.div.removeChild(sequence.div);

		if (sequence == STATE.getOverlaySequence()) {
			STATE.setOverlaySequence(null);
			var mainSequence = STATE.getMainSequence();
			mainSequence.resume(true);
			PLAYER.updateTime(mainSequence.getCurrentTime(), mainSequence);
		}
		STATE.mainDeactivatedByOverlay = false;
	}
	
	function updateTimeSheetsContainers(sequence) {
		var event = document.createEvent("Event");
		event.sequence = sequence;
		event.initEvent("DOMContentLoaded", true, true);
		document.dispatchEvent(event);
	}

	/* Player state */

	var STATE = (function () {
		var mainSequence,
			overlaySequence;

		var STATE = {
			mutedByUser:false, // Indicates whether the user has muted the player.
			mainDeactivatedByOverlay:false, // Indicates whether the main sequence was deactivated by an overlay sequence.
			fullScreenActive:false,
			mapsEnabled:false
		};

		STATE.getActiveSequence = function () {
			return overlaySequence || mainSequence;
		};

		STATE.getCurrentSequences = function () {
			var sequences = [];
			if (mainSequence) {
				sequences.push(mainSequence);
			}
			if (overlaySequence) {
				sequences.push(overlaySequence);
			}
			return sequences;
		};

		STATE.getMainSequence = function () {
			return mainSequence;
		};

		STATE.setMainSequence = function (sequence) {
			mainSequence = sequence;
		};

		STATE.getOverlaySequence = function () {
			return overlaySequence;
		};
		
		STATE.setOverlaySequence = function (sequence) {
			overlaySequence = sequence;
		};

		return STATE;
	})();

	/* Utils */

	function keyUpHandler(event) {
		switch (event.keyCode) {
			case 32: // Space key
				PLAYER.togglePause();
				break;
		}
	}
	
	function getSequenceIdFromAliases(sequenceId) {
	    if (sequenceId) {
	        if (data.sequences[sequenceId]) {
	            return sequenceId;
			}
			sequenceId = data.aliases.aliasToId[sequenceId];
	        if (sequenceId) {
	            return sequenceId;
			}
	    }
	    return null;
	}
	
	var Hashtag = (function () {
	
		var ignorePendingHashChange = false;
		var currentSequenceIdOrHash;
		var canAccessTopLocation = false;
		try {
			canAccessTopLocation = window.top != window && !!window.top.location.href;
		} catch (e) {
			canAccessTopLocation = false;
		}
	
		var HashtagClass = function () {
			if (window.addEventListener) {
				if (canAccessTopLocation) {
					top.window.addEventListener('hashchange', this.onHashChange);
				} else {
					window.addEventListener('hashchange', this.onHashChange);
				}
			}
		};
			
		HashtagClass.prototype.getCurrentSequence = function () {
			return currentSequenceIdOrHash;
		};
		
		HashtagClass.prototype.setCurrentSequence = function (value) {
			currentSequenceIdOrHash = value;
			this.setSequenceAliasAsHashtag();
		};
		
		HashtagClass.prototype.toSequenceId = function () {
			var hashtag = getHashtag();
			return getSequenceIdByAlias(hashtag) || hashtag;
		};
		
		HashtagClass.prototype.onHashChange = function (event) {
			if (ignorePendingHashChange) {
				ignorePendingHashChange = false;
			} else {
				PLAYER.showSequence(getSequenceIdByAlias(getHashtag()));
			}
		};
		
		HashtagClass.prototype.setSequenceAliasAsHashtag = function () {
			var displayedHashtag = getAliasBySequenceId(currentSequenceIdOrHash) || currentSequenceIdOrHash;
			var currentHashtag = getHashtag();
			
			if (!displayedMatches()) {
				changeHashtag();
			}
			
			function displayedMatches() {
				return (displayedHashtag == currentHashtag);
			}
			
			function changeHashtag() {	
				ignorePendingHashChange = true;
				location.hash = "#" + displayedHashtag;
				
				if (canAccessTopLocation) {
					window.top.location.hash = window.location.hash;
				}
			}
		};
		
		function getSequenceIdByAlias(alias) {
			return data.aliases.aliasToId[alias];
		}
		
		function getAliasBySequenceId(sequenceId) {
			return data.aliases.idToAlias[sequenceId];
		}
		
		function getHashtag() {
			var hash = canAccessTopLocation ? window.top.location.hash : null;
			var hash = hash || window.location.hash || "";
			var hashtag = hash.split('?');
			return hashtag[0].split('#')[1];
		}
		
		return new HashtagClass();
	})();

	return PLAYER;
})();
