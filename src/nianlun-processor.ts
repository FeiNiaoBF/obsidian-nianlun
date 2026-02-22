import { MarkdownPostProcessorContext, parseYaml } from "obsidian";

export interface NianLunEvent {
    name: string;
    start: number;
    end: number;
}

// 布局后的事件
export interface NianLunEventLayout extends NianLunEvent {
    track: number; // The row/swimlane assigned
    leftPercent: number; // Starting percentage offset from the left
    widthPercent: number; // Width percentage
}

export class NianLunProcessor {
    static async process(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        let events: NianLunEvent[] = [];
        try {
            // Using Obsidian's built-in parseYaml, avoiding external dependencies
            events = parseYaml(source);
            if (!Array.isArray(events)) {
                throw new Error("YAML must be an array of events");
            }
        } catch (e: any) {
            el.createEl("div", { text: `NianLun Parse Error: ${e.message}`, cls: 'nianlun-error' });
            return;
        }

        // Filter invalid events
        events = events.filter(e => e.name && typeof e.start === "number" && typeof e.end === "number" && e.start <= e.end);

        if (events.length === 0) {
            el.createEl("div", { text: "NianLun: No valid events found.", cls: 'nianlun-error' });
            return;
        }

        const layoutEvents = NianLunProcessor.calculateLayout(events);
        NianLunProcessor.render(layoutEvents, el);
    }

    static calculateLayout(events: NianLunEvent[]): NianLunEventLayout[] {
        if (!events || events.length === 0) return [];

        // Sort by start time ascending, then by duration descending
        const sorted = [...events].sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            return (b.end - b.start) - (a.end - a.start);
        });

        const minStart = Math.min(...sorted.map(e => e.start));
        const maxEnd = Math.max(...sorted.map(e => e.end));
        const totalSpan = Math.max(1, maxEnd - minStart); // Avoid divide by zero

        const tracks: number[] = []; // Stores the ending time of the last event in each track

        const layout: NianLunEventLayout[] = [];

        for (const ev of sorted) {
            let trackIndex = -1;
            // Greedily find the first track where the new event does not collide
            for (let i = 0; i < tracks.length; i++) {
                const trackEnd = tracks[i];
                if (trackEnd !== undefined && trackEnd < ev.start) {
                    trackIndex = i;
                    break;
                }
            }
            if (trackIndex === -1) {
                // If it collides with all existing tracks, create a new track
                trackIndex = tracks.length;
                tracks.push(ev.end);
            } else {
                // Update track's end time
                tracks[trackIndex] = Math.max(tracks[trackIndex]!, ev.end);
            }

            layout.push({
                ...ev,
                track: trackIndex,
                leftPercent: ((ev.start - minStart) / totalSpan) * 100,
                widthPercent: ((ev.end - ev.start) / totalSpan) * 100,
            });
        }

        return layout;
    }

    static render(events: NianLunEventLayout[], el: HTMLElement) {
        const container = el.createDiv({ cls: 'nianlun-container' });

        const minStart = Math.min(...events.map(e => e.start));
        const maxEnd = Math.max(...events.map(e => e.end));

        // Add a scale/axis header if needed, but for minimal UI we stick to the events
        const tracksContainer = container.createDiv({ cls: 'nianlun-tracks-container' });

        const maxTrack = Math.max(-1, ...events.map(e => e.track));

        for (let i = 0; i <= maxTrack; i++) {
            const trackEl = tracksContainer.createDiv({ cls: 'nianlun-track' });

            const eventsInTrack = events.filter(e => e.track === i);
            for (const ev of eventsInTrack) {
                const eventWrapper = trackEl.createDiv({ cls: 'nianlun-event' });
                eventWrapper.style.left = `${ev.leftPercent}%`;
                eventWrapper.style.width = `${ev.widthPercent}%`;

                const capsuleEl = eventWrapper.createDiv({ cls: 'nianlun-capsule' });
                capsuleEl.createSpan({ cls: 'nianlun-name', text: ev.name });
                capsuleEl.createSpan({ cls: 'nianlun-time', text: `${ev.start} ~ ${ev.end}` });
            }
        }
    }
}
