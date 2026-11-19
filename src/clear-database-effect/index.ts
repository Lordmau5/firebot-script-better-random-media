import firebot, { EffectType, EffectScope, FirebotAudioDevice } from '@crowbartools/firebot-types';

import template from './template.html';
import {
	mediaManager
} from '../media-manager';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface EffectModel {
	clearType: 'database' | 'effect';
	effectId: string;
}

interface OverlayData {
	overlayInstance: string;
}

const effect: EffectType<EffectModel & OverlayData> = {
	definition: {
		id: 'lordmau5:better-random-media:clear-cache',
		name: 'Better Random Media - Clear Cache',
		description: 'Clear the cache of played media files.',
		icon: 'fad fa-eraser',
		categories: ['common']
	},
	optionsTemplate: template,
	optionsController: $scope => {
		if ($scope.effect.clearType == null) {
			$scope.effect.clearType = 'database';
		}
	},
	optionsValidator: effect => {
		const errors = [];

		if (effect.clearType === 'effect' && (!effect.effectId || effect.effectId.trim().length !== 36)) {
			errors.push('Please enter a valid effect ID.');
		}

		return errors;
	},
	onTriggerEvent: async scope => {
		const effect = scope.effect;
		if (effect.clearType === 'database') {
			mediaManager.setAllEffectsUnplayed();
		}

		else if (effect.clearType === 'effect') {
			mediaManager.setAllMediaUnplayed(effect.effectId, 'VIDEO');
			mediaManager.setAllMediaUnplayed(effect.effectId, 'AUDIO');
		}
	}
};

export default effect;
