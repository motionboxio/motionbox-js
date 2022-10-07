export interface IBaseObject {
  uid: string;
  top: number;
  left: number;
  type: string;
  width: number;
  height: number;
  endTime: number;
  startTime: number;
}

export interface ITextObject {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
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
    | IImageObject;
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
