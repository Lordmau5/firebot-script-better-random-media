import firebot, { EffectType, EffectScope, FirebotAudioDevice, RunEffectsContext } from '@crowbartools/firebot-types';

import template from './template.html';
import {
	mediaManager
} from '../media-manager';

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
	simpleRandomLogic: boolean;

	audioOutputDevice: FirebotAudioDevice;
}

interface OverlayData {
	overlayInstance: string;
	volume: number;
	audioOutputDevice: {
		deviceId: string;
		label: string;
	};
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
	optionsController: ($scope: EffectScope<EffectModel>, utilityService: any, backendCommunicator: any, $q: any, $timeout: any) => {
		if ($scope.effect.soundType == null) {
			$scope.effect.soundType = 'folderRandom';
		}

		if ($scope.effect.volume == null) {
			$scope.effect.volume = 5;
		}

		if ($scope.effect.simpleRandomLogic == null) {
			$scope.effect.simpleRandomLogic = false;
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
			backendCommunicator.fireEventAsync('lordmau5:better-random-media:clear-media-played', {
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
	onTriggerEvent: async event => {
		const effect = event.effect;

		let filepath = effect.file;

		if (effect.soundType === 'folderRandom') {
			// Update the sounds in the database
			if (!await mediaManager.updateMedia(effect.id, 'AUDIO', effect.folder)) {
				return;
			}

			// Get a random sound from the sounds array that isn't played
			const sound = mediaManager.getUnplayedMedia(effect.id, 'AUDIO', effect.simpleRandomLogic);

			if (sound != null) {
				filepath = sound.path;
			}
			else {
				firebot.logger.error('No sounds were found in the selected folder.');

				return false;
			}
		}

		const firebotSoundEffectModel: {
			soundType: 'local';
			volume: number;
			filepath: string;
			overlayInstance?: string;
			audioOutputDevice?: FirebotAudioDevice;
			waitForSound: boolean;
		} = {
			soundType: 'local',
			volume: effect.volume,
			filepath: filepath,
			overlayInstance: effect.overlayInstance,
			audioOutputDevice: effect.audioOutputDevice,
			waitForSound: effect.waitForSound
		};

		const runEffectsContext: RunEffectsContext = {
			trigger: event.trigger,
			effects: {
				id: crypto.randomUUID(),
				list: [
					{
						id: crypto.randomUUID(),
						type: 'firebot:playsound',
						...firebotSoundEffectModel
					}
				]
			}
		};

		await firebot.effects.processEffects(runEffectsContext);

		return;
	},
};

export default effect;
