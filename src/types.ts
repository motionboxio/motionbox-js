import ReconnectingWebSocket from "reconnecting-websocket";

export interface IBaseObject {
  uid: string;
  top: number;
  left: number;
  type: string;
  width: number;
  height: number;
  endTime: number;
  endDelta: number;
  metadata?: string;
  startTime: number;
  trackIndex: number;
  startDelta: number;
}

export interface IVideoObject {
  image: string;
  duration: number;
}

export interface ITextObject {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  fontWeight?: string;
  textAlignment?: string;
}

export interface ISubtitleObject extends ITextObject {
  words: any[];
  highlighter: boolean;
}

export interface ISubtitlesObject {
  loading?: boolean;
  color?: IBackground;
  background?: IBackground;
}

export interface IVisualizerObject {
  background: IBackground;
}

export interface IImageObject {
  link: string;
}

export interface IBackground {
  colors: string[];
  percents: number[];
  gradient: boolean;
}

export interface IData {
  [uid: string]:
    | IBaseObject
    | ITextObject
    | ISubtitleObject
    | ISubtitlesObject
    | IVisualizerObject
    | IImageObject
    | IVideoObject;
}

export interface IProgress {
  total: number;
  errors: string;
  message: string;
  percentage: number;
  currentFrame: number;
}

export interface IRender {
  data: IData;
  token: string;
  isDev?: boolean;
  templateId?: string;
  progress: (progress: IProgress) => void;
}

export interface IInitOpts {
  heartbeat?: boolean;
}

export interface IMotionbox {
  socket: ReconnectingWebSocket; //WebSocket;
  init: (initOpts?: IInitOpts) => Promise<string>;
  render: (args: IRender) => Promise<string>;
}
