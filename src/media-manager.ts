import {
	ScriptModules
} from '@crowbartools/firebot-custom-scripts-types';
import {
	JsonDB
} from 'node-json-db';
import Media, {
	MediaType
} from './@types/Media';
import {
	modules
} from './main';

import * as fs from 'fs-extra';

class MediaManager {
	private _db: JsonDB;

	private _modules: ScriptModules;

	constructor(path: string, modules: ScriptModules) {
		this._modules = modules;
		// @ts-ignore
		// filePath, saveOnPush, humanReadable
		this._db = new modules.JsonDb(path, true, true);

		// Clear played media for effect ID
		modules.frontendCommunicator.on(
			'lordmau5:better-random-media:clear-media-played',
			args => {
				const {
					effect_id,
					type
				}: {
					effect_id: string,
					type: MediaType
				} = args as any;

				this.setAllMediaUnplayed(effect_id, type);
			}
		);

		// Request played media count
		modules.frontendCommunicator.onAsync(
			'lordmau5:better-random-media:request-played-media-count',
			async args => {
				const {
					effect_id,
					type
				}: {
					effect_id: string,
					type: MediaType
				} = args as any;

				const media: Media[] = this.getCopy(this.getAllMedia(effect_id, type));
				const playedMedia = media.filter(_media => _media.played);

				return {
					played: playedMedia.length,
					total: media.length
				};
			}
		);
	}

	private getCopy(json_data: any): any {
		return JSON.parse(JSON.stringify(json_data));
	}

	private updateDatabase(effect_id: string, type: MediaType, media: Media[]): void {
		const pathForType = this.getPathForType(type);

		this._db.push(`${ pathForType }${ effect_id }`, media, true);
	}

	private getPathForType(type: MediaType): string {
		switch (type) {
			case 'VIDEO': {
				return '/videos/';
			}
			case 'AUDIO': {
				return '/audio/';
			}
		}
	}

	// -----

	private getAllMedia(effect_id: string, type: MediaType): Media[] {
		const pathForType = this.getPathForType(type);

		let media: Media[] = [];
		try {
			// Try to get the media from the database
			media = this._db.getData(`${ pathForType }${ effect_id }`);
		}
		catch (err) {
			// If there is no media in the database, set the media to an empty array
			this.updateDatabase(effect_id, type, media);
		}

		// Return the media from the database
		return media;
	}

	public setAllMediaUnplayed(effect_id: string, type: MediaType): void {
		// Get all media from the database
		const media: Media[] = this.getCopy(this.getAllMedia(effect_id, type));

		// If there is no media in the database, return
		if (!media.length) {
			return;
		}

		// Set all videos to unplayed
		media.forEach(_media => _media.played = false);

		// Update the videos in the database
		this.updateDatabase(effect_id, type, media);
	}

	public setAllEffectsUnplayed(): void {
		const videoEffects: Record<string, Media[]> = this._db.getData(this.getPathForType('VIDEO'));

		Object.values(videoEffects).forEach(medias => {
			medias.forEach(media => media.played = false);
		});
		this._db.push(this.getPathForType('VIDEO'), videoEffects, true);

		const audioEffects: Record<string, Media[]> = this._db.getData(this.getPathForType('AUDIO'));

		Object.values(audioEffects).forEach(medias => {
			medias.forEach(media => media.played = false);
		});
		this._db.push(this.getPathForType('AUDIO'), audioEffects, true);
	}

	public getUnplayedMedia(effect_id: string, type: MediaType): Media {
		const media: Media[] = this.getCopy(this.getAllMedia(effect_id, type));
		if (!media.length) {
			return null;
		}

		// Get a random media from the media array that isn't played
		let unplayedMedia = media.filter(_media => !_media.played);
		this._modules.logger.debug(`Found ${ unplayedMedia.length } unplayed media for ${ effect_id }.`);
		if (!unplayedMedia.length) {
			media.forEach(_media => _media.played = false);

			unplayedMedia = media;
		}

		// Get a random media from the unplayed media
		const randomIndex = Math.floor(Math.random() * unplayedMedia.length);
		const randomMedia = unplayedMedia[randomIndex];

		// Set this media to played and update it in the database
		randomMedia.played = true;
		this.updateDatabase(effect_id, type, media);

		return randomMedia;
	}

	public async updateMedia(effect_id: string, type: MediaType, effect_folder: string): Promise<boolean> {
		// Get all media from the database
		const dbMedia: Media[] = this.getCopy(this.getAllMedia(effect_id, type));

		// Get all files in the effect folder
		let files: string[] = [];
		try {
			files = await fs.readdir(effect_folder);
		}
		catch (err) {
			modules.logger.error('Unable to read video folder', err);

			return false;
		}

		const paths = files.map(file => modules.path.join(effect_folder, file));

		// Get file sizes in parallel
		const fileSizes = await Promise.all(paths.map(path => fs.stat(path).then(stat => stat.size)));

		const media: Media[] = paths.map((path, index) => {
			const present_media = dbMedia.find(_media => _media.path === path);
			const equal_file_size = present_media?.size === fileSizes[index];

			return equal_file_size ? present_media : {
				type,
				path,
				played: false,
				size: fileSizes[index]
			};
		});

		this._modules.logger.debug(`Updating media for ${ effect_id }.`);
		this.updateDatabase(effect_id, type, media);

		return true;
	}
}

export let mediaManager: MediaManager;

export function createMediaManager(path: string, modules: ScriptModules) {
	if (mediaManager != null) {
		return mediaManager;
	}
	mediaManager = new MediaManager(path, modules);

	return mediaManager;
}
