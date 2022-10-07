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
    | ISubtitlesObject
    | IVisualizerObject
    | IImageObject
    | IVideoObject;
}

export interface IProgress {
  total: number;
  errors: string;
  message: string;
  currentFrame: number;
}

export interface IRender {
  data: IData;
  token: string;
  isDev?: boolean;
  templateId: string;
  progress: (progress: IProgress) => void;
}

export interface IMotionbox {
  init: () => Promise<string>;
  socket: WebSocket;
  render: (args: IRender) => Promise<string>;
}
