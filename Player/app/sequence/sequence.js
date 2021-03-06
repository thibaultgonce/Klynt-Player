/**
 * Copyright 2013, Honkytonk Films
 * Licensed under GNU GPL
 * http://www.klynt.net
 */

function Sequence(data, autoClose) {
	var self = this,
		finished = false,
		endExecuted = false,
		duration = getTimeFromString(data.duration),
		width = PLAYER.width,
		height = PLAYER.height,
		syncMaster = data.syncMaster,
		div = null,
		medias = [];
	
	this.automaticLink = null;

	this.addMetaElement = function (begin, onBegin) {
		var meta = document.createElement('div');
		meta.setAttribute('data-begin', begin);
		meta.setAttribute('data-dur', 1);
		if (typeof onBegin === "function") {
			meta.addEventListener("begin", onBegin);
		} else {
			meta.setAttribute('data-onbegin', onBegin);
		}
		div.appendChild(meta);
	};
	
	this.executeEnd = function () {
		if (!endExecuted) {
			endExecuted = true;
			if (self.automaticLink) {
				PLAYER.runLink(self.automaticLink);
			} else if (autoClose) {
				PLAYER.closeOverlay();
			} else {
				self.stop();
			}
		}
	};
	
	this.stop = function () {
		self.pause("sequenceEndVolume");
		finished = true;
	};
	
	/*
	 * When continuousAudioVolumeProperty is not set, all audios are paused.
	 * Otherwise, continuous audios are not paused, and their volume is changed.
	 */
	this.pause = function (continuousAudioVolumeProperty) {
		if (!finished) {
			try {
				div.timing.Pause();
				medias.forEach(function (media) {
					if (continuousAudioVolumeProperty && media.continuous) {
						setMediaVolume(media, media[continuousAudioVolumeProperty]);
					} else {
						pauseMedia(media);
					}
				});
			} catch (e) {
			}
		} else if (continuousAudioVolumeProperty) {
			medias.forEach(function (media) {
				if (media.continuous) {
					setMediaVolume(media, media[continuousAudioVolumeProperty]);
				}
			});
		}
	};
	
	this.resume = function (resetContinuousAudioVolume) {
		if (!finished) {
			try {
				div.timing.Play();
				medias.forEach(function (media) {
					if (media.continuous && resetContinuousAudioVolume) {
						setMediaVolume(media, media.volume);
					}
					playMedia(media);
				});
			} catch (e) {
			}
		} else {
			medias.forEach(function (media) {
				if (media.continuous) {
					setMediaVolume(media, media.volume);
					playMedia(media);
				}
			});
		}
	};
	
	this.seek = function (time) {
		if (!finished) {
			if (typeof time === "string") {
				time = getTimeFromString(time);
			}
			time = Math.max(Math.min(time, duration), 0);
			if (div && div.timing) {
				div.timing.setCurrentTime(time);
			}
			/*
			medias.forEach(function (media) {
				var start = getTimeFromString(media.databegin);
				var end = getTimeFromString(media.dataend);
				if (start < time && time < end) {
					seekMedia(media, time - start);
					playMedia(media);
				}
			});
			*/
		}
	};
	
	this.mute = function () {
		medias.forEach(function (media) {
			setMediaVolume(media, 0);
		});
	};

	this.unmute = function () {
		medias.forEach(function (media) {
			setMediaVolume(media, media.volume);
		});
	};

	this.runLink = function (itemId) {
		var item = document.getElementById(itemId);
		if (item && item.linkData) {
			PLAYER.runLink(item.linkData);
		}
	};

	this.runAction = function (itemId) {
		var item = document.getElementById(itemId);
		if (item && item.actionData) {
			PLAYER.runAction(item.actionData);
		}
	};
	
	this.getCurrentTime = function() {
		div.timing.getCurrentTime();
	};
	
	this.updateSequenceTime = function (time) {
		PLAYER.updateTime(time, this);
	};
	
	/* Adds a close button to the given sequence div. */
	this.addCloseButton = function (closeButtonX, closeButtonY) {
		var button = document.createElement("div");
		button.setAttribute("name", "closeOverlay");
		button.className = "closeOverlay";
		button.style.position = "absolute";
		button.style.left = closeButtonX + 'px';
		button.style.top = closeButtonY + 'px';
		button.style.width = '46px';
		button.style.height = '46px';
		button.style.zIndex = 600;
		button.setAttribute("onClick", "PLAYER.closeOverlay();");
		div.appendChild(button);
	};
	
	function initSequenceDiv() {
		var container = document.createElement('div');
		container.id = data.id;
		container.name = "container";
		container.className = "container";
		container.style.position = "absolute";
		container.style.overflow = "hidden";
		container.style.display = "block";
		container.style.width = width + "px";
		container.style.height = height + "px";
		container.style.left = '0px';
		container.style.top = '0px';
		container.style.backgroundColor = data.backgroundColor;
		container.setAttribute("data-timecontainer", "par");
		container.setAttribute("data-timeaction", "visibility");
		container.sequence = self;
		//document.body.appendChild(container);
		return container;
	}
	
	function addSequenceElements() {
		medias = addElements({
			images: addImage,
			videos: addVideo,
			externalVideos: addExternalVideo,
			audios: addAudio
		});
		addElements({
			shapes: addShape,
			buttons: addButton,
			texts: addText,
			iframes: addFrame
		});
		createTooltips();
		createScrollBars();

		function addElements(list) {
			var elements = [];
			$.each(list, function (arrayName, fn) {
				data[arrayName].forEach(function (elementData) {
					updateElementTiming(elementData);
					var element = fn(elementData, self);
					if (element) {
						elements.push(element);
					}
				});
			});
			return elements;
		}
	
		function createTooltips() {
			if (!isiOS()) {
				$(div).tooltip({track: true, parentDiv: div});
			}
		}
	
		function createScrollBars() {
			$(div).find(".nano-container").nanoScroller({
				paneClass: 'nano-pane',
				contentClass: 'nano-content'
			});
		}
	}
	
	function updateElementTiming(data) {
		var end = getTimeFromString(data.dataend);
		if (end >= duration && end < duration + 1 && data.id != syncMaster) {
			data.dataend = getStringFromTime(end + 1);
			data.duration = getStringFromTime(getTimeFromString(data.duration) + 1);
		}
	}
	
	function endSequence() {
		self.executeEnd();
	}

	this.duration = duration;
	this.syncMaster = syncMaster;
	this.div = div = initSequenceDiv();
	PLAYER.div.appendChild(div);
	addSequenceElements();
	this.addMetaElement(data.duration, endSequence);
}

/**
 * Returns time in seconds from a time string in the format
 * h:m:s.s, m:s.s or s.s where the number of digits in each part is variable.
 */
function getTimeFromString(timeString) {
	var timeParts = timeString.split(':');
	var time = 0;
	while (timeParts.length) {
		time *= 60;
		time += parseFloat(timeParts.shift());
	}
	return time;
}

function getStringFromTime(timeInSeconds) {
	var min = Math.floor(timeInSeconds / 60);
	var sec = timeInSeconds - 60 * min;
	return min + ":" + sec;
}
