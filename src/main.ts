import { Plugin } from "@crowbartools/firebot-types";

import clearDatabaseEffect from './clear-database-effect';
import playSoundEffect from './play-sound-effect';
import playVideoEffect from './play-video-effect';

import {
	mediaManager
} from './media-manager';

const script: Plugin = {
	manifest: {
		name: 'Better Random Media',
		description: "Adds an alternative 'Play Random Video' and 'Play Random Sound' effect with proper folder randomness and effect output support to Firebot",
		author: 'Lordmau5',
		version: '1.2.0',
		repo: 'https://github.com/Lordmau5/firebot-script-better-random-media',
		icon: {
			type: "font-awesome",
			name: "fa-random",
			color: "#7c42e8",
		},
	},
	registers: {
		effects: [clearDatabaseEffect, playSoundEffect, playVideoEffect],
		frontendListeners: mediaManager.frontendListeners
	},
};

export default script;
