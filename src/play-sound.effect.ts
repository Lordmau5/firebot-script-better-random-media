import {
	Effects
} from '@crowbartools/firebot-custom-scripts-types/types/effects';
import {
	modules, settings
} from './main';
import template from './play-sound.html';
import {
	mediaManager
} from './media-manager';
import EffectType = Effects.EffectType;
import {
	FirebotAudioOutputDevice
} from '@crowbartools/firebot-custom-scripts-types/types/settings.js';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface EffectModel {
	id: string;

	soundType: 'local' | 'folderRandom';
	file: string;
	volume: number;

	waitForSound: boolean;
	loop: boolean;

	folder: string;
	length: number;

	audioOutputDevice: FirebotAudioOutputDevice;
}

interface OverlayData {
	overlayInstance: string;
}

const effect: EffectType<EffectModel & OverlayData> = {
	definition: {
		id: 'lordmau5:better-random-media:better-random-sound',
		name: 'Better Random Sound',
		description: 'Improved version of the \'Play Random Sound\' effect with proper folder randomness and effect output support',
		icon: 'fad fa-waveform',
		categories: ['common'],
		outputs: [{
			label: 'Sound Length',
			description: 'The played sound length in seconds.',
			defaultName: 'soundLength'
		}]
	},
	optionsTemplate: template,
	optionsController: ($scope, utilityService: any, backendCommunicator: any, $q: any, $timeout: any) => {
		if ($scope.effect.soundType == null) {
			$scope.effect.soundType = 'local';
		}

		if ($scope.effect.volume == null) {
			$scope.effect.volume = 5;
		}

		// Request played sound count
		$scope.playedData = {
			status: 'fetching',
			played: 0,
			total: 0
		};
		$q.when(backendCommunicator.fireEventAsync('lordmau5:better-random-media:request-played-media-count', {
			effect_id: $scope.effect.id,
			type: 'AUDIO'
		}))
			.then((result: { played: number, total: number }) => {
				$scope.playedData = {
					status: 'success',
					played: result.played,
					total: result.total
				};
			});

		// Clear sounds played state
		$scope.clearSoundsPlayed = function () {
			backendCommunicator.fireEvent('lordmau5:better-random-media:clear-media-played', {
				effect_id: $scope.effect.id,
				type: 'AUDIO'
			});
			$scope.playedSoundsCleared = true;

			// @ts-ignore
			$scope.playedData.played = 0;
		};
	},
	optionsValidator: effect => {
		const errors = [];

		if (effect.soundType === 'local' && !effect.file?.length) {
			errors.push('Please select a file.');
		}

		if (effect.soundType === 'folderRandom' && !effect.folder?.length) {
			errors.push('Please select a folder.');
		}

		return errors;
	},
	onTriggerEvent: async scope => {
		const effect = scope.effect;

		if (effect.soundType == null) {
			effect.soundType = 'local';
		}

		// Send data back to media.js in the gui.
		const data = {
			filepath: effect.file,
			soundDuration: effect.length,
			volume: effect.volume,
			loop: effect.loop === true,
			// @ts-ignore
			audioOutputDevice: null,
			// @ts-ignore
			overlayInstance: null
		};

		if (effect.soundType === 'folderRandom') {
			// Update the sounds in the database
			if (!await mediaManager.updateMedia(effect.id, 'AUDIO', effect.folder)) {
				return;
			}

			// Get a random sound from the sounds array that isn't played
			const sound = mediaManager.getUnplayedMedia(effect.id, 'AUDIO');

			if (sound != null) {
				data.filepath = sound.path;
			}
			else {
				modules.logger.error('No sounds were found in the selected folder.');

				return false;
			}
		}

		if (settings.useOverlayInstances()) {
			if (effect.overlayInstance != null) {
				if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
					data.overlayInstance = effect.overlayInstance;
				}
			}
		}

		let duration;
		const result: any = await modules.frontendCommunicator.fireEventAsync('getSoundDuration', {
			path: data.filepath
		});
		if (!isNaN(result)) {
			duration = result;
		}

		data.soundDuration = duration;

		// Set output device.
		let selectedOutputDevice = effect.audioOutputDevice;
		if (selectedOutputDevice == null || selectedOutputDevice.label === 'App Default') {
			selectedOutputDevice = settings.getAudioOutputDevice();
		}
		data.audioOutputDevice = selectedOutputDevice;

		// Generate token if going to overlay, otherwise send to gui.
		if (selectedOutputDevice.deviceId === 'overlay') {
			// @ts-ignore
			data.resourceToken = modules.resourceTokenManager.storeResourcePath(
				data.filepath,
				Math.max(1, duration)
			);

			// send event to the overlay
			modules.httpServer.sendToOverlay('lordmau5:better-random-media:sound', data);
		}
		else {
			// Send data back to media.js in the gui.
			renderWindow.webContents.send('playsound', data);
		}

		if (effect.waitForSound) {
			let internalDuration: any = data.soundDuration;
			if (internalDuration == null || internalDuration === 0 || internalDuration === '') {
				internalDuration = duration;
			}
			await wait(internalDuration * 1000);
		}

		return {
			success: true,
			outputs: {
				soundLength: duration
			}
		};
	},
	overlayExtension: {
		dependencies: {
			css: [],
			js: []
		},
		event: {
			name: 'lordmau5:better-random-media:sound',
			onOverlayEvent: (event: any) => {
				const data = event;
				// @ts-ignore
				const token = encodeURIComponent(data.resourceToken);
				const resourcePath = `http://${window.location.hostname
					}:7472/resource/${token}`;

				// Generate UUID to use as class name.
				// eslint-disable-next-line no-undef
				// @ts-ignore
				const uuid = uuidv4();

				const filepath = data.isUrl ? data.url : data.filepath.toLowerCase();
				let mediaType;
				if (filepath.endsWith('mp3')) {
					mediaType = 'audio/mpeg';
				}
				else if (filepath.endsWith('ogg')) {
					mediaType = 'audio/ogg';
				}
				else if (filepath.endsWith('wav')) {
					mediaType = 'audio/wav';
				}
				else if (filepath.endsWith('flac')) {
					mediaType = 'audio/flac';
				}

				const audioElement = `<audio id="${uuid}" src="${data.isUrl ? data.url : resourcePath}" type="${mediaType}"></audio>`;

				// Throw audio element on page.
				// @ts-ignore
				$('#wrapper').append(audioElement);

				const audio = document.getElementById(uuid);
				// @ts-ignore
				audio.volume = parseFloat(data.volume) / 10;

				// @ts-ignore
				audio.oncanplay = () => audio.play();

				audio.onended = () => {
					// @ts-ignore
					$(`#${uuid}`).remove();
				};
			}
		}
	}
};

export default effect;
