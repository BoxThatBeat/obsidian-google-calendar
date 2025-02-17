import type { EventNoteQueryResult, GoogleEvent } from "./types";

/**
 * @param date to convert
 * @returns time of day as a number between 0 and 1
 */
export function dateToPercent(date: Date): number {
	return date.getHours() / 24 + date.getMinutes() / (60 * 24);
}

/**
 * This function calculates the y position of a event in a timeline view
 * The height is the percentage the day has gone when the event starts
//  * The start of the day is 0% the end is 100% this is mapped to the height of th view 
 * 
 * If the event is full day the height is 0
 * 
 * @param event to calculate the position from
 * @param timeLineHeight the max height of the timeline 
 * @returns height where the events starts
 */
export function getEventStartPosition(
	event: GoogleEvent,
	timeLineHeight: number
): number {
	if (event.start.date || event?.eventType == "multiDay") {
		return 0;
	}

	const startPercentage = dateToPercent(new Date(event.start.dateTime));
	return timeLineHeight * startPercentage;
}

/**
 * This function calculated the height of a event inside a timeline view
 * The height is determined by the start and end time of the event
 * 
 * TODO Error when stretches over more than a day
 * @param event to get the height of
 * @param timeLineHeight the max height of the timeline  
 * @returns the height of the event
 */
export function getEventHeight(
	event: GoogleEvent,
	timeLineHeight: number
): number {
	if (event.start.date || event?.eventType == "multiDay") {
		return 25;
	}

	const startPercentage = dateToPercent(new Date(event.start.dateTime));
	const endPercentage = dateToPercent(new Date(event.end.dateTime));
	return timeLineHeight * (endPercentage - startPercentage);
}

export function getStartHeightOfHour(timeLineHeight: number, hour: number): number {
	return (timeLineHeight / 24) * hour - 10;
}

export function getEndHeightOfHour(timeLineHeight: number, hour: number): number {
	return timeLineHeight - (timeLineHeight / 24) * hour - 10;
}

export const getCurrentTheme = (): string => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (app.vault as any).config.theme ? ((app.vault as any).config.theme == "obsidian" ? "dark" : "light") : "dark";
}


export const sanitizeFileName = (name: string): string => {
    if(!name) return "";
	return name.trim()
		.replace('<', 'lt')
		.replace('>', 'gt')
		.replace('"', '\'\'')
		.replace('\\', '-')
		.replace('/', '-')
		.replace(':', '-')
		.replace('|', '-')
		.replace('*', '')
		.replace('?', '');
}

export const findEventNote = (event: GoogleEvent): EventNoteQueryResult => {
	const filesWithName = app.vault.getFiles().filter(file =>
		file.basename === sanitizeFileName(event.summary)
	)
	const [filesWithId, filesWithOutId] = filesWithName.reduce(([withID, withOutID, withWrongID], file) => {
		const frontmatter = app.metadataCache.getFileCache(file).frontmatter;
		if (frontmatter?.['event-id'] === event.id) {
			return [[...withID, file], withOutID, withWrongID]
		} else if (frontmatter?.['event-id']) {
			return [withID, withOutID, [...withWrongID, file]]
		} else {
			return [withID, [...withOutID, file], withWrongID]
		}
	}, [[], [], []]);



	return {
		event: event,
		file: filesWithId[0] || filesWithOutId[0] || null,
		match: filesWithId.length > 0 ? "id" : "title"
	}
}