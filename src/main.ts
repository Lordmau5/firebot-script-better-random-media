import {
	Firebot, ScriptModules
} from '@crowbartools/firebot-custom-scripts-types';
import {
	EventSource
} from '@crowbartools/firebot-custom-scripts-types/types/modules/event-manager';
import {
	FirebotSettings
} from '@crowbartools/firebot-custom-scripts-types/types/settings';
import {
	autoload
} from './autoload';
import {
	createMediaManager
} from './media-manager';

const script: Firebot.CustomScript = {
	getScriptManifest: () => {
		return {
			name: 'Better Random Media',
			description: 'A custom script that adds an improved \'Play Random Video\' and \'Play Random Sound\' effect with proper folder randomness and effect output support',
			author: 'Lordmau5',
			version: '1.1.0',
			firebotVersion: '5'
		};
	},
	getDefaultParameters: () => {
		return {
		};
	},
	run: async runRequest => {
		const eventSource: EventSource = {
			id: 'lordmau5:better-random-media',
			name: 'Better Random Media',
			events: []
		};
		autoload(runRequest.modules, eventSource);
		modules = runRequest.modules;
		settings = runRequest.firebot.settings;

		try {
			createMediaManager(modules.path.join(SCRIPTS_DIR, '..', 'db', 'betterRandomMedia.db'), modules);
		}
		catch (error) {
			// eslint-disable-next-line no-debugger
			debugger;
		}
	}
};

export let modules: ScriptModules;

export let settings: FirebotSettings;

export default script;
