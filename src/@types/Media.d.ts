export type MediaType = 'VIDEO' | 'AUDIO';

export default interface Media {
	type: MediaType;
	path: string;
	played: boolean;
	size: number;
}
