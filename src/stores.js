import { writable } from 'svelte/store';

export const walletAddress = writable('');
export const currentStatus = writable('unconnected');
