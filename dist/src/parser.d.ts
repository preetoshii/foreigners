export interface Script {
    seed: number | null;
    events: Event[];
}
export type Event = LocationEvent | TextEvent | PauseEvent | ShotEvent;
export interface LocationEvent {
    type: 'location';
    location: string;
}
export interface TextEvent {
    type: 'text';
    character: string;
    state: string;
    text: string;
}
export interface PauseEvent {
    type: 'pause';
    character: string;
    state: string;
}
export interface ShotEvent {
    type: 'shot';
    shot: string;
}
export declare function parse(input: string): Script;
